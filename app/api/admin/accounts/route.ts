import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ensurePermission } from "@/lib/permissions";

type AccountStatus = "Active" | "Inactive" | "Frozen" | "Closed";

type StatusFilter = "All" | AccountStatus;

const VALID_STATUS_FILTERS = new Set<StatusFilter>(["All", "Active", "Inactive", "Frozen", "Closed"]);

const toPositiveInt = (value: string) => {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null;
  }
  return numberValue;
};

const toSafeStatusFilter = (value: string | null): StatusFilter => {
  if (value && VALID_STATUS_FILTERS.has(value as StatusFilter)) {
    return value as StatusFilter;
  }
  return "All";
};

export async function GET(request: NextRequest) {
  const denial = await ensurePermission(request, "view_accounts");
  if (denial) {
    return denial;
  }

  try {
    const status = toSafeStatusFilter(request.nextUrl.searchParams.get("status"));
    const search = (request.nextUrl.searchParams.get("search") ?? "").trim();
    const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "200");
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(400, limitRaw)) : 200;
    const productIdRaw = request.nextUrl.searchParams.get("productId");
    const productId = productIdRaw ? toPositiveInt(productIdRaw) : null;

    if (productIdRaw && !productId) {
      return NextResponse.json({ success: false, error: "Invalid product id." }, { status: 400 });
    }

    const [rows]: any = await db.execute(
      `
      SELECT
        a.account_id AS accountId,
        a.account_number AS accountNumber,
        a.client_id AS clientId,
        a.product_id AS productId,
        p.product_name AS productName,
        a.branch_id AS branchId,
        a.status AS status,
        a.balance AS balance,
        a.created_at AS createdAt
      FROM accounts a
      INNER JOIN products p ON p.product_id = a.product_id
      WHERE (? = 'All' OR a.status = ?)
        AND (? IS NULL OR a.product_id = ?)
        AND (
          ? = ''
          OR CAST(a.account_number AS CHAR) LIKE CONCAT('%', ?, '%')
          OR CAST(a.client_id AS CHAR) LIKE CONCAT('%', ?, '%')
        )
      ORDER BY a.created_at DESC
      LIMIT ?
      `,
      [status, status, productId, productId, search, search, search, limit]
    );

    return NextResponse.json({ success: true, data: rows ?? [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to fetch accounts." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const denial = await ensurePermission(request, "create_account");
  if (denial) {
    return denial;
  }

  const connection = await db.getConnection();

  try {
    const body = await request.json();
    const branchId = toPositiveInt(String(body?.branchId ?? "").trim());
    const productId = toPositiveInt(String(body?.productId ?? "").trim());
    const clientId = toPositiveInt(String(body?.clientId ?? "").trim());

    if (!branchId || !productId || !clientId) {
      return NextResponse.json(
        { success: false, error: "Branch id, product id, and client id are required." },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    const [clientRows]: any = await connection.execute(
      `SELECT client_id FROM Client_Master WHERE client_id = ?`,
      [clientId]
    );

    if (!clientRows.length) {
      await connection.rollback();
      return NextResponse.json({ success: false, error: "Client not found." }, { status: 404 });
    }

    const [productRows]: any = await connection.execute(
      `SELECT product_id FROM products WHERE product_id = ?`,
      [productId]
    );

    if (!productRows.length) {
      await connection.rollback();
      return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
    }

    const [existingRows]: any = await connection.execute(
      `SELECT account_id FROM accounts WHERE client_id = ? AND product_id = ? LIMIT 1`,
      [clientId, productId]
    );

    if (existingRows.length) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, error: "Client already has account on this product." },
        { status: 409 }
      );
    }

    const accountNumber = `${branchId}${productId}${clientId}`;

    const [result]: any = await connection.execute(
      `
      INSERT INTO accounts (branch_id, product_id, client_id, account_number)
      VALUES (?, ?, ?, ?)
      `,
      [branchId, productId, clientId, accountNumber]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      data: {
        accountId: result.insertId,
        accountNumber,
      },
    });
  } catch (error: any) {
    await connection.rollback();

    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { success: false, error: "Client already has account on this product." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to create account." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
