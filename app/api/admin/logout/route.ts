import { NextResponse } from "next/server";
import { adminCookieName } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  response.cookies.set(adminCookieName, "", { path: "/", maxAge: 0 });
  return response;
}
