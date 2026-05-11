import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/security";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  validateRoleCredentials,
} from "@/lib/adminAuth";

const ALLOWED_ROLES = new Set(["Admin", "Manager", "Officer", "Super Admin"]);

const normalizeRole = (value: unknown) => {
  const role = String(value ?? "").trim();
  return ALLOWED_ROLES.has(role) ? role : null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = String(body?.id ?? "").trim();
    const password = String(body?.password ?? "").trim();
    const selectedRole = normalizeRole(body?.role) ?? "Admin";

    if (!id || !password) {
      return NextResponse.json(
        { success: false, error: "Admin ID and password are required." },
        { status: 400 }
      );
    }

    const [userRows]: any = await db.execute(
      `
      SELECT user_id AS userId, username, password_hash AS passwordHash, status, role_id AS roleId
      FROM users
      WHERE username = ?
      LIMIT 1
      `,
      [id]
    );

    if (userRows.length) {
      const user = userRows[0];

      if (user.status !== "Active") {
        return NextResponse.json(
          { success: false, error: "User is inactive." },
          { status: 403 }
        );
      }

      if (!verifyPassword(password, user.passwordHash)) {
        return NextResponse.json(
          { success: false, error: "Invalid admin credentials." },
          { status: 401 }
        );
      }

      const response = NextResponse.json({ success: true });
      response.cookies.set({
        name: ADMIN_SESSION_COOKIE,
        value: createAdminSessionToken(user.userId, user.roleId, user.username),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 8,
      });

      return response;
    }

    if (!validateRoleCredentials(selectedRole, id, password)) {
      return NextResponse.json(
        { success: false, error: "Invalid admin credentials." },
        { status: 401 }
      );
    }

    const [roleRows]: any = await db.execute(
      `SELECT role_id AS roleId FROM roles WHERE role_name = ? LIMIT 1`,
      [selectedRole]
    );
    const roleId = Number(roleRows?.[0]?.roleId ?? (selectedRole === "Super Admin" ? 1 : 0));

    if (!Number.isInteger(roleId) || roleId <= 0) {
      return NextResponse.json(
        { success: false, error: "Role is not configured." },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: createAdminSessionToken(0, roleId, id),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: "Login failed." }, { status: 500 });
  }
}
