import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/adminAuth";

const VALID_STATUS = new Set(["Active", "Inactive", "Suspended"]);

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
