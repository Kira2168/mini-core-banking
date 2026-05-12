import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ensurePermission, getRoleNameById, getSessionFromRequest } from "@/lib/permissions";

const TRANSFER_APPROVAL_LIMIT = Number(process.env.TRANSFER_APPROVAL_LIMIT ?? "100000");

const toPositiveInt = (value: string) => {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null;
  }
  return numberValue;
};

export async function POST(request: NextRequest) {
  const denial = await ensurePermission(request, "post_transfer");
  if (denial) {
    return denial;
  }

  const connection = await db.getConnection();

  try {
    const body = await request.json();
    const fromAccountValue = String(body?.fromAccountId ?? "").trim();
    const toAccountValue = String(body?.toAccountId ?? "").trim();
    const fromAccountId = toPositiveInt(fromAccountValue);
    const toAccountId = toPositiveInt(toAccountValue);
    const amountRaw = String(body?.amount ?? "").trim();
    const amount = Number(amountRaw);
    const reference = String(body?.reference ?? "").trim() || null;

    if (!fromAccountValue || !toAccountValue) {
      return NextResponse.json(
        { success: false, error: "From and to account ids are required." },
        { status: 400 }
      );
    }

    if (fromAccountValue === toAccountValue) {
      return NextResponse.json(
        { success: false, error: "From and to accounts must be different." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be greater than zero." },
        { status: 400 }
      );
    }

    if (Number.isFinite(TRANSFER_APPROVAL_LIMIT) && amount > TRANSFER_APPROVAL_LIMIT) {
      const session = getSessionFromRequest(request);
      const roleName = session ? await getRoleNameById(session.roleId) : null;
      if (roleName !== "Manager" && roleName !== "Super Admin") {
        return NextResponse.json(
          { success: false, error: "Manager approval required for this transfer amount." },
          { status: 403 }
        );
      }
    }

    const debitAmount = -Math.abs(amount);
    const creditAmount = Math.abs(amount);

    await connection.beginTransaction();

    const [fromRows]: any = await connection.execute(
      `
      SELECT account_id AS accountId, account_number AS accountNumber
      FROM accounts
      WHERE account_id = ? OR account_number = ?
      `,
      [fromAccountId ?? -1, fromAccountValue]
    );

    const [toRows]: any = await connection.execute(
      `
      SELECT account_id AS accountId, account_number AS accountNumber
      FROM accounts
      WHERE account_id = ? OR account_number = ?
      `,
      [toAccountId ?? -1, toAccountValue]
    );

    if (!fromRows.length || !toRows.length) {
      await connection.rollback();
      return NextResponse.json({ success: false, error: "One or both accounts not found." }, { status: 404 });
    }

    const resolvedFrom =
      fromRows.find((row: any) => String(row.accountNumber) === fromAccountValue) ?? fromRows[0];
    const resolvedTo =
      toRows.find((row: any) => String(row.accountNumber) === toAccountValue) ?? toRows[0];

    const resolvedFromId = Number(resolvedFrom.accountId);
    const resolvedToId = Number(resolvedTo.accountId);

    if (!Number.isInteger(resolvedFromId) || !Number.isInteger(resolvedToId)) {
      await connection.rollback();
      return NextResponse.json({ success: false, error: "One or both accounts not found." }, { status: 404 });
    }

    const ordered = [resolvedFromId, resolvedToId].sort((a, b) => a - b);
    const [accountRows]: any = await connection.execute(
      `SELECT account_id AS accountId, balance FROM accounts WHERE account_id IN (?, ?) FOR UPDATE`,
      [ordered[0], ordered[1]]
    );

    if (accountRows.length !== 2) {
      await connection.rollback();
      return NextResponse.json({ success: false, error: "One or both accounts not found." }, { status: 404 });
    }

    const fromRow = accountRows.find((row: any) => Number(row.accountId) === resolvedFromId);
    const toRow = accountRows.find((row: any) => Number(row.accountId) === resolvedToId);

    if (!fromRow || !toRow) {
      await connection.rollback();
      return NextResponse.json({ success: false, error: "One or both accounts not found." }, { status: 404 });
    }

    const fromBalance = Number(fromRow.balance ?? 0) + debitAmount;
    const toBalance = Number(toRow.balance ?? 0) + creditAmount;

    const [transferResult]: any = await connection.execute(
      `
      INSERT INTO transfer_batches (from_account_id, to_account_id, amount)
      VALUES (?, ?, ?)
      `,
      [resolvedFromId, resolvedToId, amount]
    );

    await connection.execute(`UPDATE accounts SET balance = ? WHERE account_id = ?`, [fromBalance, resolvedFromId]);
    await connection.execute(`UPDATE accounts SET balance = ? WHERE account_id = ?`, [toBalance, resolvedToId]);

    await connection.execute(
      `
      INSERT INTO transactions (account_id, transaction_type, direction, amount, reference)
      VALUES (?, 'Transfer', 'Debit', ?, ?)
      `,
      [resolvedFromId, debitAmount, reference]
    );

    await connection.execute(
      `
      INSERT INTO transactions (account_id, transaction_type, direction, amount, reference)
      VALUES (?, 'Transfer', 'Credit', ?, ?)
      `,
      [resolvedToId, creditAmount, reference]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      data: {
        transferId: transferResult.insertId,
        fromAccountId: resolvedFromId,
        toAccountId: resolvedToId,
        fromBalance,
        toBalance,
      },
    });
  } catch (error: any) {
    await connection.rollback();
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to post transfer transaction." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
