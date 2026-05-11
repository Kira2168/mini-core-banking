import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ensurePermission } from "@/lib/permissions";

const toPositiveInt = (value: string) => {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null;
  }
  return numberValue;
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  const denial = await ensurePermission(request, "edit_roles");
  if (denial) {
    return denial;
  }

  const { roleId: roleIdParam } = await params;
  const roleId = toPositiveInt(roleIdParam);

  if (!roleId) {
    return NextResponse.json({ success: false, error: "Invalid role id." }, { status: 400 });
  }

  const connection = await db.getConnection();

  try {
    const body = await request.json();
    const permissionIds = Array.isArray(body?.permissionIds)
      ? body.permissionIds.map((id: any) => Number(id)).filter((id: number) => Number.isFinite(id))
      : [];

    await connection.beginTransaction();

    const [roleRows]: any = await connection.execute(`SELECT role_id FROM roles WHERE role_id = ?`, [roleId]);
    if (!roleRows.length) {
      await connection.rollback();
      return NextResponse.json({ success: false, error: "Role not found." }, { status: 404 });
    }

    await connection.execute(`DELETE FROM role_permissions WHERE role_id = ?`, [roleId]);

    if (permissionIds.length) {
      const values = permissionIds.map(() => "(?, ?)").join(", ");
      const paramsList = permissionIds.flatMap((permissionId) => [roleId, permissionId]);
      await connection.execute(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`,
        paramsList
      );
    }

    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    await connection.rollback();
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to update role permissions." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
