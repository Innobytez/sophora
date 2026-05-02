import fs from "node:fs";
import path from "node:path";

import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import multer from "multer";
import * as oidc from "openid-client";
import { z } from "zod";

import { config } from "./config.js";
import { db, initializeDatabase, nowIso, parseJson, serializeJson } from "./database.js";
import { sendEmail } from "./email.js";
import { buildArtistContractPdf, buildClientQuotePdf } from "./pdf.js";
import {
  checkStorageHealth,
  deleteUploadByPublicPath,
  ensureStorageReady,
  putArtistUpload,
  streamUploadToResponse
} from "./storage.js";
import {
  createPasswordLengthEnvelope,
  createRandomToken,
  decryptText,
  encryptText,
  hashPassword,
  hashToken,
  readPasswordLengthEnvelope,
  verifyPassword
} from "./security.js";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: 100 * 1024 * 1024
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

const oauthConfigCache = new Map();
const dateSelectionModeSchema = z.enum(["single", "multiple", "range"]);
const optionalTimeSchema = z.preprocess((value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  return value == null ? undefined : value;
}, z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional()).transform((value) => value || "");
const optionalIntegerSchema = z.preprocess((value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  return value == null ? undefined : value;
}, z.coerce.number().int().min(0).optional()).transform((value) => (value == null ? null : value));

const PUBLIC_ROOT_FILES = [
  "index.html",
  "paraempresas.html",
  "catalogodeartistas.html",
  "artist-catalog-page.html",
  "eventos.html",
  "contacto.html",
  "escribenos.html",
  "unirse.html",
  "login.html",
  "perfil.html",
  "privacidad.html",
  "preguntas.html",
  "artists.html",
  "booking.html",
  "auth.html",
  "admin.html",
  "dashboard.html",
  "reset-password.html",
  "verify-email.html",
  "styles.css",
  "backend.css",
  "i18n.js",
  "site.js",
  "booking.js",
  "backend-common.js",
  "artists-feed.js",
  "home.js",
  "home-web.css",
  "home-web.js",
  "artist-catalog.css",
  "artist-catalog-data.js",
  "artist-catalog.js",
  "artist-page.js",
  "auth.js",
  "admin.js",
  "dashboard.js"
];

const CATALOG_ARTIST_SLUGS = new Set([
  "gusto-completo",
  "carmeners",
  "alexander-roberts",
  "gabriela-caceres",
  "la-sociedad-chilena-del-jass",
  "mirza-y-erick",
  "the-hot-cats-big-band",
  "trio-mena-corral"
]);

function hasStaticCatalogArtist(slug) {
  return CATALOG_ARTIST_SLUGS.has(slug) &&
    fs.existsSync(path.join(config.rootDir, "artists", slug, "assets"));
}

const signUpSchema = z.object({
  username: z.string().trim().min(3).max(48),
  email: z.string().trim().email(),
  password: z.string().min(10).max(128),
  passwordConfirm: z.string().min(10).max(128)
});

const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(255),
  password: z.string().min(1).max(128)
});

const emailOnlySchema = z.object({
  email: z.string().trim().email()
});

const resetPasswordSchema = z.object({
  token: z.string().trim().min(12),
  password: z.string().min(10).max(128),
  passwordConfirm: z.string().min(10).max(128)
});

const onboardingSchema = z.object({
  dismissPermanently: z.boolean()
});

const adminCreateArtistSchema = z.object({
  slug: z.string().trim().max(80).optional().default(""),
  displayName: z.any(),
  shortBio: z.any().optional(),
  publicStatus: z.enum(["published", "hidden"]).default("published"),
  pageMode: z.enum(["page", "booking_only"]).default("page"),
  email: z.string().trim().email().optional().or(z.literal("")).default(""),
  username: z.string().trim().max(48).optional().or(z.literal("")).default(""),
  password: z.string().max(128).optional().or(z.literal("")).default("")
});

const dashboardProfileSchema = z.object({
  artistId: z.coerce.number().int().positive().optional(),
  slug: z.string().trim().min(2).max(80),
  publicStatus: z.enum(["published", "hidden"]),
  pageMode: z.enum(["page", "booking_only"]),
  displayName: z.any(),
  shortBio: z.any().optional(),
  about: z.any().optional(),
  showDetails: z.any().optional(),
  welcomePrefix: z.any().optional(),
  cardImageUrl: z.string().trim().optional().nullable(),
  cardAudioUrl: z.string().trim().optional().nullable(),
  heroImageUrl: z.string().trim().optional().nullable(),
  technicalRiderPath: z.string().trim().optional().nullable(),
  videos: z.array(z.any()).optional().default([]),
  photos: z.array(z.any()).optional().default([]),
  pageSections: z.any().optional()
});

const availabilitySchema = z.object({
  artistId: z.coerce.number().int().positive().optional(),
  mode: z.enum(["custom", "all_available", "all_unavailable"]).default("custom"),
  dates: z.array(z.string().trim()).max(5000).default([])
});

const publicBookingRequestSchema = z.object({
  artistSlug: z.string().trim().min(1).max(160),
  clientName: z.string().trim().min(2).max(160),
  clientEmail: z.string().trim().email().optional().or(z.literal("")).default(""),
  clientPhone: z.string().trim().max(48).optional().or(z.literal("")).default(""),
  notifyByEmail: z.coerce.boolean().default(false),
  notifyBySms: z.coerce.boolean().default(false),
  engagementStartTime: optionalTimeSchema,
  engagementEndTime: optionalTimeSchema,
  location: z.string().trim().max(160).optional().default(""),
  suggestedBudget: optionalIntegerSchema,
  dateMode: dateSelectionModeSchema.default("single"),
  selectedDates: z.array(z.string().trim().min(10).max(10)).max(180).default([]),
  startDate: z.string().trim().max(10).optional().default(""),
  endDate: z.string().trim().max(10).optional().default(""),
  additionalInfo: z.string().trim().max(4000).optional().default("")
}).superRefine((data, ctx) => {
  if (!data.notifyByEmail && !data.notifyBySms) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["notifyByEmail"],
      message: "Choose at least one notification method."
    });
  }
  if (data.notifyByEmail && !String(data.clientEmail || "").trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["clientEmail"],
      message: "An email address is required when email notifications are enabled."
    });
  }
  if (data.notifyBySms && !String(data.clientPhone || "").trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["clientPhone"],
      message: "A phone number is required when WhatsApp notifications are enabled."
    });
  }
});

const eventDetailsSchema = z.object({
  artistId: z.coerce.number().int().positive(),
  bookingRequestId: z.coerce.number().int().positive().optional(),
  title: z.string().trim().min(2).max(160),
  venue: z.string().trim().max(160).optional().default(""),
  engagementTime: z.string().trim().max(120).optional().default(""),
  engagementStartTime: optionalTimeSchema,
  engagementEndTime: optionalTimeSchema,
  dateMode: dateSelectionModeSchema.default("single"),
  selectedDates: z.array(z.string().trim().min(10).max(10)).max(180).default([]),
  startDate: z.string().trim().max(10).optional().default(""),
  endDate: z.string().trim().max(10).optional().default(""),
  paymentAmount: z.coerce.number().int().min(0).default(0),
  currency: z.string().trim().min(3).max(8).default("CLP"),
  clientName: z.string().trim().max(160).optional().default(""),
  clientEmail: z.string().trim().max(255).optional().default(""),
  clientPhone: z.string().trim().max(48).optional().default(""),
  requireSignature: z.coerce.boolean().default(true),
  createArtistPdf: z.coerce.boolean().default(true),
  createClientPdf: z.coerce.boolean().default(true),
  contractPath: z.string().trim().optional().nullable(),
  contractOriginalName: z.string().trim().max(255).optional().nullable(),
  clientPdfPath: z.string().trim().optional().nullable(),
  clientPdfOriginalName: z.string().trim().max(255).optional().nullable(),
  notes: z.string().trim().max(4000).optional().default("")
});

const createEventSchema = eventDetailsSchema;

const updateEventSchema = eventDetailsSchema.partial().extend({
  artistId: z.coerce.number().int().positive().optional(),
  clientPaid: z.coerce.boolean().optional(),
  artistPaid: z.coerce.boolean().optional(),
  resetSignedContract: z.coerce.boolean().optional().default(false)
});

const updateEventPaymentSchema = z.object({
  clientPaid: z.coerce.boolean().optional(),
  artistPaid: z.coerce.boolean().optional()
}).refine((data) => data.clientPaid !== undefined || data.artistPaid !== undefined, {
  message: "At least one payment field is required."
});

const signaturePointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1)
});

const signatureStrokesSchema = z.array(
  z.array(signaturePointSchema).min(2).max(256)
).min(1).max(64);

const signContractSchema = z.object({
  fullName: z.string().trim().min(3).max(160),
  signatureStrokes: signatureStrokesSchema
});

const forwardBookingRequestSchema = z.object({
  channel: z.enum(["email", "whatsapp"]),
  message: z.string().trim().min(1).max(4000)
});

const accountAttachSchema = z.object({
  email: z.string().trim().email(),
  username: z.string().trim().min(3).max(48),
  password: z.string().max(128).optional().or(z.literal("")).default("")
});

const dashboardAccountSchema = z.object({
  artistId: z.coerce.number().int().positive().optional(),
  email: z.string().trim().email(),
  username: z.string().trim().min(3).max(48),
  contactPhone: z.string().trim().max(48).optional().or(z.literal("")).default("")
});

const dashboardAccountPasswordSchema = z.object({
  artistId: z.coerce.number().int().positive().optional(),
  password: z.string().min(10).max(128),
  passwordConfirm: z.string().min(10).max(128)
});

const reorderArtistsSchema = z.object({
  artistIds: z.array(z.coerce.number().int().positive()).min(1).max(500)
});

function safeAsync(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

function jsonError(res, status, message, details) {
  res.status(status).json({
    error: message,
    details: details || undefined
  });
}

function parseCookies(cookieHeader) {
  const parsed = {};
  if (!cookieHeader) return parsed;
  const parts = String(cookieHeader).split(";");
  for (const part of parts) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = decodeURIComponent(part.slice(index + 1).trim());
    parsed[key] = value;
  }
  return parsed;
}

function serializeCookie(name, value, options = {}) {
  const pairs = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge != null) pairs.push(`Max-Age=${Math.floor(options.maxAge)}`);
  if (options.expires) pairs.push(`Expires=${options.expires.toUTCString()}`);
  if (options.httpOnly) pairs.push("HttpOnly");
  if (options.secure) pairs.push("Secure");
  if (options.sameSite) pairs.push(`SameSite=${options.sameSite}`);
  pairs.push(`Path=${options.path || "/"}`);
  return pairs.join("; ");
}

function setSessionCookie(res, token, expiresAt) {
  res.append(
    "Set-Cookie",
    serializeCookie(config.sessionCookieName, token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: "Lax",
      path: "/",
      expires: new Date(expiresAt)
    })
  );
}

function clearSessionCookie(res) {
  res.append(
    "Set-Cookie",
    serializeCookie(config.sessionCookieName, "", {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: "Lax",
      path: "/",
      expires: new Date(0)
    })
  );
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizePublicSlugInput(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  let candidate = raw;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const segments = url.pathname.split("/").filter(Boolean);
      candidate = segments.at(-1) || "";
    } catch {
      candidate = raw;
    }
  } else if (raw.includes("/")) {
    const segments = raw.split("/").filter(Boolean);
    candidate = segments.at(-1) || raw;
  }

  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    candidate = candidate;
  }

  return slugify(candidate);
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function cleanOptionalUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (raw.startsWith("/")) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  return null;
}

function normalizePhone(value) {
  const raw = String(value || "").trim();
  return raw || null;
}

function sortDateStrings(values) {
  return [...new Set((values || []).map((value) => String(value).trim()).filter(Boolean))].sort();
}

function expandDateRange(startDate, endDate) {
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) return [];
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];
  const dates = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function resolveDateSelectionInput({ dateMode, selectedDates, startDate, endDate }) {
  const mode = dateMode || "single";
  let dates = [];
  let nextStartDate = null;
  let nextEndDate = null;

  if (mode === "multiple") {
    dates = sortDateStrings(selectedDates).filter(isIsoDate);
    if (dates.length) {
      nextStartDate = dates[0];
      nextEndDate = dates.at(-1);
    }
  } else if (mode === "range") {
    const from = String(startDate || "").trim();
    const to = String(endDate || "").trim() || from;
    dates = expandDateRange(from, to);
    if (dates.length) {
      nextStartDate = dates[0];
      nextEndDate = dates.at(-1);
    }
  } else {
    const singleDate = String(startDate || selectedDates?.[0] || "").trim();
    if (isIsoDate(singleDate)) {
      dates = [singleDate];
      nextStartDate = singleDate;
      nextEndDate = singleDate;
    }
  }

  if (!dates.length || !nextStartDate || !nextEndDate) {
    const error = new Error("At least one valid event date is required.");
    error.statusCode = 400;
    throw error;
  }

  return {
    dateMode: mode,
    selectedDates: dates,
    startDate: nextStartDate,
    endDate: nextEndDate
  };
}

function summarizeSelectedDates(dateMode, selectedDates, startDate, endDate) {
  const dates = sortDateStrings(selectedDates);
  if (dateMode === "multiple") return dates.join(", ");
  if (dateMode === "range") return `${startDate} to ${endDate}`;
  return startDate || dates[0] || "";
}

