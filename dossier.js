import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/build/pdf.mjs";

const PDF_URL = "/assets/DossierSophora2026.pdf";
const PDF_WORKER_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/build/pdf.worker.mjs";
const SLIDE_DURATION_MS = 8500;
const FADE_DURATION_MS = 180;

const stage = document.querySelector("[data-dossier-stage]");
const canvas = document.querySelector("[data-dossier-canvas]");
const status = document.querySelector("[data-dossier-status]");
const context = canvas.getContext("2d", { alpha: false });

let pdfDocument = null;
let pageCount = 0;
let currentPage = 1;
let renderInProgress = false;
let slideTimer = null;
let resizeTimer = null;

pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;

function setStatus(message) {
  status.textContent = message;
}

function normalizePage(pageNumber) {
  if (pageNumber > pageCount) return 1;
  if (pageNumber < 1) return pageCount;
  return pageNumber;
}

function queueLoop() {
  window.clearTimeout(slideTimer);
  slideTimer = window.setTimeout(() => {
    showPage(currentPage + 1);
  }, SLIDE_DURATION_MS);
}

function getStageSize() {
  const bounds = stage.getBoundingClientRect();
  return {
    width: Math.max(1, bounds.width),
    height: Math.max(1, bounds.height)
  };
}

async function showPage(pageNumber, options = {}) {
  if (!pdfDocument || renderInProgress) return;

  renderInProgress = true;
  const nextPage = normalizePage(pageNumber);
  const shouldFade = options.fade !== false;

  if (shouldFade) {
    stage.classList.add("is-fading");
    await new Promise((resolve) => window.setTimeout(resolve, FADE_DURATION_MS));
  }

  try {
    const page = await pdfDocument.getPage(nextPage);
    const baseViewport = page.getViewport({ scale: 1 });
    const stageSize = getStageSize();
    const cssScale = Math.min(
      stageSize.width / baseViewport.width,
      stageSize.height / baseViewport.height
    );
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2.5);
    const renderViewport = page.getViewport({ scale: cssScale * pixelRatio });

    canvas.width = Math.floor(renderViewport.width);
    canvas.height = Math.floor(renderViewport.height);
    canvas.style.width = `${Math.floor(renderViewport.width / pixelRatio)}px`;
    canvas.style.height = `${Math.floor(renderViewport.height / pixelRatio)}px`;

    context.fillStyle = "#000";
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      viewport: renderViewport
    }).promise;

    currentPage = nextPage;
    canvas.setAttribute("aria-label", `Dossier Sophora, pagina ${currentPage} de ${pageCount}`);
    stage.classList.remove("is-loading", "is-error", "is-fading");
    queueLoop();
  } catch (error) {
    console.error(error);
    stage.classList.add("is-error");
    stage.classList.remove("is-loading", "is-fading");
    setStatus("No se pudo cargar el dossier.");
  } finally {
    renderInProgress = false;
  }
}

function advanceSlide() {
  showPage(currentPage + 1);
}

function handleKeydown(event) {
  if (event.key === "ArrowRight" || event.key === " " || event.key === "Enter") {
    event.preventDefault();
    advanceSlide();
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    showPage(currentPage - 1);
  }
}

function handleResize() {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    showPage(currentPage, { fade: false });
  }, 140);
}

async function boot() {
  try {
    setStatus("Cargando dossier...");
    const loadingTask = pdfjsLib.getDocument(PDF_URL);
    pdfDocument = await loadingTask.promise;
    pageCount = pdfDocument.numPages;
    await showPage(1, { fade: false });
  } catch (error) {
    console.error(error);
    stage.classList.add("is-error");
    stage.classList.remove("is-loading");
    setStatus("No se pudo cargar el dossier.");
  }
}

stage.addEventListener("click", advanceSlide);
window.addEventListener("keydown", handleKeydown);
window.addEventListener("resize", handleResize);
window.addEventListener("orientationchange", handleResize);

boot();
