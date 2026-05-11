import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/security";
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
  { params }: { params: Promise<{ userId: string }> }
) {
  const denial = await ensurePermission(request, "edit_user");
  if (denial) {
    return denial;
  }

  const { userId: userIdParam } = await params;
  const userId = toPositiveInt(userIdParam);

  if (!userId) {
    return NextResponse.json({ success: false, error: "Invalid user id." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim();
    const status = String(body?.status ?? "").trim();
    const roleId = Number(body?.roleId ?? 0);
    const newPassword = String(body?.password ?? "").trim();

    if (!email || !Number.isInteger(roleId) || roleId <= 0) {
      return NextResponse.json(
        { success: false, error: "Email and role are required." },
        { status: 400 }
      );
    }

    if (status !== "Active" && status !== "Inactive") {
      return NextResponse.json({ success: false, error: "Invalid status." }, { status: 400 });
    }

    const passwordHash = newPassword ? hashPassword(newPassword) : null;

    if (passwordHash) {
      await db.execute(
        `UPDATE users SET email = ?, status = ?, role_id = ?, password_hash = ? WHERE user_id = ?`,
        [email, status, roleId, passwordHash, userId]
      );
    } else {
      await db.execute(
        `UPDATE users SET email = ?, status = ?, role_id = ? WHERE user_id = ?`,
        [email, status, roleId, userId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to update user." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const denial = await ensurePermission(request, "delete_user");
  if (denial) {
    return denial;
  }

  const { userId: userIdParam } = await params;
  const userId = toPositiveInt(userIdParam);

  if (!userId) {
    return NextResponse.json({ success: false, error: "Invalid user id." }, { status: 400 });
  }

  try {
    const [result]: any = await db.execute(`DELETE FROM users WHERE user_id = ?`, [userId]);

    if (!result.affectedRows) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to delete user." },
      { status: 500 }
    );
  }
}
