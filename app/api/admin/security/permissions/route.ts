import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ensurePermission } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const denial = await ensurePermission(request, "view_roles");
  if (denial) {
    return denial;
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
