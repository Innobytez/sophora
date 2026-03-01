(() => {
  const B = window.SophoraBackend;
  if (!B) return;

  const STORAGE_ARTIST = "sophora_artist";
  const state = {
    artists: [],
    slideIndex: 0,
    visibleCount: 1,
    autoRotateTimer: null,
    dragOffset: 0,
    dragStartX: 0,
    dragActive: false,
    suppressClick: false
  };

  const dom = {
    rotator: document.getElementById("home-rotator"),
    viewport: null,
    track: null
  };

  function stopAutoRotate() {
    if (state.autoRotateTimer) {
      window.clearInterval(state.autoRotateTimer);
      state.autoRotateTimer = null;
    }
  }

  function startAutoRotate() {
    stopAutoRotate();
    if (state.artists.length < 2) return;
    state.autoRotateTimer = window.setInterval(() => {
      stepCarousel(1);
    }, 3000);
  }

  function getVisibleCount() {
    return window.matchMedia("(min-width: 960px)").matches ? 2 : 1;
  }

  function getRenderedArtists() {
    if (!state.artists.length) return [];
    if (state.artists.length <= state.visibleCount) {
      return state.artists.slice();
    }

    const leading = state.artists.slice(-state.visibleCount);
    const trailing = state.artists.slice(0, state.visibleCount);
    return [...leading, ...state.artists, ...trailing];
  }

  function getSlideStep() {
    if (!dom.track) return 0;
    const cards = dom.track.querySelectorAll(".home-rotator-slide");
    if (!cards.length) return 0;
    if (cards.length === 1) {
      return cards[0].getBoundingClientRect().width;
    }
    const first = cards[0].getBoundingClientRect();
    const second = cards[1].getBoundingClientRect();
    return second.left - first.left;
  }

  function applyTrackPosition(animated = true) {
    if (!dom.track) return;
    const step = getSlideStep();
    dom.track.style.transition = animated && !state.dragActive
      ? "transform .48s cubic-bezier(.22, 1, .36, 1)"
      : "none";
    dom.track.style.transform = `translate3d(${-(state.slideIndex * step) + state.dragOffset}px, 0, 0)`;
  }

  function normalizeSlideIndex() {
    if (!dom.track) return;
    if (state.artists.length <= state.visibleCount) return;

    if (state.slideIndex >= state.artists.length + state.visibleCount) {
      state.slideIndex = state.visibleCount;
      applyTrackPosition(false);
    } else if (state.slideIndex < state.visibleCount) {
      state.slideIndex = state.artists.length + state.slideIndex;
      applyTrackPosition(false);
    }
  }

  function stepCarousel(direction) {
    if (!dom.track || state.artists.length <= 1) return;
    state.slideIndex += direction;
    state.dragOffset = 0;
    applyTrackPosition(true);
  }

  function handlePointerDown(event) {
    if (!dom.viewport || state.artists.length <= 1) return;
    state.dragActive = true;
    state.dragStartX = event.clientX;
    state.dragOffset = 0;
    dom.viewport.setPointerCapture?.(event.pointerId);
    stopAutoRotate();
    applyTrackPosition(false);
  }

  function handlePointerMove(event) {
    if (!state.dragActive) return;
    state.dragOffset = event.clientX - state.dragStartX;
    applyTrackPosition(false);
  }

  function finishDrag(event) {
    if (!state.dragActive) return;
    state.dragActive = false;
    const delta = state.dragOffset;
    const threshold = Math.max(48, getSlideStep() * 0.14);
    state.dragOffset = 0;
    dom.viewport?.releasePointerCapture?.(event.pointerId);

    if (delta <= -threshold) {
      state.suppressClick = true;
      stepCarousel(1);
    } else if (delta >= threshold) {
      state.suppressClick = true;
      stepCarousel(-1);
    } else {
      applyTrackPosition(true);
    }
    startAutoRotate();
  }

  function bindCarousel() {
    dom.viewport = dom.rotator.querySelector(".home-rotator-viewport");
    dom.track = dom.rotator.querySelector(".home-rotator-track");
    if (!dom.viewport || !dom.track) return;

    dom.track.addEventListener("transitionend", normalizeSlideIndex);
    dom.viewport.addEventListener("pointerdown", handlePointerDown);
    dom.viewport.addEventListener("pointermove", handlePointerMove);
    dom.viewport.addEventListener("pointerup", finishDrag);
    dom.viewport.addEventListener("pointercancel", finishDrag);
    dom.viewport.addEventListener("mouseenter", stopAutoRotate);
    dom.viewport.addEventListener("mouseleave", startAutoRotate);
  }

  function render() {
    if (!dom.rotator) return;
    if (!state.artists.length) {
      dom.rotator.innerHTML = `<p class="backend-status active">${B.escapeHtml(B.t("loading"))}</p>`;
      return;
    }

    state.visibleCount = Math.min(getVisibleCount(), Math.max(1, state.artists.length));
    const renderedArtists = getRenderedArtists();
    state.slideIndex = state.artists.length > state.visibleCount ? state.visibleCount : 0;
    state.dragOffset = 0;

    dom.rotator.innerHTML = `
      <div class="home-rotator-shell">
        <div class="home-rotator-viewport">
          <div class="home-rotator-track">
            ${renderedArtists.map((artist) => {
              const name = B.translateContent(artist.displayName);
              const imageUrl = artist.cardImageUrl || "/assets/artist-placeholder.svg";
              return `
                <a class="home-rotator-slide" href="${B.escapeHtml(artist.publicDestination)}" data-artist-name="${B.escapeHtml(name)}">
                  <div class="home-rotator-image-wrap">
                    <img src="${B.escapeHtml(imageUrl)}" alt="${B.escapeHtml(name)}" />
                  </div>
                  <div class="home-rotator-copy">
                    <h3>${B.escapeHtml(name)}</h3>
                  </div>
                </a>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    `;

    dom.rotator.querySelectorAll("[data-artist-name]").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (state.suppressClick) {
          event.preventDefault();
          state.suppressClick = false;
          return;
        }
        const artistName = link.getAttribute("data-artist-name");
        if (artistName) {
          window.localStorage.setItem(STORAGE_ARTIST, artistName);
        }
      });
    });

    bindCarousel();
    requestAnimationFrame(() => {
      applyTrackPosition(false);
    });
  }

  function rerenderOnResize() {
    if (!dom.rotator || !state.artists.length) return;
    const nextVisibleCount = Math.min(getVisibleCount(), Math.max(1, state.artists.length));
    if (nextVisibleCount !== state.visibleCount) {
      render();
      startAutoRotate();
      return;
    }
    applyTrackPosition(false);
  }

  async function init() {
    if (!dom.rotator) return;

    try {
      const payload = await B.api("/api/public/artists", { skipCsrf: true });
      state.artists = payload.artists || [];
      render();
      startAutoRotate();
    } catch (error) {
      dom.rotator.innerHTML = `<p class="backend-status error active">${B.escapeHtml(error.message)}</p>`;
    }
  }

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("sophora:backend-language-change", render);
  window.addEventListener("resize", rerenderOnResize);
  window.addEventListener("beforeunload", stopAutoRotate);
})();
