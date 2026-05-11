import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/security";
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
        u.user_id AS userId,
        u.username AS username,
        u.email AS email,
        u.status AS status,
        u.role_id AS roleId,
        r.role_name AS roleName,
        u.created_at AS createdAt
      FROM users u
      INNER JOIN roles r ON r.role_id = u.role_id
      ORDER BY u.created_at DESC
      `
    );

    return NextResponse.json({ success: true, data: rows ?? [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to fetch users." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const username = String(body?.username ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const password = String(body?.password ?? "").trim();
    const roleId = Number(body?.roleId ?? 0);

    if (!username || !email || !password || !Number.isInteger(roleId) || roleId <= 0) {
      return NextResponse.json(
        { success: false, error: "Username, email, password, and role are required." },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);

    const [result]: any = await db.execute(
      `INSERT INTO users (username, password_hash, email, role_id) VALUES (?, ?, ?, ?)`,
      [username, passwordHash, email, roleId]
    );

    return NextResponse.json({
      success: true,
      data: {
        userId: result.insertId,
        username,
        email,
        roleId,
      },
    });
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { success: false, error: "Username already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to create user." },
      { status: 500 }
    );
  }
}
