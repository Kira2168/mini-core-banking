// app/api/register/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

type Category = "Individual" | "Non-Individual";

const INDIVIDUAL_SUBTYPES = new Set(["Individual", "Minor", "Group", "Staff"]);
const NON_INDIVIDUAL_SUBTYPES = new Set(["Corporate", "Association", "Bank", "NGO"]);
const GENDERS = new Set(["Male", "Female", "Other"]);

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isRegistrationNumber = (value: string) => /^REG-\d{5,12}$/.test(value);

const parseIsoDateUtc = (value: string) => {
  if (!isIsoDate(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  // Reject impossible calendar dates like 2026-02-31.

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

const calculateAgeYearsUtc = (dob: Date, reference: Date) => {
  let age = reference.getUTCFullYear() - dob.getUTCFullYear();
  const hasHadBirthdayThisYear =
    reference.getUTCMonth() > dob.getUTCMonth() ||
    (reference.getUTCMonth() === dob.getUTCMonth() && reference.getUTCDate() >= dob.getUTCDate());

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
};

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

      if (!GENDERS.has(gender)) {
        return NextResponse.json({ success: false, error: "Invalid gender." }, { status: 400 });
      }

      const parsedDob = parseIsoDateUtc(dob);
      if (!parsedDob) {
        return NextResponse.json(
          { success: false, error: "Date of birth must be a real calendar date." },
          { status: 400 }
        );
      }

      const now = new Date();
      if (parsedDob.getTime() > now.getTime()) {
        return NextResponse.json(
          { success: false, error: "Date of birth cannot be in the future." },
          { status: 400 }
        );
      }

      const age = calculateAgeYearsUtc(parsedDob, now);
      if (age < 18) {
        return NextResponse.json(
          { success: false, error: "Individual clients must be at least 18 years old." },
          { status: 400 }
        );
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

    const [result] = await db.execute(
      `CALL PRC_Register_Client(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category,
        firstName || null,
        lastName || null,
        dob || null,
        category === "Individual" ? gender : null,
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unexpected server error.";
    console.error("Database Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}