import { getDb } from "../_lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, name, avatarUrl } = body ?? {}
    if (!username || typeof username !== "string") {
      return Response.json({ error: "username is required" }, { status: 400 })
    }
    const db = getDb()
    const user = await db.createUser({ username, name, avatarUrl })
    return Response.json({ user })
  } catch (err: any) {
    return Response.json({ error: err.message ?? "Failed to create user" }, { status: 400 })
  }
}
