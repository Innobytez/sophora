import fs from "node:fs";
import path from "node:path";

import PDFDocument from "pdfkit";

import { config } from "./config.js";

const COLORS = {
  ink: "#0E0E0E",
  paper: "#F6F5F2",
  green: "#1F3D2B",
  terracotta: "#B66A4A",
  text: "#151515",
  muted: "#5D5A55",
  border: "#D7D1C6",
  panel: "#FFFFFF",
  softPanel: "#F0ECE5",
  success: "#2E6C46"
};

const PAGE_MARGIN = 44;
const HEADER_HEIGHT = 92;
const HEADER_CONTENT_TOP = HEADER_HEIGHT + 18;
const FOOTER_HEIGHT = 28;
const CARD_GAP = 10;
const LOGO_PATH = path.join(config.rootDir, "assets", "sophora_logo_black.png");

function artistDisplayName(artist) {
  return artist?.displayName?.es
    || artist?.displayName?.en
    || Object.values(artist?.displayName || {}).find(Boolean)
    || "Artista";
}

function formatIsoDate(value) {
  if (!value) return "Por confirmar";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatTimestamp(value) {
  if (!value) return "Pendiente";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatSelectedDates(event) {
  if (!event) return "Por confirmar";
  if (event.dateMode === "multiple" && Array.isArray(event.selectedDates) && event.selectedDates.length) {
    return event.selectedDates.map(formatIsoDate).join(" / ");
  }
  if (event.dateMode === "range" && event.startDate && event.endDate && event.startDate !== event.endDate) {
    return `${formatIsoDate(event.startDate)} al ${formatIsoDate(event.endDate)}`;
  }
  return formatIsoDate(event.startDate || event.selectedDates?.[0] || "");
}

function splitLegacyTimeWindow(value) {
  const text = String(value || "").trim();
  if (!text) return { startTime: "", endTime: "" };
  const match = text.match(/^(.+?)\s*-\s*(.+)$/);
  if (match) {
    return {
      startTime: match[1].trim(),
      endTime: match[2].trim()
    };
  }
  return { startTime: text, endTime: "" };
}

function resolveEventTimeParts(event) {
  const startTime = String(event?.engagementStartTime || "").trim();
  const endTime = String(event?.engagementEndTime || "").trim();
  if (startTime || endTime) {
    return { startTime, endTime };
  }
  return splitLegacyTimeWindow(event?.engagementTime || "");
}

function buildEstimatedTimeSentence(event) {
  const { startTime, endTime } = resolveEventTimeParts(event);
  if (startTime && endTime) {
    return `La hora estimada de inicio es ${startTime} y la hora estimada de termino es ${endTime}.`;
  }
  if (startTime) {
    return `La hora estimada de inicio es ${startTime}.`;
  }
  if (endTime) {
    return `La hora estimada de termino es ${endTime}.`;
  }
  return null;
}

function buildEstimatedTimeInfoItems(event) {
  const { startTime, endTime } = resolveEventTimeParts(event);
  return [
    { label: "Hora estimada de inicio", value: startTime || "Por confirmar" },
    { label: "Hora estimada de termino", value: endTime || "Por confirmar" }
  ];
}

function formatMoney(amount, currency = "CLP", { allowUndefined = false } = {}) {
  const value = Number(amount);
  if ((!Number.isFinite(value) || value <= 0) && allowUndefined) {
    return "Por definir";
  }

  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currency || "CLP",
      maximumFractionDigits: 0
    }).format(Number.isFinite(value) ? value : 0);
  } catch {
    return `${currency || "CLP"} ${Number.isFinite(value) ? value : 0}`;
  }
}

function calculateArtistPayAmount(amount) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return 0;
  return Math.max(0, Math.floor(numericAmount * 0.9));
}

function paymentStatusLabel(status) {
  const labels = {
    pending: "Pendiente",
    partial: "Parcial",
    paid: "Pagado",
    waived: "Sin cobro"
  };
  return labels[status] || String(status || "Pendiente");
}

