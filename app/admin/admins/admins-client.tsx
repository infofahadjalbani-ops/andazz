"use client";
import { useEffect, useState, type FormEvent } from "react";
type Admin = {email:string;id:string;createdAt:string};
export default function AdminsClient() {
 const [admins,setAdmins] = useState<Admin[]>([]);
 const [owner,setOwner] = useState("");
 const [email,setEmail] = useState("");
 const [password,setPassword] = useState("");
 const [loading,setLoading] = useState(true);
 const [busy,setBusy] = useState(false);
 const [error,setError] = useState("");
 const [message,setMessage] = useState("");
 async function load() {
  const response = await fetch("/api/admin/admins",{cache:"no-store"});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Admins could not load.");
  setAdmins(data.admins); setOwner(data.owner);
 }
 useEffect(() => { load().catch(e => setError(e.message)).finally(() => setLoading(false)); },[]);
 async function save(method: string, target: string) {
  setBusy(true); setError(""); setMessage("");
  try {
   const response = await fetch("/api/admin/admins",{method,headers:{"content-type":"application/json"},body:JSON.stringify({email:target,...(method === "POST" ? {password} : {})})});
   const data = await response.json();
   if (!response.ok) throw new Error(data.error || "Changes could not be saved.");
   if (method === "POST") {setEmail("");setPassword("");}
   setMessage(method === "POST" ? "Admin added. Share the login URL and password privately." : "Admin removed. Their access has been revoked.");
   await load();
  } catch(e) {setError(e instanceof Error ? e.message : "Connection failed. Please try again.");}
  finally {setBusy(false);}
 }
 function add(event: FormEvent) {event.preventDefault(); void save("POST",email);}
 return <main className="min-h-screen bg-[#f4f4f1] text-zinc-950">
  <header className="border-b border-zinc-300 bg-white px-5 py-6"><div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold tracking-widest text-red-700">ANDAZZ / OWNER</p><h1 className="mt-1 text-3xl font-black">MANAGE ADMINS</h1></div><nav className="flex gap-5 text-xs font-bold underline"><a href="/admin/orders">ORDERS</a><a href="/api/admin/logout">SIGN OUT</a></nav></div></header>
  <section className="mx-auto max-w-4xl space-y-6 px-5 py-8">
   <p className="text-sm text-zinc-600">Admins can view and update orders. Only you, the owner, can add or remove admins.</p>
   {error && <p role="alert" className="border border-red-300 bg-red-50 p-4 text-red-800">{error}</p>}
   {message && <p role="status" className="border border-green-300 bg-green-50 p-4 text-green-900">{message}</p>}
   <form onSubmit={add} className="space-y-4 border border-zinc-300 bg-white p-6">
    <h2 className="text-xl font-black">ADD ADMIN</h2>
    <div className="grid gap-4 sm:grid-cols-2">
     <label className="text-xs font-bold">EMAIL<input required type="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} autoComplete="off" className="mt-2 block w-full border border-zinc-400 p-3 text-base font-normal" /></label>
     <label className="text-xs font-bold">PASSWORD<input required type="password" minLength={12} maxLength={256} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" className="mt-2 block w-full border border-zinc-400 p-3 text-base font-normal" /><span className="mt-1 block font-normal text-zinc-500">At least 12 characters.</span></label>
    </div>
    <button disabled={busy || loading} className="bg-red-700 px-6 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "SAVING…" : "ADD ADMIN"}</button>
   </form>
   <div className="divide-y divide-zinc-200 border border-zinc-300 bg-white">
    {loading ? <p className="p-6">Loading admins…</p> : <>
     <div className="flex flex-wrap items-center justify-between gap-3 p-6"><div className="min-w-0 break-all font-bold">{owner}</div><span className="text-xs font-bold text-zinc-500">OWNER · PROTECTED</span></div>
     {admins.map(admin=><div key={admin.id} className="flex flex-wrap items-center justify-between gap-3 p-6"><div className="min-w-0"><p className="break-all font-bold">{admin.email}</p><p className="mt-1 text-xs text-zinc-500">Admin · Added {new Date(admin.createdAt).toLocaleDateString()}</p></div><button disabled={busy} onClick={()=>{if(window.confirm("Remove " + admin.email + "? They will lose access immediately.")) void save("DELETE",admin.email);}} className="border border-red-700 px-4 py-2 text-xs font-bold text-red-700 disabled:opacity-50">DELETE</button></div>)}
     {!admins.length && <p className="p-6 text-sm text-zinc-500">No additional admins yet.</p>}
    </>}
   </div>
  </section>
 </main>;
}
