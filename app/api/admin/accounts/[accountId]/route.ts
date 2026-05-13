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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const denial = await ensurePermission(request, "view_accounts");
  if (denial) {
    return denial;
  }

  const { accountId: accountIdParam } = await params;
  const accountId = toPositiveInt(accountIdParam);
  const accountNumber = String(accountIdParam ?? "").trim();

  if (!accountId && !accountNumber) {
    return NextResponse.json({ success: false, error: "Invalid account id." }, { status: 400 });
  }

  try {
    const [rows]: any = await db.execute(
      `
      SELECT
        a.account_id AS accountId,
        a.account_number AS accountNumber,
        a.client_id AS clientId,
        COALESCE(CONCAT(ic.first_name, ' ', ic.last_name), nic.organization_name, 'Client') AS clientName
      FROM accounts a
      LEFT JOIN Individual_Clients ic ON ic.individual_id = a.client_id
      LEFT JOIN Non_Individual_Clients nic ON nic.non_individual_id = a.client_id
      WHERE a.account_id = ? OR a.account_number = ?
      LIMIT 1
      `,
      [accountId ?? -1, accountNumber]
    );

    if (!rows.length) {
      return NextResponse.json({ success: false, error: "Account not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to load account." },
      { status: 500 }
    );
  }
}
