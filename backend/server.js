const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = express();

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

app.post("/join-queue", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const newUser = new QueueEntry({
      name,
    });

    const savedUser = await newUser.save();
    io.emit("queueUpdated");

    const count = await QueueEntry.countDocuments();

    res.status(201).json({
      user: savedUser,
      position: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/queue", async (req, res) => {
  try {
    const users = await QueueEntry.find().sort({ joinedAt: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/next", async (req, res) => {
  try {
    const user = await QueueEntry.findOne().sort({ joinedAt: 1 });

    if (!user) {
      return res.status(404).json({ message: "Queue is empty" });
    }

    // Calculate wait time (in minutes)
    const waitTime = Math.floor((Date.now() - new Date(user.joinedAt)) / 60000);

    // Save to Completed collection
    const completedUser = new Completed({
      name: user.name,
      queueId: user.queueId,
      joinedAt: user.joinedAt,
      servedAt: new Date(),
      waitTime,
      status: "completed",
    });

    await completedUser.save();

    // Remove from active queue
    await QueueEntry.findByIdAndDelete(user._id);

    io.emit("queueUpdated");
    io.emit("nowServing", completedUser);

    res.json({
      message: "Next user called",
      user: completedUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
