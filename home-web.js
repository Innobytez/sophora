const galleryItems = [
  {
    title: "Artistas en rotacion",
    src: "artists/carmeners/assets/the-carmeners-jpg.webp"
  },
  {
    title: "Musica en vivo para eventos",
    src: "artists/carmeners/assets/the-carmeners-logo.jpeg"
  },
  {
    title: "Seleccionado para el espacio",
    src: "artists/alexander-roberts/assets/alexander-roberts-casual-headshot.jpg"
  },
  {
    title: "Artistas Sophora",
    src: "assets/artist-placeholder.svg"
  }
];

const stage = document.querySelector(".web-home");
const lowerScroll = document.querySelector(".lower-scroll");
const originalLowerBands = Array.from(document.querySelectorAll(".lower-stage .home-band"));
const image = document.getElementById("gallery-image");
const whatsappContact = document.querySelector("[data-whatsapp-contact]");
const whatsappLabel = document.querySelector("[data-whatsapp-label]");
const desktopQuery = window.matchMedia("(min-width: 761px)");
const MAX_SNAP_INDEX = 1;
const LOOP_PANEL_COUNT = 61;
const LOOP_CENTER_SLOT = Math.floor(LOOP_PANEL_COUNT / 2);
const SCROLL_EASE = 0.18;
const SNAP_MAGNET = 0.085;
const WHEEL_INTENT_THRESHOLD = 82;
const WHEEL_LOCK_MS = 520;

let activeGalleryIndex = 0;
let snapIndex = 0;
let touchStartY = 0;
let wheelIntent = 0;
let wheelResetTimer = 0;
let lastWheelSnapAt = 0;
let renderedLowerBands = originalLowerBands.slice();
let currentLoopSlot = LOOP_CENTER_SLOT;
let targetLoopSlot = LOOP_CENTER_SLOT;
let lowerScrollFrame = 0;

function prepareLoopPanels() {
  if (!lowerScroll || originalLowerBands.length !== 2 || lowerScroll.dataset.loopReady) return;

  originalLowerBands.forEach((band, index) => {
    band.dataset.snapPanel = String(index);
  });

  const fragment = document.createDocumentFragment();
  for (let slot = 0; slot < LOOP_PANEL_COUNT; slot += 1) {
    const panelIndex = slot % originalLowerBands.length;
    const useOriginal =
      slot === LOOP_CENTER_SLOT ||
      slot === LOOP_CENTER_SLOT + 1;
    const panel = useOriginal
      ? originalLowerBands[panelIndex]
      : originalLowerBands[panelIndex].cloneNode(true);

    panel.dataset.snapPanel = String(panelIndex);
    panel.dataset.loopSlot = String(slot);

    if (!useOriginal) {
      panel.dataset.loopClone = "true";
      panel.setAttribute("aria-hidden", "true");
      panel.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
      panel.querySelectorAll("a, button, input, select, textarea").forEach((node) => {
        node.setAttribute("tabindex", "-1");
      });
    }

    fragment.appendChild(panel);
  }

  lowerScroll.replaceChildren(fragment);
  renderedLowerBands = Array.from(lowerScroll.querySelectorAll(".home-band"));
  currentLoopSlot = LOOP_CENTER_SLOT;
  targetLoopSlot = LOOP_CENTER_SLOT;
  lowerScroll.dataset.loopReady = "true";
}

function fromCodes(codes) {
  return String.fromCharCode(...codes);
}

function hydrateWhatsappContact() {
  if (!whatsappContact) return;
  const display = fromCodes([43, 53, 54, 32, 57, 32, 50, 48, 52, 55, 32, 52, 54, 52, 53]);
  const waNumber = fromCodes([53, 54, 57, 50, 48, 52, 55, 52, 54, 52, 53]);

  whatsappContact.href = `https://wa.me/${waNumber}`;
  whatsappContact.target = "_blank";
  whatsappContact.rel = "noreferrer";
  whatsappContact.setAttribute("aria-label", `Enviar WhatsApp a ${display}`);
  if (whatsappLabel) whatsappLabel.textContent = display;
}

function textFitTargets() {
  return Array.from(document.querySelectorAll(".brand-copy, .service-card, .collaborator-copy, .collaborator-mark, .contact-action"));
}

function canUseSnapLayout() {
  if (!desktopQuery.matches) return false;

  const measuredBands = [
    ...Array.from(document.querySelectorAll(".web-home > .home-band")),
    ...originalLowerBands
  ];

  return measuredBands.every((band) => {
    const inner = band.querySelector(".home-band-inner");
    if (!inner) return true;
    return inner.scrollHeight <= band.clientHeight + 1 && inner.scrollWidth <= band.clientWidth + 1;
  });
}

