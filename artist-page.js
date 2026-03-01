(() => {
  const B = window.SophoraBackend;
  if (!B) return;

  let artist = null;

  function getSlugFromPath() {
    const parts = window.location.pathname.split("/").filter(Boolean);
    return parts[1] || "";
  }

  function render() {
    if (!artist) return;

    const name = B.translateContent(artist.displayName);
    const bio = B.translateContent(artist.shortBio);
    const about = B.translateContent(artist.about);
    const showDetails = B.translateContent(artist.showDetails);
    const heroSlot = document.getElementById("artist-hero-slot");
    const sectionSlot = document.getElementById("artist-sections");
    const headerTitle = document.getElementById("artist-header-title");
    const bookLink = document.getElementById("artist-book-link");
    const heroImageUrl = artist.heroImageUrl || artist.cardImageUrl || "";
    const showHeroImage = artist.pageSections.photos && Boolean(heroImageUrl);
    const galleryPhotos = [];
    const seenPhotoUrls = new Set();

    (artist.photos || []).forEach((photo) => {
      const url = String(photo?.url || "").trim();
      if (!url || seenPhotoUrls.has(url) || url === heroImageUrl) return;
      seenPhotoUrls.add(url);
      galleryPhotos.push(photo);
    });

    document.title = `${name} | Sophora`;
    headerTitle.textContent = name;
    bookLink.href = artist.bookingUrl;
    bookLink.onclick = () => {
      localStorage.setItem("sophora_artist", name);
    };

    heroSlot.classList.toggle("artist-hero-media--text-only", !showHeroImage);

    heroSlot.innerHTML = `
      <div>
        <p class="artist-subtitle">${B.escapeHtml(bio)}</p>
        ${artist.pageSections.audio && artist.cardAudioUrl ? `
          <div class="section" style="padding-top:18px;">
            <audio controls preload="none">
              <source src="${B.escapeHtml(artist.cardAudioUrl)}" />
            </audio>
          </div>
        ` : ""}
      </div>
      ${showHeroImage ? `
        <div>
          <img class="artist-hero-image" src="${B.escapeHtml(heroImageUrl)}" alt="${B.escapeHtml(name)}" />
        </div>
      ` : ""}
    `;

    const sections = [];

    if (artist.pageSections.about && about) {
      sections.push(`
        <article class="artist-section-card">
          <h2>${B.escapeHtml(B.t("artist_about_heading"))}</h2>
          <p>${B.escapeHtml(about)}</p>
        </article>
      `);
    }

    if (artist.pageSections.showDetails && showDetails) {
      sections.push(`
        <article class="artist-section-card">
          <h2>${B.escapeHtml(B.t("artist_show_heading"))}</h2>
          <p>${B.escapeHtml(showDetails)}</p>
        </article>
      `);
    }

    if (artist.pageSections.videos && artist.videos.length) {
      sections.push(`
        <article class="artist-section-card">
          <div class="artist-video-grid">
            ${artist.videos.map((video) => B.renderVideoEmbed(video.url, B.translateContent(video.title) || name)).join("")}
          </div>
        </article>
      `);
    }

    if (artist.pageSections.photos && galleryPhotos.length) {
      sections.push(`
        <article class="artist-section-card">
          <div class="artist-photo-grid">
            ${galleryPhotos.map((photo) => `
              <img src="${B.escapeHtml(photo.url)}" alt="${B.escapeHtml(B.translateContent(photo.alt) || name)}" />
            `).join("")}
          </div>
        </article>
      `);
    }

    if (artist.pageSections.technicalRider && artist.technicalRiderPath) {
      sections.push(`
        <article class="artist-section-card">
          <h2>${B.escapeHtml(B.t("artist_rider_heading"))}</h2>
          <a class="btn outline" href="${B.escapeHtml(artist.technicalRiderPath)}" target="_blank" rel="noreferrer">${B.escapeHtml(B.t("technical_rider"))}</a>
        </article>
      `);
    }

    sectionSlot.innerHTML = sections.join("");
  }

  async function init() {
    const slug = getSlugFromPath();
    if (!slug) return;

    try {
      const payload = await B.api(`/api/public/artists/${encodeURIComponent(slug)}`, { skipCsrf: true });
      artist = payload.artist;
      render();
    } catch (error) {
      const slot = document.getElementById("artist-page-content");
      slot.innerHTML = `<section class="backend-card"><p class="backend-status error active">${B.escapeHtml(error.message)}</p></section>`;
    }
  }

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("sophora:backend-language-change", render);
})();
