import { getDb } from "../../../_lib/db"

export async function POST(request: Request, ctx: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { followerId } = body ?? {}
    if (!followerId) {
      return Response.json({ error: "followerId is required" }, { status: 400 })
    }
    const db = getDb()
    const result = await db.follow(followerId, ctx.params.id)
    return Response.json(result)
  } catch (err: any) {
    return Response.json({ error: err.message ?? "Failed to follow/unfollow" }, { status: 400 })
  }
}
