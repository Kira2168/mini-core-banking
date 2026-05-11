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

export type AdminSessionPayload = {
  userId: number;
  roleId: number;
  username: string;
  expiresAt: number;
};

export const createAdminSessionToken = (userId: number, roleId: number, username: string) => {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 8;
  const payload = `${userId}:${roleId}:${username}:${expiresAt}`;
  const signature = sign(payload);
  const encodedPayload = Buffer.from(payload, "utf8").toString("base64url");
  return `${encodedPayload}.${signature}`;
};

export const decodeAdminSessionToken = (token: string | undefined): AdminSessionPayload | null => {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  const expectedSignature = sign(payload);

  if (signature !== expectedSignature) {
    return null;
  }

  const [userIdRaw, roleIdRaw, username, expiresAtRaw] = payload.split(":");
  const userId = Number(userIdRaw);
  const roleId = Number(roleIdRaw);
  const expiresAt = Number(expiresAtRaw);

  if (!username || Number.isNaN(userId) || Number.isNaN(roleId) || Number.isNaN(expiresAt)) {
    return null;
  }

  if (Date.now() > expiresAt) {
    return null;
  }

  return { userId, roleId, username, expiresAt };
};

export const verifyAdminSessionToken = (token: string | undefined) => {
  return Boolean(decodeAdminSessionToken(token));
};
