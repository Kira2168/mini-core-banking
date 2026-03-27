import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/adminAuth";

const VALID_STATUS = new Set(["Active", "Inactive", "Suspended"]);
const VALID_GENDER = new Set(["Male", "Female", "Other"]);

const getClientId = (value: string) => {
  const clientId = Number(value);
  if (!Number.isInteger(clientId) || clientId <= 0) {
    return null;
  }
  return clientId;
};

const isAuthorized = (request: NextRequest) => {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
};

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { clientId: clientIdParam } = await params;
  const clientId = getClientId(clientIdParam);

  if (!clientId) {
    return NextResponse.json({ success: false, error: "Invalid client id." }, { status: 400 });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [masterRows]: any = await connection.execute(
      `SELECT client_category AS clientCategory FROM Client_Master WHERE client_id = ? FOR UPDATE`,
      [clientId]
    );

    if (!masterRows.length) {
      await connection.rollback();
      return NextResponse.json({ success: false, error: "Client not found." }, { status: 404 });
    }

    const clientCategory = masterRows[0].clientCategory as "Individual" | "Non-Individual";

    if (clientCategory === "Individual") {
      await connection.execute(`DELETE FROM Individual_Clients WHERE individual_id = ?`, [clientId]);
    } else {
      await connection.execute(`DELETE FROM Non_Individual_Clients WHERE non_individual_id = ?`, [clientId]);
    }

    await connection.execute(`DELETE FROM Client_Master WHERE client_id = ?`, [clientId]);

    await connection.commit();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    await connection.rollback();
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to delete client." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { clientId: clientIdParam } = await params;
  const clientId = getClientId(clientIdParam);

  if (!clientId) {
    return NextResponse.json({ success: false, error: "Invalid client id." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const status = String(body?.status ?? "").trim();

    if (!VALID_STATUS.has(status)) {
      return NextResponse.json({ success: false, error: "Invalid status." }, { status: 400 });
    }

    const [result]: any = await db.execute(
      `UPDATE Client_Master SET status = ? WHERE client_id = ?`,
      [status, clientId]
    );

    if (!result.affectedRows) {
      return NextResponse.json({ success: false, error: "Client not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to update client status." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { clientId: clientIdParam } = await params;
  const clientId = getClientId(clientIdParam);

  if (!clientId) {
    return NextResponse.json({ success: false, error: "Invalid client id." }, { status: 400 });
  }

  const connection = await db.getConnection();

  try {
    const body = await request.json();
    await connection.beginTransaction();

    const [masterRows]: any = await connection.execute(
      `SELECT client_category AS clientCategory FROM Client_Master WHERE client_id = ? FOR UPDATE`,
      [clientId]
    );

    if (!masterRows.length) {
      await connection.rollback();
      return NextResponse.json({ success: false, error: "Client not found." }, { status: 404 });
    }

    const clientCategory = masterRows[0].clientCategory as "Individual" | "Non-Individual";
    const nextStatus = String(body?.status ?? "").trim();

    if (nextStatus && !VALID_STATUS.has(nextStatus)) {
      await connection.rollback();
      return NextResponse.json({ success: false, error: "Invalid status." }, { status: 400 });
    }

    if (nextStatus) {
      await connection.execute(`UPDATE Client_Master SET status = ? WHERE client_id = ?`, [nextStatus, clientId]);
    }

    if (clientCategory === "Individual") {
      const firstName = String(body?.firstName ?? "").trim();
      const lastName = String(body?.lastName ?? "").trim();
      const dobRaw = String(body?.dob ?? "").trim();
      const genderRaw = String(body?.gender ?? "").trim();
      const subType = String(body?.individualSubType ?? "").trim();

      if (!firstName || !lastName) {
        await connection.rollback();
        return NextResponse.json(
          { success: false, error: "First name and last name are required." },
          { status: 400 }
        );
      }

      const dob = dobRaw || null;
      if (dob && Number.isNaN(Date.parse(dob))) {
        await connection.rollback();
        return NextResponse.json({ success: false, error: "Invalid date of birth." }, { status: 400 });
      }

      const gender = genderRaw || null;
      if (gender && !VALID_GENDER.has(gender)) {
        await connection.rollback();
        return NextResponse.json({ success: false, error: "Invalid gender." }, { status: 400 });
      }

      await connection.execute(
        `
        UPDATE Individual_Clients
        SET first_name = ?,
            last_name = ?,
            dob = ?,
            gender = ?,
            sub_type = ?
        WHERE individual_id = ?
        `,
        [firstName, lastName, dob, gender, subType || null, clientId]
      );
    } else {
      const organizationName = String(body?.organizationName ?? "").trim();
      const registrationNumber = String(body?.registrationNumber ?? "").trim();
      const incorporationDateRaw = String(body?.incorporationDate ?? "").trim();
      const subType = String(body?.nonIndividualSubType ?? "").trim();

      if (!organizationName || !registrationNumber) {
        await connection.rollback();
        return NextResponse.json(
          { success: false, error: "Organization name and registration number are required." },
          { status: 400 }
        );
      }

      const incorporationDate = incorporationDateRaw || null;
      if (incorporationDate && Number.isNaN(Date.parse(incorporationDate))) {
        await connection.rollback();
        return NextResponse.json(
          { success: false, error: "Invalid incorporation date." },
          { status: 400 }
        );
      }

      await connection.execute(
        `
        UPDATE Non_Individual_Clients
        SET organization_name = ?,
            registration_number = ?,
            incorporation_date = ?,
            sub_type = ?
        WHERE non_individual_id = ?
        `,
        [organizationName, registrationNumber, incorporationDate, subType || null, clientId]
      );
    }

    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    await connection.rollback();
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to update client." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
