import { getDb } from "../_lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { senderId, recipientId, content } = body ?? {}
    if (!senderId || !recipientId || !content || typeof content !== "string" || content.trim().length === 0) {
      return Response.json({ error: "senderId, recipientId and non-empty content are required" }, { status: 400 })
    }
    const db = getDb()
    const message = await db.sendMessage({ senderId, recipientId, content: content.trim() })
    return Response.json({ message })
  } catch (err: any) {
    return Response.json({ error: err.message ?? "Failed to send message" }, { status: 400 })
  }
}
