import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
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
    const [clientWeekRows]: any = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM Client_Master
      WHERE registration_date >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
      `
    );

    const [clientMonthRows]: any = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM Client_Master
      WHERE registration_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
      `
    );

    const [cashWeekRows]: any = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM transactions
      WHERE transaction_type = 'Cash'
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
      `
    );

    const [transferWeekRows]: any = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM transactions
      WHERE transaction_type = 'Transfer'
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
      `
    );

    const [topTransactionsRows]: any = await db.execute(
      `
      SELECT
        t.transaction_id AS transactionId,
        t.transaction_type AS transactionType,
        t.direction AS direction,
        t.amount AS amount,
        t.created_at AS createdAt,
        t.account_id AS accountId
      FROM transactions t
      WHERE t.created_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
      ORDER BY ABS(t.amount) DESC
      LIMIT 5
      `
    );

    const [topAccountsRows]: any = await db.execute(
      `
      SELECT
        account_id AS accountId,
        account_number AS accountNumber,
        client_id AS clientId,
        balance AS balance
      FROM accounts
      ORDER BY balance DESC
      LIMIT 5
      `
    );

    return NextResponse.json({
      success: true,
      data: {
        newClientsWeek: Number(clientWeekRows?.[0]?.total ?? 0),
        newClientsMonth: Number(clientMonthRows?.[0]?.total ?? 0),
        cashTransactionsWeek: Number(cashWeekRows?.[0]?.total ?? 0),
        transferTransactionsWeek: Number(transferWeekRows?.[0]?.total ?? 0),
        topTransactionsWeek: topTransactionsRows ?? [],
        topAccountsByBalance: topAccountsRows ?? [],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to load dashboard metrics." },
      { status: 500 }
    );
  }
}
