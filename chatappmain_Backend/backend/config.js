import dotenv from "dotenv"
dotenv.config()

export const PORT = process.env.PORT || 4000
export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me"
export const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000"
export const UPLOAD_DIR = new URL("./uploads/", import.meta.url).pathname
export const DB_FILE = new URL("./db.json", import.meta.url).pathname
