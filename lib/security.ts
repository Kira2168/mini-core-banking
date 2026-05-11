import crypto from "crypto";

const ITERATIONS = 10000;
const KEYLEN = 64;
const DIGEST = "sha256";

const toHex = (buffer: Buffer) => buffer.toString("hex");

export const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST);
  return `${toHex(salt)}:${toHex(hash)}`;
};

export const verifyPassword = (password: string, stored: string) => {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) {
    return false;
  }
  const salt = Buffer.from(saltHex, "hex");
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST);
  return crypto.timingSafeEqual(Buffer.from(hashHex, "hex"), hash);
};
