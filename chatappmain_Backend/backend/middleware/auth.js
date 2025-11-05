import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../config.js"

export function authOptional(req, _res, next) {
  const header = req.headers.authorization
  if (header && header.startsWith("Bearer ")) {
    const token = header.slice(7)
    try {
      const payload = jwt.verify(token, JWT_SECRET)
      req.user = { id: payload.sub }
    } catch {
      // ignore invalid
    }
  }
  next()
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" })
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = { id: payload.sub }
    next()
  } catch {
    return res.status(401).json({ error: "Invalid token" })
  }
}
