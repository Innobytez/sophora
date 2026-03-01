(() => {
  const B = window.SophoraBackend;
  if (!B) return;

  let artists = [];
  const STORAGE_ARTIST = "sophora_artist";

  function orderArtists(items) {
    const params = new URLSearchParams(window.location.search);
    const pin = params.get("pin");
    if (!pin) return items.slice();
    const pinned = items.find((artist) => artist.slug === pin);
    const others = items.filter((artist) => artist.slug !== pin);
    return pinned ? [pinned, ...others] : items.slice();
  }

  function render() {
    const list = document.querySelector(".artist-list");
    if (!list) return;

    list.innerHTML = orderArtists(artists)
      .map((artist) => {
        const name = B.translateContent(artist.displayName);
        const bio = B.translateContent(artist.shortBio);
        const hasArtistPage = artist.publicDestination !== artist.bookingUrl;
        const showPhoto = artist.pageSections?.photos !== false && Boolean(artist.cardImageUrl);
        const showAudio = artist.pageSections?.audio !== false && Boolean(artist.cardAudioUrl);
        return `
          <article class="artist-card" data-artist="${B.escapeHtml(artist.slug)}">
            ${showPhoto ? `
              <a class="artist-link" href="${B.escapeHtml(artist.publicDestination)}" aria-label="${B.escapeHtml(name)}">
                <img src="${B.escapeHtml(artist.cardImageUrl)}" alt="${B.escapeHtml(name)}" />
              </a>
            ` : ""}
            <div class="artist-info">
              <div class="artist-header">
                <div class="artist-title-block">
                  <a class="artist-name-link" href="${B.escapeHtml(artist.publicDestination)}">
                    <h3>${B.escapeHtml(name)}</h3>
                  </a>
                  <div class="artist-meta-row">
                    <span class="artist-location-tag artist-location-tag--title">Santiago</span>
                  </div>
                </div>
                <div class="artist-actions">
                  <span class="artist-location-tag artist-location-tag--actions">Santiago</span>
                  ${hasArtistPage ? `<a class="btn outline" href="${B.escapeHtml(artist.publicDestination)}">${B.escapeHtml(B.t("view_artist_page"))}</a>` : ""}
                  <a class="btn outline book-btn" href="${B.escapeHtml(artist.bookingUrl)}" data-artist-name="${B.escapeHtml(name)}">${B.escapeHtml(B.t("book_artist"))}</a>
                </div>
              </div>
              <p>${B.escapeHtml(bio)}</p>
              ${showAudio ? `
                <div class="audio-block">
                  <audio controls preload="none">
                    <source src="${B.escapeHtml(artist.cardAudioUrl)}" />
                  </audio>
                </div>
              ` : ""}
            </div>
          </article>
        `;
      })
      .join("");

    list.querySelectorAll(".book-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const artistName = button.getAttribute("data-artist-name") || "";
        if (artistName) {
          localStorage.setItem(STORAGE_ARTIST, artistName);
        }
      });
    });
  }

  async function init() {
    const list = document.querySelector(".artist-list");
    if (!list) return;

    list.innerHTML = `<p class="backend-status active">${B.escapeHtml(B.t("loading"))}</p>`;

    try {
      const payload = await B.api("/api/public/artists", { skipCsrf: true });
      artists = payload.artists || [];
      render();
    } catch (error) {
      list.innerHTML = `<p class="backend-status error active">${B.escapeHtml(error.message)}</p>`;
    }
  }

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("sophora:backend-language-change", render);
})();
