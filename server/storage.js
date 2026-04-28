import fs from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import mime from "mime-types";

import { config } from "./config.js";

let s3Client;
let storageReadyPromise;

function isS3Storage() {
  return config.storage.driver === "s3";
}

function getS3Client() {
  if (!isS3Storage()) return null;
  if (!s3Client) {
    s3Client = new S3Client({
      region: config.storage.region,
      endpoint: config.storage.endpoint || undefined,
      forcePathStyle: config.storage.forcePathStyle,
      credentials: config.storage.accessKeyId && config.storage.secretAccessKey
        ? {
            accessKeyId: config.storage.accessKeyId,
            secretAccessKey: config.storage.secretAccessKey
          }
        : undefined
    });
  }
  return s3Client;
}

export function publicUploadPathToStorageKey(publicPath) {
  const text = String(publicPath || "").trim();
  if (!text.startsWith("/uploads/")) return null;
  return text.replace(/^\/uploads\//, "");
}

export function buildArtistStorageKey(artistSlug, fileName) {
  return `${String(artistSlug || "").trim()}/${String(fileName || "").trim()}`.replace(/^\/+/, "");
}

export function buildPublicUploadPathFromKey(key) {
  return `/uploads/${String(key || "").replace(/^\/+/, "")}`;
}

export function getLocalUploadFilePath(publicPath) {
  const key = publicUploadPathToStorageKey(publicPath);
  if (!key) return null;
  return path.join(config.uploadsDir, key);
}

export async function ensureStorageReady() {
  if (!isS3Storage()) {
    await fs.mkdir(config.uploadsDir, { recursive: true });
    return;
  }

  if (!storageReadyPromise) {
    storageReadyPromise = (async () => {
      const client = getS3Client();
      const bucket = config.storage.bucket;
      try {
        await client.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch (error) {
        const code = error?.name || error?.Code || "";
        if (code !== "NotFound" && code !== "NoSuchBucket") {
          throw error;
        }
        try {
          await client.send(new CreateBucketCommand({ Bucket: bucket }));
        } catch (createError) {
          const createCode = createError?.name || createError?.Code || "";
          if (createCode !== "BucketAlreadyOwnedByYou" && createCode !== "BucketAlreadyExists") {
            throw createError;
          }
        }
      }
    })();
  }

  await storageReadyPromise;
}

export async function checkStorageHealth() {
  if (!isS3Storage()) {
    await fs.access(config.uploadsDir);
    return {
      ok: true,
      driver: "local"
    };
  }

  await getS3Client().send(new HeadBucketCommand({ Bucket: config.storage.bucket }));
  return {
    ok: true,
    driver: "s3",
    bucket: config.storage.bucket
  };
}

export async function putStorageObject({ key, buffer, contentType = "" }) {
  const normalizedKey = String(key || "").replace(/^\/+/, "");
  if (!isS3Storage()) {
    const filePath = path.join(config.uploadsDir, normalizedKey);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return {
      key: normalizedKey,
      publicPath: buildPublicUploadPathFromKey(normalizedKey)
    };
  }

  await ensureStorageReady();
  await getS3Client().send(new PutObjectCommand({
    Bucket: config.storage.bucket,
    Key: normalizedKey,
    Body: buffer,
    ContentType: contentType || mime.lookup(normalizedKey) || "application/octet-stream"
  }));

  return {
    key: normalizedKey,
    publicPath: buildPublicUploadPathFromKey(normalizedKey)
  };
}

export async function putArtistUpload({ artistSlug, fileName, buffer, contentType = "" }) {
  const key = buildArtistStorageKey(artistSlug, fileName);
  return putStorageObject({ key, buffer, contentType });
}

export async function deleteUploadByPublicPath(publicPath) {
  const key = publicUploadPathToStorageKey(publicPath);
  if (!key) return;

  if (!isS3Storage()) {
    const filePath = path.join(config.uploadsDir, key);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    return;
  }

  await ensureStorageReady();
  await getS3Client().send(new DeleteObjectCommand({
    Bucket: config.storage.bucket,
    Key: key
  }));
}

function pipeReadableBody(body, res) {
  if (!body) {
    res.status(404).end();
    return;
  }

  if (typeof body.pipe === "function") {
    body.pipe(res);
    return;
  }

  if (typeof body.transformToWebStream === "function") {
    Readable.fromWeb(body.transformToWebStream()).pipe(res);
    return;
  }

  res.status(500).end();
}

export async function streamUploadToResponse(publicPath, res) {
  const key = publicUploadPathToStorageKey(publicPath);
  if (!key) return false;

  if (!isS3Storage()) {
    const filePath = path.join(config.uploadsDir, key);
    try {
      await fs.access(filePath);
    } catch (error) {
      if (error?.code === "ENOENT") return false;
      throw error;
    }
    return filePath;
  }

  await ensureStorageReady();

  try {
    const response = await getS3Client().send(new GetObjectCommand({
      Bucket: config.storage.bucket,
      Key: key
    }));
    if (response.ContentType) {
      res.type(response.ContentType);
    }
    if (response.ContentLength != null) {
      res.setHeader("Content-Length", String(response.ContentLength));
    }
    pipeReadableBody(response.Body, res);
    return true;
  } catch (error) {
    const code = error?.name || error?.Code || "";
    if (code === "NoSuchKey" || code === "NotFound") {
      return false;
    }
    throw error;
  }
}
