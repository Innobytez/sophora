import fs from "node:fs/promises";
import path from "node:path";

import nodemailer from "nodemailer";

import { config } from "./config.js";

let transporter;

function getTransporter() {
  if (!config.smtp.host || !config.smtp.user || !config.smtp.pass) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
      }
    });
  }

  return transporter;
}

export async function sendEmail({ to, subject, text, html, type = "generic", meta = {} }) {
  const transport = getTransporter();

  if (transport) {
    await transport.sendMail({
      from: config.smtp.from,
      to,
      subject,
      text,
      html
    });
    return { mode: "smtp" };
  }

  const filename = `${Date.now()}-${type}.json`;
  const outputPath = path.join(config.emailOutboxDir, filename);
  await fs.writeFile(
    outputPath,
    JSON.stringify(
      {
        to,
        subject,
        text,
        html,
        meta,
        createdAt: new Date().toISOString()
      },
      null,
      2
    ),
    "utf8"
  );
  return { mode: "file", outputPath };
}