function shrinkTextToFit() {
  textFitTargets().forEach((container) => {
    const textNodes = container.matches(".service-card")
      ? Array.from(container.querySelectorAll("h2, p, a"))
      : [container];

    textNodes.forEach((node) => {
      node.style.fontSize = "";
    });

    for (let step = 0; step < 10; step += 1) {
      const isOverflowing =
        container.scrollHeight > container.clientHeight + 1 ||
        container.scrollWidth > container.clientWidth + 1;

      if (!isOverflowing) break;

      textNodes.forEach((node) => {
        const currentSize = Number.parseFloat(window.getComputedStyle(node).fontSize);
        node.style.fontSize = `${Math.max(10, currentSize * 0.94)}px`;
      });
    }
  });
}

function sizeGalleryImage() {
  if (!image || !image.complete || !image.naturalWidth || !image.naturalHeight) return;
  const frame = image.closest(".gallery-card");
  if (!frame) return;

  const slot = frame.parentElement?.getBoundingClientRect();
  const maxWidth = Math.min(slot?.width || 560, 560);
  const minHeight = desktopQuery.matches ? 220 : 210;
  const preferredHeight = window.innerHeight * (desktopQuery.matches ? 0.31 : 0.42);
  const maxHeight = Math.max(minHeight, Math.min(preferredHeight, desktopQuery.matches ? 300 : 280));
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const maxRatio = maxWidth / maxHeight;

  let frameWidth = maxWidth;
  let frameHeight = maxWidth / imageRatio;

  if (imageRatio < maxRatio) {
    frameHeight = maxHeight;
    frameWidth = maxHeight * imageRatio;
  }

  frame.style.width = `${Math.round(frameWidth)}px`;
  frame.style.height = `${Math.round(frameHeight)}px`;
  if (!document.body.classList.contains("home-snap-ready")) {
    applySnapPosition();
  }
}

function showGalleryItem(index) {
  const item = galleryItems[index];
  if (!image || !item) return;
  image.src = item.src;
}

function loopPositionForPanel(index) {
  return lowerScroll?.dataset.loopReady ? LOOP_CENTER_SLOT + index : index;
}

function setLowerPosition(position) {
  if (!lowerScroll) return;
  lowerScroll.style.transform = `translate3d(0, -${position * 50}vh, 0)`;
}

function updatePanelFade() {
  renderedLowerBands.forEach((band) => {
    const slot = Number.parseFloat(band.dataset.loopSlot || "0");
    const distance = Math.abs(slot - currentLoopSlot);
    band.style.opacity = String(Math.max(0.52, 1 - distance * 0.38));
  });
}

function normalizeLoopPosition() {
  if (!lowerScroll?.dataset.loopReady) return;
  if (targetLoopSlot > 8 && targetLoopSlot < LOOP_PANEL_COUNT - 8) return;

  const shift = Math.round((targetLoopSlot - LOOP_CENTER_SLOT) / 2) * 2;
  if (!shift) return;
  targetLoopSlot -= shift;
  currentLoopSlot -= shift;
}

function animateLowerScroll() {
  if (!canUseSnapLayout()) {
    lowerScrollFrame = 0;
    return;
  }

  normalizeLoopPosition();
  const nearestPanel = Math.round(targetLoopSlot);
  targetLoopSlot += (nearestPanel - targetLoopSlot) * SNAP_MAGNET;
  const delta = targetLoopSlot - currentLoopSlot;
  if (Math.abs(delta) < 0.001) {
    currentLoopSlot = targetLoopSlot;
    setLowerPosition(currentLoopSlot);
    updatePanelFade();
    lowerScrollFrame = 0;
    return;
  }

  currentLoopSlot += delta * SCROLL_EASE;
  setLowerPosition(currentLoopSlot);
  updatePanelFade();
  lowerScrollFrame = window.requestAnimationFrame(animateLowerScroll);
}

function requestLowerScrollFrame() {
  if (!lowerScrollFrame) {
    lowerScrollFrame = window.requestAnimationFrame(animateLowerScroll);
  }
}

function setLowerTarget(position, immediate = false) {
  targetLoopSlot = position;
  if (immediate) {
    currentLoopSlot = targetLoopSlot;
    normalizeLoopPosition();
    setLowerPosition(currentLoopSlot);
    updatePanelFade();
    return;
  }
  requestLowerScrollFrame();
}

