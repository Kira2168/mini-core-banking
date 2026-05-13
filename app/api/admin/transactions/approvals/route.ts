import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ensurePermission, getRoleNameById, getSessionFromRequest } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const denial = await ensurePermission(request, "view_transactions");
  if (denial) {
    return denial;
  }

  const session = getSessionFromRequest(request);
  const roleName = session ? await getRoleNameById(session.roleId) : null;
  if (roleName !== "Manager" && roleName !== "Super Admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    await db.execute(
      `
      CREATE TABLE IF NOT EXISTS cash_approvals (
        approval_id BIGINT PRIMARY KEY AUTO_INCREMENT,
        account_id BIGINT NOT NULL,
        direction VARCHAR(10) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        reference VARCHAR(255) NULL,
        requested_by BIGINT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Pending',
        transaction_id BIGINT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        decided_by BIGINT NULL,
        decided_at TIMESTAMP NULL
      )
      `
    );

    const [rows]: any = await db.execute(
      `
      SELECT
        ca.approval_id AS approvalId,
        ca.account_id AS accountId,
        a.account_number AS accountNumber,
        a.client_id AS clientId,
        ca.direction AS direction,
        ca.amount AS amount,
        ca.reference AS reference,
        ca.status AS status,
        ca.created_at AS createdAt
      FROM cash_approvals ca
      INNER JOIN accounts a ON a.account_id = ca.account_id
      WHERE ca.status = 'Pending'
      ORDER BY ca.created_at ASC
      `
    );

    return NextResponse.json({ success: true, data: rows ?? [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to load approvals." },
      { status: 500 }
    );
  }
}
