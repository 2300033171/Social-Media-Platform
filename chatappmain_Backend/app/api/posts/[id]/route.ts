import { getDb } from "../../_lib/db"

export async function GET(_: Request, ctx: { params: { id: string } }) {
  const db = getDb()
  const post = await db.getPostById(ctx.params.id)
  if (!post) return Response.json({ error: "Not found" }, { status: 404 })
  return Response.json({ post })
}
