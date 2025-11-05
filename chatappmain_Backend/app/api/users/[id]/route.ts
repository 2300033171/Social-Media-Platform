import { getDb } from "../../_lib/db"

export async function GET(_: Request, ctx: { params: { id: string } }) {
  const db = getDb()
  const user = await db.getUserById(ctx.params.id)
  if (!user) return Response.json({ error: "Not found" }, { status: 404 })
  return Response.json({ user })
}
