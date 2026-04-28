import "dotenv/config";

import fs from "node:fs/promises";
import path from "node:path";

import mime from "mime-types";

if (!process.env.STORAGE_DRIVER) {
  process.env.STORAGE_DRIVER = "s3";
}

const { config } = await import("../server/config.js");
const { ensureStorageReady, putStorageObject } = await import("../server/storage.js");

async function walkUploads(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkUploads(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

if (config.storage.driver !== "s3") {
  throw new Error("Set STORAGE_DRIVER=s3 before running the uploads migration.");
}

try {
  await fs.access(config.uploadsDir);
} catch (error) {
  if (error?.code === "ENOENT") {
    console.log("[migrate-local-uploads-to-storage] No local uploads directory found. Nothing to migrate.");
    process.exit(0);
  }
  throw error;
}

const localFiles = await walkUploads(config.uploadsDir);
if (!localFiles.length) {
  console.log("[migrate-local-uploads-to-storage] No files found in uploads/. Nothing to migrate.");
  process.exit(0);
}

await ensureStorageReady();

let uploadedCount = 0;
let uploadedBytes = 0;

for (const filePath of localFiles) {
  const key = path.relative(config.uploadsDir, filePath).split(path.sep).join("/");
  const buffer = await fs.readFile(filePath);
  await putStorageObject({
    key,
    buffer,
    contentType: mime.lookup(filePath) || "application/octet-stream"
  });
  uploadedCount += 1;
  uploadedBytes += buffer.byteLength;
}

console.log(`[migrate-local-uploads-to-storage] Uploaded ${uploadedCount} files (${uploadedBytes} bytes).`);
