const mongoose = require("mongoose");

const queueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  queueId: {
    type: String,
    default: "defaultQueue",
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    default: "waiting",
  },
});

module.exports = mongoose.model("QueueEntry", queueSchema);
