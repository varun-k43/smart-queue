const Doctor = require("../models/Doctor");

const addDoctor = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const queueId = req.body.queueId?.trim();

    if (!name || !queueId) {
      return res.status(400).json({ message: "Name and queueId are required" });
    }

    const existingDoctor = await Doctor.findOne({ queueId });

    if (existingDoctor) {
      return res.status(409).json({ message: "queueId already exists" });
    }

    const doctor = await Doctor.create({ name, queueId });

    return res.status(201).json(doctor);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const listDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ createdAt: -1 });
    return res.json(doctors);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    return res.json({ message: "Doctor deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addDoctor,
  listDoctors,
  deleteDoctor,
};
