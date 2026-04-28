import { config } from "./config.js";

const implementation = await (config.dbClient === "postgres"
  ? import("./database-postgres.js")
  : import("./database-sqlite.js"));

export const db = implementation.db;
export const parseJson = implementation.parseJson;
export const serializeJson = implementation.serializeJson;
export const nowIso = implementation.nowIso;
export const initializeDatabase = implementation.initializeDatabase;
