export async function GET() {
  return Response.json({ ok: true, name: "social-backend", time: new Date().toISOString() })
}
