import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getDefaultPermissionsForRole, getSessionFromRequest } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [roleRows]: any = await db.execute(
      `SELECT role_name AS roleName FROM roles WHERE role_id = ? LIMIT 1`,
      [session.roleId]
    );

    const [permRows]: any = await db.execute(
      `
      SELECT p.permission_name AS permissionName
      FROM role_permissions rp
      INNER JOIN permissions p ON p.permission_id = rp.permission_id
      WHERE rp.role_id = ?
      ORDER BY p.permission_name ASC
      `,
      [session.roleId]
    );

    const roleName = roleRows?.[0]?.roleName ?? "";
    const defaultPermissions = getDefaultPermissionsForRole(roleName);
    const dbPermissions = (permRows ?? []).map((row: any) => row.permissionName);
    const mergedPermissions = Array.from(new Set([...dbPermissions, ...defaultPermissions]));

    return NextResponse.json({
      success: true,
      data: {
        userId: session.userId,
        username: session.username,
        roleId: session.roleId,
        roleName,
        permissions: mergedPermissions,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to load session." },
      { status: 500 }
    );
  }
}
