import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import AdminDashboardShell from "@/components/AdminDashboardShell";
import { ADMIN_SESSION_COOKIE, decodeAdminSessionToken, verifyAdminSessionToken } from "@/lib/adminAuth";

export default async function BalanceDashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!verifyAdminSessionToken(sessionToken)) {
    redirect("/admin/login");
  }

  const session = decodeAdminSessionToken(sessionToken);
  const adminName = session?.username ?? "Admin";
  const roleId = Number(session?.roleId ?? 0);

  if (!Number.isInteger(roleId) || roleId <= 0) {
    redirect("/dashboard");
  }

  const [roleRows]: any = await db.execute(
    `SELECT role_name AS roleName FROM roles WHERE role_id = ? LIMIT 1`,
    [roleId]
  );
  const roleName = roleRows?.[0]?.roleName ?? "";

  if (roleName !== "Manager" && roleName !== "Super Admin") {
    redirect("/dashboard");
  }

  return (
    <AdminDashboardShell
      adminName={adminName}
      showClients={false}
      showProducts={false}
      showAccounts={false}
      showTransactions={false}
      showBalances
      showBackToDashboard
    />
  );
}
