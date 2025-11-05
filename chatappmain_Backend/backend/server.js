import express from "express"
import http from "http"
import cors from "cors"
import morgan from "morgan"
import { Server as SocketIOServer } from "socket.io"

import { PORT, CORS_ORIGIN, UPLOAD_DIR } from "./config.js"
import { initDb } from "./db/db.js"

import authRoutes from "./routes/auth.js"
import usersRoutes from "./routes/users.js"
import coursesRoutes from "./routes/courses.js"
import skillsRoutes from "./routes/skills.js"
import chatsRoutes from "./routes/chats.js"
import messagesRouter from "./routes/messages.js"

const app = express()
const server = http.createServer(app)
const io = new SocketIOServer(server, {
  cors: { origin: CORS_ORIGIN, methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
})

// Middleware
app.use(cors({ origin: CORS_ORIGIN, credentials: true }))
app.use(express.json({ limit: "5mb" }))
app.use(morgan("dev"))

// Static for uploads
app.use("/uploads", express.static(UPLOAD_DIR))

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", usersRoutes)
app.use("/api/courses", coursesRoutes)
app.use("/api/skills", skillsRoutes)
app.use("/api/chats", chatsRoutes)
app.use("/api/messages", messagesRouter(io))

// Socket.IO
io.on("connection", (socket) => {
  // Join a chat room
  socket.on("chat:join", ({ chatId }) => {
    socket.join(`chat:${chatId}`)
  })
  // Optional: Send message via socket (server stores and re-broadcasts)
  socket.on("message:send", async ({ token, chatId, content }) => {
    // minimal JWT verify so we can attribute the user
    try {
      const { default: jwt } = await import("jsonwebtoken")
      const { JWT_SECRET } = await import("./config.js")
      const payload = jwt.verify(token, JWT_SECRET)
      const { getDb } = await import("./db/db.js")
      const { nanoid } = await import("nanoid")
      const db = getDb()

      const chat = db.data.chats.find((c) => c.id === chatId)
      if (!chat || !chat.members.includes(payload.sub)) return

      const message = {
        id: nanoid(),
        chatId,
        userId: payload.sub,
        content,
        timestamp: new Date().toISOString(),
      }
      db.data.messages.push(message)
      await db.write()
      io.to(`chat:${chatId}`).emit("message:new", message)
    } catch {
      // ignore
    }
  })
})

// Start
;(async () => {
  await initDb()
  server.listen(PORT, () => {
    console.log(`[v0] Backend listening on http://localhost:${PORT}`)
  })
})()
