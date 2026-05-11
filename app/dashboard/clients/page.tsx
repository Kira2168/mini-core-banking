import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboardShell from "@/components/AdminDashboardShell";
import { ADMIN_SESSION_COOKIE, decodeAdminSessionToken, verifyAdminSessionToken } from "@/lib/adminAuth";

export default async function ClientsDashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!verifyAdminSessionToken(sessionToken)) {
    redirect("/admin/login");
  }

  const session = decodeAdminSessionToken(sessionToken);
  const adminName = session?.username ?? "Admin";

  return (
    <AdminDashboardShell
      adminName={adminName}
      showClients
      showProducts={false}
      showAccounts={false}
    />
  );
}