function formatEngagementWindowString(startTime, endTime, fallback = "") {
  const from = String(startTime || "").trim();
  const to = String(endTime || "").trim();
  const legacy = String(fallback || "").trim();
  if (from && to) return `${from} - ${to}`;
  if (from) return from;
  if (to) return to;
  return legacy;
}

function resolveEngagementWindowParts(startTime, endTime, fallback = "") {
  const from = String(startTime || "").trim();
  const to = String(endTime || "").trim();
  if (from || to) {
    return {
      engagementStartTime: from,
      engagementEndTime: to
    };
  }

  const legacy = String(fallback || "").trim();
  if (!legacy) {
    return {
      engagementStartTime: "",
      engagementEndTime: ""
    };
  }

  const match = legacy.match(/^(.+?)\s*-\s*(.+)$/);
  if (match) {
    return {
      engagementStartTime: match[1].trim(),
      engagementEndTime: match[2].trim()
    };
  }

  return {
    engagementStartTime: legacy,
    engagementEndTime: ""
  };
}

function formatSuggestedBudgetLabel(amount, currency = "CLP") {
  if (amount == null || amount === "") return "";
  return `${amount} ${currency}`;
}

function calculateArtistPayAmount(amount) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return 0;
  return Math.max(0, Math.floor(numericAmount * 0.9));
}

function getLatestEventDate(dateMode, selectedDates, startDate, endDate) {
  const dates = sortDateStrings(selectedDates || []);
  if (dateMode === "multiple") {
    return dates.at(-1) || startDate || endDate || "";
  }
  return endDate || startDate || dates.at(-1) || dates[0] || "";
}

function deriveEventStatus(dateMode, selectedDates, startDate, endDate, fallbackStatus = "upcoming") {
  if (fallbackStatus === "cancelled") return "cancelled";
  const latestDate = getLatestEventDate(dateMode, selectedDates, startDate, endDate);
  if (!latestDate) return fallbackStatus === "completed" ? "completed" : "upcoming";
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return latestDate < todayIso ? "completed" : "upcoming";
}

function resolveEventPaymentState(clientPaidAt, artistPaidAt, fallbackStatus = "pending", fallbackTimestamp = "") {
  const clientPaid = String(clientPaidAt || "").trim();
  const artistPaid = String(artistPaidAt || "").trim();
  const fallback = String(fallbackStatus || "pending").trim();
  const timestamp = String(fallbackTimestamp || "").trim() || nowIso();

  if (clientPaid || artistPaid) {
    return {
      clientPaidAt: clientPaid,
      artistPaidAt: artistPaid,
      paymentStatus: clientPaid && artistPaid ? "paid" : "partial"
    };
  }

  if (fallback === "paid") {
    return {
      clientPaidAt: timestamp,
      artistPaidAt: timestamp,
      paymentStatus: "paid"
    };
  }

  if (fallback === "partial") {
    return {
      clientPaidAt: timestamp,
      artistPaidAt: "",
      paymentStatus: "partial"
    };
  }

  return {
    clientPaidAt: "",
    artistPaidAt: "",
    paymentStatus: fallback === "waived" ? "waived" : "pending"
  };
}

function formatBookingRequestNotificationMethods(bookingRequest) {
  const methods = [];
  if (bookingRequest?.notifyByEmail) methods.push("email");
  if (bookingRequest?.notifyBySms) methods.push("WhatsApp");
  return methods.join(", ");
}

function normalizeTranslations(value, fallbackValue = "") {
  if (typeof value === "string") {
    const text = value.trim();
    return { es: text || fallbackValue, en: text || fallbackValue };
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { es: fallbackValue, en: fallbackValue };
  }

  const output = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw !== "string") continue;
    const text = raw.trim();
    if (text) output[key] = text;
  }

  if (!output.es && fallbackValue) output.es = fallbackValue;
  if (!output.en && output.es) output.en = output.es;
  return output;
}

function normalizePageSections(value, { fallbackAudio = false } = {}) {
  const defaults = {
    about: false,
    audio: Boolean(fallbackAudio),
    videos: false,
    photos: false,
    showDetails: false,
    technicalRider: false
  };

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaults;
  }

  return {
    about: Boolean(value.about),
    audio: Object.prototype.hasOwnProperty.call(value, "audio") ? Boolean(value.audio) : Boolean(fallbackAudio),
    videos: Boolean(value.videos),
    photos: Boolean(value.photos),
    showDetails: Boolean(value.showDetails),
    technicalRider: Boolean(value.technicalRider)
  };
}

function normalizeVideos(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const url = cleanOptionalUrl(entry?.url);
      if (!url) return null;
      return {
        url,
        title: normalizeTranslations(entry?.title || {}, "")
      };
    })
    .filter(Boolean)
    .slice(0, 12);
}

function normalizePhotos(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const url = cleanOptionalUrl(entry?.url);
      if (!url) return null;
      return {
        url,
        alt: normalizeTranslations(entry?.alt || {}, "")
      };
    })
    .filter(Boolean)
    .slice(0, 24);
}

function resolveTranslation(translations, lang, fallback = "es") {
  if (!translations || typeof translations !== "object") return "";
  return (
    translations[lang] ||
    translations[fallback] ||
    translations.en ||
    Object.values(translations).find(Boolean) ||
    ""
  );
}

function detectArtistContent(artist) {
  return Boolean(
    artist.heroImageUrl ||
      artist.cardAudioUrl ||
      artist.about?.es ||
      artist.about?.en ||
      artist.showDetails?.es ||
      artist.showDetails?.en ||
      artist.videos?.length ||
      artist.photos?.length ||
      artist.technicalRiderPath
  );
}

function computeArtistPaths(artist) {
  const bookingUrl = `/booking.html?artistSlug=${encodeURIComponent(artist.slug)}`;
  const publicUrl = `/artists/${artist.slug}/`;
  const shouldRedirectToBooking = artist.pageMode === "booking_only" || !artist.hasPublicContent;
  return {
    bookingUrl,
    publicUrl,
    publicDestination: shouldRedirectToBooking ? bookingUrl : publicUrl
  };
}

function parseArtistRow(row) {
  if (!row) return null;
  const artist = {
    id: row.id,
    userId: row.user_id,
    slug: row.slug,
    publicStatus: row.public_status,
    pageMode: row.page_mode,
    availabilityMode: row.availability_mode || "custom",
    contactPhone: row.contact_phone,
    displayName: parseJson(row.display_name_translations, {}),
    shortBio: parseJson(row.short_bio_translations, {}),
    about: parseJson(row.about_translations, {}),
    showDetails: parseJson(row.show_details_translations, {}),
    welcomePrefix: parseJson(row.welcome_prefix_translations, {}),
    cardImageUrl: row.card_image_url,
    cardAudioUrl: row.card_audio_url,
    heroImageUrl: row.hero_image_url,
    technicalRiderPath: row.technical_rider_path,
    videos: parseJson(row.videos_json, []),
    photos: parseJson(row.photos_json, []),
    pageSections: normalizePageSections(parseJson(row.page_sections_json, {}), {
      fallbackAudio: row.card_audio_url
    }),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    account: row.account_id
      ? {
          id: row.account_id,
          username: row.account_username,
          email: row.account_email,
          emailVerifiedAt: row.account_email_verified_at,
          role: row.account_role,
          dashboardTourDismissedAt: row.account_dashboard_tour_dismissed_at
        }
      : null
  };

  artist.hasPublicContent = detectArtistContent(artist);
  return {
    ...artist,
    ...computeArtistPaths(artist)
  };
}

function serializeArtistSummary(artist) {
  return {
    id: artist.id,
    slug: artist.slug,
    publicStatus: artist.publicStatus,
    pageMode: artist.pageMode,
    availabilityMode: artist.availabilityMode,
    displayName: artist.displayName,
    shortBio: artist.shortBio,
    cardImageUrl: artist.cardImageUrl,
    cardAudioUrl: artist.cardAudioUrl,
    hasPublicContent: artist.hasPublicContent,
    bookingUrl: artist.bookingUrl,
    publicUrl: artist.publicUrl,
    publicDestination: artist.publicDestination,
    contactPhone: artist.contactPhone,
    pageSections: artist.pageSections,
    account: artist.account
  };
}

function serializeArtistDetail(artist) {
  return {
    ...serializeArtistSummary(artist),
    about: artist.about,
    showDetails: artist.showDetails,
    welcomePrefix: artist.welcomePrefix,
    heroImageUrl: artist.heroImageUrl,
    technicalRiderPath: artist.technicalRiderPath,
    videos: artist.videos,
    photos: artist.photos,
    pageSections: artist.pageSections
  };
}

