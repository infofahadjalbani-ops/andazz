"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Item = { id: string; name: string; size: string; qty: number; unitPrice: number; lineTotal: number };
type Order = {
  id: string; customerName: string; phone: string; email: string | null; address: string;
  city: string; notes: string | null; paymentMethod: string; paymentReference: string | null;
  subtotal: number; status: string; createdAt: string; items: Item[];
};
const statuses = ["new", "confirmed", "shipped", "completed", "cancelled"];
const statusLabel = (status: string) => status === "cancelled" ? "CANCELED" : status.toUpperCase();
const money = (value: number) => `Rs.${value.toLocaleString("en-PK")}`;

export default function OrdersClient({ adminEmail, signOutHref, isOwner }: { adminEmail: string; signOutHref: string; isOwner: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  useEffect(() => {
    fetch("/api/admin/orders").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Orders could not load.");
      setOrders(data.orders);
    }).catch((reason) => setError(reason.message)).finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    if (updating) return;
    const previous = orders;
    setUpdating(true);
    setError("");
    setOrders(current => current.map(order => order.id === id ? { ...order, status } : order));
    try {
      const response = await fetch("/api/admin/orders", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status }) });
      if (!response.ok) throw new Error("Status update failed.");
    } catch {
      setOrders(previous);
      setError("Status update failed. Please try again.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f4f1] text-zinc-950">
      <header className="border-b border-zinc-300 bg-white px-5 py-5 sm:px-10">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5">
          <div><p className="text-xs font-bold tracking-[.18em] text-red-700">ANDAZZ / ADMIN</p><h1 className="mt-1 text-3xl font-black tracking-tight">ORDERS</h1></div>
          <div className="text-right text-xs"><p className="text-zinc-500">{adminEmail}</p>{isOwner && <a className="mr-4 mt-2 inline-block font-bold underline" href="/admin/admins">MANAGE ADMINS</a>}<a className="mt-1 inline-block font-bold underline" href={signOutHref}>SIGN OUT</a></div>
        </div>
      </header>
      <section className="mx-auto max-w-[1500px] px-5 py-8 sm:px-10">
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <div className="border border-zinc-300 bg-white p-4"><span className="text-xs text-zinc-500">TOTAL</span><strong className="mt-1 block text-2xl">{orders.length}</strong></div>
          {statuses.map(status => <div key={status} className="border border-zinc-300 bg-white p-4"><span className="text-xs text-zinc-500">{statusLabel(status)}</span><strong className="mt-1 block text-2xl text-red-700">{orders.filter(order => order.status === status).length}</strong></div>)}
        </div>
        {loading && <p className="border border-zinc-300 bg-white p-8">Loading orders…</p>}
        {error && <p role="alert" className="mb-5 border border-red-300 bg-red-50 p-4 text-red-800">{error}</p>}
        {!loading && !error && orders.length === 0 && <p className="border border-zinc-300 bg-white p-10 text-center">No orders yet.</p>}
        {orders.length > 0 && <div className="border border-zinc-300 bg-white">
          <Table>
            <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Items</TableHead><TableHead>Payment</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{orders.map(order => <TableRow key={order.id}>
              <TableCell className="align-top"><strong>{order.id}</strong><small className="mt-1 block text-zinc-500">{new Date(order.createdAt).toLocaleString("en-PK")}</small></TableCell>
              <TableCell className="min-w-64 whitespace-normal align-top"><strong>{order.customerName}</strong><span className="mt-1 block">{order.phone}</span>{order.email && <span className="block text-zinc-500">{order.email}</span>}<span className="mt-2 block text-zinc-600">{order.address}, {order.city}</span>{order.notes && <span className="mt-2 block italic text-zinc-500">{order.notes}</span>}</TableCell>
              <TableCell className="min-w-64 whitespace-normal align-top">{order.items.map(item => <div key={`${item.id}-${item.size}`} className="mb-2"><strong>{item.name}</strong><small className="block text-zinc-500">Size {item.size} · Qty {item.qty} · {money(item.lineTotal)}</small></div>)}</TableCell>
              <TableCell className="align-top"><strong>{order.paymentMethod === "cod" ? "Cash on Delivery" : "Bank Transfer"}</strong>{order.paymentReference && <span className="mt-1 block text-zinc-500">Ref: {order.paymentReference}</span>}</TableCell>
              <TableCell className="align-top font-bold">{money(order.subtotal)}</TableCell>
              <TableCell className="align-top"><Select disabled={updating} value={order.status} onValueChange={(value) => updateStatus(order.id, value)}><SelectTrigger aria-label={`Status for ${order.id}`}><SelectValue /></SelectTrigger><SelectContent>{statuses.map(status => <SelectItem key={status} value={status}>{statusLabel(status)}</SelectItem>)}</SelectContent></Select></TableCell>
            </TableRow>)}</TableBody>
          </Table>
        </div>}
      </section>
    </main>
  );
}
