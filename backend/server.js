const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = express();
const doctorRoutes = require("./routes/doctorRoutes");
const assistantRoutes = require("./routes/assistantRoutes");

// Middleware
app.use(cors());
app.use(express.json());

// http server + websocket
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", (queueId) => {
    socket.join(queueId);
    console.log(`Joined room: ${queueId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Test route
app.get("/", (req, res) => {
  res.send("Server is running");
});

const QueueEntry = require("./models/QueueEntry");
const Completed = require("./models/Completed");
const Doctor = require("./models/Doctor");

app.use("/doctor", doctorRoutes);
app.use("/assistant", assistantRoutes);

app.post("/join-queue", async (req, res) => {
  try {
    const { name, queueId } = req.body;

    if (!name || !queueId) {
      return res.status(400).json({ message: "Name and queueId required" });
    }

    // Count only this doctor's queue
    const count = await QueueEntry.countDocuments({ queueId });

    const doctor = await Doctor.findOne({ queueId });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const token = `${doctor.prefix}${count + 1}`;

    const newUser = new QueueEntry({
      name,
      queueId,
      token,
    });

    const savedUser = await newUser.save();

    io.to(queueId).emit("queueUpdated", { queueId });

    res.status(201).json({
      user: savedUser,
      position: count + 1,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/queue/:queueId", async (req, res) => {
  try {
    const users = await QueueEntry.find({ queueId: req.params.queueId }).sort({
      joinedAt: 1,
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/next", async (req, res) => {
  const { queueId } = req.body;

  try {
    if (!queueId) {
      return res.status(400).json({ message: "queueId is required" });
    }

    const user = await QueueEntry.findOneAndDelete(
      { queueId },
      { sort: { joinedAt: 1 } },
    );

    if (!user) {
      return res.status(404).json({ message: "Queue is empty" });
    }

    const doctor = await Doctor.findOne({ queueId });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Calculate wait time (in minutes)
    const waitTime = Math.floor((Date.now() - new Date(user.joinedAt)) / 60000);

    // Save to Completed collection
    const completedUser = await Completed.create({
      name: user.name,
      queueId: user.queueId,
      joinedAt: user.joinedAt,
      servedAt: new Date(),
      waitTime,
      status: "completed",
      token: user.token,
    });

    doctor.currentPatient = {
      token: user.token,
      name: user.name,
    };
    await doctor.save();

    io.to(queueId).emit("queueUpdated", { queueId });
    io.to(queueId).emit("nowServing", {
      queueId,
      token: user.token,
      name: user.name,
    });

    res.json({
      message: "Next user called",
      user: completedUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/analytics/:queueId", async (req, res) => {
  try {
    const data = await Completed.aggregate([
      {
        $match: { queueId: req.params.queueId },
      },
      {
        $group: {
          _id: "$queueId",
          totalPatients: { $sum: 1 },
          avgWaitTime: { $avg: "$waitTime" },
        },
      },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/current/:queueId", async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ queueId: req.params.queueId });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    return res.json(doctor.currentPatient || null);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

//Connect DB + Start Server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(5000, () => {
      console.log("Server running on port 5000");
    });
  })
  .catch((err) => console.log(err));