function normalizePdfText(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function clampText(doc, value, {
  width,
  height,
  font = "Helvetica",
  fontSize = 10,
  lineGap = 2,
  maxChars = 320
} = {}) {
  let text = normalizePdfText(value);
  if (!text) return "";
  if (text.length > maxChars) {
    text = `${text.slice(0, maxChars).trim()}…`;
  }

  doc.font(font).fontSize(fontSize);
  if (doc.heightOfString(text, { width, lineGap }) <= height) {
    return text;
  }

  const words = text.split(" ");
  while (words.length > 1) {
    words.pop();
    const candidate = `${words.join(" ").trim()}…`;
    if (doc.heightOfString(candidate, { width, lineGap }) <= height) {
      return candidate;
    }
  }

  for (let length = Math.min(text.length, 72); length > 1; length -= 1) {
    const candidate = `${text.slice(0, length).trim()}…`;
    if (doc.heightOfString(candidate, { width, lineGap }) <= height) {
      return candidate;
    }
  }

  return "…";
}

function contentWidth(doc) {
  return doc.page.width - PAGE_MARGIN * 2;
}

function defaultContractDescription(event) {
  const pieces = [
    `Sophora coordina la presentacion de ${event.title || "musica en vivo"} con el artista indicado en este documento.`,
    event.venue ? `La presentacion se realizara en ${event.venue}.` : null,
    buildEstimatedTimeSentence(event)
  ].filter(Boolean);
  return pieces.join(" ");
}

function defaultQuoteDescription(artist, event) {
  const pieces = [
    `Cotizacion por la presentacion en vivo de ${artistDisplayName(artist)} gestionada por Sophora.`,
    event.venue ? `Lugar de entrega del servicio: ${event.venue}.` : null,
    buildEstimatedTimeSentence(event)
  ].filter(Boolean);
  return pieces.join(" ");
}

function collectPdfBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

function drawPageChrome(doc, { documentLabel, title }) {
  const { width, height } = doc.page;

  doc.save();
  doc.rect(0, 0, width, height).fill(COLORS.paper);
  doc.rect(0, 0, width, HEADER_HEIGHT).fill(COLORS.ink);
  doc.rect(PAGE_MARGIN, HEADER_HEIGHT - 5, 82, 3).fill(COLORS.terracotta);

  if (fs.existsSync(LOGO_PATH)) {
    try {
      doc.image(LOGO_PATH, PAGE_MARGIN, 26, {
        fit: [188, 40],
        align: "left",
        valign: "center"
      });
    } catch {
      // Ignore logo rendering failures and keep the document readable.
    }
  }

  doc.fillColor(COLORS.paper)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(documentLabel, width - PAGE_MARGIN - 170, 28, {
      width: 170,
      align: "right"
    });

  doc.fillColor(COLORS.text)
    .font("Helvetica-Bold")
    .fontSize(18.5)
    .text(title, PAGE_MARGIN, HEADER_CONTENT_TOP, {
      width: width - PAGE_MARGIN * 2
    });

  const footerY = height - PAGE_MARGIN - 16;
  doc.moveTo(PAGE_MARGIN, footerY).lineTo(width - PAGE_MARGIN, footerY).lineWidth(1).strokeColor(COLORS.border).stroke();
  doc.fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(8)
    .text("Sophora | Music Agency", PAGE_MARGIN, footerY + 6, {
      width: width - PAGE_MARGIN * 2,
      align: "left",
      lineBreak: false
    });
  doc.restore();

  doc.x = PAGE_MARGIN;
  doc.y = HEADER_CONTENT_TOP + 28;
}

function addStyledPage(doc, meta) {
  doc.addPage();
  drawPageChrome(doc, meta);
}

function createDocument(meta) {
  const doc = new PDFDocument({
    size: "A4",
    margin: PAGE_MARGIN,
    autoFirstPage: false,
    compress: false,
    info: {
      Title: meta.title,
      Author: "Sophora",
      Subject: meta.documentLabel,
      Creator: "Sophora",
      Producer: "Sophora"
    }
  });

  doc._sophoraMeta = meta;
  addStyledPage(doc, meta);
  return doc;
}

function ensureSpace(doc, neededHeight) {
  const bottomLimit = doc.page.height - PAGE_MARGIN - FOOTER_HEIGHT - 8;
  if (doc.y + neededHeight > bottomLimit) {
    addStyledPage(doc, doc._sophoraMeta);
  }
}

function drawSinglePageLead(doc, subtitle, referenceLine) {
  const width = contentWidth(doc);
  const top = doc.y;
  const subtitleHeight = 28;
  const subtitleText = clampText(doc, subtitle, {
    width,
    height: subtitleHeight,
    fontSize: 10,
    lineGap: 2,
    maxChars: 240
  });

  doc.fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(10)
    .text(subtitleText, PAGE_MARGIN, top, {
      width,
      lineGap: 2
    });

  const referenceY = top + subtitleHeight + 6;
  const referenceText = clampText(doc, referenceLine, {
    width,
    height: 14,
    font: "Helvetica-Bold",
    fontSize: 8.5,
    lineGap: 1,
    maxChars: 180
  });
  doc.fillColor(COLORS.green)
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text(referenceText, PAGE_MARGIN, referenceY, {
      width
    });

  return referenceY + 20;
}

function drawCompactSectionTitle(doc, title, y) {
  doc.fillColor(COLORS.green)
    .font("Helvetica-Bold")
    .fontSize(11.5)
    .text(title, PAGE_MARGIN, y, {
      width: contentWidth(doc)
    });
  return y + 18;
}

function drawCompactInfoCell(doc, x, y, width, height, item) {
  const valueTop = y + 19;
  const valueHeight = Math.max(16, height - (valueTop - y) - 8);
  const valueText = clampText(doc, item.value, {
    width: width - 22,
    height: valueHeight,
    font: "Helvetica-Bold",
    fontSize: 10,
    lineGap: 1,
    maxChars: 120
  });

  doc.save();
  doc.roundedRect(x, y, width, height, 12)
    .fillAndStroke(COLORS.panel, COLORS.border);
  doc.fillColor(COLORS.muted)
    .font("Helvetica-Bold")
    .fontSize(7.2)
    .text(item.label.toUpperCase(), x + 11, y + 8, {
      width: width - 22
    });
  doc.fillColor(COLORS.text)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(valueText, x + 11, valueTop, {
      width: width - 22,
      lineGap: 1
    });
  doc.restore();
}

function drawCompactInfoGrid(doc, y, items, { columns = 2, rowHeight = 42 } = {}) {
  const width = contentWidth(doc);
  const columnWidth = (width - CARD_GAP * (columns - 1)) / columns;
  const rows = Math.ceil(items.length / columns);

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const item = items[row * columns + column];
      if (!item) continue;
      const x = PAGE_MARGIN + column * (columnWidth + CARD_GAP);
      const top = y + row * (rowHeight + 8);
      drawCompactInfoCell(doc, x, top, columnWidth, rowHeight, item);
    }
  }

  return y + rows * rowHeight + Math.max(0, rows - 1) * 8;
}

