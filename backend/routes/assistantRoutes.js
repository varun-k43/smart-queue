const express = require("express");
const Assistant = require("../models/Assistant");
const Doctor = require("../models/Doctor");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const assignedDoctorId = req.body.assignedDoctorId || null;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    const existingAssistant = await Assistant.findOne({ email });

    if (existingAssistant) {
      return res
        .status(400)
        .json({ message: "Assistant email already exists" });
    }

    if (assignedDoctorId) {
      const doctor = await Doctor.findById(assignedDoctorId);

      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
    }

    const assistant = await Assistant.create({
      name,
      email,
      password,
      assignedDoctorId,
    });

    const populatedAssistant = await Assistant.findById(assistant._id).populate(
      "assignedDoctorId",
    );

    return res.status(201).json(populatedAssistant);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const assistants = await Assistant.find()
      .populate("assignedDoctorId")
      .sort({ createdAt: -1 });

    return res.json(assistants);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const assistant = await Assistant.findOne({ email }).populate(
      "assignedDoctorId",
    );

    if (!assistant || assistant.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    return res.json({
      _id: assistant._id,
      name: assistant.name,
      email: assistant.email,
      assignedDoctorId: assistant.assignedDoctorId,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/:id/assign", async (req, res) => {
  try {
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({ message: "doctorId is required" });
    }

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const assistant = await Assistant.findByIdAndUpdate(
      req.params.id,
      { assignedDoctorId: doctorId },
      { new: true },
    ).populate("assignedDoctorId");

    if (!assistant) {
      return res.status(404).json({ message: "Assistant not found" });
    }

    return res.json(assistant);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const assistant = await Assistant.findById(req.params.id).populate(
      "assignedDoctorId",
    );

    if (!assistant) {
      return res.status(404).json({ message: "Assistant not found" });
    }

    return res.json(assistant);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
