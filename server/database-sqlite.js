import Database from "better-sqlite3";

import { config } from "./config.js";
import { hashPassword, createPasswordLengthEnvelope } from "./security.js";
import { SEED_ARTISTS, SEED_AVAILABILITY, SEED_EVENTS } from "./seed-data.js";

export const db = new Database(config.dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function serializeJson(value, fallback = {}) {
  return JSON.stringify(value ?? fallback);
}

export function nowIso() {
  return new Date().toISOString();
}

export async function initializeDatabase(options = {}) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL CHECK(role IN ('admin', 'artist')),
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_length_encrypted TEXT NOT NULL,
      email_verified_at TEXT,
      locale TEXT NOT NULL DEFAULT 'es',
      dashboard_tour_dismissed_at TEXT,
      created_by_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS artist_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
      slug TEXT NOT NULL UNIQUE,
      public_status TEXT NOT NULL DEFAULT 'published' CHECK(public_status IN ('published', 'hidden')),
      page_mode TEXT NOT NULL DEFAULT 'page' CHECK(page_mode IN ('page', 'booking_only')),
      availability_mode TEXT NOT NULL DEFAULT 'custom',
      contact_phone TEXT,
      display_name_translations TEXT NOT NULL,
      short_bio_translations TEXT NOT NULL DEFAULT '{}',
      about_translations TEXT NOT NULL DEFAULT '{}',
      show_details_translations TEXT NOT NULL DEFAULT '{}',
      welcome_prefix_translations TEXT NOT NULL DEFAULT '{}',
      card_image_url TEXT,
      card_audio_url TEXT,
      hero_image_url TEXT,
      technical_rider_path TEXT,
      videos_json TEXT NOT NULL DEFAULT '[]',
      photos_json TEXT NOT NULL DEFAULT '[]',
      page_sections_json TEXT NOT NULL DEFAULT '{}',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS oauth_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      provider_subject TEXT NOT NULL,
      email TEXT,
      display_name TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(provider, provider_subject)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      csrf_token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      user_agent TEXT,
      ip_address TEXT
    );

    CREATE TABLE IF NOT EXISTS auth_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      payload_encrypted TEXT,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS artist_availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      artist_id INTEGER NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
      available_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(artist_id, available_date)
    );

    CREATE TABLE IF NOT EXISTS artist_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      artist_id INTEGER NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
      booking_request_id INTEGER REFERENCES booking_requests(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      venue TEXT,
      engagement_time TEXT,
      engagement_start_time TEXT,
      engagement_end_time TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT,
      date_mode TEXT NOT NULL DEFAULT 'single' CHECK(date_mode IN ('single', 'multiple', 'range')),
      selected_dates_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'completed', 'cancelled')),
      payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'partial', 'waived')),
      client_paid_at TEXT,
      artist_paid_at TEXT,
      client_paid_artist_acknowledged_at TEXT,
      artist_paid_artist_acknowledged_at TEXT,
      client_paid_artist_seen_state INTEGER NOT NULL DEFAULT 0,
      artist_paid_artist_seen_state INTEGER NOT NULL DEFAULT 0,
      payment_amount INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'CLP',
      client_name TEXT,
      client_email TEXT,
      client_phone TEXT,
      require_signature INTEGER NOT NULL DEFAULT 0,
      contract_path TEXT,
      contract_original_name TEXT,
      client_pdf_path TEXT,
      client_pdf_original_name TEXT,
      signed_by_name TEXT,
      signed_signature_strokes_json TEXT,
      signed_at TEXT,
      artist_acknowledged_at TEXT,
      admin_signature_acknowledged_at TEXT,
      document_generated_at TEXT,
      client_document_generated_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS booking_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      artist_id INTEGER NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      client_phone TEXT,
      notify_by_email INTEGER NOT NULL DEFAULT 0,
      notify_by_sms INTEGER NOT NULL DEFAULT 0,
      engagement_start_time TEXT,
      engagement_end_time TEXT,
      location TEXT,
      suggested_budget INTEGER,
      date_mode TEXT NOT NULL CHECK(date_mode IN ('single', 'multiple', 'range')),
      start_date TEXT,
      end_date TEXT,
      selected_dates_json TEXT NOT NULL DEFAULT '[]',
      additional_info TEXT,
      status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'forwarded', 'converted', 'archived')),
      forwarded_message TEXT,
      forwarded_email_at TEXT,
      forwarded_whatsapp_at TEXT,
      converted_event_id INTEGER REFERENCES artist_events(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const artistProfileColumns = db.prepare("PRAGMA table_info(artist_profiles)").all();
  const hasAvailabilityModeColumn = artistProfileColumns.some((column) => column.name === "availability_mode");
  if (!hasAvailabilityModeColumn) {
    db.exec("ALTER TABLE artist_profiles ADD COLUMN availability_mode TEXT NOT NULL DEFAULT 'custom'");
  }
  const hasContactPhoneColumn = artistProfileColumns.some((column) => column.name === "contact_phone");
  if (!hasContactPhoneColumn) {
    db.exec("ALTER TABLE artist_profiles ADD COLUMN contact_phone TEXT");
  }
  db.exec(`
    UPDATE artist_profiles
    SET availability_mode = 'custom'
    WHERE availability_mode IS NULL OR availability_mode NOT IN ('custom', 'all_available', 'all_unavailable')
  `);

  const artistEventColumns = db.prepare("PRAGMA table_info(artist_events)").all();
  const requiredEventColumns = [
    ["booking_request_id", "ALTER TABLE artist_events ADD COLUMN booking_request_id INTEGER"],
    ["engagement_time", "ALTER TABLE artist_events ADD COLUMN engagement_time TEXT"],
    ["engagement_start_time", "ALTER TABLE artist_events ADD COLUMN engagement_start_time TEXT"],
    ["engagement_end_time", "ALTER TABLE artist_events ADD COLUMN engagement_end_time TEXT"],
    ["date_mode", "ALTER TABLE artist_events ADD COLUMN date_mode TEXT NOT NULL DEFAULT 'single'"],
    ["selected_dates_json", "ALTER TABLE artist_events ADD COLUMN selected_dates_json TEXT NOT NULL DEFAULT '[]'"],
    ["client_name", "ALTER TABLE artist_events ADD COLUMN client_name TEXT"],
    ["client_email", "ALTER TABLE artist_events ADD COLUMN client_email TEXT"],
    ["client_phone", "ALTER TABLE artist_events ADD COLUMN client_phone TEXT"],
    ["client_paid_at", "ALTER TABLE artist_events ADD COLUMN client_paid_at TEXT"],
    ["artist_paid_at", "ALTER TABLE artist_events ADD COLUMN artist_paid_at TEXT"],
    ["client_paid_artist_acknowledged_at", "ALTER TABLE artist_events ADD COLUMN client_paid_artist_acknowledged_at TEXT"],
    ["artist_paid_artist_acknowledged_at", "ALTER TABLE artist_events ADD COLUMN artist_paid_artist_acknowledged_at TEXT"],
    ["client_paid_artist_seen_state", "ALTER TABLE artist_events ADD COLUMN client_paid_artist_seen_state INTEGER NOT NULL DEFAULT 0"],
    ["artist_paid_artist_seen_state", "ALTER TABLE artist_events ADD COLUMN artist_paid_artist_seen_state INTEGER NOT NULL DEFAULT 0"],
    ["require_signature", "ALTER TABLE artist_events ADD COLUMN require_signature INTEGER NOT NULL DEFAULT 0"],
    ["client_pdf_path", "ALTER TABLE artist_events ADD COLUMN client_pdf_path TEXT"],
    ["client_pdf_original_name", "ALTER TABLE artist_events ADD COLUMN client_pdf_original_name TEXT"],
    ["signed_signature_strokes_json", "ALTER TABLE artist_events ADD COLUMN signed_signature_strokes_json TEXT"],
    ["artist_acknowledged_at", "ALTER TABLE artist_events ADD COLUMN artist_acknowledged_at TEXT"],
    ["admin_signature_acknowledged_at", "ALTER TABLE artist_events ADD COLUMN admin_signature_acknowledged_at TEXT"],
    ["document_generated_at", "ALTER TABLE artist_events ADD COLUMN document_generated_at TEXT"],
    ["client_document_generated_at", "ALTER TABLE artist_events ADD COLUMN client_document_generated_at TEXT"]
  ];
  for (const [columnName, statement] of requiredEventColumns) {
    if (!artistEventColumns.some((column) => column.name === columnName)) {
      db.exec(statement);
    }
  }
  db.exec(`
    UPDATE artist_events
    SET
      date_mode = COALESCE(NULLIF(date_mode, ''), CASE WHEN start_date = COALESCE(end_date, start_date) THEN 'single' ELSE 'range' END),
      selected_dates_json = CASE
        WHEN selected_dates_json IS NULL OR selected_dates_json = '' THEN
          CASE
            WHEN end_date IS NOT NULL AND end_date != start_date THEN json_array(start_date, end_date)
            ELSE json_array(start_date)
          END
        ELSE selected_dates_json
      END,
      require_signature = COALESCE(require_signature, 0)
  `);
  db.exec(`
    UPDATE artist_events
    SET
      client_paid_artist_seen_state = CASE
        WHEN client_paid_artist_acknowledged_at IS NOT NULL AND client_paid_artist_acknowledged_at != ''
          THEN CASE WHEN client_paid_at IS NOT NULL AND client_paid_at != '' THEN 1 ELSE 0 END
        ELSE COALESCE(client_paid_artist_seen_state, 0)
      END,
      artist_paid_artist_seen_state = CASE
        WHEN artist_paid_artist_acknowledged_at IS NOT NULL AND artist_paid_artist_acknowledged_at != ''
          THEN CASE WHEN artist_paid_at IS NOT NULL AND artist_paid_at != '' THEN 1 ELSE 0 END
        ELSE COALESCE(artist_paid_artist_seen_state, 0)
      END
  `);

  const bookingRequestColumns = db.prepare("PRAGMA table_info(booking_requests)").all();
  const requiredBookingRequestColumns = [
    ["notify_by_email", "ALTER TABLE booking_requests ADD COLUMN notify_by_email INTEGER NOT NULL DEFAULT 0"],
    ["notify_by_sms", "ALTER TABLE booking_requests ADD COLUMN notify_by_sms INTEGER NOT NULL DEFAULT 0"],
    ["engagement_start_time", "ALTER TABLE booking_requests ADD COLUMN engagement_start_time TEXT"],
    ["engagement_end_time", "ALTER TABLE booking_requests ADD COLUMN engagement_end_time TEXT"],
    ["location", "ALTER TABLE booking_requests ADD COLUMN location TEXT"],
    ["suggested_budget", "ALTER TABLE booking_requests ADD COLUMN suggested_budget INTEGER"]
  ];
  for (const [columnName, statement] of requiredBookingRequestColumns) {
    if (!bookingRequestColumns.some((column) => column.name === columnName)) {
      db.exec(statement);
    }
  }

  const hasArtists = db.prepare("SELECT COUNT(*) AS count FROM artist_profiles").get().count > 0;
  if (options.seed !== false && !hasArtists) {
    const insertArtist = db.prepare(`
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
      ) VALUES (
        NULL,
        @slug,
        'published',
        @pageMode,
        'custom',
        @displayName,
        @shortBio,
        @about,
        @showDetails,
        @welcomePrefix,
        @cardImageUrl,
        @cardAudioUrl,
        @heroImageUrl,
        @technicalRiderPath,
        @videos,
        @photos,
        @pageSections,
        @sortOrder,
        @createdAt,
        @updatedAt
      )
    `);

    const createdAt = nowIso();
    const artistIdsBySlug = new Map();

    for (const artist of SEED_ARTISTS) {
      const info = insertArtist.run({
        slug: artist.slug,
        pageMode: artist.pageMode,
        displayName: serializeJson(artist.displayName),
        shortBio: serializeJson(artist.shortBio),
        about: serializeJson(artist.about),
        showDetails: serializeJson(artist.showDetails),
        welcomePrefix: serializeJson(artist.welcomePrefix),
        cardImageUrl: artist.cardImageUrl,
        cardAudioUrl: artist.cardAudioUrl,
        heroImageUrl: artist.heroImageUrl,
        technicalRiderPath: artist.technicalRiderPath,
        videos: serializeJson(artist.videos, []),
        photos: serializeJson(artist.photos, []),
        pageSections: serializeJson(artist.pageSections),
        sortOrder: artist.sortOrder,
        createdAt,
        updatedAt: createdAt
      });
      artistIdsBySlug.set(artist.slug, Number(info.lastInsertRowid));
    }

    const insertAvailability = db.prepare(`
      INSERT OR IGNORE INTO artist_availability (artist_id, available_date, notes, created_at)
      VALUES (?, ?, NULL, ?)
    `);

    for (const [slug, dates] of Object.entries(SEED_AVAILABILITY)) {
      const artistId = artistIdsBySlug.get(slug);
      if (!artistId) continue;
      for (const date of dates) {
        insertAvailability.run(artistId, date, createdAt);
      }
    }

    const insertEvent = db.prepare(`
      INSERT INTO artist_events (
        artist_id,
        title,
        venue,
        start_date,
        end_date,
        status,
        payment_status,
        payment_amount,
        currency,
        notes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const event of SEED_EVENTS) {
      const artistId = artistIdsBySlug.get(event.artistSlug);
      if (!artistId) continue;
      insertEvent.run(
        artistId,
        event.title,
        event.venue,
        event.startDate,
        event.endDate,
        event.status,
        event.paymentStatus,
        event.paymentAmount,
        event.currency,
        event.notes,
        createdAt,
        createdAt
      );
    }
  }

  const adminCount = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").get().count;
  if (options.seed !== false && !adminCount) {
    const seed = config.adminSeed;
    const isSeedConfigured = seed.email && seed.username && seed.password;
    const shouldCreateDevAdmin = !config.isProduction;

    if (isSeedConfigured || shouldCreateDevAdmin) {
      const email = (seed.email || "admin@innobytez.com").toLowerCase();
      const username = seed.username || "admin";
      const password = seed.password || "ChangeMe123!";
      const createdAt = nowIso();

      const passwordHash = await hashPassword(password);
      const passwordLengthEncrypted = createPasswordLengthEnvelope(password);

      db.prepare(`
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
        ) VALUES (?, ?, ?, ?, ?, ?, 'es', NULL, 1, ?, ?)
      `).run(
        "admin",
        username,
        email,
        passwordHash,
        passwordLengthEncrypted,
        createdAt,
        createdAt,
        createdAt
      );

      console.log(
        `[sophora] Created initial admin account for ${email} with username "${username}".`
      );
    } else {
      console.warn(
        "[sophora] No admin user exists and no ADMIN_* environment variables were provided."
      );
    }
  }
}
