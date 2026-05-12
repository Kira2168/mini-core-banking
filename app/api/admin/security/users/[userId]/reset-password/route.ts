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

const generatePassword = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 10; i += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
};

export async function POST(
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
    const temporaryPassword = generatePassword();
    const passwordHash = hashPassword(temporaryPassword);

    const [result]: any = await db.execute(
      `UPDATE users SET password_hash = ? WHERE user_id = ?`,
      [passwordHash, userId]
    );

    if (!result.affectedRows) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { temporaryPassword } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to reset password." },
      { status: 500 }
    );
  }
}
