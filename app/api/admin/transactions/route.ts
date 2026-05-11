import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ensurePermission } from "@/lib/permissions";

type Direction = "Credit" | "Debit";

type TypeFilter = "All" | "Cash" | "Transfer";

const VALID_TYPES = new Set<TypeFilter>(["All", "Cash", "Transfer"]);
const VALID_DIRECTIONS = new Set<Direction>(["Credit", "Debit"]);

const toPositiveInt = (value: string) => {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null;
  }
  return numberValue;
};

const toSafeTypeFilter = (value: string | null): TypeFilter => {
  if (value && VALID_TYPES.has(value as TypeFilter)) {
    return value as TypeFilter;
  }
  return "All";
};

export async function GET(request: NextRequest) {
  const denial = await ensurePermission(request, "view_transactions");
  if (denial) {
    return denial;
  }

  try {
    const type = toSafeTypeFilter(request.nextUrl.searchParams.get("type"));
    const accountIdRaw = request.nextUrl.searchParams.get("accountId");
    const accountId = accountIdRaw ? toPositiveInt(accountIdRaw) : null;
    const startDateRaw = (request.nextUrl.searchParams.get("startDate") ?? "").trim();
    const endDateRaw = (request.nextUrl.searchParams.get("endDate") ?? "").trim();
    const startDate = startDateRaw || null;
    const endDate = endDateRaw ? `${endDateRaw} 23:59:59` : null;
    const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "200");
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(400, limitRaw)) : 200;

    if (accountIdRaw && !accountId) {
      return NextResponse.json({ success: false, error: "Invalid account id." }, { status: 400 });
    }

    if (startDate && Number.isNaN(Date.parse(startDate))) {
      return NextResponse.json({ success: false, error: "Invalid start date." }, { status: 400 });
    }

    if (endDate && Number.isNaN(Date.parse(endDate))) {
      return NextResponse.json({ success: false, error: "Invalid end date." }, { status: 400 });
    }

    const [rows]: any = await db.execute(
      `
      SELECT
        t.transaction_id AS transactionId,
        t.transaction_type AS transactionType,
        t.direction AS direction,
        t.amount AS amount,
        t.reference AS reference,
        t.created_at AS createdAt,
        t.account_id AS accountId,
        a.account_number AS accountNumber,
        a.client_id AS clientId,
        a.product_id AS productId,
        p.product_name AS productName
      FROM transactions t
      INNER JOIN accounts a ON a.account_id = t.account_id
      INNER JOIN products p ON p.product_id = a.product_id
      WHERE (? = 'All' OR t.transaction_type = ?)
        AND (? IS NULL OR t.account_id = ?)
        AND (? IS NULL OR t.created_at >= ?)
        AND (? IS NULL OR t.created_at <= ?)
      ORDER BY t.created_at DESC
      LIMIT ?
      `,
      [type, type, accountId, accountId, startDate, startDate, endDate, endDate, limit]
    );

    return NextResponse.json({ success: true, data: rows ?? [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to fetch transactions." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const denial = await ensurePermission(request, "post_cash");
  if (denial) {
    return denial;
  }

  const connection = await db.getConnection();

  try {
    const body = await request.json();
    const accountValue = String(body?.accountId ?? "").trim();
    const accountId = toPositiveInt(accountValue);
    const direction = String(body?.direction ?? "").trim() as Direction;
    const amountRaw = String(body?.amount ?? "").trim();
    const amount = Number(amountRaw);
    const reference = String(body?.reference ?? "").trim() || null;

    if (!accountValue) {
      return NextResponse.json({ success: false, error: "Account id is required." }, { status: 400 });
    }

    if (!VALID_DIRECTIONS.has(direction)) {
      return NextResponse.json({ success: false, error: "Direction must be Credit or Debit." }, { status: 400 });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: "Amount must be greater than zero." }, { status: 400 });
    }

    const signedAmount = direction === "Debit" ? -Math.abs(amount) : Math.abs(amount);

    await connection.beginTransaction();

    const [accountRows]: any = await connection.execute(
      `
      SELECT account_id AS accountId, account_number AS accountNumber, balance
      FROM accounts
      WHERE account_id = ? OR account_number = ?
      FOR UPDATE
      `,
      [accountId ?? -1, accountValue]
    );

    if (!accountRows.length) {
      await connection.rollback();
      return NextResponse.json({ success: false, error: "Account not found." }, { status: 404 });
    }

    const matchedRow =
      accountRows.find((row: any) => String(row.accountNumber) === accountValue) ?? accountRows[0];
    const resolvedAccountId = Number(matchedRow.accountId);
    const currentBalance = Number(matchedRow.balance ?? 0);
    const newBalance = currentBalance + signedAmount;

    await connection.execute(`UPDATE accounts SET balance = ? WHERE account_id = ?`, [newBalance, resolvedAccountId]);

    const [result]: any = await connection.execute(
      `
      INSERT INTO transactions (account_id, transaction_type, direction, amount, reference)
      VALUES (?, 'Cash', ?, ?, ?)
      `,
      [resolvedAccountId, direction, signedAmount, reference]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      data: {
        transactionId: result.insertId,
        accountId: resolvedAccountId,
        newBalance,
      },
    });
  } catch (error: any) {
    await connection.rollback();
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to post cash transaction." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
