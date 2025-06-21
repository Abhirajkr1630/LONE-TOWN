const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  sender: { type: String, default: "anonymous" }, // optional
  matchId: { type: String, default: "default" },   // optional future use
});

module.exports = mongoose.model("Message", messageSchema);
