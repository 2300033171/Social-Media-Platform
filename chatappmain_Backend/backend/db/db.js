import { JSONFilePreset } from "lowdb/node"
import { DB_FILE } from "../config.js"

let db = null

export async function initDb() {
  db = await JSONFilePreset(DB_FILE, {
    users: [],
    courses: [],
    skills: [],
    chats: [],
    messages: [],
  })
  // Ensure defaults are present
  await db.write()
  return db
}

export function getDb() {
  if (!db) {
    throw new Error("DB not initialized. Call initDb() first.")
  }
  return db
}
