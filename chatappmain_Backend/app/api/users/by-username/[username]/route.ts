import { getDb } from "../../../_lib/db"

export async function GET(_: Request, ctx: { params: { username: string } }) {
  const db = getDb()
  const user = await db.getUserByUsername(ctx.params.username)
  if (!user) return Response.json({ error: "Not found" }, { status: 404 })
  return Response.json({ user })
}
