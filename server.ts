import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";

interface User {
  id: string;
  socketId: string;
}

interface UsersByFrequency {
  [frequency: string]: User[];
}

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket"],
});

app.use(
  cors({
    origin: "*", // Or replace '*' with your front-end's domain
  })
);

const usersByFrequency: UsersByFrequency = {};

io.on("connection", (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join", (frequency: string, userId: string) => {
    if (!usersByFrequency[frequency]) {
      usersByFrequency[frequency] = [];
    }
    usersByFrequency[frequency].push({ id: userId, socketId: socket.id });
    socket.join(frequency);
    console.log(`User ${userId} joined frequency ${frequency}`);
  });

  socket.on(
    "audioSignal",
    (data: { frequency: string; signal: string; userId: string }) => {
      const { frequency, signal, userId } = data;
      io.to(frequency).emit("audioSignal", { signal, userId });
      console.log(`Audio signal broadcasted in frequency ${frequency}`);
    }
  );

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const frequency in usersByFrequency) {
      usersByFrequency[frequency] = usersByFrequency[frequency].filter(
        (user) => user.socketId !== socket.id
      );
      if (usersByFrequency[frequency].length === 0) {
        delete usersByFrequency[frequency];
      }
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
