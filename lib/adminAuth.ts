import crypto from "crypto";

const ADMIN_ID = process.env.ADMIN_ID ?? "kirubel";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "kira2168";
const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ?? "change-this-admin-session-secret";

export const ADMIN_SESSION_COOKIE = "admin_session";

const sign = (value: string) => {
  return crypto.createHmac("sha256", ADMIN_SESSION_SECRET).update(value).digest("hex");
};

export const validateAdminCredentials = (id: string, password: string) => {
  return id === ADMIN_ID && password === ADMIN_PASSWORD;
};

export const createAdminSessionToken = (adminId: string) => {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 8;
  const payload = `${adminId}:${expiresAt}`;
  const signature = sign(payload);
  const encodedPayload = Buffer.from(payload, "utf8").toString("base64url");
  return `${encodedPayload}.${signature}`;
};

export const verifyAdminSessionToken = (token: string | undefined) => {
  if (!token) {
    return false;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return false;
  }

  const payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  const expectedSignature = sign(payload);

  if (signature !== expectedSignature) {
    return false;
  }

  const [adminId, expiresAtRaw] = payload.split(":");
  const expiresAt = Number(expiresAtRaw);

  if (!adminId || Number.isNaN(expiresAt)) {
    return false;
  }

  if (Date.now() > expiresAt) {
    return false;
  }

  return adminId === ADMIN_ID;
};
