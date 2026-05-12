import crypto from "crypto";

const SUPER_ADMIN_USER = process.env.SUPER_ADMIN_USER ?? "kirubel";
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD ?? "kira2168";
const MANAGER_USER = process.env.MANAGER_USER ?? "manager";
const MANAGER_PASSWORD = process.env.MANAGER_PASSWORD ?? "manager1";
const OFFICER_USER = process.env.OFFICER_USER ?? "officer";
const OFFICER_PASSWORD = process.env.OFFICER_PASSWORD ?? "officer1";
const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ?? "change-this-admin-session-secret";

export const ADMIN_SESSION_COOKIE = "admin_session";

const sign = (value: string) => {
  return crypto.createHmac("sha256", ADMIN_SESSION_SECRET).update(value).digest("hex");
};

export const validateAdminCredentials = (id: string, password: string) => {
  return id === SUPER_ADMIN_USER && password === SUPER_ADMIN_PASSWORD;
};

export const validateRoleCredentials = (role: string, id: string, password: string) => {
  if (role === "Super Admin") {
    return id === SUPER_ADMIN_USER && password === SUPER_ADMIN_PASSWORD;
  }

  if (role === "Manager") {
    return id === MANAGER_USER && password === MANAGER_PASSWORD;
  }

  if (role === "Officer") {
    return id === OFFICER_USER && password === OFFICER_PASSWORD;
  }

  return false;
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
