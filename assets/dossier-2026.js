const SLIDES = [
  "/assets/dossier-slides/sophora-dossier-2026-01.webp",
  "/assets/dossier-slides/sophora-dossier-2026-02.webp",
  "/assets/dossier-slides/sophora-dossier-2026-03.webp",
  "/assets/dossier-slides/sophora-dossier-2026-04.webp",
  "/assets/dossier-slides/sophora-dossier-2026-05.webp"
];

const SLIDE_DURATION_MS = 8500;
const FADE_DURATION_MS = 180;

const stage = document.querySelector("[data-dossier-stage]");
const slide = document.querySelector("[data-dossier-slide]");
const status = document.querySelector("[data-dossier-status]");

let currentSlide = 0;
let slideTimer = null;
let isChanging = false;

function setStatus(message) {
  status.textContent = message;
}

function normalizeSlide(index) {
  if (index >= SLIDES.length) return 0;
  if (index < 0) return SLIDES.length - 1;
  return index;
}

function queueLoop() {
  window.clearTimeout(slideTimer);
  slideTimer = window.setTimeout(() => {
    showSlide(currentSlide + 1);
  }, SLIDE_DURATION_MS);
}

function preloadSlides() {
  return Promise.all(SLIDES.map((src) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = reject;
    image.src = src;
  })));
}

async function showSlide(index, options = {}) {
  if (isChanging) return;

  isChanging = true;
  const nextSlide = normalizeSlide(index);
  const shouldFade = options.fade !== false;

  if (shouldFade) {
    stage.classList.add("is-fading");
    await new Promise((resolve) => window.setTimeout(resolve, FADE_DURATION_MS));
  }

  currentSlide = nextSlide;
  slide.src = SLIDES[currentSlide];
  slide.alt = `Dossier Sophora, pagina ${currentSlide + 1} de ${SLIDES.length}`;
  stage.classList.remove("is-loading", "is-error", "is-fading");
  queueLoop();
  isChanging = false;
}

function advanceSlide() {
  showSlide(currentSlide + 1);
}

function handleKeydown(event) {
  if (event.key === "ArrowRight" || event.key === " " || event.key === "Enter") {
    event.preventDefault();
    advanceSlide();
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    showSlide(currentSlide - 1);
  }
}

async function boot() {
  try {
    setStatus("Cargando dossier...");
    await preloadSlides();
    await showSlide(0, { fade: false });
  } catch (error) {
    console.error(error);
    stage.classList.add("is-error");
    stage.classList.remove("is-loading", "is-fading");
    setStatus("No se pudo cargar el dossier.");
  }
}

stage.addEventListener("click", advanceSlide);
window.addEventListener("keydown", handleKeydown);

boot();
