# 💖 Lone Town – Intelligent Matchmaking System

Lone Town is a mindful matchmaking app that connects users based on meaningful compatibility — not swipes.

## 🚀 Live Demo
👉 [View on Vercel](https://your-vercel-link.vercel.app)

## 📦 Tech Stack

- **Frontend:** React.js
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **Realtime:** Socket.io
- **Video Calls:** Jitsi Meet

---

## 🔑 Features

### ✅ Onboarding & Profile
- Users answer 2 compatibility questions
- Answers stored in MongoDB via `/profile`

### 💘 Matching Logic
- Matches are based on question similarity
- `/daily-match` API returns best match (1 per 24 hours)

### 💬 Realtime Chat
- Instant messaging via Socket.io
- Messages are persisted in MongoDB

### 🎯 Milestone Unlock
- Video call unlocks after 100 messages in 48h

### 🔒 Match Controls
- Pin / Unpin flow
- If one user unpins, the partner gets frozen for 2 hours

### 🟢 Match Status Badges
- ✅ Matched
- ❌ Frozen
- 🔕 You unpinned
- ⚠️ Partner unpinned

---

## 📄 Matching Algorithm

See [`MATCHING_LOGIC.md`](./MATCHING_LOGIC.md)

---

## 🛠️ Run Locally

```bash
# Backend
cd server
npm install
npm run dev

# Frontend
cd client
npm install
npm start
