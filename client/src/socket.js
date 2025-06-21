import { io } from "socket.io-client";

// Connect to backend on port 5000
const socket = io("http://localhost:5000", {
  transports: ["websocket"],
  withCredentials: true,
});

export default socket;