function drawCompactTextPanel(doc, { title, body, y, height = 64 }) {
  const titleY = drawCompactSectionTitle(doc, title, y);
  const panelTop = titleY;
  const width = contentWidth(doc);
  const bodyText = clampText(doc, body, {
    width: width - 24,
    height: height - 20,
    fontSize: 10,
    lineGap: 2,
    maxChars: 280
  });

  doc.save();
  doc.roundedRect(PAGE_MARGIN, panelTop, width, height, 14)
    .fillAndStroke(COLORS.softPanel, COLORS.border);
  doc.fillColor(COLORS.text)
    .font("Helvetica")
    .fontSize(10)
    .text(bodyText, PAGE_MARGIN + 12, panelTop + 10, {
      width: width - 24,
      lineGap: 2
    });
  doc.restore();

  return panelTop + height;
}

function drawCompactBulletPanel(doc, { title, items, y, height = 80 }) {
  const titleY = drawCompactSectionTitle(doc, title, y);
  const panelTop = titleY;
  const width = contentWidth(doc);

  doc.save();
  doc.roundedRect(PAGE_MARGIN, panelTop, width, height, 14)
    .fillAndStroke(COLORS.panel, COLORS.border);
  doc.restore();

  items.slice(0, 3).forEach((item, index) => {
    const lineTop = panelTop + 10 + index * 19;
    const text = clampText(doc, item, {
      width: width - 36,
      height: 14,
      fontSize: 9.5,
      lineGap: 1,
      maxChars: 150
    });
    doc.fillColor(COLORS.terracotta)
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .text(`${index + 1}.`, PAGE_MARGIN + 12, lineTop, { width: 14 });
    doc.fillColor(COLORS.text)
      .font("Helvetica")
      .fontSize(9.5)
      .text(text, PAGE_MARGIN + 26, lineTop, {
        width: width - 38,
        lineGap: 1
      });
  });

  return panelTop + height;
}

