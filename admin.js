(() => {
  const B = window.SophoraBackend;
  if (!B) return;

  const state = {
    artists: []
  };

  function createTranslationsFromInputs(esValue) {
    const value = String(esValue || "").trim();
    return {
      es: value,
      en: value
    };
  }

  function renderArtistItem(artist) {
    const name = B.translateContent(artist.displayName);
    const bio = B.translateContent(artist.shortBio);
    const badgeClass = artist.account ? "backend-pill success" : "backend-pill";
    const badgeLabel = artist.account ? B.t("account_connected") : B.t("account_missing");

    return `
      <article class="backend-artist-item" data-artist-id="${artist.id}">
        <div>
          <div class="backend-inline-actions">
            <strong>${B.escapeHtml(name)}</strong>
            <span class="${badgeClass}">${B.escapeHtml(badgeLabel)}</span>
            <span class="backend-pill ${artist.publicStatus === "published" ? "active" : ""}">${B.escapeHtml(artist.publicStatus)}</span>
          </div>
          <p>${B.escapeHtml(bio || artist.slug)}</p>
          <div class="backend-inline-actions">
            <a class="btn outline" href="/dashboard.html?artistId=${artist.id}">${B.escapeHtml(B.t("open_dashboard"))}</a>
            <a class="btn outline" href="${B.escapeHtml(artist.publicDestination)}" target="_blank" rel="noreferrer">${B.escapeHtml(B.t("open_public_page"))}</a>
            <button class="btn outline admin-delete-btn" type="button">${B.escapeHtml(B.t("delete_artist"))}</button>
          </div>
          ${artist.account ? `
            <small class="backend-hint">${B.escapeHtml(artist.account.username)} • ${B.escapeHtml(artist.account.email)}</small>
          ` : `
            <div class="content-divider" aria-hidden="true"></div>
            <form class="backend-form-grid admin-attach-form">
              <div class="backend-field">
                <label>${B.escapeHtml(B.t("account_email"))}</label>
                <input name="email" type="email" required />
              </div>
              <div class="backend-field">
                <label>${B.escapeHtml(B.t("account_username"))}</label>
                <input name="username" type="text" required />
              </div>
              <div class="backend-field full">
                <label>${B.escapeHtml(B.t("temp_password"))}</label>
                <input name="password" type="text" />
              </div>
              <div class="backend-inline-actions full">
                <button class="btn outline" type="submit">${B.escapeHtml(B.t("attach_account_title"))}</button>
              </div>
            </form>
          `}
        </div>
        <img src="${B.escapeHtml(artist.cardImageUrl || "/assets/artist-placeholder.svg")}" alt="${B.escapeHtml(name)}" style="width:120px;height:120px;object-fit:cover;border-radius:20px;border:1px solid rgba(255,255,255,0.12);" />
      </article>
    `;
  }

  function bindListActions() {
    document.querySelectorAll(".admin-delete-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const artistId = button.closest("[data-artist-id]")?.getAttribute("data-artist-id");
        if (!artistId || !window.confirm("Delete this artist and any linked account?")) return;
        try {
          await B.api(`/api/admin/artists/${artistId}`, { method: "DELETE" });
          await loadOverview(B.t("deleted"), "success");
        } catch (error) {
          B.setStatus(document.getElementById("admin-list-status"), error.message, "error");
        }
      });
    });

    document.querySelectorAll(".admin-attach-form").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const artistId = form.closest("[data-artist-id]")?.getAttribute("data-artist-id");
        const formData = new FormData(form);
        try {
          const payload = await B.api(`/api/admin/artists/${artistId}/account`, {
            method: "POST",
            body: {
              email: formData.get("email"),
              username: formData.get("username"),
              password: formData.get("password")
            }
          });
          const tempMessage = payload.generatedPassword ? ` Password: ${payload.generatedPassword}` : "";
          await loadOverview(`${B.t("created")}${tempMessage}`, "success");
        } catch (error) {
          B.setStatus(document.getElementById("admin-list-status"), error.message, "error");
        }
      });
    });
  }

  function renderList() {
    const list = document.getElementById("admin-artist-list");
    const status = document.getElementById("admin-list-status");
    if (!list) return;
    if (!state.artists.length) {
      list.innerHTML = "";
      B.setStatus(status, "No artists yet.", "info");
      return;
    }

    list.innerHTML = state.artists.map(renderArtistItem).join("");
    B.setStatus(status, "", "info");
    bindListActions();
  }

  async function loadOverview(message, tone) {
    const payload = await B.api("/api/admin/overview");
    B.state.user = payload.user;
    B.state.csrfToken = payload.csrfToken;
    state.artists = payload.artists || [];
    renderList();
    if (message) {
      B.setStatus(document.getElementById("admin-create-status"), message, tone || "success");
    }
  }

  async function init() {
    await B.bootstrapAuth();
    if (!B.requireUser({ role: "admin" })) return;

    document.getElementById("admin-logout-btn")?.addEventListener("click", () => {
      B.logout();
    });

    document.getElementById("admin-create-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = {
        slug: document.getElementById("admin-slug").value,
        displayName: createTranslationsFromInputs(document.getElementById("admin-display-name-es").value),
        shortBio: createTranslationsFromInputs(document.getElementById("admin-short-bio-es").value),
        publicStatus: document.getElementById("admin-public-status").value,
        pageMode: document.getElementById("admin-page-mode").value,
        email: document.getElementById("admin-account-email").value,
        username: document.getElementById("admin-account-username").value,
        password: document.getElementById("admin-temp-password").value
      };

      try {
        const response = await B.api("/api/admin/artists", {
          method: "POST",
          body: payload
        });
        event.currentTarget.reset();
        await loadOverview(
          response.generatedPassword
            ? `${B.t("created")} Password: ${response.generatedPassword}`
            : B.t("created"),
          "success"
        );
      } catch (error) {
        B.setStatus(document.getElementById("admin-create-status"), error.message, "error");
      }
    });

    try {
      await loadOverview();
    } catch (error) {
      B.setStatus(document.getElementById("admin-list-status"), error.message, "error");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
