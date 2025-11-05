import { getDb } from "../../../_lib/db"

export async function GET(_: Request, ctx: { params: { id: string } }) {
  const db = getDb()
  const comments = await db.listComments(ctx.params.id, { limit: 100 })
  return Response.json({ comments })
}

export async function POST(request: Request, ctx: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { userId, content } = body ?? {}
    if (!userId || !content || typeof content !== "string" || content.trim().length === 0) {
      return Response.json({ error: "userId and non-empty content are required" }, { status: 400 })
    }
    const db = getDb()
    const comment = await db.addComment({ postId: ctx.params.id, userId, content: content.trim() })
    return Response.json({ comment })
  } catch (err: any) {
    return Response.json({ error: err.message ?? "Failed to add comment" }, { status: 400 })
  }
}