function drawCompactAmountBanner(doc, { y, label, amount, note }) {
  const width = contentWidth(doc);
  const height = 74;
  const noteText = clampText(doc, note, {
    width: width - 32,
    height: 16,
    fontSize: 8.8,
    lineGap: 1,
    maxChars: 140
  });

  doc.save();
  doc.roundedRect(PAGE_MARGIN, y, width, height, 16)
    .fillAndStroke(COLORS.green, COLORS.green);
  doc.fillColor(COLORS.paper)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(label.toUpperCase(), PAGE_MARGIN + 16, y + 12, {
      width: width - 32
    });
  doc.font("Helvetica-Bold")
    .fontSize(20)
    .text(amount, PAGE_MARGIN + 16, y + 26, {
      width: width - 32
    });
  doc.font("Helvetica")
    .fontSize(8.8)
    .text(noteText, PAGE_MARGIN + 16, y + 52, {
      width: width - 32
    });
  doc.restore();

  return y + height;
}

function drawCompactSignatureSection(doc, y, event) {
  const titleY = drawCompactSectionTitle(doc, "Firmas", y);
  const totalWidth = contentWidth(doc);
  const boxWidth = (totalWidth - CARD_GAP) / 2;
  const boxHeight = 108;
  const top = titleY;
  const leftX = PAGE_MARGIN;
  const rightX = PAGE_MARGIN + boxWidth + CARD_GAP;

  doc.save();
  doc.roundedRect(leftX, top, boxWidth, boxHeight, 14)
    .fillAndStroke(COLORS.panel, COLORS.border);
  doc.roundedRect(rightX, top, boxWidth, boxHeight, 14)
    .fillAndStroke(COLORS.panel, COLORS.border);

  doc.fillColor(COLORS.muted)
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("SOPHORA", leftX + 12, top + 10, { width: boxWidth - 24 });
  doc.fillColor(COLORS.text)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("Documento emitido por Sophora", leftX + 12, top + 22, {
      width: boxWidth - 24
    });
  doc.fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(8.8)
    .text("Respaldo del acuerdo registrado en Sophora.", leftX + 12, top + 42, {
      width: boxWidth - 24,
      lineGap: 1
    });

  doc.fillColor(COLORS.muted)
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("ARTISTA", rightX + 12, top + 10, { width: boxWidth - 24 });

  if (event.signedByName && event.signedAt) {
    doc.fillColor(COLORS.success)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("Firma digital registrada", rightX + 12, top + 22, {
        width: boxWidth - 24
      });
    drawSignatureStrokes(doc, event.signedSignatureStrokes, rightX + 12, top + 36, boxWidth - 24, 28);
    doc.fillColor(COLORS.text)
      .font("Helvetica-Oblique")
      .fontSize(15)
      .text(clampText(doc, event.signedByName, {
        width: boxWidth - 24,
        height: 18,
        font: "Helvetica-Oblique",
        fontSize: 15,
        maxChars: 48
      }), rightX + 12, top + 68, {
        width: boxWidth - 24
      });
    doc.fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(8.4)
      .text(clampText(doc, `Firmado el ${formatTimestamp(event.signedAt)}`, {
        width: boxWidth - 24,
        height: 14,
        fontSize: 8.4,
        maxChars: 70
      }), rightX + 12, top + 88, {
        width: boxWidth - 24
      });
  } else if (event.requireSignature) {
    doc.fillColor(COLORS.terracotta)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("Pendiente de firma", rightX + 12, top + 22, {
        width: boxWidth - 24
      });
    doc.strokeColor(COLORS.border)
      .moveTo(rightX + 12, top + 66)
      .lineTo(rightX + boxWidth - 12, top + 66)
      .stroke();
    doc.fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(8.8)
      .text("La firma del artista aparecera aqui.", rightX + 12, top + 76, {
        width: boxWidth - 24,
        lineGap: 1
      });
  } else {
    doc.fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(8.8)
      .text("Firma no requerida para este documento.", rightX + 12, top + 34, {
        width: boxWidth - 24,
        lineGap: 1
      });
  }

  doc.restore();
  return top + boxHeight;
}

function drawLead(doc, subtitle, referenceLine) {
  doc.fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(11)
    .text(subtitle, {
      width: doc.page.width - PAGE_MARGIN * 2,
      lineGap: 3
    });

  doc.moveDown(0.7);
  doc.fillColor(COLORS.green)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(referenceLine, {
      width: doc.page.width - PAGE_MARGIN * 2
    });
  doc.moveDown(1.1);
}

