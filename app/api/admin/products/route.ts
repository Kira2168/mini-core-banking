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
    const [rows]: any = await db.execute(
      `
      SELECT
        product_id AS productId,
        product_name AS productName,
        interest_rate AS interestRate,
        product_type AS productType,
        active_from AS activeFrom,
        expiry_date AS expiryDate,
        minimum_balance AS minimumBalance,
        created_at AS createdAt
      FROM products
      ORDER BY product_name ASC
      `
    );

    return NextResponse.json({ success: true, data: rows ?? [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to fetch products." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const productName = String(body?.productName ?? "").trim();
    const interestRateRaw = String(body?.interestRate ?? "0").trim();
    const interestRate = Number(interestRateRaw);
    const productType = String(body?.productType ?? "").trim();
    const activeFrom = String(body?.activeFrom ?? "").trim();
    const expiryDateRaw = String(body?.expiryDate ?? "").trim();
    const minimumBalanceRaw = String(body?.minimumBalance ?? "0").trim();
    const minimumBalance = Number(minimumBalanceRaw);

    if (!productName) {
      return NextResponse.json(
        { success: false, error: "Product name is required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(interestRate) || interestRate < 0) {
      return NextResponse.json(
        { success: false, error: "Interest rate must be a valid number." },
        { status: 400 }
      );
    }

    if (productType !== "Savings" && productType !== "Loan") {
      return NextResponse.json(
        { success: false, error: "Product type must be Savings or Loan." },
        { status: 400 }
      );
    }

    if (!activeFrom || Number.isNaN(Date.parse(activeFrom))) {
      return NextResponse.json(
        { success: false, error: "Active from date is required." },
        { status: 400 }
      );
    }

    if (expiryDateRaw && Number.isNaN(Date.parse(expiryDateRaw))) {
      return NextResponse.json(
        { success: false, error: "Expiry date must be a valid date." },
        { status: 400 }
      );
    }

    if (expiryDateRaw) {
      const activeMs = Date.parse(activeFrom);
      const expiryMs = Date.parse(expiryDateRaw);
      if (expiryMs < activeMs) {
        return NextResponse.json(
          { success: false, error: "Expiry date cannot be before active from date." },
          { status: 400 }
        );
      }
    }

    if (!Number.isFinite(minimumBalance) || minimumBalance < 0) {
      return NextResponse.json(
        { success: false, error: "Minimum balance must be a valid number." },
        { status: 400 }
      );
    }

    const [result]: any = await db.execute(
      `
      INSERT INTO products (
        product_name,
        interest_rate,
        product_type,
        active_from,
        expiry_date,
        minimum_balance
      ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      [productName, interestRate, productType, activeFrom, expiryDateRaw || null, minimumBalance]
    );

    return NextResponse.json({
      success: true,
      data: {
        productId: result.insertId,
        productName,
        interestRate,
        productType,
        activeFrom,
        expiryDate: expiryDateRaw || null,
        minimumBalance,
      },
    });
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { success: false, error: "Product name already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to create product." },
      { status: 500 }
    );
  }
}
