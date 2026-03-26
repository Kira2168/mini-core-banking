import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/adminAuth";

type CategoryFilter = "All" | "Individual" | "Non-Individual";
type StatusFilter = "All" | "Active" | "Inactive" | "Suspended";

const VALID_CATEGORY_FILTERS = new Set<CategoryFilter>(["All", "Individual", "Non-Individual"]);
const VALID_STATUS_FILTERS = new Set<StatusFilter>(["All", "Active", "Inactive", "Suspended"]);

const toSafeCategoryFilter = (value: string | null): CategoryFilter => {
  if (value && VALID_CATEGORY_FILTERS.has(value as CategoryFilter)) {
    return value as CategoryFilter;
  }
  return "All";
};

const toSafeStatusFilter = (value: string | null): StatusFilter => {
  if (value && VALID_STATUS_FILTERS.has(value as StatusFilter)) {
    return value as StatusFilter;
  }
  return "All";
};

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!verifyAdminSessionToken(token)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const category = toSafeCategoryFilter(request.nextUrl.searchParams.get("category"));
    const status = toSafeStatusFilter(request.nextUrl.searchParams.get("status"));
    const search = (request.nextUrl.searchParams.get("search") ?? "").trim();
    const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "100");
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(300, limitRaw)) : 100;

    const [rows]: any = await db.execute(
      `
      SELECT
        cm.client_id AS clientId,
        cm.client_category AS clientCategory,
        cm.registration_date AS registrationDate,
        cm.status AS status,
        ic.first_name AS firstName,
        ic.last_name AS lastName,
        ic.dob AS dob,
        ic.gender AS gender,
        ic.sub_type AS individualSubType,
        nic.organization_name AS organizationName,
        nic.registration_number AS registrationNumber,
        nic.incorporation_date AS incorporationDate,
        nic.sub_type AS nonIndividualSubType
      FROM Client_Master cm
      LEFT JOIN Individual_Clients ic ON ic.individual_id = cm.client_id
      LEFT JOIN Non_Individual_Clients nic ON nic.non_individual_id = cm.client_id
      WHERE (? = 'All' OR cm.client_category = ?)
        AND (? = 'All' OR cm.status = ?)
        AND (
          ? = ''
          OR CAST(cm.client_id AS CHAR) LIKE CONCAT('%', ?, '%')
          OR COALESCE(ic.first_name, '') LIKE CONCAT('%', ?, '%')
          OR COALESCE(ic.last_name, '') LIKE CONCAT('%', ?, '%')
          OR COALESCE(nic.organization_name, '') LIKE CONCAT('%', ?, '%')
          OR COALESCE(nic.registration_number, '') LIKE CONCAT('%', ?, '%')
        )
      ORDER BY cm.registration_date DESC
      LIMIT ?
      `,
      [
        category,
        category,
        status,
        status,
        search,
        search,
        search,
        search,
        search,
        search,
        limit,
      ]
    );

    const [countsRows]: any = await db.execute(
      `
      SELECT
        COUNT(*) AS totalClients,
        SUM(CASE WHEN client_category = 'Individual' THEN 1 ELSE 0 END) AS totalIndividuals,
        SUM(CASE WHEN client_category = 'Non-Individual' THEN 1 ELSE 0 END) AS totalNonIndividuals
      FROM Client_Master
      `
    );

    const counts = countsRows?.[0] ?? {
      totalClients: 0,
      totalIndividuals: 0,
      totalNonIndividuals: 0,
    };

    return NextResponse.json({
      success: true,
      data: rows,
      meta: {
        totalClients: Number(counts.totalClients ?? 0),
        totalIndividuals: Number(counts.totalIndividuals ?? 0),
        totalNonIndividuals: Number(counts.totalNonIndividuals ?? 0),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to fetch clients." },
      { status: 500 }
    );
  }
}
