import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin-auth";
import AdminsClient from "./admins-client";
export default async function AdminsPage() {
 const admin = await getAdmin();
 if (!admin) redirect("/admin/login");
 if (admin.role !== "owner") redirect("/admin/orders");
 return <AdminsClient />;
}
