import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/adminAuth";

const isAuthorized = (request: NextRequest) => {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
};

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [rows]: any = await db.execute(
      `
      SELECT
        permission_id AS permissionId,
        permission_name AS permissionName,
        module_name AS moduleName,
        action_name AS actionName,
        description AS description
      FROM permissions
      ORDER BY module_name ASC, action_name ASC
      `
    );

    return NextResponse.json({ success: true, data: rows ?? [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to fetch permissions." },
      { status: 500 }
    );
  }
}
