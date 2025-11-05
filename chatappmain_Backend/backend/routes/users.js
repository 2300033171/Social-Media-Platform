import express from "express"
import multer from "multer"
import path from "path"
import { nanoid } from "nanoid"
import { getDb } from "../db/db.js"
import { authRequired } from "../middleware/auth.js"
import { UPLOAD_DIR } from "../config.js"
import fs from "fs-extra"

const router = express.Router()

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await fs.ensureDir(UPLOAD_DIR)
    cb(null, UPLOAD_DIR)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || ".jpg")
    cb(null, `${nanoid()}${ext}`)
  },
})
const upload = multer({ storage })

router.get("/:id", async (req, res) => {
  const db = getDb()
  const user = db.data.users.find((u) => u.id === req.params.id)
  if (!user) return res.status(404).json({ error: "User not found" })
  return res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    bio: user.bio,
    imageUrl: user.imageUrl,
  })
})

router.put("/me", authRequired, upload.single("image"), async (req, res) => {
  const db = getDb()
  const user = db.data.users.find((u) => u.id === req.user.id)
  if (!user) return res.status(404).json({ error: "User not found" })

  const { firstName, lastName, bio } = req.body || {}
  if (typeof firstName === "string") user.firstName = firstName
  if (typeof lastName === "string") user.lastName = lastName
  if (typeof bio === "string") user.bio = bio
  if (req.file) {
    const fileName = path.basename(req.file.path)
    user.imageUrl = `/uploads/${fileName}`
  }
  await db.write()
  return res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    bio: user.bio,
    imageUrl: user.imageUrl,
  })
})

export default router
