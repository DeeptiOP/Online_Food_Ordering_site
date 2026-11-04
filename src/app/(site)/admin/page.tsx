import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";
import { isAdmin } from "@/lib/admin";
import { getCategories, getProducts } from "@/lib/catalog";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Admin Dashboard | Momo Delights" };

export default async function AdminPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login?notice=Please%20log%20in%20to%20continue&type=warning");
  if (!await isAdmin()) redirect("/");

  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return <AdminDashboard initialProducts={products} initialCategories={categories} />;
}
