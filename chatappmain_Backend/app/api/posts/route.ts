import { getDb } from "../_lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get("limit") ?? "20")
  const db = getDb()
  const posts = await db.listPosts({ limit: Number.isFinite(limit) ? limit : 20 })
  return Response.json({ posts })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, content, imageUrl } = body ?? {}
    if (!userId || typeof content !== "string" || content.trim().length === 0) {
      return Response.json({ error: "userId and non-empty content are required" }, { status: 400 })
    }
    const db = getDb()
    const post = await db.createPost({ userId, content: content.trim(), imageUrl })
    return Response.json({ post })
  } catch (err: any) {
    return Response.json({ error: err.message ?? "Failed to create post" }, { status: 400 })
  }
}
