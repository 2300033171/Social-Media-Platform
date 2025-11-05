import express from "express"
import { getDb } from "../db/db.js"
import { nanoid } from "nanoid"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../config.js"

const router = express.Router()

function signToken(userId) {
  return jwt.sign({}, JWT_SECRET, { subject: userId, expiresIn: "7d" })
}

router.post("/register", async (req, res) => {
  const db = getDb()
  const { username, email, password, firstName = "", lastName = "" } = req.body || {}
  if (!username || !email || !password) {
    return res.status(400).json({ error: "username, email, password are required" })
  }

  const existing = db.data.users.find((u) => u.username === username || u.email === email)
  if (existing) {
    return res.status(400).json({ error: "User already exists with same username or email" })
  }

  const id = nanoid()
  const passwordHash = await bcrypt.hash(password, 10)
  const user = {
    id,
    username,
    email,
    passwordHash,
    firstName,
    lastName,
    bio: "",
    imageUrl: "",
    createdAt: new Date().toISOString(),
  }
  db.data.users.push(user)
  await db.write()

  // Create empty course/skills records for convenience
  db.data.courses.push({
    id: nanoid(),
    userId: id,
    homeUniversity: "",
    homeDegree: "",
    guestUniCourse: "",
  })
  db.data.skills.push({
    id: nanoid(),
    userId: id,
    frontEndDevelopment: "0",
    backendDevelopment: "0",
    python: "0",
    design: "0",
    businessAnalytics: "0",
    cloudArchitecture: "0",
    productManagement: "0",
    scrumMaster: "0",
    informationSecurity: "0",
    research: "0",
  })
  await db.write()

  const token = signToken(id)
  return res.status(201).json({
    token,
    user: { id, username, email, firstName, lastName },
  })
})

router.post("/login", async (req, res) => {
  const db = getDb()
  const { usernameOrEmail, password } = req.body || {}
  if (!usernameOrEmail || !password) {
    return res.status(400).json({ error: "usernameOrEmail and password are required" })
  }
  const user = db.data.users.find((u) => u.username === usernameOrEmail || u.email === usernameOrEmail)
  if (!user) return res.status(401).json({ error: "Invalid credentials" })
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: "Invalid credentials" })
  const token = signToken(user.id)
  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  })
})

router.get("/me", (req, res) => {
  // Use authOptional in server.js if you want soft checks
  return res.json({ ok: true })
})

export default router