function drawSectionTitle(doc, title) {
  ensureSpace(doc, 28);
  doc.fillColor(COLORS.green)
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(title, {
      width: doc.page.width - PAGE_MARGIN * 2
    });
  doc.moveDown(0.45);
}

function drawInfoCard(doc, x, y, width, height, item) {
  doc.save();
  doc.roundedRect(x, y, width, height, 14)
    .fillAndStroke(COLORS.panel, COLORS.border);
  doc.fillColor(COLORS.muted)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(item.label.toUpperCase(), x + 14, y + 12, {
      width: width - 28
    });
  doc.fillColor(COLORS.text)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(item.value, x + 14, y + 28, {
      width: width - 28,
      lineGap: 2
    });
  doc.restore();
}

function drawInfoGrid(doc, items, columns = 2) {
  const usableWidth = doc.page.width - PAGE_MARGIN * 2;
  const columnGap = CARD_GAP;
  const columnWidth = (usableWidth - columnGap * (columns - 1)) / columns;

  for (let index = 0; index < items.length; index += columns) {
    const rowItems = items.slice(index, index + columns);
    const rowTop = doc.y;
    const rowHeight = Math.max(...rowItems.map((item) => {
      doc.font("Helvetica-Bold").fontSize(12);
      const valueHeight = doc.heightOfString(item.value, {
        width: columnWidth - 28,
        lineGap: 2
      });
      return Math.max(76, 42 + valueHeight);
    }));

    ensureSpace(doc, rowHeight + CARD_GAP);

    rowItems.forEach((item, columnIndex) => {
      const x = PAGE_MARGIN + columnIndex * (columnWidth + columnGap);
      drawInfoCard(doc, x, doc.y, columnWidth, rowHeight, item);
    });

    doc.y += rowHeight + CARD_GAP;
    if (doc.y < rowTop) {
      doc.y = rowTop + rowHeight + CARD_GAP;
    }
  }
}

function drawTextPanel(doc, title, body) {
  drawSectionTitle(doc, title);
  doc.font("Helvetica").fontSize(11);
  const textWidth = doc.page.width - PAGE_MARGIN * 2 - 36;
  const textHeight = doc.heightOfString(body, {
    width: textWidth,
    lineGap: 4
  });
  const panelHeight = Math.max(64, textHeight + 32);
  ensureSpace(doc, panelHeight + 14);
  doc.save();
  doc.roundedRect(PAGE_MARGIN, doc.y, doc.page.width - PAGE_MARGIN * 2, panelHeight, 14)
    .fillAndStroke(COLORS.softPanel, COLORS.border);
  doc.restore();
  const panelTop = doc.y;
  doc.fillColor(COLORS.text)
    .font("Helvetica")
    .fontSize(11)
    .text(body, PAGE_MARGIN + 18, panelTop + 16, {
      width: textWidth,
      lineGap: 4
    });
  doc.y = panelTop + panelHeight + 14;
}

function drawBulletList(doc, title, items) {
  drawSectionTitle(doc, title);
  items.forEach((item, index) => {
    ensureSpace(doc, 28);
    const marker = `${index + 1}.`;
    const top = doc.y;
    doc.fillColor(COLORS.terracotta)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(marker, PAGE_MARGIN, top, { width: 18 });
    doc.fillColor(COLORS.text)
      .font("Helvetica")
      .fontSize(11)
      .text(item, PAGE_MARGIN + 22, top, {
        width: doc.page.width - PAGE_MARGIN * 2 - 22,
        lineGap: 3
      });
    doc.moveDown(0.4);
  });
  doc.moveDown(0.8);
}

function drawAmountBanner(doc, { label, amount, note }) {
  ensureSpace(doc, 104);
  const width = doc.page.width - PAGE_MARGIN * 2;
  const top = doc.y;

  doc.save();
  doc.roundedRect(PAGE_MARGIN, top, width, 92, 18)
    .fillAndStroke(COLORS.green, COLORS.green);
  doc.fillColor(COLORS.paper)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(label.toUpperCase(), PAGE_MARGIN + 20, top + 16, { width: width - 40 });
  doc.font("Helvetica-Bold")
    .fontSize(24)
    .text(amount, PAGE_MARGIN + 20, top + 32, { width: width - 40 });
  doc.font("Helvetica")
    .fontSize(10)
    .text(note, PAGE_MARGIN + 20, top + 64, {
      width: width - 40
    });
  doc.restore();

  doc.y = top + 104;
}

