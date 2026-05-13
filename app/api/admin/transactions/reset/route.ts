import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/permissions";

const requireSuperAdmin = async (request: NextRequest) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const [roleRows]: any = await db.execute(
    `SELECT role_name AS roleName FROM roles WHERE role_id = ? LIMIT 1`,
    [session.roleId]
  );

  if (roleRows?.[0]?.roleName !== "Super Admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return null;
};

const toMySqlDateTime = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export async function POST(request: NextRequest) {
  const denial = await requireSuperAdmin(request);
  if (denial) {
    return denial;
  }

  try {
    await db.execute(
      `
      CREATE TABLE IF NOT EXISTS admin_settings (
        setting_key VARCHAR(64) PRIMARY KEY,
        setting_value VARCHAR(255) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
      `
    );

    const resetAt = toMySqlDateTime(new Date());

    await db.execute(
      `
      INSERT INTO admin_settings (setting_key, setting_value)
      VALUES ('transactions_reset_at', ?)
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP
      `,
      [resetAt]
    );

    return NextResponse.json({ success: true, data: { resetAt } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to clear transactions." },
      { status: 500 }
    );
  }
}
