import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboardShell from "@/components/AdminDashboardShell";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/adminAuth";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!verifyAdminSessionToken(sessionToken)) {
    redirect("/admin/login");
  }

  return <AdminDashboardShell adminName="Kirubel Adisu" />;
}
