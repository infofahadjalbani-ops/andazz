import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getAdmin, ownerEmail, adminStoreKey, hashPassword, type Admin } from "@/lib/admin-auth";
import { redisCommand } from "@/lib/redis";

export async function GET() {
 if ((await getAdmin())?.role !== "owner") return NextResponse.json({error:"Owner access required."},{status:403});
 try {
  const rows = await redisCommand<string[]>(["HVALS",adminStoreKey]);
  const admins = rows.map(raw => { const a: Admin = JSON.parse(raw); return {email:a.email,id:a.id,createdAt:a.createdAt}; });
  return NextResponse.json({owner:ownerEmail(),admins});
 } catch { return NextResponse.json({error:"Admins could not load."},{status:503}); }
}
async function mutate(request: Request, deleting: boolean) {
 if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({error:"Forbidden"},{status:403});
 if ((await getAdmin())?.role !== "owner") return NextResponse.json({error:"Owner access required."},{status:403});
 const body = await request.json().catch(() => null);
 const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({error:"Enter a valid email address."},{status:400});
 if (email === ownerEmail()) return NextResponse.json({error:"The owner account is protected."},{status:400});
 try {
  if (deleting) {
   const removed = await redisCommand<number>(["HDEL",adminStoreKey,email]);
   return NextResponse.json(removed ? {ok:true} : {error:"Admin not found."},{status:removed ? 200 : 404});
  }
  const password = body.password;
  if (typeof password !== "string" || password.length < 12 || password.length > 256) return NextResponse.json({error:"Use a password between 12 and 256 characters."},{status:400});
  const admin: Admin = {email,id:randomUUID(),createdAt:new Date().toISOString(),passwordHash:hashPassword(password)};
  const added = await redisCommand<number>(["HSETNX",adminStoreKey,email,JSON.stringify(admin)]);
  return NextResponse.json(added ? {ok:true} : {error:"This admin already exists."},{status:added ? 201 : 409});
 } catch { return NextResponse.json({error:"Changes could not be saved. Please try again."},{status:503}); }
}
export async function POST(request: Request) { return mutate(request,false); }
export async function DELETE(request: Request) { return mutate(request,true); }