function parseEventRow(row) {
  if (!row) return null;
  const selectedDates = sortDateStrings(parseJson(row.selected_dates_json, []));
  const { engagementStartTime, engagementEndTime } = resolveEngagementWindowParts(
    row.engagement_start_time,
    row.engagement_end_time,
    row.engagement_time
  );
  const { clientPaidAt, artistPaidAt, paymentStatus } = resolveEventPaymentState(
    row.client_paid_at,
    row.artist_paid_at,
    row.payment_status,
    row.updated_at || row.created_at
  );
  const status = deriveEventStatus(
    row.date_mode || "single",
    selectedDates,
    row.start_date,
    row.end_date,
    row.status || "upcoming"
  );
  return {
    id: row.id,
    artistId: row.artist_id,
    bookingRequestId: row.booking_request_id,
    title: row.title,
    venue: row.venue,
    legacyEngagementTime: row.engagement_time || "",
    engagementTime: formatEngagementWindowString(engagementStartTime, engagementEndTime, row.engagement_time),
    engagementStartTime,
    engagementEndTime,
    startDate: row.start_date,
    endDate: row.end_date,
    dateMode: row.date_mode || "single",
    selectedDates,
    status,
    paymentStatus,
    clientPaidAt,
    artistPaidAt,
    clientPaidArtistAcknowledgedAt: row.client_paid_artist_acknowledged_at,
    artistPaidArtistAcknowledgedAt: row.artist_paid_artist_acknowledged_at,
    clientPaidArtistSeenState: Boolean(row.client_paid_artist_seen_state),
    artistPaidArtistSeenState: Boolean(row.artist_paid_artist_seen_state),
    paymentAmount: row.payment_amount,
    artistPayAmount: calculateArtistPayAmount(row.payment_amount),
    currency: row.currency,
    clientName: row.client_name,
    clientEmail: row.client_email,
    clientPhone: row.client_phone,
    requireSignature: Boolean(row.require_signature),
    contractPath: row.contract_path,
    contractOriginalName: row.contract_original_name,
    clientPdfPath: row.client_pdf_path,
    clientPdfOriginalName: row.client_pdf_original_name,
    signedByName: row.signed_by_name,
    signedSignatureStrokes: parseJson(row.signed_signature_strokes_json, []),
    signedAt: row.signed_at,
    artistAcknowledgedAt: row.artist_acknowledged_at,
    adminSignatureAcknowledgedAt: row.admin_signature_acknowledged_at,
    documentGeneratedAt: row.document_generated_at,
    clientDocumentGeneratedAt: row.client_document_generated_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function parseBookingRequestRow(row) {
  if (!row) return null;
  const { engagementStartTime, engagementEndTime } = resolveEngagementWindowParts(
    row.engagement_start_time,
    row.engagement_end_time,
    row.engagement_time
  );
  return {
    id: row.id,
    artistId: row.artist_id,
    clientName: row.client_name,
    clientEmail: row.client_email,
    clientPhone: row.client_phone,
    notifyByEmail: Boolean(row.notify_by_email),
    notifyBySms: Boolean(row.notify_by_sms),
    engagementTime: formatEngagementWindowString(engagementStartTime, engagementEndTime),
    engagementStartTime,
    engagementEndTime,
    location: row.location,
    suggestedBudget: row.suggested_budget == null ? null : Number(row.suggested_budget),
    dateMode: row.date_mode || "single",
    startDate: row.start_date,
    endDate: row.end_date,
    selectedDates: sortDateStrings(parseJson(row.selected_dates_json, [])),
    additionalInfo: row.additional_info,
    status: row.status,
    forwardedMessage: row.forwarded_message,
    forwardedEmailAt: row.forwarded_email_at,
    forwardedWhatsappAt: row.forwarded_whatsapp_at,
    convertedEventId: row.converted_event_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function getEventSelectedDates(event) {
  if (!event) return [];
  if (Array.isArray(event.selectedDates) && event.selectedDates.length) {
    return sortDateStrings(event.selectedDates).filter(isIsoDate);
  }
  if (event.startDate && event.endDate && event.endDate !== event.startDate) {
    return expandDateRange(event.startDate, event.endDate);
  }
  if (event.startDate) return [event.startDate];
  return [];
}

function makeUniqueSlug(baseSlug, excludeArtistId = null) {
  const base = normalizePublicSlugInput(baseSlug) || "artist";
  let candidate = base;
  let suffix = 2;
  while (true) {
    const row = excludeArtistId
      ? db
          .prepare("SELECT id FROM artist_profiles WHERE slug = ? AND id != ?")
          .get(candidate, excludeArtistId)
      : db.prepare("SELECT id FROM artist_profiles WHERE slug = ?").get(candidate);
    if (!row) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function getNextArtistSortOrder() {
  const row = db.prepare("SELECT COALESCE(MAX(sort_order), 0) AS max_sort_order FROM artist_profiles").get();
  return Number(row?.max_sort_order || 0) + 10;
}

function generateTemporaryPassword() {
  return `Sophora-${createRandomToken(9)}`;
}

function createSessionForUser(user, req, res) {
  const rawToken = createRandomToken(32);
  const csrfToken = createRandomToken(18);
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + config.sessionDurationDays * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO sessions (
      user_id,
      token_hash,
      csrf_token,
      expires_at,
      created_at,
      last_seen_at,
      user_agent,
      ip_address
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    user.id,
    hashToken(rawToken),
    csrfToken,
    expiresAt,
    createdAt,
    createdAt,
    req.get("user-agent") || "",
    req.ip || ""
  );

  setSessionCookie(res, rawToken, expiresAt);
  return csrfToken;
}

function destroySession(sessionTokenHash) {
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sessionTokenHash);
}

function getAuthPayload(user) {
  const linkedProviders = db
    .prepare("SELECT provider FROM oauth_accounts WHERE user_id = ? ORDER BY provider ASC")
    .all(user.id)
    .map((entry) => entry.provider);

  const artist = user.role === "artist"
    ? parseArtistRow(
        db.prepare(`
          SELECT
            ap.*,
            u.id AS account_id,
            u.username AS account_username,
            u.email AS account_email,
            u.email_verified_at AS account_email_verified_at,
            u.role AS account_role,
            u.dashboard_tour_dismissed_at AS account_dashboard_tour_dismissed_at
          FROM artist_profiles ap
          LEFT JOIN users u ON u.id = ap.user_id
          WHERE ap.user_id = ?
        `).get(user.id)
      )
    : null;

  return {
    id: user.id,
    role: user.role,
    username: user.username,
    email: user.email,
    locale: user.locale,
    emailVerifiedAt: user.email_verified_at,
    dashboardTourDismissedAt: user.dashboard_tour_dismissed_at,
    linkedProviders,
    artist: artist ? serializeArtistSummary(artist) : null
  };
}

function findUserByIdentifier(identifier) {
  const normalized = normalizeIdentifier(identifier);
  return db.prepare(`
    SELECT *
    FROM users
    WHERE lower(email) = ? OR lower(username) = ?
  `).get(normalized, normalized);
}

function findUserById(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

function getDashboardAccountTarget(req, explicitArtistId) {
  if (!req.authUser) return null;

  if (req.authUser.role === "admin") {
    const artist = explicitArtistId ? findArtistById(explicitArtistId) : null;
    if (!artist) return null;
    return {
      artist,
      user: artist.userId ? findUserById(artist.userId) : null
    };
  }

  return {
    artist: findArtistBySlug(req.authArtistSlug, { includeHidden: true }),
    user: findUserById(req.authUser.id)
  };
}

function normalizeIdentifier(value) {
  return String(value || "").trim().toLowerCase();
}

function getValidAuthToken(rawToken, type) {
  const row = db.prepare(`
    SELECT *
    FROM auth_tokens
    WHERE token_hash = ? AND type = ? AND used_at IS NULL
  `).get(hashToken(rawToken), type);

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  return {
    ...row,
    payload: row.payload_encrypted ? parseJson(decryptText(row.payload_encrypted), {}) : {}
  };
}

function consumeAuthToken(rawToken, type) {
  const token = getValidAuthToken(rawToken, type);
  if (!token) return null;
  db.prepare("UPDATE auth_tokens SET used_at = ? WHERE id = ?").run(nowIso(), token.id);
  return token;
}

function createAuthToken({ userId = null, type, minutes, payload = {} }) {
  const rawToken = createRandomToken(32);
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  db.prepare(`
    INSERT INTO auth_tokens (
      user_id,
      type,
      token_hash,
      payload_encrypted,
      expires_at,
      used_at,
      created_at
    ) VALUES (?, ?, ?, ?, ?, NULL, ?)
  `).run(
    userId,
    type,
    hashToken(rawToken),
    Object.keys(payload).length ? encryptText(JSON.stringify(payload)) : null,
    expiresAt,
    createdAt
  );
  return rawToken;
}

async function sendVerificationEmail(user) {
  const token = createAuthToken({
    userId: user.id,
    type: "email_verify",
    minutes: 24 * 60,
    payload: {}
  });
  const link = `${config.appUrl}/verify-email.html?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: user.email,
    subject: "Verifica tu correo en Sophora",
    type: "verify-email",
    text: [
      `Hola ${user.username},`,
      "",
      "Para activar tu acceso como artista en Sophora, verifica tu correo aqui:",
      link,
      "",
      "Si no creaste esta cuenta, puedes ignorar este mensaje."
    ].join("\n"),
    html: `
      <p>Hola <strong>${user.username}</strong>,</p>
      <p>Para activar tu acceso como artista en Sophora, verifica tu correo aqui:</p>
      <p><a href="${link}">${link}</a></p>
      <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
    `
  });
}

async function sendForgotAccountEmail(user) {
  const token = createAuthToken({
    userId: user.id,
    type: "password_reset",
    minutes: 60,
    payload: {}
  });

  const passwordLength = readPasswordLengthEnvelope(user.password_length_encrypted) ?? "desconocida";
  const link = `${config.appUrl}/reset-password.html?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to: user.email,
    subject: "Recordatorio de acceso Sophora",
    type: "forgot-account",
    text: [
      `Hola ${user.username},`,
      "",
      `Tu nombre de usuario es: ${user.username}`,
      `La longitud de tu password actual es: ${passwordLength}`,
      "",
      "Si aun no recuerdas tu password, puedes restablecerlo aqui:",
      link
    ].join("\n"),
    html: `
      <p>Hola <strong>${user.username}</strong>,</p>
      <p>Tu nombre de usuario es: <strong>${user.username}</strong></p>
      <p>La longitud de tu password actual es: <strong>${passwordLength}</strong></p>
      <p>Si aun no recuerdas tu password, puedes restablecerlo aqui:</p>
      <p><a href="${link}">${link}</a></p>
    `
  });
}

async function sendAdminInviteEmail(user, tempPassword) {
  const verifyToken = createAuthToken({
    userId: user.id,
    type: "email_verify",
    minutes: 24 * 60,
    payload: {}
  });
  const resetToken = createAuthToken({
    userId: user.id,
    type: "password_reset",
    minutes: 60 * 24,
    payload: {}
  });
  const verifyLink = `${config.appUrl}/verify-email.html?token=${encodeURIComponent(verifyToken)}`;
  const resetLink = `${config.appUrl}/reset-password.html?token=${encodeURIComponent(resetToken)}`;

  await sendEmail({
    to: user.email,
    subject: "Tu acceso de artista en Sophora",
    type: "artist-invite",
    text: [
      `Hola ${user.username},`,
      "",
      "Se ha creado tu acceso de artista en Sophora.",
      `Usuario: ${user.username}`,
      `Password temporal: ${tempPassword}`,
      "",
      "Primero verifica tu correo:",
      verifyLink,
      "",
      "Despues puedes cambiar tu password aqui si lo prefieres:",
      resetLink
    ].join("\n"),
    html: `
      <p>Hola <strong>${user.username}</strong>,</p>
      <p>Se ha creado tu acceso de artista en Sophora.</p>
      <p>Usuario: <strong>${user.username}</strong></p>
      <p>Password temporal: <strong>${tempPassword}</strong></p>
      <p>Primero verifica tu correo:</p>
      <p><a href="${verifyLink}">${verifyLink}</a></p>
      <p>Despues puedes cambiar tu password aqui si lo prefieres:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
    `
  });
}

function getArtistQueryBase() {
  return `
    SELECT
      ap.*,
      u.id AS account_id,
      u.username AS account_username,
      u.email AS account_email,
      u.email_verified_at AS account_email_verified_at,
      u.role AS account_role,
      u.dashboard_tour_dismissed_at AS account_dashboard_tour_dismissed_at
    FROM artist_profiles ap
    LEFT JOIN users u ON u.id = ap.user_id
  `;
}

function findArtistBySlug(slug, options = {}) {
  const filters = ["ap.slug = ?"];
  const params = [slug];
  if (!options.includeHidden) {
    filters.push("ap.public_status = 'published'");
  }
  const row = db.prepare(`${getArtistQueryBase()} WHERE ${filters.join(" AND ")}`).get(...params);
  return parseArtistRow(row);
}

function findArtistById(id) {
  const row = db.prepare(`${getArtistQueryBase()} WHERE ap.id = ?`).get(id);
  return parseArtistRow(row);
}

function listAllArtists() {
  return db
    .prepare(`${getArtistQueryBase()} ORDER BY ap.sort_order ASC, ap.created_at ASC`)
    .all()
    .map(parseArtistRow);
}

function getEventsForArtist(artistId) {
  return db
    .prepare("SELECT * FROM artist_events WHERE artist_id = ? ORDER BY start_date DESC, id DESC")
    .all(artistId)
    .map(parseEventRow);
}

function getBookedDatesForArtist(artistId) {
  const dates = new Set();
  for (const event of getEventsForArtist(artistId)) {
    if (event.status === "cancelled") continue;
    for (const date of getEventSelectedDates(event)) {
      dates.add(date);
    }
  }
  return [...dates].sort();
}

function getBookingRequestsForArtist(artistId) {
  return db
    .prepare("SELECT * FROM booking_requests WHERE artist_id = ? ORDER BY created_at DESC, id DESC")
    .all(artistId)
    .map(parseBookingRequestRow);
}

function getArtistNotificationCounts(artistId) {
  const bookingRequestCount = Number(
    db.prepare("SELECT COUNT(*) AS count FROM booking_requests WHERE artist_id = ? AND status = 'new'").get(artistId)?.count || 0
  );
  const signedContractCount = Number(
    db.prepare(`
      SELECT COUNT(*) AS count
      FROM artist_events
      WHERE artist_id = ?
        AND signed_at IS NOT NULL
        AND (admin_signature_acknowledged_at IS NULL OR admin_signature_acknowledged_at = '')
    `).get(artistId)?.count || 0
  );
  return {
    bookingRequestCount,
    signedContractCount,
    total: bookingRequestCount + signedContractCount
  };
}

function formatSelectedDatesLabel(dateMode, selectedDates, startDate, endDate) {
  const dates = sortDateStrings(selectedDates);
  if (dateMode === "multiple") {
    return dates.join(", ");
  }
  if (dateMode === "range") {
    return `${startDate} - ${endDate}`;
  }
  return startDate || dates[0] || "";
}

function buildBookingRequestForwardMessage(artist, bookingRequest) {
  const artistName = resolveTranslation(artist.displayName, "es", "es");
  const { engagementStartTime, engagementEndTime } = resolveEngagementWindowParts(
    bookingRequest.engagementStartTime,
    bookingRequest.engagementEndTime,
    bookingRequest.engagementTime
  );
  return [
    `Nuevo pedido para ${artistName}.`,
    `Cliente: ${bookingRequest.clientName}`,
    bookingRequest.clientEmail ? `Correo: ${bookingRequest.clientEmail}` : null,
    bookingRequest.clientPhone ? `Telefono: ${bookingRequest.clientPhone}` : null,
    formatBookingRequestNotificationMethods(bookingRequest) ? `Avisar por: ${formatBookingRequestNotificationMethods(bookingRequest)}` : null,
    bookingRequest.location ? `Lugar: ${bookingRequest.location}` : null,
    engagementStartTime ? `Hora de inicio solicitada: ${engagementStartTime}` : null,
    engagementEndTime ? `Hora de termino solicitada: ${engagementEndTime}` : null,
    bookingRequest.suggestedBudget != null ? `Presupuesto sugerido: ${formatSuggestedBudgetLabel(bookingRequest.suggestedBudget)}` : null,
    `Fechas: ${formatSelectedDatesLabel(bookingRequest.dateMode, bookingRequest.selectedDates, bookingRequest.startDate, bookingRequest.endDate)}`,
    bookingRequest.additionalInfo ? `Detalles: ${bookingRequest.additionalInfo}` : null
  ].filter(Boolean).join("\n");
}

async function removeGeneratedUpload(publicPath) {
  await deleteUploadByPublicPath(publicPath);
}

async function writeGeneratedEventPdf(artist, event, { buffer, suffix, originalName }) {
  const fileName = `gig-${event.id}-${suffix}-${Date.now()}.pdf`;
  const uploaded = await putArtistUpload({
    artistSlug: artist.slug,
    fileName,
    buffer,
    contentType: "application/pdf"
  });
  return {
    publicPath: uploaded.publicPath,
    originalName
  };
}

async function createGeneratedArtistEventPdf(artist, event) {
  const buffer = await buildArtistContractPdf({ artist, event });
  return writeGeneratedEventPdf(artist, event, {
    buffer,
    suffix: "artist",
    originalName: `${slugify(event.title || "gig") || "gig"}-contrato-artista.pdf`
  });
}

async function createGeneratedClientQuotePdf(artist, event) {
  const buffer = await buildClientQuotePdf({ artist, event });
  return writeGeneratedEventPdf(artist, event, {
    buffer,
    suffix: "client",
    originalName: `${slugify(event.title || "gig") || "gig"}-cotizacion.pdf`
  });
}

async function replaceGeneratedArtistEventPdf(artist, eventId, event) {
  const previousPublicPath = event.contractPath;
  const shouldRemovePrevious = Boolean(event.documentGeneratedAt);
  const generated = await createGeneratedArtistEventPdf(artist, event);
  db.prepare(`
    UPDATE artist_events
    SET contract_path = ?, contract_original_name = ?, document_generated_at = ?, updated_at = ?
    WHERE id = ?
  `).run(generated.publicPath, generated.originalName, nowIso(), nowIso(), eventId);

  if (shouldRemovePrevious && previousPublicPath && previousPublicPath !== generated.publicPath) {
    await removeGeneratedUpload(previousPublicPath);
  }

  return parseEventRow(db.prepare("SELECT * FROM artist_events WHERE id = ?").get(eventId));
}

async function replaceGeneratedClientQuotePdf(artist, eventId, event) {
  const previousPublicPath = event.clientPdfPath;
  const shouldRemovePrevious = Boolean(event.clientDocumentGeneratedAt);
  const generated = await createGeneratedClientQuotePdf(artist, event);
  db.prepare(`
    UPDATE artist_events
    SET client_pdf_path = ?, client_pdf_original_name = ?, client_document_generated_at = ?, updated_at = ?
    WHERE id = ?
  `).run(generated.publicPath, generated.originalName, nowIso(), nowIso(), eventId);

  if (shouldRemovePrevious && previousPublicPath && previousPublicPath !== generated.publicPath) {
    await removeGeneratedUpload(previousPublicPath);
  }

  return parseEventRow(db.prepare("SELECT * FROM artist_events WHERE id = ?").get(eventId));
}

function getAvailabilityForArtist(artistId) {
  return db
    .prepare("SELECT available_date FROM artist_availability WHERE artist_id = ? ORDER BY available_date ASC")
    .all(artistId)
    .map((row) => row.available_date);
}

function getAccessibleArtist(req, explicitArtistId) {
  if (!req.authUser) return null;
  if (req.authUser.role === "admin") {
    if (explicitArtistId) {
      const explicitArtist = findArtistById(explicitArtistId);
      if (explicitArtist) return explicitArtist;
    }
    return listAllArtists()[0] || null;
  }
  return findArtistBySlug(req.authArtistSlug, { includeHidden: true }) || null;
}

function ensureCsrf(req) {
  const header = req.get("x-csrf-token") || "";
  if (!req.authSession || !header || header !== req.authSession.csrf_token) {
    const error = new Error("Invalid CSRF token.");
    error.statusCode = 403;
    throw error;
  }
}

async function getOAuthConfiguration(providerName) {
  const provider = config.oauth[providerName];
  if (!provider || !provider.clientId || !provider.clientSecret) {
    return null;
  }

  if (!oauthConfigCache.has(providerName)) {
    const redirectUri = `${config.appUrl}/api/auth/oauth/${providerName}/callback`;
    const configurationPromise = oidc.discovery(
      new URL(provider.issuer),
      provider.clientId,
      {
        redirect_uris: [redirectUri],
        response_types: ["code"]
      },
      oidc.ClientSecretPost(provider.clientSecret)
    );
    oauthConfigCache.set(providerName, configurationPromise);
  }

  return oauthConfigCache.get(providerName);
}

function getOAuthRedirectUri(providerName) {
  return `${config.appUrl}/api/auth/oauth/${providerName}/callback`;
}

function withArtistAccountAccess(req, artistId) {
  if (req.authUser.role === "admin") return findArtistById(artistId);
  const artist = db.prepare(`${getArtistQueryBase()} WHERE ap.user_id = ?`).get(req.authUser.id);
  const parsed = parseArtistRow(artist);
  if (parsed && parsed.id === artistId) return parsed;
  return null;
}

function saveArtistProfile(actor, body) {
  const artist = actor.role === "admin" ? findArtistById(body.artistId) : findArtistBySlug(actor.artistSlug, { includeHidden: true });
  if (!artist) {
    const error = new Error("Artist profile not found.");
    error.statusCode = 404;
    throw error;
  }

  const slug = makeUniqueSlug(body.slug, artist.id);
  const displayName = normalizeTranslations(body.displayName, resolveTranslation(artist.displayName, "es", "es"));
  const shortBio = normalizeTranslations(body.shortBio || artist.shortBio, "");
  const about = normalizeTranslations(body.about || artist.about, "");
  const showDetails = normalizeTranslations(body.showDetails || artist.showDetails, "");
  const welcomePrefix = normalizeTranslations(body.welcomePrefix || artist.welcomePrefix, "Bienvenido");
  const videos = normalizeVideos(body.videos);
  const photos = normalizePhotos(body.photos);
  const pageSections = normalizePageSections({
    ...artist.pageSections,
    ...body.pageSections
  });

  db.prepare(`
    UPDATE artist_profiles
    SET
      slug = ?,
      public_status = ?,
      page_mode = ?,
      display_name_translations = ?,
      short_bio_translations = ?,
      about_translations = ?,
      show_details_translations = ?,
      welcome_prefix_translations = ?,
      card_image_url = ?,
      card_audio_url = ?,
      hero_image_url = ?,
      technical_rider_path = ?,
      videos_json = ?,
      photos_json = ?,
      page_sections_json = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    slug,
    body.publicStatus,
    body.pageMode,
    serializeJson(displayName),
    serializeJson(shortBio),
    serializeJson(about),
    serializeJson(showDetails),
    serializeJson(welcomePrefix),
    cleanOptionalUrl(body.cardImageUrl),
    cleanOptionalUrl(body.cardAudioUrl),
    cleanOptionalUrl(body.heroImageUrl),
    cleanOptionalUrl(body.technicalRiderPath),
    serializeJson(videos, []),
    serializeJson(photos, []),
    serializeJson(pageSections),
    nowIso(),
    artist.id
  );

  return findArtistById(artist.id);
}

function requireAuth(req, res, next) {
  if (!req.authUser) {
    return jsonError(res, 401, "Authentication required.");
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.authUser || req.authUser.role !== "admin") {
    return jsonError(res, 403, "Admin access required.");
  }
  next();
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const cookies = parseCookies(req.headers.cookie || "");
  const rawToken = cookies[config.sessionCookieName];
  if (!rawToken) return next();

  const tokenHash = hashToken(rawToken);
  const row = db.prepare(`
    SELECT s.*, u.*
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
  `).get(tokenHash);

  if (!row) {
    clearSessionCookie(res);
    return next();
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    destroySession(tokenHash);
    clearSessionCookie(res);
    return next();
  }

  req.authSession = {
    id: row.id,
    token_hash: tokenHash,
    csrf_token: row.csrf_token,
    expires_at: row.expires_at
  };
  req.authUser = {
    id: row.user_id,
    role: row.role,
    username: row.username,
    email: row.email,
    password_hash: row.password_hash,
    password_length_encrypted: row.password_length_encrypted,
    email_verified_at: row.email_verified_at,
    locale: row.locale,
    dashboard_tour_dismissed_at: row.dashboard_tour_dismissed_at
  };

  const artistRow = db.prepare("SELECT slug FROM artist_profiles WHERE user_id = ?").get(row.user_id);
  req.authArtistSlug = artistRow?.slug || null;

  const lastSeenAt = new Date(row.last_seen_at).getTime();
  if (!Number.isFinite(lastSeenAt) || Date.now() - lastSeenAt > 5 * 60 * 1000) {
    db.prepare("UPDATE sessions SET last_seen_at = ? WHERE id = ?").run(nowIso(), row.id);
  }

  next();
});

app.get("/api/healthz", (req, res, next) => {
  Promise.resolve()
    .then(() => db.prepare("SELECT 1 AS ok").get())
    .then(() => checkStorageHealth())
    .then((storage) => {
      res.json({
        status: "ok",
        time: nowIso(),
        appUrl: config.appUrl,
        db: config.dbClient,
        storage
      });
    })
    .catch(next);
});

app.get("/api/auth/me", (req, res) => {
  if (!req.authUser) {
    return res.json({ user: null, csrfToken: null });
  }
  return res.json({
    user: getAuthPayload(req.authUser),
    csrfToken: req.authSession.csrf_token
  });
});

app.post(
  "/api/auth/signup",
  authLimiter,
  safeAsync(async (req, res) => {
    const parsed = signUpSchema.safeParse(req.body);
    if (!parsed.success) {
      return jsonError(res, 400, "Invalid signup payload.", parsed.error.flatten());
    }

    const data = parsed.data;
    const username = normalizeUsername(data.username);
    const email = normalizeEmail(data.email);

    if (data.password !== data.passwordConfirm) {
      return jsonError(res, 400, "Passwords do not match.");
    }

    if (db.prepare("SELECT id FROM users WHERE email = ?").get(email)) {
      return jsonError(res, 409, "This email address is already in use.");
    }

    if (db.prepare("SELECT id FROM users WHERE username = ?").get(username)) {
      return jsonError(res, 409, "This username is already in use.");
    }

    const passwordHash = await hashPassword(data.password);
    const passwordLengthEncrypted = createPasswordLengthEnvelope(data.password);
    const createdAt = nowIso();
    const slug = makeUniqueSlug(username);
    const sortOrder = getNextArtistSortOrder();

    const transaction = db.transaction(() => {
      const userInfo = db.prepare(`
        INSERT INTO users (
          role,
          username,
          email,
          password_hash,
          password_length_encrypted,
          email_verified_at,
          locale,
          dashboard_tour_dismissed_at,
          created_by_admin,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, NULL, 'es', NULL, 0, ?, ?)
      `).run("artist", username, email, passwordHash, passwordLengthEncrypted, createdAt, createdAt);

      db.prepare(`
        INSERT INTO artist_profiles (
          user_id,
          slug,
          public_status,
          page_mode,
          availability_mode,
          display_name_translations,
          short_bio_translations,
          about_translations,
          show_details_translations,
          welcome_prefix_translations,
          card_image_url,
          card_audio_url,
          hero_image_url,
          technical_rider_path,
          videos_json,
          photos_json,
          page_sections_json,
          sort_order,
          created_at,
          updated_at
        ) VALUES (?, ?, 'hidden', 'booking_only', 'custom', ?, '{}', '{}', '{}', ?, NULL, NULL, NULL, NULL, '[]', '[]', ?, ?, ?, ?)
      `).run(
        Number(userInfo.lastInsertRowid),
        slug,
        serializeJson({ es: data.username.trim(), en: data.username.trim() }),
        serializeJson({ es: "Bienvenido", en: "Welcome" }),
        serializeJson({
          about: false,
          videos: false,
          photos: false,
          audio: false,
          showDetails: false,
          technicalRider: false
        }),
        sortOrder,
        createdAt,
        createdAt
      );

      return Number(userInfo.lastInsertRowid);
    });

    const userId = transaction();
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    await sendVerificationEmail(user);

    res.status(201).json({
      ok: true,
      message: "Account created. Please verify your email before signing in."
    });
  })
);

app.post(
  "/api/auth/login",
  authLimiter,
  safeAsync(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return jsonError(res, 400, "Invalid login payload.");
    }

    const user = findUserByIdentifier(parsed.data.identifier);
    if (!user) {
      return jsonError(res, 401, "Invalid credentials.");
    }

    const passwordMatches = await verifyPassword(parsed.data.password, user.password_hash);
    if (!passwordMatches) {
      return jsonError(res, 401, "Invalid credentials.");
    }

    if (user.role === "artist" && !user.email_verified_at) {
      return jsonError(res, 403, "Please verify your email address before signing in.");
    }

    const csrfToken = createSessionForUser(user, req, res);
    res.json({
      ok: true,
      user: getAuthPayload(user),
      csrfToken
    });
  })
);

app.post("/api/auth/logout", requireAuth, (req, res) => {
  destroySession(req.authSession.token_hash);
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.post(
  "/api/auth/resend-verification",
  authLimiter,
  safeAsync(async (req, res) => {
    const parsed = emailOnlySchema.safeParse(req.body);
    if (!parsed.success) {
      return jsonError(res, 400, "Invalid email address.");
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(normalizeEmail(parsed.data.email));
    if (user && !user.email_verified_at) {
      await sendVerificationEmail(user);
    }

    res.json({
      ok: true,
      message: "If an account exists for that email, a verification message has been sent."
    });
  })
);

app.post(
  "/api/auth/forgot-account",
  authLimiter,
  safeAsync(async (req, res) => {
    const parsed = emailOnlySchema.safeParse(req.body);
    if (!parsed.success) {
      return jsonError(res, 400, "Invalid email address.");
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(normalizeEmail(parsed.data.email));
    if (user) {
      await sendForgotAccountEmail(user);
    }

    res.json({
      ok: true,
      message: "If that email exists in Sophora, recovery instructions have been sent."
    });
  })
);

app.get(
  "/api/auth/verify-email",
  safeAsync(async (req, res) => {
    const token = String(req.query.token || "").trim();
    if (!token) return jsonError(res, 400, "Verification token is required.");
    const authToken = consumeAuthToken(token, "email_verify");
    if (!authToken || !authToken.user_id) {
      return jsonError(res, 400, "This verification link is invalid or has expired.");
    }

    db.prepare("UPDATE users SET email_verified_at = ?, updated_at = ? WHERE id = ?").run(
      nowIso(),
      nowIso(),
      authToken.user_id
    );

    res.json({ ok: true });
  })
);

app.get("/api/auth/reset-password/details", (req, res) => {
  const token = String(req.query.token || "").trim();
  if (!token) return jsonError(res, 400, "Reset token is required.");

  const authToken = getValidAuthToken(token, "password_reset");
  if (!authToken || !authToken.user_id) {
    return jsonError(res, 400, "This reset link is invalid or has expired.");
  }

  const user = db.prepare("SELECT username, email FROM users WHERE id = ?").get(authToken.user_id);
  if (!user) {
    return jsonError(res, 404, "Account not found.");
  }

  res.json({
    ok: true,
    account: {
      username: user.username,
      email: user.email
    }
  });
});

app.post(
  "/api/auth/reset-password",
  authLimiter,
  safeAsync(async (req, res) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return jsonError(res, 400, "Invalid password reset payload.");
    }

    if (parsed.data.password !== parsed.data.passwordConfirm) {
      return jsonError(res, 400, "Passwords do not match.");
    }

    const authToken = consumeAuthToken(parsed.data.token, "password_reset");
    if (!authToken || !authToken.user_id) {
      return jsonError(res, 400, "This reset link is invalid or has expired.");
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const passwordLengthEncrypted = createPasswordLengthEnvelope(parsed.data.password);
    db.prepare(`
      UPDATE users
      SET password_hash = ?, password_length_encrypted = ?, updated_at = ?
      WHERE id = ?
    `).run(passwordHash, passwordLengthEncrypted, nowIso(), authToken.user_id);

    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(authToken.user_id);
    clearSessionCookie(res);

    res.json({
      ok: true,
      message: "Password updated. You can now sign in with your new password."
    });
  })
);

app.get(
  "/api/auth/oauth/:provider/start",
  safeAsync(async (req, res) => {
    const providerName = String(req.params.provider || "").trim().toLowerCase();
    const mode = String(req.query.mode || "login").trim();
    if (!["google", "apple"].includes(providerName)) {
      return jsonError(res, 404, "Unsupported provider.");
    }
    if (!["login", "link"].includes(mode)) {
      return jsonError(res, 400, "Unsupported OAuth mode.");
    }
    if (mode === "link" && !req.authUser) {
      return jsonError(res, 401, "You must be signed in to link a provider.");
    }

    const oauthConfig = await getOAuthConfiguration(providerName);
    if (!oauthConfig) {
      return jsonError(res, 503, `${providerName} OAuth is not configured on this server.`);
    }

    const provider = config.oauth[providerName];
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
    const expectedNonce = createRandomToken(12);
    const state = createAuthToken({
      userId: mode === "link" ? req.authUser.id : null,
      type: "oauth_state",
      minutes: 15,
      payload: {
        providerName,
        mode,
        userId: mode === "link" ? req.authUser.id : null,
        codeVerifier,
        expectedNonce
      }
    });

    const redirectTo = oidc.buildAuthorizationUrl(oauthConfig, {
      redirect_uri: getOAuthRedirectUri(providerName),
      scope: provider.scope,
      state,
      nonce: expectedNonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256"
    });

    res.redirect(302, redirectTo.toString());
  })
);

app.get(
  "/api/auth/oauth/:provider/callback",
  safeAsync(async (req, res) => {
    const providerName = String(req.params.provider || "").trim().toLowerCase();
    if (!["google", "apple"].includes(providerName)) {
      return res.redirect("/auth.html?oauth=unsupported");
    }

    if (req.query.error) {
      return res.redirect(`/auth.html?oauth=error&provider=${encodeURIComponent(providerName)}`);
    }

    const state = String(req.query.state || "").trim();
    if (!state) {
      return res.redirect("/auth.html?oauth=missing-state");
    }

    const authToken = getValidAuthToken(state, "oauth_state");
    if (!authToken) {
      return res.redirect("/auth.html?oauth=expired");
    }

    const payload = authToken.payload || {};
    if (payload.providerName !== providerName) {
      return res.redirect("/auth.html?oauth=mismatch");
    }

    const oauthConfig = await getOAuthConfiguration(providerName);
    if (!oauthConfig) {
      return res.redirect("/auth.html?oauth=unavailable");
    }

    const currentUrl = new URL(req.originalUrl, config.appUrl);
    let tokens;
    try {
      tokens = await oidc.authorizationCodeGrant(oauthConfig, currentUrl, {
        expectedNonce: payload.expectedNonce,
        expectedState: state,
        idTokenExpected: true,
        pkceCodeVerifier: payload.codeVerifier
      });
    } catch {
      return res.redirect("/auth.html?oauth=grant-failed");
    }

    const claims = tokens.claims() || {};
    const providerSubject = claims.sub;
    if (!providerSubject) {
      return res.redirect("/auth.html?oauth=missing-claims");
    }

    if (payload.mode === "link") {
      if (!req.authUser || req.authUser.id !== payload.userId) {
        return res.redirect("/dashboard.html?oauth=session-mismatch");
      }

      const existing = db
        .prepare("SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_subject = ?")
        .get(providerName, providerSubject);
      if (existing && existing.user_id !== req.authUser.id) {
        return res.redirect("/dashboard.html?oauth=already-linked");
      }

      db.prepare(`
        INSERT INTO oauth_accounts (user_id, provider, provider_subject, email, display_name, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(provider, provider_subject)
        DO UPDATE SET user_id = excluded.user_id, email = excluded.email, display_name = excluded.display_name
      `).run(
        req.authUser.id,
        providerName,
        providerSubject,
        claims.email || null,
        claims.name || null,
        nowIso()
      );

      consumeAuthToken(state, "oauth_state");
      return res.redirect("/dashboard.html?oauth=linked");
    }

    const linkedAccount = db
      .prepare("SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_subject = ?")
      .get(providerName, providerSubject);
    if (!linkedAccount) {
      consumeAuthToken(state, "oauth_state");
      return res.redirect("/auth.html?oauth=not-linked");
    }

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(linkedAccount.user_id);
    if (!user) {
      consumeAuthToken(state, "oauth_state");
      return res.redirect("/auth.html?oauth=missing-user");
    }

    const csrfToken = createSessionForUser(user, req, res);
    consumeAuthToken(state, "oauth_state");
    return res.redirect(`/dashboard.html?oauth=logged-in&csrf=${encodeURIComponent(csrfToken)}`);
  })
);

app.get("/api/public/artists", (req, res) => {
  const artists = listAllArtists()
    .filter((artist) => artist.publicStatus === "published")
    .map(serializeArtistSummary);
  res.json({ artists });
});

app.get("/api/public/artists/:slug", (req, res) => {
  const artist = findArtistBySlug(req.params.slug);
  if (!artist) {
    return jsonError(res, 404, "Artist not found.");
  }
  res.json({
    artist: {
      ...serializeArtistDetail(artist),
      availability: getAvailabilityForArtist(artist.id),
      bookedDates: getBookedDatesForArtist(artist.id)
    }
  });
});

app.get("/api/dashboard", requireAuth, (req, res) => {
  const requestedArtistId = req.authUser.role === "admin"
    ? Number.parseInt(String(req.query.artistId || "0"), 10) || null
    : null;
  const artist = getAccessibleArtist(req, requestedArtistId);
  const artists = req.authUser.role === "admin"
    ? listAllArtists().map((entry) => ({
        ...serializeArtistSummary(entry),
        notifications: getArtistNotificationCounts(entry.id)
      }))
    : artist
      ? [serializeArtistSummary(artist)]
      : [];

  if (!artist && req.authUser.role !== "admin") {
    return jsonError(res, 404, "Artist profile not found.");
  }

  res.json({
    user: getAuthPayload(req.authUser),
    csrfToken: req.authSession.csrf_token,
    artists,
    artist: artist ? serializeArtistDetail(artist) : null,
    availability: artist ? getAvailabilityForArtist(artist.id) : [],
    events: artist ? getEventsForArtist(artist.id) : [],
    bookingRequests: req.authUser.role === "admin" && artist ? getBookingRequestsForArtist(artist.id) : [],
    signatureNotifications: req.authUser.role === "admin" && artist
      ? getEventsForArtist(artist.id).filter((event) => event.signedAt && !event.adminSignatureAcknowledgedAt)
      : []
  });
});

app.patch(
  "/api/dashboard/profile",
  requireAuth,
  safeAsync(async (req, res) => {
    ensureCsrf(req);
    const parsed = dashboardProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return jsonError(res, 400, "Invalid profile payload.", parsed.error.flatten());
    }

    const body = parsed.data;
    const savedArtist = saveArtistProfile(
      {
        role: req.authUser.role,
        artistSlug: req.authArtistSlug
      },
      body
    );
    res.json({
      ok: true,
      artist: serializeArtistDetail(savedArtist)
    });
  })
);

app.patch(
  "/api/dashboard/account",
  requireAuth,
  safeAsync(async (req, res) => {
    ensureCsrf(req);
    const parsed = dashboardAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      return jsonError(res, 400, "Invalid account payload.", parsed.error.flatten());
    }

    const target = getDashboardAccountTarget(req, parsed.data.artistId);
    if (!target?.artist) {
      return jsonError(res, 404, "Artist profile not found.");
    }
    if (!target.user) {
      return jsonError(res, 404, "This artist does not have a linked account.");
    }

    const email = normalizeEmail(parsed.data.email);
    const username = normalizeUsername(parsed.data.username);

    const existingEmail = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(email, target.user.id);
    if (existingEmail) {
      return jsonError(res, 409, "This email address is already in use.");
    }

    const existingUsername = db.prepare("SELECT id FROM users WHERE username = ? AND id != ?").get(username, target.user.id);
    if (existingUsername) {
      return jsonError(res, 409, "This username is already in use.");
    }

    db.prepare("UPDATE users SET username = ?, email = ?, updated_at = ? WHERE id = ?").run(
      username,
      email,
      nowIso(),
      target.user.id
    );
    db.prepare("UPDATE artist_profiles SET contact_phone = ?, updated_at = ? WHERE id = ?").run(
      normalizePhone(parsed.data.contactPhone),
      nowIso(),
      target.artist.id
    );

    const refreshedAuthUser = findUserById(req.authUser.id);
    const refreshedArtist = findArtistById(target.artist.id);

    res.json({
      ok: true,
      user: refreshedAuthUser ? getAuthPayload(refreshedAuthUser) : null,
      artist: refreshedArtist ? serializeArtistDetail(refreshedArtist) : null
    });
  })
);

app.patch(
  "/api/dashboard/account/password",
  requireAuth,
  safeAsync(async (req, res) => {
    ensureCsrf(req);
    const parsed = dashboardAccountPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return jsonError(res, 400, "Invalid password payload.", parsed.error.flatten());
    }

    if (parsed.data.password !== parsed.data.passwordConfirm) {
      return jsonError(res, 400, "Passwords do not match.");
    }

    const target = getDashboardAccountTarget(req, parsed.data.artistId);
    if (!target?.artist) {
      return jsonError(res, 404, "Artist profile not found.");
    }
    if (!target.user) {
      return jsonError(res, 404, "This artist does not have a linked account.");
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const passwordLengthEncrypted = createPasswordLengthEnvelope(parsed.data.password);
    db.prepare("UPDATE users SET password_hash = ?, password_length_encrypted = ?, updated_at = ? WHERE id = ?").run(
      passwordHash,
      passwordLengthEncrypted,
      nowIso(),
      target.user.id
    );

    const refreshedAuthUser = findUserById(req.authUser.id);
    const refreshedArtist = findArtistById(target.artist.id);

    res.json({
      ok: true,
      user: refreshedAuthUser ? getAuthPayload(refreshedAuthUser) : null,
      artist: refreshedArtist ? serializeArtistDetail(refreshedArtist) : null
    });
  })
);

app.post("/api/dashboard/availability", requireAuth, (req, res) => {
  ensureCsrf(req);
  const parsed = availabilitySchema.safeParse(req.body);
  if (!parsed.success) {
    return jsonError(res, 400, "Invalid availability payload.");
  }

  const body = parsed.data;
  const artist = getAccessibleArtist(req, req.authUser.role === "admin" ? body.artistId : null);
  if (!artist) {
    return jsonError(res, 404, "Artist profile not found.");
  }

  const uniqueDates = [...new Set(body.dates.map((date) => String(date).trim()).filter(isIsoDate))].sort();
  const transaction = db.transaction(() => {
    db.prepare("UPDATE artist_profiles SET availability_mode = ?, updated_at = ? WHERE id = ?").run(
      body.mode,
      nowIso(),
      artist.id
    );
    db.prepare("DELETE FROM artist_availability WHERE artist_id = ?").run(artist.id);
    const insert = db.prepare(`
      INSERT INTO artist_availability (artist_id, available_date, notes, created_at)
      VALUES (?, ?, NULL, ?)
    `);
    const createdAt = nowIso();
    for (const date of uniqueDates) {
      insert.run(artist.id, date, createdAt);
    }
  });
  transaction();

  res.json({
    ok: true,
    availabilityMode: body.mode,
    availability: getAvailabilityForArtist(artist.id)
  });
});

app.post(
  "/api/public/booking-requests",
  safeAsync(async (req, res) => {
    const parsed = publicBookingRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return jsonError(res, 400, "Invalid booking request payload.", parsed.error.flatten());
    }

    const artist = findArtistBySlug(parsed.data.artistSlug);
    if (!artist) {
      return jsonError(res, 404, "Artist not found.");
    }

    const selection = resolveDateSelectionInput(parsed.data);
    const createdAt = nowIso();
    const info = db.prepare(`
      INSERT INTO booking_requests (
        artist_id,
        client_name,
        client_email,
        client_phone,
        notify_by_email,
        notify_by_sms,
        engagement_start_time,
        engagement_end_time,
        location,
        suggested_budget,
        date_mode,
        start_date,
        end_date,
      selected_dates_json,
      additional_info,
      status,
      created_at,
      updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)
    `).run(
      artist.id,
      parsed.data.clientName.trim(),
      normalizeEmail(parsed.data.clientEmail),
      normalizePhone(parsed.data.clientPhone),
      parsed.data.notifyByEmail ? 1 : 0,
      parsed.data.notifyBySms ? 1 : 0,
      parsed.data.engagementStartTime || null,
      parsed.data.engagementEndTime || null,
      parsed.data.location || null,
      parsed.data.suggestedBudget,
      selection.dateMode,
      selection.startDate,
      selection.endDate,
      serializeJson(selection.selectedDates, []),
      parsed.data.additionalInfo || null,
      createdAt,
      createdAt
    );

    res.status(201).json({
      ok: true,
      bookingRequest: parseBookingRequestRow(
        db.prepare("SELECT * FROM booking_requests WHERE id = ?").get(Number(info.lastInsertRowid))
      )
    });
  })
);

app.post("/api/dashboard/booking-requests/:id/forward", requireAuth, requireAdmin, (req, res) => {
  ensureCsrf(req);
  const parsed = forwardBookingRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return jsonError(res, 400, "Invalid booking forward payload.", parsed.error.flatten());
  }

  const bookingRequestId = Number.parseInt(req.params.id, 10);
  const bookingRequest = parseBookingRequestRow(db.prepare("SELECT * FROM booking_requests WHERE id = ?").get(bookingRequestId));
  if (!bookingRequest) {
    return jsonError(res, 404, "Booking request not found.");
  }

  const now = nowIso();
  db.prepare(`
    UPDATE booking_requests
    SET
      status = CASE WHEN status = 'converted' THEN status ELSE 'forwarded' END,
      forwarded_message = ?,
      forwarded_email_at = CASE WHEN ? = 'email' THEN ? ELSE forwarded_email_at END,
      forwarded_whatsapp_at = CASE WHEN ? = 'whatsapp' THEN ? ELSE forwarded_whatsapp_at END,
      updated_at = ?
    WHERE id = ?
  `).run(
    parsed.data.message,
    parsed.data.channel,
    now,
    parsed.data.channel,
    now,
    now,
    bookingRequestId
  );

  res.json({
    ok: true,
    bookingRequest: parseBookingRequestRow(db.prepare("SELECT * FROM booking_requests WHERE id = ?").get(bookingRequestId))
  });
});

app.post("/api/dashboard/booking-requests/:id/archive", requireAuth, requireAdmin, (req, res) => {
  ensureCsrf(req);

  const bookingRequestId = Number.parseInt(req.params.id, 10);
  const bookingRequest = parseBookingRequestRow(db.prepare("SELECT * FROM booking_requests WHERE id = ?").get(bookingRequestId));
  if (!bookingRequest) {
    return jsonError(res, 404, "Booking request not found.");
  }

  db.prepare(`
    UPDATE booking_requests
    SET
      status = CASE WHEN status = 'converted' THEN status ELSE 'archived' END,
      updated_at = ?
    WHERE id = ?
  `).run(
    nowIso(),
    bookingRequestId
  );

  res.json({
    ok: true,
    bookingRequest: parseBookingRequestRow(db.prepare("SELECT * FROM booking_requests WHERE id = ?").get(bookingRequestId))
  });
});

app.post("/api/dashboard/events", requireAuth, requireAdmin, safeAsync(async (req, res) => {
  ensureCsrf(req);
  const parsed = createEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return jsonError(res, 400, "Invalid event payload.", parsed.error.flatten());
  }

  const data = {
    ...parsed.data,
    requireSignature: true,
    createArtistPdf: true,
    createClientPdf: true
  };
  const artist = findArtistById(data.artistId);
  if (!artist) {
    return jsonError(res, 404, "Artist profile not found.");
  }

  let bookingRequest = null;
  if (data.bookingRequestId) {
    bookingRequest = parseBookingRequestRow(db.prepare("SELECT * FROM booking_requests WHERE id = ?").get(data.bookingRequestId));
    if (!bookingRequest || bookingRequest.artistId !== artist.id) {
      return jsonError(res, 404, "Booking request not found.");
    }
  }

  const selection = resolveDateSelectionInput(data);
  const engagementTime = formatEngagementWindowString(data.engagementStartTime, data.engagementEndTime, data.engagementTime);
  const eventStatus = deriveEventStatus(selection.dateMode, selection.selectedDates, selection.startDate, selection.endDate);
  const createdPaymentState = resolveEventPaymentState("", "", "pending", nowIso());
  const createdAt = nowIso();
  const info = db.prepare(`
    INSERT INTO artist_events (
      artist_id,
      booking_request_id,
      title,
      venue,
      engagement_time,
      engagement_start_time,
      engagement_end_time,
      start_date,
      end_date,
      date_mode,
      selected_dates_json,
      status,
      payment_status,
      client_paid_at,
      artist_paid_at,
      payment_amount,
      currency,
      client_name,
      client_email,
      client_phone,
      require_signature,
      contract_path,
      contract_original_name,
      client_pdf_path,
      client_pdf_original_name,
      artist_acknowledged_at,
      admin_signature_acknowledged_at,
      document_generated_at,
      client_document_generated_at,
      notes,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    artist.id,
    bookingRequest?.id || null,
    data.title,
    data.venue || null,
    engagementTime || null,
    data.engagementStartTime || null,
    data.engagementEndTime || null,
    selection.startDate,
    selection.endDate || null,
    selection.dateMode,
    serializeJson(selection.selectedDates, []),
    eventStatus,
    createdPaymentState.paymentStatus,
    createdPaymentState.clientPaidAt || null,
    createdPaymentState.artistPaidAt || null,
    data.paymentAmount,
    data.currency.toUpperCase(),
    bookingRequest?.clientName || data.clientName || null,
    bookingRequest?.clientEmail || normalizeEmail(data.clientEmail) || null,
    bookingRequest?.clientPhone || normalizePhone(data.clientPhone),
    data.requireSignature ? 1 : 0,
    cleanOptionalUrl(data.contractPath),
    data.contractOriginalName || null,
    cleanOptionalUrl(data.clientPdfPath),
    data.clientPdfOriginalName || null,
    null,
    null,
    null,
    null,
    data.notes || null,
    createdAt,
    createdAt
  );

  const eventId = Number(info.lastInsertRowid);
  let savedEvent = parseEventRow(db.prepare("SELECT * FROM artist_events WHERE id = ?").get(eventId));
  if (!savedEvent.contractPath && (data.createArtistPdf || data.requireSignature)) {
    savedEvent = await replaceGeneratedArtistEventPdf(artist, eventId, savedEvent);
  }
  if (!savedEvent.clientPdfPath && data.createClientPdf) {
    savedEvent = await replaceGeneratedClientQuotePdf(artist, eventId, savedEvent);
  }

  if (bookingRequest) {
    db.prepare(`
      UPDATE booking_requests
      SET status = 'converted', converted_event_id = ?, updated_at = ?
      WHERE id = ?
    `).run(eventId, nowIso(), bookingRequest.id);
  }

  res.status(201).json({
    ok: true,
    event: savedEvent
  });
}));

app.patch("/api/dashboard/events/:id", requireAuth, requireAdmin, safeAsync(async (req, res) => {
  ensureCsrf(req);
  const parsed = updateEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return jsonError(res, 400, "Invalid event payload.", parsed.error.flatten());
  }

  const eventId = Number.parseInt(req.params.id, 10);
  const existing = parseEventRow(db.prepare("SELECT * FROM artist_events WHERE id = ?").get(eventId));
  if (!existing) {
    return jsonError(res, 404, "Event not found.");
  }

  const data = {
    ...parsed.data,
    requireSignature: true
  };
  const selection = resolveDateSelectionInput({
    dateMode: data.dateMode || existing.dateMode,
    selectedDates: data.selectedDates?.length ? data.selectedDates : existing.selectedDates,
    startDate: data.startDate || existing.startDate,
    endDate: data.endDate === "" ? data.startDate || existing.startDate : (data.endDate || existing.endDate)
  });
  const nextEngagementStartTime = data.engagementStartTime === undefined ? (existing.engagementStartTime || "") : data.engagementStartTime;
  const nextEngagementEndTime = data.engagementEndTime === undefined ? (existing.engagementEndTime || "") : data.engagementEndTime;
  const legacyEngagementFallback = (nextEngagementStartTime || nextEngagementEndTime) || (existing.engagementStartTime || existing.engagementEndTime)
    ? ""
    : (data.engagementTime === undefined ? existing.legacyEngagementTime : data.engagementTime);
  const nextEngagementTime = formatEngagementWindowString(
    nextEngagementStartTime,
    nextEngagementEndTime,
    legacyEngagementFallback
  );
  const paymentUpdateAt = nowIso();
  const nextStatus = deriveEventStatus(
    selection.dateMode,
    selection.selectedDates,
    selection.startDate,
    selection.endDate,
    existing.status
  );
  const nextClientPaidAt = data.clientPaid === undefined
    ? (existing.clientPaidAt || "")
    : (data.clientPaid ? (existing.clientPaidAt || paymentUpdateAt) : "");
  const nextArtistPaidAt = data.artistPaid === undefined
    ? (existing.artistPaidAt || "")
    : (data.artistPaid ? (existing.artistPaidAt || paymentUpdateAt) : "");
  const nextClientPaidArtistAcknowledgedAt = data.clientPaid === undefined
    ? (existing.clientPaidArtistAcknowledgedAt || "")
    : (data.clientPaid
      ? (existing.clientPaidAt ? (existing.clientPaidArtistAcknowledgedAt || "") : "")
      : "");
  const nextArtistPaidArtistAcknowledgedAt = data.artistPaid === undefined
    ? (existing.artistPaidArtistAcknowledgedAt || "")
    : (data.artistPaid
      ? (existing.artistPaidAt ? (existing.artistPaidArtistAcknowledgedAt || "") : "")
      : "");
  const nextPaymentState = resolveEventPaymentState(
    nextClientPaidAt,
    nextArtistPaidAt,
    existing.paymentStatus,
    existing.updatedAt || existing.createdAt || nowIso()
  );
  const nextArtistId = data.artistId || existing.artistId;
  const artist = findArtistById(nextArtistId);
  if (!artist) {
    return jsonError(res, 404, "Artist profile not found.");
  }

  db.prepare(`
    UPDATE artist_events
    SET
      artist_id = ?,
      booking_request_id = ?,
      title = ?,
      venue = ?,
      engagement_time = ?,
      engagement_start_time = ?,
      engagement_end_time = ?,
      start_date = ?,
      end_date = ?,
      date_mode = ?,
      selected_dates_json = ?,
      status = ?,
      payment_status = ?,
      client_paid_at = ?,
      artist_paid_at = ?,
      client_paid_artist_acknowledged_at = ?,
      artist_paid_artist_acknowledged_at = ?,
      payment_amount = ?,
      currency = ?,
      client_name = ?,
      client_email = ?,
      client_phone = ?,
      require_signature = ?,
      contract_path = ?,
      contract_original_name = ?,
      client_pdf_path = ?,
      client_pdf_original_name = ?,
      notes = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    nextArtistId,
    data.bookingRequestId === undefined ? existing.bookingRequestId : data.bookingRequestId,
    data.title || existing.title,
    data.venue ?? existing.venue,
    nextEngagementTime || null,
    nextEngagementStartTime || null,
    nextEngagementEndTime || null,
    selection.startDate,
    selection.endDate,
    selection.dateMode,
    serializeJson(selection.selectedDates, []),
    nextStatus,
    nextPaymentState.paymentStatus,
    nextPaymentState.clientPaidAt || null,
    nextPaymentState.artistPaidAt || null,
    nextClientPaidArtistAcknowledgedAt || null,
    nextArtistPaidArtistAcknowledgedAt || null,
    data.paymentAmount ?? existing.paymentAmount,
    (data.currency || existing.currency).toUpperCase(),
    data.clientName === undefined ? existing.clientName : (data.clientName || null),
    data.clientEmail === undefined ? existing.clientEmail : (normalizeEmail(data.clientEmail) || null),
    data.clientPhone === undefined ? existing.clientPhone : normalizePhone(data.clientPhone),
    data.requireSignature === undefined ? (existing.requireSignature ? 1 : 0) : (data.requireSignature ? 1 : 0),
    data.contractPath === undefined ? existing.contractPath : cleanOptionalUrl(data.contractPath),
    data.contractOriginalName === undefined ? existing.contractOriginalName : (data.contractOriginalName || null),
    data.clientPdfPath === undefined ? existing.clientPdfPath : cleanOptionalUrl(data.clientPdfPath),
    data.clientPdfOriginalName === undefined ? existing.clientPdfOriginalName : (data.clientPdfOriginalName || null),
    data.notes === undefined ? existing.notes : (data.notes || null),
    nowIso(),
    eventId
  );

  let refreshed = parseEventRow(db.prepare("SELECT * FROM artist_events WHERE id = ?").get(eventId));
  const shouldGenerateArtistPdf = Boolean(data.createArtistPdf) || (!refreshed.contractPath && refreshed.requireSignature);
  if (shouldGenerateArtistPdf) {
    if (existing.signedAt && !data.resetSignedContract) {
      return jsonError(res, 400, "Signed contract reset confirmation required.");
    }
    if (existing.signedAt || existing.contractPath) {
      db.prepare(`
        UPDATE artist_events
        SET
          signed_by_name = NULL,
          signed_signature_strokes_json = NULL,
          signed_at = NULL,
          artist_acknowledged_at = NULL,
          admin_signature_acknowledged_at = NULL,
          updated_at = ?
        WHERE id = ?
      `).run(nowIso(), eventId);
      refreshed = parseEventRow(db.prepare("SELECT * FROM artist_events WHERE id = ?").get(eventId));
    }
    refreshed = await replaceGeneratedArtistEventPdf(artist, eventId, refreshed);
  } else if (data.contractPath !== undefined && cleanOptionalUrl(data.contractPath)) {
    if (existing.documentGeneratedAt && existing.contractPath && existing.contractPath !== cleanOptionalUrl(data.contractPath)) {
      await removeGeneratedUpload(existing.contractPath);
    }
    db.prepare("UPDATE artist_events SET document_generated_at = NULL WHERE id = ?").run(eventId);
    refreshed = parseEventRow(db.prepare("SELECT * FROM artist_events WHERE id = ?").get(eventId));
  }

  const shouldGenerateClientPdf = Boolean(data.createClientPdf) || !refreshed.clientPdfPath;
  if (shouldGenerateClientPdf) {
    refreshed = await replaceGeneratedClientQuotePdf(artist, eventId, refreshed);
  } else if (data.clientPdfPath !== undefined && cleanOptionalUrl(data.clientPdfPath)) {
    if (existing.clientDocumentGeneratedAt && existing.clientPdfPath && existing.clientPdfPath !== cleanOptionalUrl(data.clientPdfPath)) {
      await removeGeneratedUpload(existing.clientPdfPath);
    }
    db.prepare("UPDATE artist_events SET client_document_generated_at = NULL WHERE id = ?").run(eventId);
    refreshed = parseEventRow(db.prepare("SELECT * FROM artist_events WHERE id = ?").get(eventId));
  }

  res.json({
    ok: true,
    event: refreshed
  });
}));

app.patch("/api/dashboard/events/:id/payment", requireAuth, requireAdmin, safeAsync(async (req, res) => {
  ensureCsrf(req);
  const parsed = updateEventPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return jsonError(res, 400, "Invalid payment payload.", parsed.error.flatten());
  }

  const eventId = Number.parseInt(req.params.id, 10);
  const existing = parseEventRow(db.prepare("SELECT * FROM artist_events WHERE id = ?").get(eventId));
  if (!existing) {
    return jsonError(res, 404, "Event not found.");
  }

  const data = parsed.data;
  const currentClientPaid = Boolean(existing.clientPaidAt);
  const currentArtistPaid = Boolean(existing.artistPaidAt);
  const nextClientPaid = data.clientPaid === undefined ? currentClientPaid : data.clientPaid;
  const nextArtistPaid = data.artistPaid === undefined ? currentArtistPaid : data.artistPaid;
  const clientChanged = nextClientPaid !== currentClientPaid;
  const artistChanged = nextArtistPaid !== currentArtistPaid;

  if (!clientChanged && !artistChanged) {
    return res.json({
      ok: true,
      event: existing
    });
  }

  const paymentUpdateAt = nowIso();
  const nextClientPaidAt = nextClientPaid ? (existing.clientPaidAt || paymentUpdateAt) : "";
  const nextArtistPaidAt = nextArtistPaid ? (existing.artistPaidAt || paymentUpdateAt) : "";
  const nextPaymentState = resolveEventPaymentState(
    nextClientPaidAt,
    nextArtistPaidAt,
    existing.paymentStatus,
    existing.updatedAt || existing.createdAt || paymentUpdateAt
  );

  db.prepare(`
    UPDATE artist_events
    SET
      payment_status = ?,
      client_paid_at = ?,
      artist_paid_at = ?,
      client_paid_artist_acknowledged_at = ?,
      artist_paid_artist_acknowledged_at = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    nextPaymentState.paymentStatus,
    nextPaymentState.clientPaidAt || null,
    nextPaymentState.artistPaidAt || null,
    clientChanged ? null : (existing.clientPaidArtistAcknowledgedAt || null),
    artistChanged ? null : (existing.artistPaidArtistAcknowledgedAt || null),
    paymentUpdateAt,
    eventId
  );

  res.json({
    ok: true,
    event: parseEventRow(db.prepare("SELECT * FROM artist_events WHERE id = ?").get(eventId))
  });
}));

app.delete("/api/dashboard/events/:id", requireAuth, requireAdmin, (req, res) => {
  ensureCsrf(req);
  const eventId = Number.parseInt(req.params.id, 10);
  db.prepare("DELETE FROM artist_events WHERE id = ?").run(eventId);
  res.json({ ok: true });
});

app.post("/api/dashboard/events/:id/sign-preview", requireAuth, safeAsync(async (req, res) => {
  ensureCsrf(req);
  const parsed = signContractSchema.safeParse(req.body);
  if (!parsed.success) {
    return jsonError(res, 400, "Invalid signature payload.");
  }

  const eventId = Number.parseInt(req.params.id, 10);
  const event = parseEventRow(db.prepare("SELECT * FROM artist_events WHERE id = ?").get(eventId));
  if (!event) {
    return jsonError(res, 404, "Event not found.");
  }

  const accessibleArtist = withArtistAccountAccess(req, event.artistId);
  if (!accessibleArtist) {
    return jsonError(res, 403, "You cannot sign this contract.");
  }

  if (!event.contractPath) {
    return jsonError(res, 400, "This event does not have a contract to sign yet.");
  }
  if (!event.requireSignature) {
    return jsonError(res, 400, "This gig does not require a signature.");
  }
  if (!event.documentGeneratedAt) {
    return jsonError(res, 400, "Preview is only available for generated Sophora contracts.");
  }

  const previewEvent = {
    ...event,
    signedByName: parsed.data.fullName,
    signedSignatureStrokes: parsed.data.signatureStrokes,
    signedAt: nowIso()
  };
  const pdfBuffer = await buildArtistContractPdf({
    artist: accessibleArtist,
    event: previewEvent
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename=\"${slugify(event.title || "gig") || "gig"}-preview.pdf\"`);
  res.send(pdfBuffer);
}));

app.post("/api/dashboard/events/:id/sign", requireAuth, safeAsync(async (req, res) => {
  ensureCsrf(req);
  const parsed = signContractSchema.safeParse(req.body);
  if (!parsed.success) {
    return jsonError(res, 400, "Invalid signature payload.");
  }

  const eventId = Number.parseInt(req.params.id, 10);
  const event = parseEventRow(db.prepare("SELECT * FROM artist_events WHERE id = ?").get(eventId));
  if (!event) {
    return jsonError(res, 404, "Event not found.");
  }

  const accessibleArtist = withArtistAccountAccess(req, event.artistId);
  if (!accessibleArtist) {
    return jsonError(res, 403, "You cannot sign this contract.");
  }

  if (!event.contractPath) {
    return jsonError(res, 400, "This event does not have a contract to sign yet.");
  }
  if (!event.requireSignature) {
    return jsonError(res, 400, "This gig does not require a signature.");
  }

  db.prepare(`
    UPDATE artist_events
    SET
      signed_by_name = ?,
      signed_signature_strokes_json = ?,
      signed_at = ?,
      artist_acknowledged_at = ?,
      admin_signature_acknowledged_at = NULL,
      updated_at = ?
    WHERE id = ?
  `).run(
    parsed.data.fullName,
    serializeJson(parsed.data.signatureStrokes, []),
    nowIso(),
    nowIso(),
    nowIso(),
    eventId
  );

  let refreshedEvent = parseEventRow(db.prepare("SELECT * FROM artist_events WHERE id = ?").get(eventId));
  if (refreshedEvent?.documentGeneratedAt) {
    refreshedEvent = await replaceGeneratedArtistEventPdf(accessibleArtist, eventId, refreshedEvent);
  }

  res.json({
    ok: true,
    event: refreshedEvent
  });
}));

app.post("/api/dashboard/events/:id/acknowledge", requireAuth, (req, res) => {
  ensureCsrf(req);
  const eventId = Number.parseInt(req.params.id, 10);
  const event = parseEventRow(db.prepare("SELECT * FROM artist_events WHERE id = ?").get(eventId));
  if (!event) {
    return jsonError(res, 404, "Event not found.");
  }

  const accessibleArtist = withArtistAccountAccess(req, event.artistId);
  if (!accessibleArtist) {
    return jsonError(res, 403, "You cannot access this event.");
  }

  if (req.authUser.role === "admin") {
    db.prepare("UPDATE artist_events SET admin_signature_acknowledged_at = ?, updated_at = ? WHERE id = ?").run(nowIso(), nowIso(), eventId);
  } else {
    const allowedKinds = ["event", "client_paid", "artist_paid"];
    const requestedKinds = Array.isArray(req.body?.kinds)
      ? req.body.kinds.map((entry) => String(entry || "").trim()).filter((entry) => allowedKinds.includes(entry))
      : [];
    const kinds = requestedKinds.length ? requestedKinds : allowedKinds;
    const updates = [];
    const params = [];
    const acknowledgedAt = nowIso();

    if (kinds.includes("event")) {
      updates.push("artist_acknowledged_at = ?");
      params.push(acknowledgedAt);
    }
    if (kinds.includes("client_paid")) {
      updates.push("client_paid_artist_acknowledged_at = ?");
      params.push(acknowledgedAt);
      updates.push("client_paid_artist_seen_state = ?");
      params.push(event.clientPaidAt ? 1 : 0);
    }
    if (kinds.includes("artist_paid")) {
      updates.push("artist_paid_artist_acknowledged_at = ?");
      params.push(acknowledgedAt);
      updates.push("artist_paid_artist_seen_state = ?");
      params.push(event.artistPaidAt ? 1 : 0);
    }

    if (updates.length) {
      db.prepare(`UPDATE artist_events SET ${updates.join(", ")}, updated_at = ? WHERE id = ?`).run(
        ...params,
        acknowledgedAt,
        eventId
      );
    }
  }

  res.json({
    ok: true,
    event: parseEventRow(db.prepare("SELECT * FROM artist_events WHERE id = ?").get(eventId))
  });
});

app.post("/api/dashboard/onboarding", requireAuth, (req, res) => {
  ensureCsrf(req);
  const parsed = onboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    return jsonError(res, 400, "Invalid onboarding preference payload.");
  }

  if (parsed.data.dismissPermanently) {
    db.prepare("UPDATE users SET dashboard_tour_dismissed_at = ?, updated_at = ? WHERE id = ?").run(
      nowIso(),
      nowIso(),
      req.authUser.id
    );
  }

  res.json({ ok: true });
});

app.post(
  "/api/dashboard/upload",
  requireAuth,
  upload.single("file"),
  safeAsync(async (req, res) => {
    ensureCsrf(req);
    if (!req.file) {
      return jsonError(res, 400, "No file uploaded.");
    }

    const kind = String(req.body.kind || "").trim();
    const requestedArtistId = req.authUser.role === "admin"
      ? Number.parseInt(String(req.body.artistId || "0"), 10) || null
      : null;
    const artist = getAccessibleArtist(req, requestedArtistId);
    if (!artist) {
      return jsonError(res, 404, "Artist profile not found.");
    }

    const rules = {
      photo: /^image\//i,
      hero: /^image\//i,
      card: /^image\//i,
      video: /^video\//i,
      audio: /^audio\//i,
      rider: /^application\/pdf$/i,
      contract: /^application\/pdf$/i
    };

    if (!rules[kind] || !rules[kind].test(req.file.mimetype)) {
      return jsonError(res, 400, "Unsupported file type.");
    }

    const ext = path.extname(req.file.originalname || "").toLowerCase() || (
      kind === "audio"
        ? ".mp3"
        : kind === "video"
          ? ".mp4"
          : kind === "rider" || kind === "contract"
            ? ".pdf"
            : ".jpg"
    );
    const safeBaseName = slugify(path.basename(req.file.originalname || kind, ext)) || kind;
    const fileName = `${kind}-${Date.now()}-${safeBaseName}${ext}`;
    const uploaded = await putArtistUpload({
      artistSlug: artist.slug,
      fileName,
      buffer: req.file.buffer,
      contentType: req.file.mimetype
    });

    res.json({
      ok: true,
      file: {
        name: req.file.originalname,
        kind,
        url: uploaded.publicPath
      }
    });
  })
);

app.get("/api/admin/overview", requireAuth, requireAdmin, (req, res) => {
  const artists = listAllArtists().map((artist) => {
    const eventCount = db.prepare("SELECT COUNT(*) AS count FROM artist_events WHERE artist_id = ?").get(artist.id).count;
    const availabilityCount = db.prepare("SELECT COUNT(*) AS count FROM artist_availability WHERE artist_id = ?").get(artist.id).count;
    return {
      ...serializeArtistSummary(artist),
      eventCount,
      availabilityCount
    };
  });

  res.json({
    user: getAuthPayload(req.authUser),
    csrfToken: req.authSession.csrf_token,
    artists
  });
});

app.post(
  "/api/admin/artists",
  requireAuth,
  requireAdmin,
  safeAsync(async (req, res) => {
    ensureCsrf(req);
    const parsed = adminCreateArtistSchema.safeParse(req.body);
    if (!parsed.success) {
      return jsonError(res, 400, "Invalid artist creation payload.", parsed.error.flatten());
    }

    const data = parsed.data;
    const displayName = normalizeTranslations(data.displayName, "Nuevo artista");
    const slug = makeUniqueSlug(data.slug || resolveTranslation(displayName, "es", "es"));
    const shortBio = normalizeTranslations(data.shortBio || {}, "");
    const createdAt = nowIso();
    const sortOrder = getNextArtistSortOrder();

    let userId = null;
    let generatedPassword = null;
    let createdUser = null;

    if (data.email || data.username) {
      if (!data.email || !data.username) {
        return jsonError(res, 400, "Email and username are both required when creating an artist account.");
      }

      const email = normalizeEmail(data.email);
      const username = normalizeUsername(data.username);

      if (db.prepare("SELECT id FROM users WHERE email = ?").get(email)) {
        return jsonError(res, 409, "This email address is already in use.");
      }
      if (db.prepare("SELECT id FROM users WHERE username = ?").get(username)) {
        return jsonError(res, 409, "This username is already in use.");
      }

      generatedPassword = data.password || generateTemporaryPassword();
      const passwordHash = await hashPassword(generatedPassword);
      const passwordLengthEncrypted = createPasswordLengthEnvelope(generatedPassword);

      const userInfo = db.prepare(`
        INSERT INTO users (
          role,
          username,
          email,
          password_hash,
          password_length_encrypted,
          email_verified_at,
          locale,
          dashboard_tour_dismissed_at,
          created_by_admin,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, NULL, 'es', NULL, 1, ?, ?)
      `).run("artist", username, email, passwordHash, passwordLengthEncrypted, createdAt, createdAt);

      userId = Number(userInfo.lastInsertRowid);
      createdUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    }

    const info = db.prepare(`
      INSERT INTO artist_profiles (
        user_id,
        slug,
        public_status,
        page_mode,
        availability_mode,
        display_name_translations,
        short_bio_translations,
        about_translations,
        show_details_translations,
        welcome_prefix_translations,
        card_image_url,
        card_audio_url,
        hero_image_url,
        technical_rider_path,
        videos_json,
        photos_json,
        page_sections_json,
        sort_order,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, 'custom', ?, ?, '{}', '{}', ?, NULL, NULL, NULL, NULL, '[]', '[]', ?, ?, ?, ?)
    `).run(
      userId,
      slug,
      data.publicStatus,
      data.pageMode,
      serializeJson(displayName),
      serializeJson(shortBio),
      serializeJson({ es: "Bienvenido", en: "Welcome" }),
      serializeJson({
        about: Boolean(resolveTranslation(shortBio, "es", "es")),
        audio: false,
        videos: false,
        photos: false,
        showDetails: false,
        technicalRider: false
      }),
      sortOrder,
      createdAt,
      createdAt
    );

    if (createdUser && generatedPassword) {
      await sendAdminInviteEmail(createdUser, generatedPassword);
    }

    res.status(201).json({
      ok: true,
      artist: serializeArtistDetail(findArtistById(Number(info.lastInsertRowid))),
      generatedPassword
    });
  })
);

app.post("/api/admin/artists/reorder", requireAuth, requireAdmin, (req, res) => {
  ensureCsrf(req);
  const parsed = reorderArtistsSchema.safeParse(req.body);
  if (!parsed.success) {
    return jsonError(res, 400, "Invalid reorder payload.", parsed.error.flatten());
  }

  const currentArtists = listAllArtists();
  const currentArtistIds = currentArtists.map((artist) => artist.id);
  const requestedArtistIds = parsed.data.artistIds;
  const currentSet = new Set(currentArtistIds);
  const requestedSet = new Set(requestedArtistIds);

  if (
    requestedArtistIds.length !== currentArtistIds.length ||
    requestedSet.size !== currentArtistIds.length ||
    requestedArtistIds.some((artistId) => !currentSet.has(artistId))
  ) {
    return jsonError(res, 400, "Artist reorder payload does not match the current artist list.");
  }

  const updatedAt = nowIso();
  const updateSortOrder = db.prepare("UPDATE artist_profiles SET sort_order = ?, updated_at = ? WHERE id = ?");
  const reorderArtists = db.transaction((artistIds) => {
    artistIds.forEach((artistId, index) => {
      updateSortOrder.run((index + 1) * 10, updatedAt, artistId);
    });
  });

  reorderArtists(requestedArtistIds);

  res.json({
    ok: true,
    artists: listAllArtists().map((artist) => ({
      ...serializeArtistSummary(artist),
      notifications: getArtistNotificationCounts(artist.id)
    }))
  });
});

app.post(
  "/api/admin/artists/:id/account",
  requireAuth,
  requireAdmin,
  safeAsync(async (req, res) => {
    ensureCsrf(req);
    const parsed = accountAttachSchema.safeParse(req.body);
    if (!parsed.success) {
      return jsonError(res, 400, "Invalid account payload.", parsed.error.flatten());
    }

    const artistId = Number.parseInt(req.params.id, 10);
    const artist = findArtistById(artistId);
    if (!artist) {
      return jsonError(res, 404, "Artist not found.");
    }
    if (artist.userId) {
      return jsonError(res, 409, "This artist already has an attached account.");
    }

    const email = normalizeEmail(parsed.data.email);
    const username = normalizeUsername(parsed.data.username);
    if (db.prepare("SELECT id FROM users WHERE email = ?").get(email)) {
      return jsonError(res, 409, "This email address is already in use.");
    }
    if (db.prepare("SELECT id FROM users WHERE username = ?").get(username)) {
      return jsonError(res, 409, "This username is already in use.");
    }

    const password = parsed.data.password || generateTemporaryPassword();
    const passwordHash = await hashPassword(password);
    const passwordLengthEncrypted = createPasswordLengthEnvelope(password);
    const createdAt = nowIso();

    const userInfo = db.prepare(`
      INSERT INTO users (
        role,
        username,
        email,
        password_hash,
        password_length_encrypted,
        email_verified_at,
        locale,
        dashboard_tour_dismissed_at,
        created_by_admin,
        created_at,
        updated_at
      ) VALUES ('artist', ?, ?, ?, ?, NULL, 'es', NULL, 1, ?, ?)
    `).run(username, email, passwordHash, passwordLengthEncrypted, createdAt, createdAt);

    const userId = Number(userInfo.lastInsertRowid);
    db.prepare("UPDATE artist_profiles SET user_id = ?, updated_at = ? WHERE id = ?").run(userId, createdAt, artistId);

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    await sendAdminInviteEmail(user, password);

    res.json({
      ok: true,
      artist: serializeArtistDetail(findArtistById(artistId)),
      generatedPassword: password
    });
  })
);

app.patch(
  "/api/admin/artists/:id",
  requireAuth,
  requireAdmin,
  safeAsync(async (req, res) => {
    ensureCsrf(req);
    req.body.artistId = Number.parseInt(req.params.id, 10);
    const parsed = dashboardProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return jsonError(res, 400, "Invalid profile payload.", parsed.error.flatten());
    }

    const savedArtist = saveArtistProfile(
      {
        role: "admin",
        artistSlug: null
      },
      parsed.data
    );

    res.json({
      ok: true,
      artist: serializeArtistDetail(savedArtist)
    });
  })
);

app.delete("/api/admin/artists/:id", requireAuth, requireAdmin, (req, res) => {
  ensureCsrf(req);
  const artistId = Number.parseInt(req.params.id, 10);
  const artist = findArtistById(artistId);
  if (!artist) {
    return jsonError(res, 404, "Artist not found.");
  }

  const transaction = db.transaction(() => {
    if (artist.userId) {
      db.prepare("DELETE FROM users WHERE id = ? AND role = 'artist'").run(artist.userId);
    }
    db.prepare("DELETE FROM artist_profiles WHERE id = ?").run(artistId);
  });
  transaction();

  res.json({ ok: true });
});

app.get("/artists/:slug/", (req, res, next) => {
  if (hasStaticCatalogArtist(req.params.slug)) {
    return res.sendFile(path.join(config.rootDir, "artist-catalog-page.html"));
  }

  const artist = findArtistBySlug(req.params.slug, { includeHidden: false });
  if (!artist) return next();
  if (artist.pageMode === "booking_only" || !artist.hasPublicContent) {
    return res.redirect(302, artist.bookingUrl);
  }
  return res.sendFile(path.join(config.rootDir, "artist-shell.html"));
});

app.get("/artists/:slug", (req, res, next) => {
  if (req.path.endsWith("/")) return next();
  if (hasStaticCatalogArtist(req.params.slug)) {
    return res.sendFile(path.join(config.rootDir, "artist-catalog-page.html"));
  }

  const artist = findArtistBySlug(req.params.slug, { includeHidden: false });
  if (!artist) return next();
  if (artist.pageMode === "booking_only" || !artist.hasPublicContent) {
    return res.redirect(302, artist.bookingUrl);
  }
  return res.sendFile(path.join(config.rootDir, "artist-shell.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(config.rootDir, "index.html"));
});

app.get("/paraempresas", (req, res) => {
  res.redirect(301, "/empresas");
});

app.get("/paraempresas/", (req, res) => {
  res.redirect(301, "/empresas");
});

app.get("/convenioempresas", (req, res) => {
  res.redirect(301, "/empresas");
});

app.get("/convenioempresas/", (req, res) => {
  res.redirect(301, "/empresas");
});

app.get("/empresas", (req, res) => {
  res.sendFile(path.join(config.rootDir, "paraempresas.html"));
});

app.get("/empresas/", (req, res) => {
  res.sendFile(path.join(config.rootDir, "paraempresas.html"));
});

app.get("/eventos", (req, res) => {
  res.sendFile(path.join(config.rootDir, "eventos.html"));
});

app.get("/eventos/", (req, res) => {
  res.sendFile(path.join(config.rootDir, "eventos.html"));
});

app.get("/contact", (req, res) => {
  res.redirect(301, "/contacto");
});

app.get("/contacto", (req, res) => {
  res.sendFile(path.join(config.rootDir, "contacto.html"));
});

app.get("/contacto/", (req, res) => {
  res.sendFile(path.join(config.rootDir, "contacto.html"));
});

app.get("/escribenos", (req, res) => {
  res.sendFile(path.join(config.rootDir, "escribenos.html"));
});

app.get("/escribenos/", (req, res) => {
  res.sendFile(path.join(config.rootDir, "escribenos.html"));
});

app.get("/unirse", (req, res) => {
  res.sendFile(path.join(config.rootDir, "unirse.html"));
});

app.get("/unirse/", (req, res) => {
  res.sendFile(path.join(config.rootDir, "unirse.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(config.rootDir, "login.html"));
});

app.get("/login/", (req, res) => {
  res.sendFile(path.join(config.rootDir, "login.html"));
});

app.get("/perfil", (req, res) => {
  res.sendFile(path.join(config.rootDir, "perfil.html"));
});

app.get("/perfil/", (req, res) => {
  res.sendFile(path.join(config.rootDir, "perfil.html"));
});

app.get("/privacypolicy", (req, res) => {
  res.redirect(301, "/privacidad");
});

app.get("/privacidad", (req, res) => {
  res.sendFile(path.join(config.rootDir, "privacidad.html"));
});

app.get("/privacidad/", (req, res) => {
  res.sendFile(path.join(config.rootDir, "privacidad.html"));
});

app.get("/preguntas", (req, res) => {
  res.sendFile(path.join(config.rootDir, "preguntas.html"));
});

app.get("/preguntas/", (req, res) => {
  res.sendFile(path.join(config.rootDir, "preguntas.html"));
});

app.get("/catalogodeartistas", (req, res) => {
  res.redirect(301, "/artistas");
});

app.get("/catalogodeartistas/", (req, res) => {
  res.redirect(301, "/artistas");
});

app.get("/artistas", (req, res) => {
  res.sendFile(path.join(config.rootDir, "catalogodeartistas.html"));
});

app.get("/artistas/", (req, res) => {
  res.sendFile(path.join(config.rootDir, "catalogodeartistas.html"));
});

app.get("/artistas/:slug/", (req, res, next) => {
  if (!hasStaticCatalogArtist(req.params.slug)) return next();
  return res.sendFile(path.join(config.rootDir, "artist-catalog-page.html"));
});

app.get("/artistas/:slug", (req, res, next) => {
  if (req.path.endsWith("/")) return next();
  if (!hasStaticCatalogArtist(req.params.slug)) return next();
  return res.sendFile(path.join(config.rootDir, "artist-catalog-page.html"));
});

app.use("/assets", express.static(path.join(config.rootDir, "assets"), { index: false }));
app.use("/artists", express.static(path.join(config.rootDir, "artists"), { index: false }));
app.get(/^\/uploads\/(.+)$/, safeAsync(async (req, res, next) => {
  const publicPath = req.path;
  const streamed = await streamUploadToResponse(publicPath, res);
  if (streamed === false) return next();
  if (typeof streamed === "string") {
    return res.sendFile(streamed);
  }
}));

for (const fileName of PUBLIC_ROOT_FILES) {
  app.get(`/${fileName}`, (req, res) => {
    res.sendFile(path.join(config.rootDir, fileName));
  });
}

app.use((req, res) => {
  res.status(404).json({
    error: "Not found."
  });
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) {
    console.error(error);
  }
  if (res.headersSent) return next(error);
  res.status(statusCode).json({
    error: error.message || "Unexpected server error."
  });
});

await initializeDatabase();
await ensureStorageReady();

app.listen(config.port, () => {
  console.log(`[sophora] Backend listening on ${config.appUrl}`);
});
