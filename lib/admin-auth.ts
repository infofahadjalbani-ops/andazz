import { cookies } from "next/headers";
import { createHmac, timingSafeEqual, randomBytes, scryptSync } from "node:crypto";
import { redisCommand } from "./redis";
export const adminCookieName = "andazz_admin";
export const adminStoreKey = "andazz:admins";
export type Admin = { email: string; id: string; createdAt: string; passwordHash: string };
export type Identity = { email: string; id: string; role: "owner" | "admin" };
export const ownerEmail = () => process.env.ADMIN_EMAIL?.trim().toLowerCase() || "";
export function hashPassword(password: string) {
 const salt = randomBytes(16).toString("hex");
 return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
export function checkPassword(password: string, encoded: string) {
 const [salt, hash] = encoded.split(":");
 if (!salt || !hash) return false;
 const actual = scryptSync(password, salt, 64), expected = Buffer.from(hash, "hex");
 return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export async function findAdmin(email: string): Promise<Admin | null> {
 const raw = await redisCommand<string | null>(["HGET", adminStoreKey, email]);
 return raw ? JSON.parse(raw) : null;
}
export async function authenticate(email: string, password: string): Promise<Identity | null> {
 if (email === ownerEmail()) {
  const a = Buffer.from(password), b = Buffer.from(process.env.ADMIN_PASSWORD || "");
  return b.length && a.length === b.length && timingSafeEqual(a, b) ? { email, id: "owner", role: "owner" } : null;
 }
 const admin = await findAdmin(email);
 return admin && checkPassword(password, admin.passwordHash) ? { email, id: admin.id, role: "admin" } : null;
}
export async function createAdminToken(identity: Identity) {
 const payload = Buffer.from(JSON.stringify({ ...identity, exp: Date.now() + 604800000 })).toString("base64url");
 return payload + "." + createHmac("sha256", process.env.SESSION_SECRET!).update(payload).digest("hex");
}
export async function verifyAdminToken(token?: string | null): Promise<Identity | null> {
 if (!token || !ownerEmail() || (process.env.SESSION_SECRET?.length || 0) < 32) return null;
 try {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = createHmac("sha256", process.env.SESSION_SECRET!).update(payload).digest("hex");
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const data = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (!Number.isFinite(data.exp) || data.exp <= Date.now()) return null;
  if (data.role === "owner" && data.id === "owner" && data.email === ownerEmail()) return { email: data.email, id: "owner", role: "owner" };
  if (data.role !== "admin" || typeof data.email !== "string" || data.email === ownerEmail()) return null;
  const admin = await findAdmin(data.email);
  return admin && admin.id === data.id ? { email: admin.email, id: admin.id, role: "admin" } : null;
 } catch { return null; }
}
export async function getAdmin() { return verifyAdminToken((await cookies()).get(adminCookieName)?.value); }
export async function isAdmin() { return Boolean(await getAdmin()); }
