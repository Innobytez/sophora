import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const port = Number.parseInt(process.env.PORT || "3000", 10);
const appUrl = (process.env.APP_URL || `http://localhost:${port}`).replace(/\/$/, "");

const app = express();

const catalogArtistSlugs = new Set([
  "gusto-completo",
  "carmeners",
  "alexander-roberts",
  "gabriela-caceres",
  "la-sociedad-chilena-del-jass",
  "mirza-y-erick",
  "the-hot-cats-big-band",
  "trio-mena-corral"
]);

function sendRootFile(res, fileName) {
  res.sendFile(path.join(rootDir, fileName));
}

app.disable("x-powered-by");

app.use("/assets", express.static(path.join(rootDir, "assets"), { index: false }));
app.use("/artists", express.static(path.join(rootDir, "artists"), { index: false }));
app.use("/uploads", express.static(path.join(rootDir, "uploads"), { index: false }));

app.get("/", (req, res) => sendRootFile(res, "index.html"));
app.get(/^\/empresas\/?$/, (req, res) => sendRootFile(res, "paraempresas.html"));
app.get(/^\/convenioempresas\/?$/, (req, res) => res.redirect(301, "/empresas"));
app.get(/^\/paraempresas\/?$/, (req, res) => res.redirect(301, "/empresas"));
app.get(/^\/artistas\/?$/, (req, res) => sendRootFile(res, "catalogodeartistas.html"));
app.get(/^\/catalogodeartistas\/?$/, (req, res) => res.redirect(301, "/artistas"));

app.get(/^\/artistas\/([^/]+)\/?$/, (req, res, next) => {
  const slug = req.params[0];
  if (!catalogArtistSlugs.has(slug)) return next();
  sendRootFile(res, "artist-catalog-page.html");
});

app.get(/^\/artists\/([^/]+)\/?$/, (req, res, next) => {
  const slug = req.params[0];
  if (!catalogArtistSlugs.has(slug)) return next();
  res.redirect(301, `/artistas/${slug}/`);
});

[
  "home-web.css",
  "home-web.js",
  "artist-catalog.css",
  "artist-catalog-data.js",
  "artist-catalog.js",
  "catalogodeartistas.html",
  "artist-catalog-page.html",
  "paraempresas.html"
].forEach((fileName) => {
  app.get(`/${fileName}`, (req, res) => sendRootFile(res, fileName));
});

app.use((req, res) => {
  res.status(404).send("Not found");
});

app.listen(port, () => {
  console.log(`[sophora] Public site listening on ${appUrl}`);
});
