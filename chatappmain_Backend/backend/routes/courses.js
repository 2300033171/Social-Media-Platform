import express from "express"
import { getDb } from "../db/db.js"
import { authRequired } from "../middleware/auth.js"
import { nanoid } from "nanoid" // Declare the nanoid variable

const router = express.Router()

router.get("/me", authRequired, (req, res) => {
  const db = getDb()
  const course = db.data.courses.find((c) => c.userId === req.user.id)
  return res.json(course || null)
})

router.put("/me", authRequired, async (req, res) => {
  const db = getDb()
  let course = db.data.courses.find((c) => c.userId === req.user.id)
  if (!course) {
    course = { id: nanoid(), userId: req.user.id, homeUniversity: "", homeDegree: "", guestUniCourse: "" }
    db.data.courses.push(course)
  }
  const { homeUniversity, homeDegree, guestUniCourse } = req.body || {}
  if (typeof homeUniversity === "string") course.homeUniversity = homeUniversity
  if (typeof homeDegree === "string") course.homeDegree = homeDegree
  if (typeof guestUniCourse === "string") course.guestUniCourse = guestUniCourse
  await db.write()
  return res.json(course)
})

export default router
