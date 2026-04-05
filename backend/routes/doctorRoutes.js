const express = require("express");
const Doctor = require("../models/Doctor");
const {
  listDoctors,
  deleteDoctor,
} = require("../controllers/doctorController");

const router = express.Router();

const getExcelColumnName = (number) => {
  let result = "";
  let current = number;

  while (current >= 0) {
    result = String.fromCharCode((current % 26) + 65) + result;
    current = Math.floor(current / 26) - 1;
  }

  return result;
};

router.post("/", async (req, res) => {
  try {
    const name = req.body.name?.trim();

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const doctorCount = await Doctor.countDocuments();
    const prefix = getExcelColumnName(doctorCount);
    const queueId = `doctor${doctorCount + 1}`;

    const doctor = await Doctor.create({
      name,
      queueId,
      prefix,
    });

    return res.status(201).json(doctor);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});
router.get("/", listDoctors);
router.delete("/:id", deleteDoctor);

module.exports = router;
