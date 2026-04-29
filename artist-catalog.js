(() => {
  const artists = Array.isArray(window.SOPHORA_ARTISTS) ? window.SOPHORA_ARTISTS : [];
  const mode = document.body.dataset.catalogMode;
  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function artistUrl(artist) {
    return `/artistas/${encodeURIComponent(artist.slug)}/`;
  }

  function audioMarkup(artist) {
    if (!artist.audio) {
      return "";
    }

    return `
      <div class="catalog-audio">
        <audio controls preload="none">
          <source src="${escapeHtml(artist.audio)}" />
        </audio>
      </div>
    `;
  }

  function previewMediaMarkup(artist) {
    if (artist.previewVideo) {
      return `
        <video class="catalog-card-video" controls preload="metadata" poster="${escapeHtml(artist.image)}">
          <source src="${escapeHtml(artist.previewVideo)}" />
        </video>
      `;
    }

    return `
      <a class="catalog-card-image" href="${artistUrl(artist)}" aria-label="${escapeHtml(artist.name)}">
        <img src="${escapeHtml(artist.image)}" alt="${escapeHtml(artist.name)}" />
      </a>
    `;
  }

  function videoEmbed(video) {
    const url = String(video.url || "");
    if (!url) return "";
    if (url.startsWith("/")) {
      return `
        <video controls preload="metadata">
          <source src="${escapeHtml(url)}" />
        </video>
      `;
    }

    return `
      <a class="catalog-doc-link" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">
        ${escapeHtml(video.title || "Video")}
      </a>
    `;
  }

  function renderCatalog() {
    const grid = document.getElementById("artist-catalog-grid");
    if (!grid) return;

    grid.innerHTML = artists.map((artist) => `
      <article class="catalog-card">
        ${previewMediaMarkup(artist)}
        <div class="catalog-card-copy">
          <a href="${artistUrl(artist)}">
            <h2>${escapeHtml(artist.name)}</h2>
          </a>
          <p>${escapeHtml(artist.tagline)}</p>
          ${audioMarkup(artist)}
        </div>
      </article>
    `).join("");
    preventOverlappingPlayback(grid);
  }

  function preventOverlappingPlayback(scope = document) {
    const mediaItems = Array.from(scope.querySelectorAll("audio, video"));
    mediaItems.forEach((media) => {
      media.addEventListener("play", () => {
        mediaItems.forEach((otherMedia) => {
          if (otherMedia !== media) otherMedia.pause();
        });
      });
    });
  }

  function renderDetail() {
    const page = document.getElementById("artist-detail-page");
    if (!page) return;

    const slug = window.location.pathname.split("/").filter(Boolean)[1] || "";
    const artist = artists.find((item) => item.slug === slug);

    if (!artist) {
      page.innerHTML = `
        <section class="catalog-hero">
          <a class="catalog-logo-link" href="/" aria-label="Volver a Sophora">
            <img src="/assets/sophora_logo.png" alt="Sophora" />
          </a>
          <p>Artista no encontrado.</p>
          <nav class="catalog-actions">
            <a href="mailto:info@sophora.cl">info@sophora.cl</a>
            <a href="https://wa.me/56920474645" target="_blank" rel="noreferrer">+56 9 2047 4645</a>
            <a href="/">&lt;Volver al inicio</a>
            <a href="/artistas">&lt;Volver al catalogo</a>
          </nav>
        </section>
      `;
      return;
    }

    document.title = `${artist.name} | Sophora`;

    page.innerHTML = `
      <header class="artist-detail-hero">
        <div class="artist-detail-copy">
          <a class="catalog-logo-link" href="/" aria-label="Volver a Sophora">
            <img src="/assets/sophora_logo.png" alt="Sophora" />
          </a>
          <nav class="catalog-actions" aria-label="Acciones de artista">
            <a href="mailto:info@sophora.cl?subject=${encodeURIComponent(artist.name)}">info@sophora.cl</a>
            <a href="https://wa.me/56920474645" target="_blank" rel="noreferrer">+56 9 2047 4645</a>
            <a href="/">&lt;Volver al inicio</a>
            <a href="/artistas">&lt;Volver al catalogo</a>
          </nav>
          <h1>${escapeHtml(artist.name)}</h1>
          <p>${escapeHtml(artist.tagline)}</p>
          ${audioMarkup(artist)}
        </div>
        <figure class="artist-detail-main-image">
          <img src="${escapeHtml(artist.image)}" alt="${escapeHtml(artist.name)}" />
        </figure>
      </header>

      <section class="artist-media-section" aria-label="Media de ${escapeHtml(artist.name)}">
        ${artist.photos?.length ? `
          <div class="artist-media-block">
            <h2>Fotos</h2>
            <div class="artist-photo-wall">
              ${artist.photos.map((photo) => `
                <img src="${escapeHtml(photo)}" alt="${escapeHtml(artist.name)}" />
              `).join("")}
            </div>
          </div>
        ` : ""}

        ${artist.videos?.length ? `
          <div class="artist-media-block">
            <h2>Video</h2>
            <div class="artist-video-wall">
              ${artist.videos.map(videoEmbed).join("")}
            </div>
          </div>
        ` : ""}

        ${artist.documents?.length ? `
          <div class="artist-media-block">
            <h2>Material</h2>
            <div class="artist-doc-grid">
              ${artist.documents.map((doc) => `
                <a class="catalog-doc-link" href="${escapeHtml(doc.url)}" target="_blank" rel="noreferrer">
                  ${escapeHtml(doc.title)}
                </a>
              `).join("")}
            </div>
          </div>
        ` : ""}
      </section>
    `;
    preventOverlappingPlayback(page);
  }

  if (mode === "list") renderCatalog();
  if (mode === "detail") renderDetail();
})();