function drawSignatureStrokes(doc, strokes, x, y, width, height) {
  if (!Array.isArray(strokes) || !strokes.length) return;
  doc.save();
  doc.rect(x, y, width, height).clip();
  doc.lineWidth(1.8).lineCap("round").lineJoin("round").strokeColor(COLORS.ink);
  strokes.forEach((stroke) => {
    if (!Array.isArray(stroke) || stroke.length < 2) return;
    const [firstPoint, ...rest] = stroke;
    doc.moveTo(x + firstPoint.x * width, y + firstPoint.y * height);
    rest.forEach((point) => {
      doc.lineTo(x + point.x * width, y + point.y * height);
    });
    doc.stroke();
  });
  doc.restore();
}

function drawSignatureSection(doc, event) {
  drawSectionTitle(doc, "Firmas");
  ensureSpace(doc, 148);

  const totalWidth = doc.page.width - PAGE_MARGIN * 2;
  const boxGap = CARD_GAP;
  const boxWidth = (totalWidth - boxGap) / 2;
  const boxHeight = 122;
  const top = doc.y;

  doc.save();
  doc.roundedRect(PAGE_MARGIN, top, boxWidth, boxHeight, 16)
    .fillAndStroke(COLORS.panel, COLORS.border);
  doc.roundedRect(PAGE_MARGIN + boxWidth + boxGap, top, boxWidth, boxHeight, 16)
    .fillAndStroke(COLORS.panel, COLORS.border);

  doc.fillColor(COLORS.muted)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("SOPHORA", PAGE_MARGIN + 16, top + 14, { width: boxWidth - 32 });
  doc.fillColor(COLORS.text)
    .font("Helvetica-Bold")
    .fontSize(13)
    .text("Documento emitido por Sophora", PAGE_MARGIN + 16, top + 30, {
      width: boxWidth - 32
    });
  doc.fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(10)
    .text("Respaldo del acuerdo registrado en el dashboard de Sophora.", PAGE_MARGIN + 16, top + 56, {
      width: boxWidth - 32,
      lineGap: 3
    });

  const rightX = PAGE_MARGIN + boxWidth + boxGap;
  doc.fillColor(COLORS.muted)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("ARTISTA", rightX + 16, top + 14, { width: boxWidth - 32 });

  if (event.signedByName && event.signedAt) {
    doc.fillColor(COLORS.success)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Firma digital registrada", rightX + 16, top + 30, {
        width: boxWidth - 32
      });
    drawSignatureStrokes(doc, event.signedSignatureStrokes, rightX + 16, top + 42, boxWidth - 32, 38);
    doc.fillColor(COLORS.text)
      .font("Helvetica-Oblique")
      .fontSize(18)
      .text(event.signedByName, rightX + 16, top + 84, {
        width: boxWidth - 32
      });
    doc.fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(10)
      .text(`Firmado el ${formatTimestamp(event.signedAt)}`, rightX + 16, top + 104, {
        width: boxWidth - 32
      });
  } else if (event.requireSignature) {
    doc.fillColor(COLORS.terracotta)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Pendiente de firma", rightX + 16, top + 30, {
        width: boxWidth - 32
      });
    doc.strokeColor(COLORS.border)
      .moveTo(rightX + 16, top + 82)
      .lineTo(rightX + boxWidth - 16, top + 82)
      .stroke();
    doc.fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(10)
      .text("La firma del artista aparecera aqui cuando quede registrada.", rightX + 16, top + 92, {
        width: boxWidth - 32
      });
  } else {
    doc.fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(10)
      .text("Firma no requerida para este documento.", rightX + 16, top + 40, {
        width: boxWidth - 32,
        lineGap: 3
      });
  }

  doc.restore();
  doc.y = top + boxHeight + 14;
}

