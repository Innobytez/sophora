import crypto from "node:crypto";

import { config } from "./config.js";

const ENCRYPTION_KEY = crypto.createHash("sha256").update(config.encryptionSecret).digest();

function scryptAsync(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derivedKey = await scryptAsync(password, salt);
  return `scrypt:${salt.toString("hex")}:${Buffer.from(derivedKey).toString("hex")}`;
}

export async function verifyPassword(password, storedValue) {
  const [scheme, saltHex, keyHex] = String(storedValue || "").split(":");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;

  const derivedKey = await scryptAsync(password, Buffer.from(saltHex, "hex"));
  const candidate = Buffer.from(derivedKey).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(keyHex, "hex"));
}

export function encryptText(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${authTag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptText(payload) {
  if (!payload) return "";
  const [ivPart, authTagPart, encryptedPart] = String(payload).split(".");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    ENCRYPTION_KEY,
    Buffer.from(ivPart, "base64url")
  );
  decipher.setAuthTag(Buffer.from(authTagPart, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
}

export function createRandomToken(byteLength = 32) {
  return crypto.randomBytes(byteLength).toString("base64url");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

export function createPasswordLengthEnvelope(password) {
  return encryptText(String(password.length));
}

export function readPasswordLengthEnvelope(encryptedLength) {
  const raw = decryptText(encryptedLength);
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function signValue(value) {
  return crypto.createHmac("sha256", config.sessionSecret).update(String(value)).digest("hex");
}
