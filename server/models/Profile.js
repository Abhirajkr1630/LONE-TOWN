const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  userId: String,
  question1: String,
  question2: String,
  lastMatchedAt: {
    type: Date,
    default: null, // ⏰ Used to restrict daily matching
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("Profile", ProfileSchema);
