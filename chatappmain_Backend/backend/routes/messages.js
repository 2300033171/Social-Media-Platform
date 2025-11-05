import express from "express"
import { nanoid } from "nanoid"
import { getDb } from "../db/db.js"
import { authRequired } from "../middleware/auth.js"

export default function messagesRouter(io) {
  const router = express.Router()

  router.get("/:chatId", authRequired, (req, res) => {
    const db = getDb()
    const { chatId } = req.params
    const chat = db.data.chats.find((c) => c.id === chatId)
    if (!chat) return res.status(404).json({ error: "Chat not found" })
    if (!chat.members.includes(req.user.id)) return res.status(403).json({ error: "Forbidden" })
    const messages = db.data.messages
      .filter((m) => m.chatId === chatId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    return res.json(messages)
  })

  router.post("/:chatId", authRequired, async (req, res) => {
    const db = getDb()
    const { chatId } = req.params
    const { content } = req.body || {}
    if (!content) return res.status(400).json({ error: "content required" })

    const chat = db.data.chats.find((c) => c.id === chatId)
    if (!chat) return res.status(404).json({ error: "Chat not found" })
    if (!chat.members.includes(req.user.id)) return res.status(403).json({ error: "Forbidden" })

    const message = {
      id: nanoid(),
      chatId,
      userId: req.user.id,
      content,
      timestamp: new Date().toISOString(),
    }
    db.data.messages.push(message)
    await db.write()

    // Emit realtime event to chat room
    io.to(`chat:${chatId}`).emit("message:new", message)
    return res.status(201).json(message)
  })

  return router
}
