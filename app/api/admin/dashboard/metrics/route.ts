import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ensurePermission } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const denial = await ensurePermission(request, "view_dashboard");
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

    const [resetRows]: any = await db.execute(
      `SELECT setting_value AS settingValue FROM admin_settings WHERE setting_key = 'dashboard_reset_at' LIMIT 1`
    );
    const resetAt = resetRows?.[0]?.settingValue ?? null;

    const [clientWeekRows]: any = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM Client_Master
      WHERE registration_date >= GREATEST(
        IFNULL(?, '1970-01-01'),
        DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
      )
      `
      ,
      [resetAt]
    );

    const [clientMonthRows]: any = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM Client_Master
      WHERE registration_date >= GREATEST(
        IFNULL(?, '1970-01-01'),
        DATE_FORMAT(CURDATE(), '%Y-%m-01')
      )
      `
      ,
      [resetAt]
    );

    const [cashWeekRows]: any = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM transactions
      WHERE transaction_type = 'Cash'
        AND created_at >= GREATEST(
          IFNULL(?, '1970-01-01'),
          DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
        )
      `
      ,
      [resetAt]
    );

    const [transferWeekRows]: any = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM transactions
      WHERE transaction_type = 'Transfer'
        AND created_at >= GREATEST(
          IFNULL(?, '1970-01-01'),
          DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
        )
      `
      ,
      [resetAt]
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
      WHERE t.created_at >= GREATEST(
        IFNULL(?, '1970-01-01'),
        DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
      )
      ORDER BY ABS(t.amount) DESC
      LIMIT 5
      `
      ,
      [resetAt]
    );

    const [topAccountsRows]: any = await db.execute(
      `
      SELECT
        account_id AS accountId,
        account_number AS accountNumber,
        client_id AS clientId,
        balance AS balance
      FROM accounts
      WHERE created_at >= IFNULL(?, '1970-01-01')
      ORDER BY balance DESC
      LIMIT 5
      `
      ,
      [resetAt]
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