function buildArtistContractBody(doc, artist, event) {
  const artistName = artistDisplayName(artist);
  const description = event.notes || defaultContractDescription(event);
  const artistPayLabel = formatMoney(
    event.artistPayAmount ?? calculateArtistPayAmount(event.paymentAmount),
    event.currency,
    { allowUndefined: true }
  );
  let y = drawSinglePageLead(
    doc,
    "Sophora emite este contrato como respaldo del acuerdo de presentacion artistica y, cuando corresponde, de la firma digital del artista.",
    `Emitido para ${artistName} | Generado ${formatTimestamp(event.documentGeneratedAt || event.updatedAt || event.createdAt)}`
  );

  y = drawCompactSectionTitle(doc, "Resumen del acuerdo", y);
  y = drawCompactInfoGrid(doc, y, [
    { label: "Artista", value: artistName },
    { label: "Cliente", value: event.clientName || "Por confirmar" },
    { label: "Presentacion", value: event.title || "Gig" },
    { label: "Fechas", value: formatSelectedDates(event) },
    { label: "Lugar", value: event.venue || "Por confirmar" },
    ...buildEstimatedTimeInfoItems(event),
    { label: "Pago al artista", value: artistPayLabel },
    { label: "Estado de pago", value: paymentStatusLabel(event.paymentStatus) }
  ], { columns: 2, rowHeight: 40 });

  y += 12;
  y = drawCompactTextPanel(doc, {
    title: "Servicio acordado",
    body: description,
    y,
    height: 62
  });

  y += 12;
  y = drawCompactBulletPanel(doc, {
    title: "Condiciones principales",
    y,
    height: 72,
    items: [
      "Sophora registra el gig y coordina las condiciones comerciales indicadas en este contrato.",
      "El artista se compromete a cumplir la fecha, lugar y horario indicados salvo cambios confirmados por Sophora.",
      "Cualquier ajuste tecnico, logistico o de alcance debe quedar validado por Sophora antes de la presentacion."
    ]
  });

  y += 12;
  drawCompactSignatureSection(doc, y, event);
}

function buildClientQuoteBody(doc, artist, event) {
  const artistName = artistDisplayName(artist);
  const description = event.notes || defaultQuoteDescription(artist, event);
  const amountLabel = formatMoney(event.paymentAmount, event.currency, { allowUndefined: true });
  let y = drawSinglePageLead(
    doc,
    "Cotizacion emitida por Sophora para la coordinacion y entrega del servicio artistico descrito en este documento.",
    `Dirigido a ${event.clientName || "Cliente"} | Emitido ${formatTimestamp(event.clientDocumentGeneratedAt || event.updatedAt || event.createdAt)}`
  );

  y = drawCompactSectionTitle(doc, "Resumen del servicio", y);
  y = drawCompactInfoGrid(doc, y, [
    { label: "Cliente", value: event.clientName || "Cliente" },
    { label: "Proveedor", value: "Sophora" },
    { label: "Artista", value: artistName },
    { label: "Presentacion", value: event.title || "Gig" },
    { label: "Fechas", value: formatSelectedDates(event) },
    { label: "Lugar", value: event.venue || "Por confirmar" },
    ...buildEstimatedTimeInfoItems(event)
  ], { columns: 2, rowHeight: 40 });

  y += 12;
  y = drawCompactTextPanel(doc, {
    title: "Detalle del producto",
    body: description,
    y,
    height: 56
  });

  y += 12;
  y = drawCompactSectionTitle(doc, "Cotizacion", y);
  y = drawCompactAmountBanner(doc, {
    y,
    label: "Monto total a pagar a Sophora",
    amount: amountLabel,
    note: "Monto correspondiente al servicio coordinado por Sophora para la presentacion del artista indicado."
  });

  y += 12;
  drawCompactBulletPanel(doc, {
    title: "Condiciones comerciales",
    y,
    height: 72,
    items: [
      "La presente cotizacion resume el servicio artistico y operativo indicado en este documento.",
      "El pago debe realizarse a Sophora por el monto total aqui informado.",
      "La programacion final del servicio queda sujeta a confirmacion operativa y disponibilidad definitiva."
    ]
  });
}

export async function buildArtistContractPdf({ artist, event }) {
  const doc = createDocument({
    documentLabel: "DOCUMENTO PARA ARTISTA",
    title: "Contrato de presentacion artistica"
  });
  const bufferPromise = collectPdfBuffer(doc);
  buildArtistContractBody(doc, artist, event);
  doc.end();
  return bufferPromise;
}

export async function buildClientQuotePdf({ artist, event }) {
  const doc = createDocument({
    documentLabel: "COTIZACION PARA CLIENTE",
    title: "Cotizacion Sophora"
  });
  const bufferPromise = collectPdfBuffer(doc);
  buildClientQuoteBody(doc, artist, event);
  doc.end();
  return bufferPromise;
}
