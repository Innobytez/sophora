(() => {
  const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "zh", label: "中文" },
    { code: "hi", label: "हिन्दी" },
    { code: "fr", label: "Français" },
    { code: "ar", label: "العربية" },
    { code: "bn", label: "বাংলা" },
    { code: "pt", label: "Português" },
    { code: "ru", label: "Русский" },
    { code: "ur", label: "اردو" }
  ];

  const RTL_LANGS = new Set(["ar", "ur"]);
  const STORAGE_LANG = "sophora_lang";
  const STORAGE_ARTIST = "sophora_artist";
  const INSTAGRAM_URL = "https://www.instagram.com/sophora.cl/";
  const FACEBOOK_URL = "https://www.facebook.com/sophora.cl/";

  const langSelect = document.getElementById("lang-select");
  const urlParams = new URLSearchParams(window.location.search);
  const pinParam = urlParams.get("pin");
  let langMeasure = null;
  if (langSelect && !langSelect.options.length) {
    LANGUAGES.forEach(lang => {
      const option = document.createElement("option");
      option.value = lang.code;
      option.textContent = lang.label;
      langSelect.appendChild(option);
    });
  }

  function detectLanguage(){
    const navLangs = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || ""];

    for (const lang of navLangs) {
      if (!lang) continue;
      const base = lang.toLowerCase().split("-")[0];
      if (LANGUAGES.some(item => item.code === base)) return base;
    }
    return "en";
  }

  function sizeFooterLangSelects(){
    if (!langSelect) return;
    if (!langMeasure) {
      langMeasure = document.createElement("span");
      langMeasure.style.position = "absolute";
      langMeasure.style.visibility = "hidden";
      langMeasure.style.whiteSpace = "pre";
      langMeasure.style.pointerEvents = "none";
      langMeasure.style.height = "0";
      langMeasure.style.overflow = "hidden";
      document.body.appendChild(langMeasure);
    }
    const style = window.getComputedStyle(langSelect);
    langMeasure.style.font = style.font;
    langMeasure.style.letterSpacing = style.letterSpacing;
    langMeasure.style.textTransform = style.textTransform;
    const option = langSelect.options[langSelect.selectedIndex];
    langMeasure.textContent = option ? option.textContent : "";
    const textWidth = langMeasure.getBoundingClientRect().width;
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;
    langSelect.style.width = `${Math.ceil(textWidth + paddingLeft + paddingRight)}px`;
  }

  function applyTranslations(lang){
    const dict = (window.I18N && window.I18N[lang]) || {};
    const fallback = (window.I18N && window.I18N.en) || {};

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const value = dict[key] || fallback[key];
      if (!value) return;
      if (el.hasAttribute("data-i18n-attr")) {
        return;
      }
      el.textContent = value;
    });

    document.querySelectorAll("[data-i18n-attr]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const attr = el.getAttribute("data-i18n-attr");
      const value = dict[key] || fallback[key];
      if (attr && value) el.setAttribute(attr, value);
    });

    sizeFooterLangSelects();
  }

  function setLanguage(lang){
    const activeLang = LANGUAGES.some(item => item.code === lang) ? lang : "en";
    localStorage.setItem(STORAGE_LANG, activeLang);
    document.documentElement.lang = activeLang;
    document.documentElement.dir = RTL_LANGS.has(activeLang) ? "rtl" : "ltr";

    applyTranslations(activeLang);

    if (langSelect) {
      langSelect.value = activeLang;
    }

    sizeFooterLangSelects();
    window.dispatchEvent(new CustomEvent("sophora:language-change", {
      detail: { lang: activeLang }
    }));
  }

  const storedLang = localStorage.getItem(STORAGE_LANG);
  const initialLang = storedLang || "es";
  setLanguage(initialLang);

  const HOME_SESSION_KEY = "sophora_home_entry";
  const isArtistDirectory = document.body.classList.contains("artists-page") || !!document.querySelector(".artist-list");

  if (!sessionStorage.getItem(HOME_SESSION_KEY)) {
    const isUnpinnedDirectory = isArtistDirectory && !pinParam;
    sessionStorage.setItem(HOME_SESSION_KEY, isUnpinnedDirectory ? "artists" : "other");
  }

  const otherArtistsBtn = document.querySelector(".other-artists-btn");
  if (otherArtistsBtn) {
    const entry = sessionStorage.getItem(HOME_SESSION_KEY);
    if (entry === "artists") {
      otherArtistsBtn.classList.remove("hidden");
    }
  }

  if (langSelect) {
    langSelect.addEventListener("change", (event) => {
      setLanguage(event.target.value);
    });
  }

  window.addEventListener("resize", sizeFooterLangSelects);


  function fromCodes(codes) {
    return String.fromCharCode(...codes);
  }

  const emailBtn = document.getElementById("email-btn");
  const callBtn = document.getElementById("call-btn");
  const footerEmailLink = document.getElementById("footer-email-link");
  const footerWhatsappLink = document.getElementById("footer-whatsapp-link");
  const footerYear = document.getElementById("footer-year");

  const emailUser = "support";
  const emailDomain = ["innobytez", "com"].join(".");
  const email = `${emailUser}@${emailDomain}`;
  const phone = fromCodes([43, 53, 54, 57, 55, 49, 52, 51, 57, 48, 51, 50]);
  const phoneDisplay = fromCodes([43, 53, 54, 32, 57, 32, 55, 49, 52, 51, 32, 57, 48, 51, 50]);
  const whatsappNumber = phone.replace("+", "");

  function getTranslation(key, fallback = key) {
    const lang = document.documentElement.lang || "en";
    const dict = (window.I18N && window.I18N[lang]) || (window.I18N && window.I18N.en) || {};
    return dict[key] || fallback;
  }

  function iconSvg(kind) {
    if (kind === "email") {
      return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 6.5h18v11H3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
          <path d="m4.2 7.5 7.8 6 7.8-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    }
    if (kind === "whatsapp") {
      return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.5a8.5 8.5 0 0 0-7.4 12.7L3.5 20.5l4.5-1.1A8.5 8.5 0 1 0 12 3.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
          <path d="M9.2 8.8c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .5.4l.6 1.5c.1.2 0 .4-.1.5l-.4.5c-.1.1-.1.3 0 .4.3.6 1 1.4 1.9 1.8.1.1.3 0 .4-.1l.5-.6c.1-.1.3-.2.5-.1l1.4.7c.2.1.3.3.2.5l-.2.7c-.1.3-.4.5-.7.6-.5.1-1.3.1-2.7-.6-1.9-1-3.3-3.1-3.5-4.8-.1-.5 0-1 .4-1.5Z" fill="currentColor"/>
        </svg>
      `;
    }
    if (kind === "instagram") {
      return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4.1" y="4.1" width="15.8" height="15.8" rx="4.5" fill="none" stroke="currentColor" stroke-width="1.6"/>
          <circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" stroke-width="1.6"/>
          <circle cx="17.3" cy="6.8" r="1" fill="currentColor"/>
        </svg>
      `;
    }
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13.4 20v-7h2.3l.4-2.8h-2.7V8.4c0-.8.2-1.4 1.4-1.4H16V4.5c-.4-.1-1.2-.2-2.2-.2-2.2 0-3.6 1.3-3.6 3.8v2.1H8v2.8h2.2v7h3.2Z" fill="currentColor"/>
      </svg>
    `;
  }

  function ensureFooterSocials() {
    document.querySelectorAll(".site-footer").forEach((footer) => {
      if (footer.querySelector(".footer-socials")) return;
      footer.querySelector(".footer-email")?.remove();
      footer.querySelector(".footer-whatsapp")?.remove();
      footer.querySelector(".footer-grid")?.classList.add("footer-grid--two");
      const socialWrap = document.createElement("div");
      socialWrap.className = "footer-socials";
      socialWrap.innerHTML = `
        <div class="footer-social-group">
          <span class="footer-socials-title" data-i18n="contact_label">Contact us</span>
          <div class="footer-socials-list">
            <a class="footer-social-btn" href="mailto:${email}" data-i18n="email_label" data-i18n-attr="aria-label" aria-label="${getTranslation("email_label", "Mail")}">
              ${iconSvg("email")}
            </a>
            <a class="footer-social-btn" href="https://wa.me/${whatsappNumber}" target="_blank" rel="noreferrer" data-i18n="whatsapp_label" data-i18n-attr="aria-label" aria-label="${getTranslation("whatsapp_label", "WhatsApp")}">
              ${iconSvg("whatsapp")}
            </a>
          </div>
        </div>
        <div class="footer-social-group">
          <span class="footer-socials-title" data-i18n="follow_label">Follow us</span>
          <div class="footer-socials-list">
            <a class="footer-social-btn" href="${INSTAGRAM_URL}" target="_blank" rel="noreferrer" data-i18n="instagram_label" data-i18n-attr="aria-label" aria-label="${getTranslation("instagram_label", "Instagram")}">
              ${iconSvg("instagram")}
            </a>
            <a class="footer-social-btn" href="${FACEBOOK_URL}" target="_blank" rel="noreferrer" data-i18n="facebook_label" data-i18n-attr="aria-label" aria-label="${getTranslation("facebook_label", "Facebook")}">
              ${iconSvg("facebook")}
            </a>
          </div>
        </div>
      `;
      footer.insertBefore(socialWrap, footer.querySelector(".footer-grid"));
      applyTranslations(document.documentElement.lang || "en");
    });
  }

  if (footerEmailLink) {
    footerEmailLink.textContent = email;
    footerEmailLink.href = `mailto:${email}`;
  }

  if (footerWhatsappLink) {
    footerWhatsappLink.textContent = phoneDisplay;
    footerWhatsappLink.href = `https://wa.me/${whatsappNumber}`;
  }

  ensureFooterSocials();

  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  if (emailBtn) {
    emailBtn.addEventListener("click", () => {
      window.location.href = `mailto:${email}`;
    });
  }

  if (callBtn) {
    callBtn.addEventListener("click", () => {
      window.location.href = `tel:${phone}`;
    });
  }

  document.querySelectorAll(".book-btn[data-artist]").forEach(btn => {
    btn.addEventListener("click", () => {
      const artist = btn.getAttribute("data-artist") || "";
      if (artist) localStorage.setItem(STORAGE_ARTIST, artist);
    });
  });

  const artistImages = document.querySelectorAll(".artist-card img");
  const footerAccessLinks = document.querySelectorAll(".footer-access-btn");

  if (footerAccessLinks.length) {
    fetch("/api/auth/me", {
      credentials: "same-origin",
      headers: {
        Accept: "application/json"
      }
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!payload?.user) return;
        footerAccessLinks.forEach((link) => {
          link.setAttribute("href", "/dashboard.html");
        });
      })
      .catch(() => {
        // Public pages should stay usable even if auth bootstrap fails.
      });
  }

  const setOrientation = (img) => {
    const card = img.closest(".artist-card");
    if (!card) return;
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    if (!width || !height) return;
    const isPortrait = height >= width;
    card.classList.toggle("portrait", isPortrait);
    card.classList.toggle("landscape", !isPortrait);
  };

  artistImages.forEach(img => {
    if (img.complete) setOrientation(img);
    img.addEventListener("load", () => setOrientation(img));
  });

  const artistList = document.querySelector(".artist-list");
  if (artistList) {
    const cards = Array.from(artistList.querySelectorAll(".artist-card"));
    const pin = pinParam;

    const shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    let ordered = [];
    if (pin) {
      const pinnedCard = cards.find(card => card.dataset.artist === pin);
      if (pinnedCard) {
        ordered.push(pinnedCard);
        const others = cards.filter(card => card !== pinnedCard);
        ordered = ordered.concat(shuffle(others));
      }
    }

    if (!ordered.length) {
      ordered = shuffle(cards.slice());
    }

    ordered.forEach(card => artistList.appendChild(card));
  }
})();
