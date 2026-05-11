import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, decodeAdminSessionToken } from "@/lib/adminAuth";

export const getSessionFromRequest = (request: NextRequest) => {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return decodeAdminSessionToken(token);
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
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return null;
};