function activePanelFromPosition(position) {
  const rounded = Math.round(position);
  return ((rounded % 2) + 2) % 2;
}

function applySnapPosition() {
  if (!stage) return;
  shrinkTextToFit();

  if (!canUseSnapLayout()) {
    document.body.classList.remove("home-snap-ready");
    stage.style.transform = "";
    if (lowerScroll) lowerScroll.style.transform = "";
    if (lowerScrollFrame) {
      window.cancelAnimationFrame(lowerScrollFrame);
      lowerScrollFrame = 0;
    }
    renderedLowerBands.forEach((band) => {
      band.style.opacity = "";
    });
    return;
  }

  document.body.classList.add("home-snap-ready");
  snapIndex = Math.max(0, Math.min(MAX_SNAP_INDEX, snapIndex));
  stage.style.transform = "";
  setLowerTarget(loopPositionForPanel(snapIndex), true);
}

function snapTo(index) {
  if (!canUseSnapLayout()) return;
  const nextIndex = Math.max(0, Math.min(MAX_SNAP_INDEX, index));

  snapIndex = nextIndex;
  setLowerTarget(loopPositionForPanel(snapIndex));
}

function flowScroll(deltaY) {
  if (!canUseSnapLayout() || deltaY === 0) return;
  const pixelsPerPanel = Math.max(230, window.innerHeight * 0.42);
  const nextTarget = targetLoopSlot + deltaY / pixelsPerPanel;

  setLowerTarget(nextTarget);
  snapIndex = activePanelFromPosition(nextTarget);
}

function normalizedWheelDelta(event) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
  return event.deltaY;
}

function handleWheel(event) {
  if (!canUseSnapLayout()) return;
  event.preventDefault();

  const deltaY = normalizedWheelDelta(event);
  const now = performance.now();

  window.clearTimeout(wheelResetTimer);
  wheelResetTimer = window.setTimeout(() => {
    wheelIntent = 0;
  }, 180);

  if (now - lastWheelSnapAt < WHEEL_LOCK_MS) return;

  wheelIntent += Math.max(-90, Math.min(90, deltaY));
  if (Math.abs(wheelIntent) < WHEEL_INTENT_THRESHOLD) return;

  const direction = Math.sign(wheelIntent);
  wheelIntent = 0;
  lastWheelSnapAt = now;
  snapTo(snapIndex + direction);
}

function handleKeydown(event) {
  if (!canUseSnapLayout()) return;

  const nextKeys = new Set(["ArrowDown", "PageDown", "Space"]);
  const previousKeys = new Set(["ArrowUp", "PageUp"]);

  if (nextKeys.has(event.code)) {
    event.preventDefault();
    flowScroll(window.innerHeight * 0.62);
  } else if (previousKeys.has(event.code)) {
    event.preventDefault();
    flowScroll(-window.innerHeight * 0.62);
  } else if (event.code === "Home") {
    event.preventDefault();
    snapTo(0);
  } else if (event.code === "End") {
    event.preventDefault();
    snapTo(MAX_SNAP_INDEX);
  }
}

function handleTouchStart(event) {
  touchStartY = event.touches[0]?.clientY || 0;
}

function handleTouchEnd(event) {
  if (!canUseSnapLayout()) return;
  const touchEndY = event.changedTouches[0]?.clientY || touchStartY;
  const delta = touchStartY - touchEndY;
  if (Math.abs(delta) < 36) return;
  flowScroll(delta * 1.4);
}

document.querySelectorAll("[data-snap-target]").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (!canUseSnapLayout()) return;
    event.preventDefault();
    snapTo(Number(link.dataset.snapTarget || 0));
  });
});

showGalleryItem(activeGalleryIndex);
hydrateWhatsappContact();
prepareLoopPanels();
applySnapPosition();

image?.addEventListener("load", sizeGalleryImage);
requestAnimationFrame(() => {
  sizeGalleryImage();
  applySnapPosition();
});

window.setInterval(() => {
  activeGalleryIndex = (activeGalleryIndex + 1) % galleryItems.length;
  showGalleryItem(activeGalleryIndex);
}, 3000);

window.addEventListener("wheel", handleWheel, { passive: false });
window.addEventListener("keydown", handleKeydown);
window.addEventListener("touchstart", handleTouchStart, { passive: true });
window.addEventListener("touchend", handleTouchEnd, { passive: true });
window.addEventListener("resize", () => {
  sizeGalleryImage();
  applySnapPosition();
});
desktopQuery.addEventListener("change", applySnapPosition);
