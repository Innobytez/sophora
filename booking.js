(() => {
  const STORAGE_ARTIST = "sophora_artist";

  const params = new URLSearchParams(window.location.search);
  const rawArtist = params.get("artist");
  const storedArtist = localStorage.getItem(STORAGE_ARTIST);
  const artistName = rawArtist
    ? decodeURIComponent(rawArtist.replace(/\+/g, " "))
    : (storedArtist || "");

  const artistNameEl = document.getElementById("artist-name");
  const headerTitleEl = document.getElementById("booking-header-title");
  const footerArtistLinkEl = document.getElementById("booking-artist-footer");
  const footerArtistTextEl = document.getElementById("booking-artist-footer-text");
  const otherArtistsLink = document.getElementById("booking-other-artists");
  const missingEl = document.getElementById("artist-missing");
  const sendEmailBtn = document.getElementById("send-email");
  const sendWhatsappBtn = document.getElementById("send-whatsapp");
  const additionalInfoEl = document.getElementById("additional-info");

  if (artistName) {
    localStorage.setItem(STORAGE_ARTIST, artistName);
  }

  if (artistNameEl) {
    artistNameEl.textContent = artistName || "";
  }

  if (headerTitleEl) {
    const lang = document.documentElement.lang || "en";
    const dict = (window.I18N && window.I18N[lang]) || (window.I18N && window.I18N.en) || {};
    const prefix = dict.booking_title_prefix || "Book";
    headerTitleEl.textContent = artistName ? `${prefix} ${artistName}` : (dict.booking_title || "Booking");
  }

  if (footerArtistLinkEl && footerArtistTextEl) {
    footerArtistTextEl.textContent = artistName || "";
    const slug = artistName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    footerArtistLinkEl.href = artistName ? `artists/${slug}/` : "index.html";
  }

  if (otherArtistsLink) {
    if (artistName) {
      const slug = artistName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      otherArtistsLink.href = `index.html?pin=${slug}`;
    }
  }

  if (!artistName && missingEl) {
    missingEl.classList.remove("hidden");
    if (sendEmailBtn) sendEmailBtn.disabled = true;
    if (sendWhatsappBtn) sendWhatsappBtn.disabled = true;
  }

  if (additionalInfoEl) {
    const infoKey = `sophora_booking_info_${artistName || "unknown"}`;
    const savedInfo = sessionStorage.getItem(infoKey);
    if (savedInfo) {
      additionalInfoEl.value = savedInfo;
    }
    additionalInfoEl.addEventListener("input", () => {
      sessionStorage.setItem(infoKey, additionalInfoEl.value);
    });
  }

  const modeSelect = document.getElementById("date-mode-select");
  const dateSections = {
    single: document.querySelector(".date-fields[data-mode='single']"),
    multiple: document.querySelector(".date-fields[data-mode='multiple']"),
    range: document.querySelector(".date-fields[data-mode='range']")
  };

  function updateDateMode(){
    const mode = modeSelect ? modeSelect.value : "single";
    Object.keys(dateSections).forEach(key => {
      const section = dateSections[key];
      if (!section) return;
      section.classList.toggle("active", key === mode);
    });
  }

  if (modeSelect) {
    modeSelect.addEventListener("change", updateDateMode);
  }
  updateDateMode();

  const multiDatesWrap = document.getElementById("multi-dates");
  const addDateBtn = document.getElementById("add-date-btn");
  const removeDateBtn = document.getElementById("remove-date-btn");

  function updateRemoveButton(){
    if (!removeDateBtn || !multiDatesWrap) return;
    const count = multiDatesWrap.querySelectorAll(".multi-date").length;
    removeDateBtn.classList.toggle("hidden", count <= 1);
  }

  function addMultiDate(){
    if (!multiDatesWrap) return;
    const input = document.createElement("input");
    input.type = "date";
    input.className = "multi-date";
    multiDatesWrap.appendChild(input);
    updateRemoveButton();
  }

  if (addDateBtn) {
    addDateBtn.addEventListener("click", () => {
      addMultiDate();
    });
  }

  if (removeDateBtn) {
    removeDateBtn.addEventListener("click", () => {
      if (!multiDatesWrap) return;
      const dates = multiDatesWrap.querySelectorAll(".multi-date");
      if (dates.length > 1) {
        dates[dates.length - 1].remove();
      }
      updateRemoveButton();
    });
  }

  updateRemoveButton();

  const bookingUser = String.fromCharCode(98, 111, 111, 107, 105, 110, 103, 115);
  const bookingDomain = ["sophora", "cl"].join(".");
  const bookingEmail = `${bookingUser}@${bookingDomain}`;
  const whatsappNumber = "56971439032";

  function getSelectedDates(dict){
    const selected = document.querySelector("input[name='date-mode']:checked");
    const mode = selected ? selected.value : "single";

    if (mode === "single") {
      const date = document.getElementById("single-date");
      return date && date.value ? [date.value] : [];
    }

    if (mode === "multiple") {
      const dates = [];
      document.querySelectorAll("#multi-dates .multi-date").forEach(input => {
        if (input.value) dates.push(input.value);
      });
      return dates;
    }

    if (mode === "range") {
      const start = document.getElementById("range-start");
      const end = document.getElementById("range-end");
      const parts = [];
      const startLabel = (dict && dict.booking_range_start_label) || "Start date";
      const endLabel = (dict && dict.booking_range_end_label) || "End date";
      if (start && start.value) parts.push(`${startLabel}: ${start.value}`);
      if (end && end.value) parts.push(`${endLabel}: ${end.value}`);
      return parts;
    }

    return [];
  }

  function buildMessage(){
    const lang = document.documentElement.lang || "en";
    const dict = (window.I18N && window.I18N[lang]) || window.I18N.en;

    const dates = getSelectedDates(dict);
    const additional = document.getElementById("additional-info");
    const details = [
      `${dict.booking_artist_label || "Artist"}: ${artistName || ""}`,
      `${dict.booking_date_label || "Date options"}:`,
      dates.length ? `- ${dates.join("\n- ")}` : "-",
      `${dict.booking_additional_info || "Additional information"}: ${additional && additional.value ? additional.value : ""}`
    ];

    return details.join("\n");
  }

  if (sendEmailBtn) {
    sendEmailBtn.addEventListener("click", () => {
      const subject = encodeURIComponent(`Booking enquiry - ${artistName || ""}`);
      const body = encodeURIComponent(buildMessage());
      window.location.href = `mailto:${bookingEmail}?subject=${subject}&body=${body}`;
    });
  }

  if (sendWhatsappBtn) {
    sendWhatsappBtn.addEventListener("click", () => {
      const text = encodeURIComponent(buildMessage());
      const url = `https://wa.me/${whatsappNumber}?text=${text}`;
      window.open(url, "_blank", "noopener");
    });
  }
})();
