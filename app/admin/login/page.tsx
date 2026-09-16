"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    if (response.ok) { router.push("/admin/orders"); router.refresh(); return; }
    const result = await response.json(); setError(result.error || "Login failed."); setLoading(false);
  }
  return <main className="grid min-h-screen place-items-center bg-zinc-950 p-5 text-white"><form onSubmit={submit} className="w-full max-w-md border border-zinc-700 bg-zinc-900 p-8"><p className="text-xs font-bold tracking-[.18em] text-red-500">ANDAZZ / ADMIN</p><h1 className="mt-4 text-4xl font-black">ORDER LOGIN</h1><label className="mt-8 grid gap-2 text-xs font-bold tracking-wider">EMAIL<input required name="email" type="email" className="border border-zinc-600 bg-black p-3 text-base font-normal tracking-normal" /></label><label className="mt-4 grid gap-2 text-xs font-bold tracking-wider">PASSWORD<input required name="password" type="password" className="border border-zinc-600 bg-black p-3 text-base font-normal tracking-normal" /></label>{error && <p className="mt-4 bg-red-950 p-3 text-sm text-red-200">{error}</p>}<button disabled={loading} className="mt-6 w-full bg-red-700 p-4 font-bold tracking-wider disabled:opacity-60">{loading ? "SIGNING IN…" : "SIGN IN"}</button><a href="/" className="mt-5 block text-center text-xs text-zinc-400 underline">BACK TO STORE</a></form></main>;
}
