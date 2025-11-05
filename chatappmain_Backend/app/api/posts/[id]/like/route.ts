import { getDb } from "../../../_lib/db"

export async function POST(request: Request, ctx: { params: { id: string } }) {
  try {
    const { id: postId } = ctx.params
    const body = await request.json()
    const { userId } = body ?? {}
    if (!userId) return Response.json({ error: "userId is required" }, { status: 400 })
    const db = getDb()
    const result = await db.toggleLike(postId, userId)
    return Response.json(result)
  } catch (err: any) {
    return Response.json({ error: err.message ?? "Failed to toggle like" }, { status: 400 })
  }
}
