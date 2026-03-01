(() => {
  const B = window.SophoraBackend;
  if (!B) return;

  function setAuthStatus(message, tone = "info") {
    const element = document.getElementById("auth-status") || document.getElementById("reset-status") || document.getElementById("verify-status");
    B.setStatus(element, message, tone);
  }

  function showQuickActions(user) {
    const quickActions = document.getElementById("auth-quick-actions");
    if (!quickActions || !user) return;
    quickActions.classList.remove("hidden");
  }

  function setActivePanel(name) {
    document.querySelectorAll(".backend-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.panel === name);
    });
    document.querySelectorAll(".backend-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === `auth-panel-${name}`);
    });
  }

  async function initAuthPage() {
    try {
      const payload = await B.bootstrapAuth();
      if (payload.user) {
        window.location.href = "/dashboard.html";
        return;
      }
    } catch {
      // Keep the auth page usable even if auth bootstrap fails.
    }

    document.querySelectorAll(".backend-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        setActivePanel(tab.dataset.panel);
      });
    });

    document.getElementById("auth-logout-btn")?.addEventListener("click", () => {
      B.logout();
    });

    document.getElementById("login-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      try {
        const payload = await B.api("/api/auth/login", {
          method: "POST",
          body: {
            identifier: form.get("identifier"),
            password: form.get("password")
          },
          skipCsrf: true
        });
        B.state.user = payload.user;
        B.state.csrfToken = payload.csrfToken;
        window.location.href = "/dashboard.html";
      } catch (error) {
        setAuthStatus(error.message, "error");
      }
    });

    document.getElementById("signup-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      try {
        await B.api("/api/auth/signup", {
          method: "POST",
          body: {
            username: form.get("username"),
            email: form.get("email"),
            password: form.get("password"),
            passwordConfirm: form.get("passwordConfirm")
          },
          skipCsrf: true
        });
        setAuthStatus(B.t("auth_success_verify"), "success");
        setActivePanel("login");
      } catch (error) {
        setAuthStatus(error.message, "error");
      }
    });

    document.getElementById("recovery-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      try {
        await B.api("/api/auth/forgot-account", {
          method: "POST",
          body: { email: form.get("email") },
          skipCsrf: true
        });
        setAuthStatus(B.t("auth_success_email"), "success");
      } catch (error) {
        setAuthStatus(error.message, "error");
      }
    });

    const oauthMessage = B.getQueryParam("oauth");
    if (oauthMessage === "not-linked") {
      setAuthStatus("Esa cuenta social aun no esta vinculada a un artista.", "error");
    } else if (oauthMessage === "logged-in") {
      setAuthStatus("Ingreso realizado correctamente.", "success");
    }
  }

  async function initResetPage() {
    const token = B.getQueryParam("token");
    const form = document.getElementById("reset-form");
    if (!token || !form) return;

    try {
      const payload = await B.api(`/api/auth/reset-password/details?token=${encodeURIComponent(token)}`, {
        skipCsrf: true
      });
      document.getElementById("reset-email").value = payload.account.email;
      document.getElementById("reset-username").value = payload.account.username;
      form.classList.remove("hidden");
      setAuthStatus("", "info");
    } catch (error) {
      setAuthStatus(error.message, "error");
      return;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const password = document.getElementById("reset-password").value;
      const passwordConfirm = document.getElementById("reset-password-confirm").value;
      try {
        await B.api("/api/auth/reset-password", {
          method: "POST",
          body: {
            token,
            password,
            passwordConfirm
          },
          skipCsrf: true
        });
        setAuthStatus(B.t("auth_success_reset"), "success");
        form.classList.add("hidden");
      } catch (error) {
        setAuthStatus(error.message, "error");
      }
    });
  }

  async function initVerifyPage() {
    const status = document.getElementById("verify-status");
    if (!status) return;
    const token = B.getQueryParam("token");
    if (!token) {
      setAuthStatus("Falta el token de verificacion.", "error");
      return;
    }

    try {
      await B.api(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, { skipCsrf: true });
      setAuthStatus("Correo verificado. Ya puedes ingresar.", "success");
      document.getElementById("verify-auth-link")?.classList.remove("hidden");
    } catch (error) {
      setAuthStatus(error.message, "error");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("login-form")) {
      initAuthPage();
    }
    if (document.getElementById("reset-form")) {
      initResetPage();
    }
    if (document.getElementById("verify-status")) {
      initVerifyPage();
    }
  });
})();
