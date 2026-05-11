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
        r.role_id AS roleId,
        r.role_name AS roleName,
        r.description AS description,
        r.created_at AS createdAt,
        GROUP_CONCAT(rp.permission_id ORDER BY rp.permission_id) AS permissionIds
      FROM roles r
      LEFT JOIN role_permissions rp ON rp.role_id = r.role_id
      GROUP BY r.role_id
      ORDER BY r.role_name ASC
      `
    );

    const roles = (rows ?? []).map((role: any) => ({
      ...role,
      permissionIds: role.permissionIds
        ? String(role.permissionIds)
            .split(",")
            .map((id) => Number(id))
            .filter((id) => Number.isFinite(id))
        : [],
    }));

    return NextResponse.json({ success: true, data: roles });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to fetch roles." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const denial = await ensurePermission(request, "edit_roles");
  if (denial) {
    return denial;
  }

  try {
    const body = await request.json();
    const roleName = String(body?.roleName ?? "").trim();
    const description = String(body?.description ?? "").trim() || null;

    if (!roleName) {
      return NextResponse.json({ success: false, error: "Role name is required." }, { status: 400 });
    }

    const [result]: any = await db.execute(
      `INSERT INTO roles (role_name, description) VALUES (?, ?)`,
      [roleName, description]
    );

    return NextResponse.json({
      success: true,
      data: {
        roleId: result.insertId,
        roleName,
        description,
      },
    });
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { success: false, error: "Role name already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to create role." },
      { status: 500 }
    );
  }
}
