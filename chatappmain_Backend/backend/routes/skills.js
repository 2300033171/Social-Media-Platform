import express from "express"
import { getDb } from "../db/db.js"
import { authRequired } from "../middleware/auth.js"
import { nanoid } from "nanoid"

const router = express.Router()

router.get("/me", authRequired, (req, res) => {
  const db = getDb()
  const record = db.data.skills.find((s) => s.userId === req.user.id)
  return res.json(record || null)
})

router.put("/me", authRequired, async (req, res) => {
  const db = getDb()
  let record = db.data.skills.find((s) => s.userId === req.user.id)
  if (!record) {
    record = {
      id: nanoid(),
      userId: req.user.id,
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
    }
    db.data.skills.push(record)
  }
  Object.assign(record, req.body || {})
  await db.write()
  return res.json(record)
})

export default router
