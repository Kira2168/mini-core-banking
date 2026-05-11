import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/adminAuth";

const isAuthorized = (request: NextRequest) => {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
};

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
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { roleId: roleIdParam } = await params;
  const roleId = toPositiveInt(roleIdParam);

  if (!roleId) {
    return NextResponse.json({ success: false, error: "Invalid role id." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const roleName = String(body?.roleName ?? "").trim();
    const description = String(body?.description ?? "").trim() || null;

    if (!roleName) {
      return NextResponse.json({ success: false, error: "Role name is required." }, { status: 400 });
    }

    const [result]: any = await db.execute(
      `UPDATE roles SET role_name = ?, description = ? WHERE role_id = ?`,
      [roleName, description, roleId]
    );

    if (!result.affectedRows) {
      return NextResponse.json({ success: false, error: "Role not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { roleId, roleName, description },
    });
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { success: false, error: "Role name already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to update role." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { roleId: roleIdParam } = await params;
  const roleId = toPositiveInt(roleIdParam);

  if (!roleId) {
    return NextResponse.json({ success: false, error: "Invalid role id." }, { status: 400 });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [userRows]: any = await connection.execute(
      `SELECT COUNT(*) AS total FROM users WHERE role_id = ?`,
      [roleId]
    );

    const totalUsers = Number(userRows?.[0]?.total ?? 0);
    if (totalUsers > 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, error: "Cannot delete role with assigned users." },
        { status: 409 }
      );
    }

    await connection.execute(`DELETE FROM role_permissions WHERE role_id = ?`, [roleId]);
    const [result]: any = await connection.execute(`DELETE FROM roles WHERE role_id = ?`, [roleId]);

    if (!result.affectedRows) {
      await connection.rollback();
      return NextResponse.json({ success: false, error: "Role not found." }, { status: 404 });
    }

    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    await connection.rollback();
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to delete role." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
