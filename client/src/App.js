import React, { useEffect, useState } from "react";
import socket from "./socket";

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [videoUnlocked, setVideoUnlocked] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const [userId] = useState(() => Math.random().toString(36).substr(2, 5));

  // Onboarding
  const [formVisible, setFormVisible] = useState(true);
  const [question1, setQuestion1] = useState("");
  const [question2, setQuestion2] = useState("");
  const [matchId, setMatchId] = useState("");

  // Match status
  const [isPinned, setIsPinned] = useState(true); // user starts pinned
  const [partnerUnpinned, setPartnerUnpinned] = useState(false);
  const [freezeUntil, setFreezeUntil] = useState(null);

  // ✅ New handleStartChat with backend logic
  const handleStartChat = async () => {
    if (!question1 || !question2) {
      alert("Please answer both questions");
      return;
    }

    try {
      // Save onboarding profile
      await fetch("http://localhost:5000/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, question1, question2 }),
      });

      // Request a match
      const res = await fetch("http://localhost:5000/daily-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (data.matchId) {
        setMatchId(data.matchId);
        setFormVisible(false);
      } else {
        alert("No match available yet. Please try again later.");
      }
    } catch (err) {
      console.error("❌ Error during matchmaking:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  // Load chat for current match
  useEffect(() => {
    if (!matchId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch("http://localhost:5000/messages");
        const data = await res.json();
        const filtered = data.filter((msg) => msg.matchId === matchId);
        setChat(filtered);
      } catch (err) {
        console.error("❌ Failed to load messages:", err);
      }
    };

    fetchMessages();
  }, [matchId]);

  // Count messages in last 48h
  const getRecentMessageCount = () => {
    const now = new Date();
    const hours48Ago = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    return chat.filter((msg) => new Date(msg.timestamp) >= hours48Ago).length;
  };

  // Unlock video call
  useEffect(() => {
    const recent = chat.filter((msg) => {
      const msgTime = new Date(msg.timestamp);
      return msgTime >= new Date(Date.now() - 48 * 60 * 60 * 1000);
    });
    if (recent.length >= 100 && !videoUnlocked) {
      setVideoUnlocked(true);
    }
  }, [chat, videoUnlocked]);

  // Real-time message + pin status updates
  useEffect(() => {
    if (!matchId) return;

    socket.on("receive_message", (data) => {
      if (data.matchId === matchId) {
        setChat((prev) => [...prev, data]);
      }
    });

    socket.on("partner_unpinned", (data) => {
      if (data.matchId === matchId) {
        setPartnerUnpinned(true);
        if (isPinned) {
          const freezeEnd = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
          setFreezeUntil(freezeEnd);
        }
      }
    });

    return () => {
      socket.off("receive_message");
      socket.off("partner_unpinned");
    };
  }, [matchId, isPinned]);

  // Send message
  const sendMessage = () => {
    if (message.trim()) {
      const msgData = {
        content: message,
        timestamp: new Date().toISOString(),
        senderId: userId,
        matchId,
      };

      socket.emit("send_message", msgData);
      setChat((prev) => [...prev, msgData]);
      setMessage("");
    }
  };

  // Handle unpin
  const handleUnpin = () => {
    setIsPinned(false);
    socket.emit("unpin_match", { matchId });
  };

  // Onboarding form
  if (formVisible) {
    return (
      <div style={{ padding: "20px", maxWidth: "500px", margin: "auto" }}>
        <h2>Lone Town Onboarding</h2>

        <div>
          <label>💬 What's most important to you in a partner?</label>
          <select value={question1} onChange={(e) => setQuestion1(e.target.value)}>
            <option value="">Select</option>
            <option value="honesty">Honesty</option>
            <option value="humor">Sense of Humor</option>
            <option value="ambition">Ambition</option>
          </select>
        </div>

        <div style={{ marginTop: "10px" }}>
          <label>🌟 Your ideal weekend?</label>
          <select value={question2} onChange={(e) => setQuestion2(e.target.value)}>
            <option value="">Select</option>
            <option value="hiking">Hiking outdoors</option>
            <option value="reading">Reading a book</option>
            <option value="partying">Partying with friends</option>
          </select>
        </div>

        <button onClick={handleStartChat} style={{ marginTop: "20px" }}>
          Start Chat
        </button>
      </div>
    );
  }

  const isFrozen = freezeUntil && new Date() < new Date(freezeUntil);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Chat Room: {matchId}</h2>
      <p>Messages in last 48h: {getRecentMessageCount()} / 100</p>

      {/* Visual Match State Badge */}
      <div style={{ marginBottom: "10px" }}>
        {isFrozen ? (
          <span style={{ backgroundColor: "#f44336", color: "white", padding: "5px 10px", borderRadius: "8px" }}>
            ❌ Frozen until {new Date(freezeUntil).toLocaleTimeString()}
          </span>
        ) : !isPinned ? (
          <span style={{ backgroundColor: "#9e9e9e", color: "white", padding: "5px 10px", borderRadius: "8px" }}>
            🔕 You unpinned
          </span>
        ) : partnerUnpinned ? (
          <span style={{ backgroundColor: "#ff9800", color: "white", padding: "5px 10px", borderRadius: "8px" }}>
            ⚠️ Partner unpinned
          </span>
        ) : (
          <span style={{ backgroundColor: "#4caf50", color: "white", padding: "5px 10px", borderRadius: "8px" }}>
            ✅ Matched
          </span>
        )}
      </div>

      {/* Match status */}
      <div style={{ marginBottom: "10px" }}>
        {isFrozen && (
          <p style={{ color: "red" }}>
            ❌ You are frozen until {new Date(freezeUntil).toLocaleTimeString()}
          </p>
        )}
        {!isPinned && <p>🔕 You’ve unpinned this match</p>}
        {partnerUnpinned && <p>⚠️ Your partner unpinned this match</p>}
        {isPinned && !partnerUnpinned && <p>✅ Matched</p>}
      </div>

      {isPinned && (
        <button onClick={handleUnpin} style={{ marginBottom: "10px" }}>
          Unpin Match
        </button>
      )}

      {videoUnlocked && (
        <>
          <p style={{ color: "green", fontWeight: "bold" }}>🎉 Video Call Unlocked!</p>
          <button
            onClick={() => setShowVideo(true)}
            style={{
              marginBottom: "10px",
              backgroundColor: "#007bff",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Start Video Call
          </button>
        </>
      )}

      <div
        style={{
          border: "1px solid black",
          padding: "10px",
          height: "200px",
          overflowY: "scroll",
          marginBottom: "10px",
        }}
      >
        {chat.map((msg, index) => (
          <p key={index}>
            <strong>{msg.senderId === userId ? "You" : "Match"}:</strong> {msg.content}
          </p>
        ))}
      </div>

      <input
        type="text"
        value={message}
        placeholder="Type message"
        onChange={(e) => setMessage(e.target.value)}
        style={{ marginTop: "10px", width: "80%" }}
        disabled={isFrozen}
      />
      <button onClick={sendMessage} disabled={isFrozen} style={{ marginLeft: "10px" }}>
        Send
      </button>

      {showVideo && (
        <div style={{ marginTop: "20px" }}>
          <h3>Video Call Room</h3>
          <iframe
            allow="camera; microphone; fullscreen; display-capture"
            style={{ height: "500px", width: "100%", border: "none" }}
            src="https://meet.jit.si/LoneTownRoom123"
            title="Jitsi Meet"
          />
        </div>
      )}
    </div>
  );
}

export default App;
