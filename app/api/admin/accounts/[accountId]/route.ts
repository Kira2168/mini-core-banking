import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ensurePermission } from "@/lib/permissions";

const VALID_STATUSES = new Set(["Active", "Inactive", "Frozen", "Closed"]);

const toPositiveInt = (value: string) => {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null;
  }
  return numberValue;
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const denial = await ensurePermission(request, "edit_account");
  if (denial) {
    return denial;
  }

  const { accountId: accountIdParam } = await params;
  const accountId = toPositiveInt(accountIdParam);

  if (!accountId) {
    return NextResponse.json({ success: false, error: "Invalid account id." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const status = String(body?.status ?? "").trim();
    const branchId = toPositiveInt(String(body?.branchId ?? "").trim());

    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json({ success: false, error: "Invalid status." }, { status: 400 });
    }

    if (!branchId) {
      return NextResponse.json({ success: false, error: "Invalid branch id." }, { status: 400 });
    }

    const [result]: any = await db.execute(
      `UPDATE accounts SET status = ?, branch_id = ? WHERE account_id = ?`,
      [status, branchId, accountId]
    );

    if (!result.affectedRows) {
      return NextResponse.json({ success: false, error: "Account not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to update account." },
      { status: 500 }
    );
  }
}
