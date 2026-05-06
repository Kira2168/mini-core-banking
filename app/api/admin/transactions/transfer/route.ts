import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/adminAuth";

const isAuthorized = (request: NextRequest) => {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
};

const toPositiveInt = (value: string) => {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null;
  }
  return numberValue;
};

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const connection = await db.getConnection();

  try {
    const body = await request.json();
    const fromAccountId = toPositiveInt(String(body?.fromAccountId ?? "").trim());
    const toAccountId = toPositiveInt(String(body?.toAccountId ?? "").trim());
    const amountRaw = String(body?.amount ?? "").trim();
    const amount = Number(amountRaw);
    const reference = String(body?.reference ?? "").trim() || null;

    if (!fromAccountId || !toAccountId) {
      return NextResponse.json(
        { success: false, error: "From and to account ids are required." },
        { status: 400 }
      );
    }

    if (fromAccountId === toAccountId) {
      return NextResponse.json(
        { success: false, error: "From and to accounts must be different." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: "Amount must be greater than zero." }, { status: 400 });
    }

    const debitAmount = -Math.abs(amount);
    const creditAmount = Math.abs(amount);

    await connection.beginTransaction();

    const ordered = [fromAccountId, toAccountId].sort((a, b) => a - b);
    const [accountRows]: any = await connection.execute(
      `SELECT account_id AS accountId, balance FROM accounts WHERE account_id IN (?, ?) FOR UPDATE`,
      [ordered[0], ordered[1]]
    );

    if (accountRows.length !== 2) {
      await connection.rollback();
      return NextResponse.json({ success: false, error: "One or both accounts not found." }, { status: 404 });
    }

    const fromRow = accountRows.find((row: any) => Number(row.accountId) === fromAccountId);
    const toRow = accountRows.find((row: any) => Number(row.accountId) === toAccountId);

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
      [fromAccountId, toAccountId, amount]
    );

    await connection.execute(`UPDATE accounts SET balance = ? WHERE account_id = ?`, [fromBalance, fromAccountId]);
    await connection.execute(`UPDATE accounts SET balance = ? WHERE account_id = ?`, [toBalance, toAccountId]);

    await connection.execute(
      `
      INSERT INTO transactions (account_id, transaction_type, direction, amount, reference)
      VALUES (?, 'Transfer', 'Debit', ?, ?)
      `,
      [fromAccountId, debitAmount, reference]
    );

    await connection.execute(
      `
      INSERT INTO transactions (account_id, transaction_type, direction, amount, reference)
      VALUES (?, 'Transfer', 'Credit', ?, ?)
      `,
      [toAccountId, creditAmount, reference]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      data: {
        transferId: transferResult.insertId,
        fromAccountId,
        toAccountId,
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
