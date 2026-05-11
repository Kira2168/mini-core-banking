import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ensurePermission } from "@/lib/permissions";

const toPositiveInt = (value: string) => {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null;
  }
  return numberValue;
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const denial = await ensurePermission(request, "edit_product");
  if (denial) {
    return denial;
  }

  const { productId: productIdParam } = await params;
  const productId = toPositiveInt(productIdParam);

  if (!productId) {
    return NextResponse.json({ success: false, error: "Invalid product id." }, { status: 400 });
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
      UPDATE products
      SET product_name = ?,
          interest_rate = ?,
          product_type = ?,
          active_from = ?,
          expiry_date = ?,
          minimum_balance = ?
      WHERE product_id = ?
      `,
      [
        productName,
        interestRate,
        productType,
        activeFrom,
        expiryDateRaw || null,
        minimumBalance,
        productId,
      ]
    );

    if (!result.affectedRows) {
      return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        productId,
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
      { success: false, error: error?.message ?? "Failed to update product." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const denial = await ensurePermission(request, "delete_product");
  if (denial) {
    return denial;
  }

  const { productId: productIdParam } = await params;
  const productId = toPositiveInt(productIdParam);

  if (!productId) {
    return NextResponse.json({ success: false, error: "Invalid product id." }, { status: 400 });
  }

  try {
    const [accountRows]: any = await db.execute(
      `SELECT COUNT(*) AS total FROM accounts WHERE product_id = ?`,
      [productId]
    );

    const totalAccounts = Number(accountRows?.[0]?.total ?? 0);
    if (totalAccounts > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete product with active accounts." },
        { status: 409 }
      );
    }

    const [result]: any = await db.execute(
      `DELETE FROM products WHERE product_id = ?`,
      [productId]
    );

    if (!result.affectedRows) {
      return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to delete product." },
      { status: 500 }
    );
  }
}
