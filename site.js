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
      const tag = el.tagName;
      if ((tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") && el.hasAttribute("data-i18n-attr")) {
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
  }

  const storedLang = localStorage.getItem(STORAGE_LANG);
  const initialLang = storedLang || "es";
  setLanguage(initialLang);

  const HOME_SESSION_KEY = "sophora_home_entry";
  const isHomepage = !!document.querySelector(".artist-list");

  if (!sessionStorage.getItem(HOME_SESSION_KEY)) {
    const isUnpinnedHome = isHomepage && !pinParam;
    sessionStorage.setItem(HOME_SESSION_KEY, isUnpinnedHome ? "home" : "other");
  }

  const otherArtistsBtn = document.querySelector(".other-artists-btn");
  if (otherArtistsBtn) {
    const entry = sessionStorage.getItem(HOME_SESSION_KEY);
    if (entry === "home") {
      otherArtistsBtn.classList.remove("hidden");
    }
  }

  if (langSelect) {
    langSelect.addEventListener("change", (event) => {
      setLanguage(event.target.value);
    });
  }

  window.addEventListener("resize", sizeFooterLangSelects);


  const emailBtn = document.getElementById("email-btn");
  const callBtn = document.getElementById("call-btn");
  const footerEmailLink = document.getElementById("footer-email-link");
  const footerWhatsappLink = document.getElementById("footer-whatsapp-link");
  const footerYear = document.getElementById("footer-year");
  const footerHomeLink = document.querySelector(".footer-copyright .footer-value");

  const emailUser = String.fromCharCode(105, 110, 102, 111);
  const emailDomain = ["sophora", "cl"].join(".");
  const email = `${emailUser}@${emailDomain}`;
  const phoneParts = ["+56", "9", "7143", "9032"];
  const phone = phoneParts.join("");
  const phoneDisplay = "+56 9 7143 9032";
  const whatsappNumber = phone.replace("+", "");

  if (footerEmailLink) {
    footerEmailLink.textContent = email;
    footerEmailLink.href = `mailto:${email}`;
  }

  if (footerWhatsappLink) {
    footerWhatsappLink.textContent = phoneDisplay;
    footerWhatsappLink.href = `https://wa.me/${whatsappNumber}`;
  }

  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  if (pinParam && footerHomeLink) {
    const href = footerHomeLink.getAttribute("href") || "";
    if (href.includes("index.html") && !href.includes("pin=")) {
      footerHomeLink.href = `/index.html?pin=${encodeURIComponent(pinParam)}`;
    }
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
