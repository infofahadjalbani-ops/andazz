import { NextResponse } from "next/server";
import { adminCookieName, createAdminToken, authenticate } from "@/lib/admin-auth";
import { redisCommand } from "@/lib/redis";

export async function POST(request: Request) {
  if(request.headers.get('origin') && request.headers.get('origin')!==new URL(request.url).origin) return NextResponse.json({error:'Forbidden'}, {status:403});
  if ((process.env.SESSION_SECRET?.length || 0)<32 || (process.env.ADMIN_PASSWORD?.length || 0)<12) return NextResponse.json({error:'Configure a 32+ character session secret and 12+ character admin password.'},{status:503});
  try {
    const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const key=`andazz:login:${ip}:${Math.floor(Date.now()/900000)}`;
    const count=await redisCommand<number>(['INCR',key]);
    await redisCommand(['EXPIRE',key,900]);
    if(count>10) return NextResponse.json({error:'Too many login attempts. Try again in 15 minutes.'},{status:429});
  } catch {return NextResponse.json({error:'Database configuration is missing or unavailable.'},{status:503});}
  const body = await request.json().catch(() => ({})) as { email?: unknown; password?: unknown };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) return NextResponse.json({ error: "Admin environment variables are not configured." }, { status: 503 });
  if (email.length > 254 || password.length > 256) return NextResponse.json({error: "Email or password is incorrect."}, {status:401});
  let identity;
  try { identity = await authenticate(email, password); }
  catch { return NextResponse.json({error: "Login is temporarily unavailable."}, {status:503}); }
  if (!identity) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName, await createAdminToken(identity), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return response;
}
