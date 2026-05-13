import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ensurePermission, getRoleNameById, getSessionFromRequest } from "@/lib/permissions";

const toPositiveInt = (value: string) => {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null;
  }
  return numberValue;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ approvalId: string }> }
) {
  const denial = await ensurePermission(request, "post_cash");
  if (denial) {
    return denial;
  }

  const session = getSessionFromRequest(request);
  const roleName = session ? await getRoleNameById(session.roleId) : null;
  if (roleName !== "Manager" && roleName !== "Super Admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { approvalId: approvalIdParam } = await params;
  const approvalId = toPositiveInt(approvalIdParam);

  if (!approvalId) {
    return NextResponse.json({ success: false, error: "Invalid approval id." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const action = String(body?.action ?? "").trim();

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
    }

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

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [approvalRows]: any = await connection.execute(
        `SELECT * FROM cash_approvals WHERE approval_id = ? FOR UPDATE`,
        [approvalId]
      );

      if (!approvalRows.length) {
        await connection.rollback();
        return NextResponse.json({ success: false, error: "Approval not found." }, { status: 404 });
      }

      const approval = approvalRows[0];
      if (approval.status !== "Pending") {
        await connection.rollback();
        return NextResponse.json({ success: false, error: "Approval already processed." }, { status: 409 });
      }

      if (action === "reject") {
        await connection.execute(
          `
          UPDATE cash_approvals
          SET status = 'Rejected', decided_by = ?, decided_at = CURRENT_TIMESTAMP
          WHERE approval_id = ?
          `,
          [session?.userId ?? 0, approvalId]
        );
        await connection.commit();
        return NextResponse.json({ success: true });
      }

      const [accountRows]: any = await connection.execute(
        `SELECT balance FROM accounts WHERE account_id = ? FOR UPDATE`,
        [approval.account_id]
      );

      if (!accountRows.length) {
        await connection.rollback();
        return NextResponse.json({ success: false, error: "Account not found." }, { status: 404 });
      }

      const amount = Number(approval.amount);
      const signedAmount = approval.direction === "Debit" ? -Math.abs(amount) : Math.abs(amount);
      const currentBalance = Number(accountRows[0].balance ?? 0);
      const newBalance = currentBalance + signedAmount;

      await connection.execute(`UPDATE accounts SET balance = ? WHERE account_id = ?`, [newBalance, approval.account_id]);

      const [result]: any = await connection.execute(
        `
        INSERT INTO transactions (account_id, transaction_type, direction, amount, reference)
        VALUES (?, 'Cash', ?, ?, ?)
        `,
        [approval.account_id, approval.direction, signedAmount, approval.reference]
      );

      await connection.execute(
        `
        UPDATE cash_approvals
        SET status = 'Approved', decided_by = ?, decided_at = CURRENT_TIMESTAMP, transaction_id = ?
        WHERE approval_id = ?
        `,
        [session?.userId ?? 0, result.insertId, approvalId]
      );

      await connection.commit();
      return NextResponse.json({
        success: true,
        data: {
          transactionId: result.insertId,
          accountId: approval.account_id,
          newBalance,
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to process approval." },
      { status: 500 }
    );
  }
}
