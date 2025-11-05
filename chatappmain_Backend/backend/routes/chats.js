import express from "express"
import { nanoid } from "nanoid"
import { getDb } from "../db/db.js"
import { authRequired } from "../middleware/auth.js"

const router = express.Router()

router.get("/", authRequired, (req, res) => {
  const db = getDb()
  const myChats = db.data.chats
    .filter((c) => c.members.includes(req.user.id))
    .map((c) => {
      const others = c.members.filter((m) => m !== req.user.id)
      const last = [...db.data.messages]
        .filter((m) => m.chatId === c.id)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]
      return {
        id: c.id,
        members: c.members,
        otherUserIds: others,
        lastMessage: last || null,
      }
    })
  return res.json(myChats)
})

router.post("/", authRequired, async (req, res) => {
  const db = getDb()
  const { targetUserId } = req.body || {}
  if (!targetUserId) return res.status(400).json({ error: "targetUserId required" })
  const existing = db.data.chats.find(
    (c) => c.members.length === 2 && c.members.includes(req.user.id) && c.members.includes(targetUserId),
  )
  if (existing) return res.json(existing)
  const chat = { id: nanoid(), members: [req.user.id, targetUserId], createdAt: new Date().toISOString() }
  db.data.chats.push(chat)
  await db.write()
  return res.status(201).json(chat)
})

export default router
