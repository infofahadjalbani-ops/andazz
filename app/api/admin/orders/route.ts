import { isAdmin } from "@/lib/admin-auth";
import { redisCommand, redisPipeline } from "@/lib/redis";
const statuses = new Set(["new", "confirmed", "shipped", "completed", "cancelled"]);

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const ids = await redisCommand<string[]>(["ZREVRANGE", "andazz:orders", 0, 249]);
  if (!ids.length) return Response.json({ orders: [] });
  const values = await redisPipeline(ids.map(id => ["GET", `andazz:order:${id}`]));
  return Response.json({ orders: values.filter(Boolean).map(value => JSON.parse(String(value))) });
}

export async function PATCH(request: Request) {
  if(request.headers.get('origin') && request.headers.get('origin')!==new URL(request.url).origin) return Response.json({error:'Forbidden'}, {status:403});
  if (!(await isAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json() as { id?: unknown; status?: unknown };
  const id = typeof body.id === "string" ? body.id.trim() : "";
  const status = typeof body.status === "string" ? body.status.trim() : "";
  if (!id || !statuses.has(status)) return Response.json({ error: "Invalid order or status." }, { status: 400 });
  const raw = await redisCommand<string | null>(["GET", `andazz:order:${id}`]);
  if (!raw) return Response.json({ error: "Order not found." }, { status: 404 });
  const updated = { ...JSON.parse(raw), status, updatedAt: new Date().toISOString() };
  await redisCommand(["SET", `andazz:order:${id}`, JSON.stringify(updated)]);
  return Response.json({ order: updated });
}
