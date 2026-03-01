import "dotenv/config";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const uploadsDir = path.join(rootDir, "uploads");
const emailOutboxDir = path.join(dataDir, "emails");

for (const dir of [dataDir, uploadsDir, emailOutboxDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

function readBoolean(value, fallback = false) {
  if (value == null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function readNumber(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const port = readNumber(process.env.PORT, 3000);
const appUrl = (process.env.APP_URL || `http://localhost:${port}`).replace(/\/$/, "");
const isProduction = process.env.NODE_ENV === "production";

export const config = {
  rootDir,
  dataDir,
  uploadsDir,
  emailOutboxDir,
  dbPath: path.join(dataDir, "sophora.sqlite"),
  port,
  appUrl,
  isProduction,
  sessionSecret: process.env.SESSION_SECRET || "dev-session-secret-change-me",
  encryptionSecret: process.env.APP_ENCRYPTION_KEY || process.env.SESSION_SECRET || "dev-encryption-secret-change-me",
  sessionCookieName: "sophora_session",
  sessionDurationDays: readNumber(process.env.SESSION_DURATION_DAYS, 14),
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: readNumber(process.env.SMTP_PORT, 587),
    secure: readBoolean(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "Sophora <no-reply@sophora.cl>"
  },
  adminSeed: {
    email: process.env.ADMIN_EMAIL || "",
    username: process.env.ADMIN_USERNAME || "",
    password: process.env.ADMIN_PASSWORD || ""
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      issuer: "https://accounts.google.com",
      scope: "openid email profile"
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID || "",
      clientSecret: process.env.APPLE_CLIENT_SECRET || "",
      issuer: "https://appleid.apple.com",
      scope: "openid email name"
    }
  }
};
