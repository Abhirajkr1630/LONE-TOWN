const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

// ✅ Load environment variables from .env.localdev
require('dotenv').config({ path: '.env.localdev' });

const Message = require('./models/Message');
const Profile = require('./models/Profile');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Allow connections from frontend
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Lone Town backend running");
});

// ✅ Get all chat messages
app.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error("❌ Failed to fetch messages:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Save onboarding profile
app.post("/profile", async (req, res) => {
  const { userId, question1, question2 } = req.body;
  if (!userId || !question1 || !question2) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await Profile.create({ userId, question1, question2 });
    res.json({ success: true, message: "Profile saved" });
  } catch (err) {
    console.error("❌ Failed to save profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Find best compatible daily match
app.post("/daily-match", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const currentUser = await Profile.findOne({ userId });
    if (!currentUser) return res.status(404).json({ error: "User profile not found" });

    const others = await Profile.find({ userId: { $ne: userId } });

    if (others.length === 0) {
      return res.status(200).json({ message: "No matches available yet", matchId: null });
    }

    let bestMatch = null;
    let highestScore = -1;

    for (const other of others) {
      let score = 0;
      if (other.question1 === currentUser.question1) score++;
      if (other.question2 === currentUser.question2) score++;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = other;
      }
    }

    if (!bestMatch) {
      return res.status(200).json({ message: "No compatible match found", matchId: null });
    }

    const sortedIds = [userId, bestMatch.userId].sort();
    const matchId = `${sortedIds[0]}_${sortedIds[1]}`;

    res.json({ matchId, partnerId: bestMatch.userId });
  } catch (err) {
    console.error("❌ Failed to find match:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Socket.io setup
io.on('connection', (socket) => {
  console.log("User connected: ", socket.id);

  socket.on('send_message', async (data) => {
    try {
      const newMessage = new Message({
        content: data.content,
        timestamp: data.timestamp,
        sender: data.sender || "anonymous",
        matchId: data.matchId || "default"
      });

      await newMessage.save();
      socket.broadcast.emit('receive_message', data);
    } catch (err) {
      console.error("❌ Error saving message:", err);
    }
  });

  socket.on("unpin_match", (data) => {
    socket.broadcast.emit("partner_unpinned", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: ", socket.id);
  });
});

// Run server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
