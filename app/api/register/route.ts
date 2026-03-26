// app/api/register/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

type Category = "Individual" | "Non-Individual";

const INDIVIDUAL_SUBTYPES = new Set(["Individual", "Minor", "Group", "Staff"]);
const NON_INDIVIDUAL_SUBTYPES = new Set(["Corporate", "Association", "Bank", "NGO"]);

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isRegistrationNumber = (value: string) => /^REG-\d{5,12}$/.test(value);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const category = body?.category as Category;
    const firstName = (body?.firstName ?? "").trim();
    const lastName = (body?.lastName ?? "").trim();
    const dob = (body?.dob ?? "").trim();
    const gender = (body?.gender ?? "Male").trim() || "Male";
    const subType = (body?.subType ?? "").trim();
    const orgName = (body?.orgName ?? "").trim();
    const regNo = (body?.regNo ?? "").trim();
    const incorpDate = (body?.incorpDate ?? "").trim();

    if (category !== "Individual" && category !== "Non-Individual") {
      return NextResponse.json({ success: false, error: "Invalid category." }, { status: 400 });
    }

    if (category === "Individual") {
      if (!firstName || !lastName || !dob) {
        return NextResponse.json(
          { success: false, error: "First name, last name, and date of birth are required." },
          { status: 400 }
        );
      }

      if (!INDIVIDUAL_SUBTYPES.has(subType)) {
        return NextResponse.json({ success: false, error: "Invalid individual subtype." }, { status: 400 });
      }

      if (!isIsoDate(dob)) {
        return NextResponse.json({ success: false, error: "Date of birth must use YYYY-MM-DD format." }, { status: 400 });
      }
    }

    if (category === "Non-Individual") {
      if (!orgName || !regNo) {
        return NextResponse.json(
          { success: false, error: "Organization name and registration number are required." },
          { status: 400 }
        );
      }

      if (!isRegistrationNumber(regNo)) {
        return NextResponse.json(
          { success: false, error: "Registration number must look like REG-88990." },
          { status: 400 }
        );
      }

      if (!NON_INDIVIDUAL_SUBTYPES.has(subType)) {
        return NextResponse.json({ success: false, error: "Invalid non-individual subtype." }, { status: 400 });
      }

      if (incorpDate && !isIsoDate(incorpDate)) {
        return NextResponse.json(
          { success: false, error: "Incorporation date must use YYYY-MM-DD format." },
          { status: 400 }
        );
      }
    }

    const [result]: any = await db.execute(
      `CALL PRC_Register_Client(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category,
        firstName || null,
        lastName || null,
        dob || null,
        gender,
        category === "Individual" ? subType : null,
        orgName || null,
        regNo || null,
        incorpDate || null,
        category === "Non-Individual" ? subType : null,
      ]
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Database Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}