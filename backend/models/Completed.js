const mongoose = require("mongoose");

const completedSchema = new mongoose.Schema({
  name: String,
  queueId: String,
  joinedAt: Date,
  servedAt: {
    type: Date,
    default: Date.now,
  },
  waitTime: Number,
  status: {
    type: String,
    default: "completed",
  },
});

module.exports = mongoose.model("Completed", completedSchema);
