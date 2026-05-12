import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, decodeAdminSessionToken } from "@/lib/adminAuth";

export const getSessionFromRequest = (request: NextRequest) => {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return decodeAdminSessionToken(token);
};

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  Officer: [
    "view_clients",
    "view_accounts",
    "view_transactions",
    "post_cash",
    "post_transfer",
  ],
  Manager: [
    "view_clients",
    "view_accounts",
    "create_account",
    "view_products",
    "create_product",
    "edit_product",
    "delete_product",
    "view_transactions",
    "post_cash",
    "post_transfer",
    "view_dashboard",
  ],
};

export const getDefaultPermissionsForRole = (roleName: string | null) => {
  if (!roleName) {
    return [];
  }
  return ROLE_DEFAULT_PERMISSIONS[roleName] ?? [];
};

export const getRoleNameById = async (roleId: number) => {
  const [roleRows]: any = await db.execute(
    `SELECT role_name AS roleName FROM roles WHERE role_id = ? LIMIT 1`,
    [roleId]
  );
  return roleRows?.[0]?.roleName ?? null;
};

export const ensurePermission = async (request: NextRequest, permissionName: string) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const [rows]: any = await db.execute(
    `
    SELECT 1
    FROM role_permissions rp
    INNER JOIN permissions p ON p.permission_id = rp.permission_id
    WHERE rp.role_id = ? AND p.permission_name = ?
    LIMIT 1
    `,
    [session.roleId, permissionName]
  );

  if (!rows.length) {
    const roleName = await getRoleNameById(session.roleId);
    const defaultPermissions = getDefaultPermissionsForRole(roleName);
    if (defaultPermissions.includes(permissionName)) {
      return null;
    }
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return null;
};
