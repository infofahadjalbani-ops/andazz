import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin-auth";
import OrdersClient from "./orders-client";

export default async function OrdersPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return <OrdersClient adminEmail={admin.email} isOwner={admin.role === "owner"} signOutHref="/api/admin/logout" />;
}
