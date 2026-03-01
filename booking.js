(() => {
  const Backend = window.SophoraBackend;
  const STORAGE_ARTIST = "sophora_artist";

  const params = new URLSearchParams(window.location.search);
  let calendarStateFontFrame = 0;
  let calendarMeasureContext = null;
  const state = {
    artistSlug: params.get("artistSlug"),
    artistName: params.get("artist")
      ? decodeURIComponent(params.get("artist").replace(/\+/g, " "))
      : (localStorage.getItem(STORAGE_ARTIST) || ""),
    mode: "single",
    currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    availabilityLoaded: false,
    availabilityMode: "custom",
    availableDates: [],
    bookedDates: [],
    singleDate: "",
    multipleDates: [],
    rangeStart: "",
    rangeEnd: ""
  };

  const artistNameEl = document.getElementById("artist-name");
  const headerTitleEl = document.getElementById("booking-header-title");
  const footerArtistLinkEl = document.getElementById("booking-artist-footer");
  const footerArtistTextEl = document.getElementById("booking-artist-footer-text");
  const otherArtistsLink = document.getElementById("booking-other-artists");
  const missingEl = document.getElementById("artist-missing");
  const clientNameInput = document.getElementById("client-name");
  const clientEmailInput = document.getElementById("client-email");
  const clientPhoneInput = document.getElementById("client-phone");
  const notifyByEmailInput = document.getElementById("notify-by-email");
  const notifyBySmsInput = document.getElementById("notify-by-sms");
  const bookingNotifyHint = document.getElementById("booking-notify-hint");
  const bookingNotifyOptions = document.querySelector(".booking-notify-options");
  const engagementStartTimeDisplayInput = document.getElementById("engagement-start-time-display");
  const engagementStartTimeMeridiemInput = document.getElementById("engagement-start-time-meridiem");
  const engagementStartTimeInput = document.getElementById("engagement-start-time");
  const engagementEndTimeDisplayInput = document.getElementById("engagement-end-time-display");
  const engagementEndTimeMeridiemInput = document.getElementById("engagement-end-time-meridiem");
  const engagementEndTimeInput = document.getElementById("engagement-end-time");
  const bookingLocationInput = document.getElementById("booking-location");
  const suggestedBudgetInput = document.getElementById("suggested-budget");
  const submitRequestBtn = document.getElementById("booking-submit-request");
  const bookingStatusEl = document.getElementById("booking-request-status");
  const additionalInfoEl = document.getElementById("additional-info");
  const modeSelect = document.getElementById("date-mode-select");
  const calendarGrid = document.getElementById("booking-calendar-grid");
  const calendarPanel = document.querySelector(".booking-calendar-panel");
  const calendarNote = document.getElementById("booking-calendar-note");
  const calendarMonthLabel = document.getElementById("booking-calendar-month-label");
  const prevMonthBtn = document.getElementById("booking-calendar-prev");
  const nextMonthBtn = document.getElementById("booking-calendar-next");
  const clearSelectionBtn = document.getElementById("booking-clear-selection");

  function t(key, fallback = key) {
    if (Backend) return Backend.t(key);
    return fallback;
  }

  function toDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function splitTimeForDisplay(value) {
    const text = String(value || "").trim();
    const match = text.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!match) {
      return { time: "", meridiem: "PM" };
    }
    let hour = Number(match[1]);
    const minute = match[2];
    const meridiem = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return {
      time: `${String(hour).padStart(2, "0")}:${minute}`,
      meridiem
    };
  }

  function parseDisplayTime(value, meridiem = "PM") {
    const text = String(value || "").trim();
    if (!text) return "";
    const match = text.match(/^(\d{1,2}):([0-5]\d)$/);
    if (!match) return "";
    let hour = Number(match[1]);
    if (hour < 1 || hour > 12) return "";
    const minute = match[2];
    const upperMeridiem = String(meridiem || "PM").toUpperCase() === "AM" ? "AM" : "PM";
    if (upperMeridiem === "AM") {
      if (hour === 12) hour = 0;
    } else if (hour !== 12) {
      hour += 12;
    }
    return `${String(hour).padStart(2, "0")}:${minute}`;
  }

  function syncBookingTimeField({ displayInput, meridiemInput, hiddenInput }) {
    if (!displayInput || !meridiemInput || !hiddenInput) return { valid: true, value: "" };
    const raw = String(displayInput.value || "").trim();
    if (!raw) {
      hiddenInput.value = "";
      return { valid: true, value: "" };
    }
    const parsed = parseDisplayTime(raw, meridiemInput.value);
    hiddenInput.value = parsed;
    return { valid: Boolean(parsed), value: parsed };
  }

  function hydrateBookingTimeField({ displayInput, meridiemInput, hiddenInput }) {
    if (!displayInput || !meridiemInput || !hiddenInput) return;
    const parts = splitTimeForDisplay(hiddenInput.value);
    displayInput.value = parts.time;
    meridiemInput.value = parts.meridiem;
  }

  function sanitizeIntegerInput(input) {
    if (!input) return;
    input.value = String(input.value || "").replace(/[^\d]/g, "");
  }

  function getCalendarMeasureContext() {
    if (!calendarMeasureContext) {
      calendarMeasureContext = document.createElement("canvas").getContext("2d");
    }
    return calendarMeasureContext;
  }

  function updateCalendarStateFontSize() {
    if (!calendarGrid) return;
    const sampleDay = calendarGrid.querySelector(".calendar-day[data-date]");
    if (!sampleDay) return;

    const dayWidth = sampleDay.getBoundingClientRect().width;
    if (!dayWidth) return;

    const labelElement = sampleDay.querySelector(".calendar-day-state") || sampleDay;
    const availableWidth = Math.max(dayWidth - 16, 24);
    const context = getCalendarMeasureContext();
    if (!context) return;

    const computedStyle = window.getComputedStyle(labelElement);
    const fontFamily = computedStyle.fontFamily || '"Inter", sans-serif';
    const baseFontSize = 10;
    context.font = `${baseFontSize}px ${fontFamily}`;

    const longestWidth = Math.max(
      context.measureText(t("available", "Available")).width,
      context.measureText(t("unavailable", "Unavailable")).width
    );

    if (!longestWidth) return;

    const nextFontSize = Math.max(5, Math.min(baseFontSize, (availableWidth / longestWidth) * baseFontSize));
    calendarGrid.style.setProperty("--calendar-day-state-font-size", `${nextFontSize.toFixed(2)}px`);
  }

  function queueCalendarStateFontSizeUpdate() {
    window.cancelAnimationFrame(calendarStateFontFrame);
    calendarStateFontFrame = window.requestAnimationFrame(() => {
      updateCalendarStateFontSize();
    });
  }

  function isBookableDate(iso) {
    if (!state.availabilityLoaded) return true;
    if (state.bookedDates.includes(iso)) return false;
    const today = toDateString(new Date());
    if (state.availabilityMode === "all_available") {
      return iso >= today && !state.availableDates.includes(iso);
    }
    return state.availableDates.includes(iso);
  }

  function resetUnavailableSelections() {
    if (!state.availabilityLoaded) return;

    if (state.singleDate && !isBookableDate(state.singleDate)) {
      state.singleDate = "";
    }

    state.multipleDates = state.multipleDates.filter(isBookableDate);

    if (state.rangeStart && !isBookableDate(state.rangeStart)) {
      state.rangeStart = "";
      state.rangeEnd = "";
    }

    if (state.rangeEnd && !isBookableDate(state.rangeEnd)) {
      state.rangeEnd = "";
    }
  }

  function updateNotificationHint() {
    if (!bookingNotifyHint) return;
    const shouldShow = !notifyByEmailInput?.checked && !notifyBySmsInput?.checked;
    bookingNotifyHint.classList.toggle("hidden", !shouldShow);
  }

  function syncCalendarMonthToAvailability() {
    if (!state.availabilityLoaded) return;
    if (state.availabilityMode === "all_available") {
      state.currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      return;
    }
    if (!state.availableDates.length) return;
    const today = toDateString(new Date());
    const nextAvailable = state.availableDates.find((date) => date >= today) || state.availableDates[0];
    if (!nextAvailable) return;
    const [year, month] = nextAvailable.split("-").map(Number);
    state.currentMonth = new Date(year, month - 1, 1);
  }

  function renderArtist() {
    const artistName = state.artistName;
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
      const slug = state.artistSlug || artistName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      footerArtistLinkEl.href = artistName ? `artists/${slug}/` : "index.html";
    }

    if (otherArtistsLink && artistName) {
      const slug = state.artistSlug || artistName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      otherArtistsLink.href = `artists.html?pin=${slug}`;
    }

    if (missingEl) {
      missingEl.classList.toggle("hidden", Boolean(artistName));
    }

    if (submitRequestBtn) {
      submitRequestBtn.disabled = !artistName;
    }
  }

  function setBookingStatus(message, tone = "info") {
    if (!bookingStatusEl) return;
    bookingStatusEl.textContent = message || "";
    bookingStatusEl.classList.toggle("hidden", !message);
    bookingStatusEl.classList.toggle("success", tone === "success");
    bookingStatusEl.classList.toggle("error", tone === "error");
  }

  function clearBookingErrorTargets() {
    document.querySelectorAll(".booking-error-target").forEach((element) => {
      element.classList.remove("booking-error-target");
    });
  }

  function getBookingErrorTarget(key) {
    const map = {
      artistSlug: submitRequestBtn,
      clientName: clientNameInput,
      clientEmail: clientEmailInput,
      clientPhone: clientPhoneInput,
      notifyByEmail: bookingNotifyOptions,
      notifyBySms: bookingNotifyOptions,
      engagementStartTime: engagementStartTimeDisplayInput,
      engagementEndTime: engagementEndTimeDisplayInput,
      selectedDates: calendarPanel,
      startDate: calendarPanel,
      endDate: calendarPanel
    };
    return map[key] || null;
  }

  function showBookingError(message, targets = [], focusTarget = null) {
    clearBookingErrorTargets();
    targets
      .map((target) => (typeof target === "string" ? getBookingErrorTarget(target) : target))
      .filter(Boolean)
      .forEach((target) => target.classList.add("booking-error-target"));

    setBookingStatus(message, "error");

    const focusElement = (typeof focusTarget === "string" ? getBookingErrorTarget(focusTarget) : focusTarget)
      || targets.map((target) => (typeof target === "string" ? getBookingErrorTarget(target) : target)).find(Boolean);

    if (focusElement?.scrollIntoView) {
      focusElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (focusElement?.focus) {
      focusElement.focus({ preventScroll: true });
    }
  }

  function parseBookingApiError(error) {
    const fieldErrors = error?.payload?.details?.fieldErrors || {};
    const firstField = Object.keys(fieldErrors).find((key) => Array.isArray(fieldErrors[key]) && fieldErrors[key].length);

    if (fieldErrors.clientName?.length) {
      return {
        message: t("booking_missing_contact_name", "Please complete your name."),
        targets: ["clientName"],
        focusTarget: "clientName"
      };
    }
    if (fieldErrors.notifyByEmail?.length || fieldErrors.notifyBySms?.length) {
      return {
        message: t("booking_missing_notification_method", "Choose at least one notification method."),
        targets: ["notifyByEmail"],
        focusTarget: "notifyByEmail"
      };
    }
    if (fieldErrors.clientEmail?.length) {
      return {
        message: t("booking_invalid_email_notification", "Please enter a valid email address in the Email field or turn off email notifications."),
        targets: ["clientEmail"],
        focusTarget: "clientEmail"
      };
    }
    if (fieldErrors.clientPhone?.length) {
      return {
        message: t("booking_missing_phone_notification", "Please enter a phone number or turn off WhatsApp notifications."),
        targets: ["clientPhone"],
        focusTarget: "clientPhone"
      };
    }
    if (fieldErrors.selectedDates?.length || fieldErrors.startDate?.length || fieldErrors.endDate?.length) {
      return {
        message: t("booking_missing_dates", "Please choose at least one date."),
        targets: ["selectedDates"],
        focusTarget: "selectedDates"
      };
    }

    if (String(error?.message || "").includes("At least one valid event date")) {
      return {
        message: t("booking_missing_dates", "Please choose at least one date."),
        targets: ["selectedDates"],
        focusTarget: "selectedDates"
      };
    }

    if (error?.status === 404 || firstField === "artistSlug") {
      return {
        message: t("booking_artist_missing", "Artist not selected."),
        targets: [],
        focusTarget: submitRequestBtn
      };
    }

    return {
      message: t("booking_submit_error", "We could not send your booking request. Please review the highlighted fields and try again."),
      targets: firstField ? [firstField] : [],
      focusTarget: firstField || null
    };
  }

  function getModeHelp() {
    if (state.availabilityLoaded && state.availabilityMode !== "all_available" && !state.availableDates.length) {
      return t("booking_no_available_dates", "There are no published available dates for this artist yet.");
    }
    let help = "";
    if (state.mode === "multiple") {
      help = t("booking_pick_multiple", "Click every date you want to send.");
    } else if (state.mode === "range") {
      help = state.rangeStart && !state.rangeEnd
        ? t("booking_pick_range_end", "Now choose the end date.")
        : t("booking_pick_range_start", "Choose the start date.");
    } else {
      help = t("booking_pick_single", "Choose one date from the calendar.");
    }

    return help;
  }

  function renderCalendar() {
    if (!calendarGrid) return;

    const month = state.currentMonth;
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const offset = firstDay.getDay();
    const weekdayBase = new Date(2026, 0, 4);
    const todayIso = toDateString(new Date());

    calendarNote.textContent = getModeHelp();
    calendarMonthLabel.textContent = new Intl.DateTimeFormat((Backend && Backend.getLanguage()) || "es", {
      month: "long",
      year: "numeric"
    }).format(month);

    const parts = [];
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const day = new Date(weekdayBase);
      day.setDate(weekdayBase.getDate() + weekday);
      parts.push(`<div class="calendar-weekday">${new Intl.DateTimeFormat((Backend && Backend.getLanguage()) || "es", { weekday: "short" }).format(day)}</div>`);
    }

    for (let i = 0; i < offset; i += 1) {
      parts.push(`<div class="calendar-day muted" aria-hidden="true"></div>`);
    }

    const multipleSet = new Set(state.multipleDates);

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      const date = new Date(year, monthIndex, day);
      const iso = toDateString(date);
      const isPast = iso < todayIso;
      const isAvailable = isBookableDate(iso);
      const isSelectable = !isPast && isAvailable;
      let selected = false;
      let rangeClass = "";

      if (state.mode === "single") {
        selected = state.singleDate === iso;
      } else if (state.mode === "multiple") {
        selected = multipleSet.has(iso);
      } else if (state.rangeStart && state.rangeEnd) {
        selected = isAvailable && iso >= state.rangeStart && iso <= state.rangeEnd;
        if (iso === state.rangeStart) rangeClass = "range-start";
        else if (iso === state.rangeEnd) rangeClass = "range-end";
        else if (selected) rangeClass = "range-middle";
      } else if (state.rangeStart) {
        selected = state.rangeStart === iso;
        if (selected) rangeClass = "range-start";
      }

      parts.push(`
        <button
          class="calendar-day ${selected ? "selected" : ""} ${rangeClass} ${isAvailable ? "available" : "unavailable"} ${isPast ? "muted" : ""}"
          type="button"
          data-date="${iso}"
          data-bookable="${isSelectable ? "true" : "false"}"
          ${isPast ? "disabled" : ""}
          aria-disabled="${isSelectable ? "false" : "true"}">
          <span class="calendar-day-number">${day}</span>
          <span class="calendar-day-state">${isAvailable ? t("available", "Available") : t("unavailable", "Unavailable")}</span>
        </button>
      `);
    }

    calendarGrid.innerHTML = parts.join("");
    queueCalendarStateFontSizeUpdate();
  }

  function clearSelection() {
    if (state.mode === "single") {
      state.singleDate = "";
    } else if (state.mode === "multiple") {
      state.multipleDates = [];
    } else {
      state.rangeStart = "";
      state.rangeEnd = "";
    }
    renderCalendar();
  }

  function handleCalendarClick(event) {
    const button = event.target.closest("[data-date]");
    if (!button || button.disabled || button.dataset.bookable !== "true") return;
    const date = button.dataset.date;

    if (state.mode === "single") {
      state.singleDate = date;
    } else if (state.mode === "multiple") {
      const current = new Set(state.multipleDates);
      if (current.has(date)) current.delete(date);
      else current.add(date);
      state.multipleDates = [...current].sort();
    } else if (!state.rangeStart || (state.rangeStart && state.rangeEnd)) {
      state.rangeStart = date;
      state.rangeEnd = "";
    } else if (date < state.rangeStart) {
      state.rangeEnd = state.rangeStart;
      state.rangeStart = date;
    } else {
      state.rangeEnd = date;
    }

    renderCalendar();
  }

  function getBookingPayload() {
    sanitizeIntegerInput(suggestedBudgetInput);
    const startTimeSync = syncBookingTimeField({
      displayInput: engagementStartTimeDisplayInput,
      meridiemInput: engagementStartTimeMeridiemInput,
      hiddenInput: engagementStartTimeInput
    });
    const endTimeSync = syncBookingTimeField({
      displayInput: engagementEndTimeDisplayInput,
      meridiemInput: engagementEndTimeMeridiemInput,
      hiddenInput: engagementEndTimeInput
    });
    const payload = {
      artistSlug: state.artistSlug,
      clientName: clientNameInput?.value.trim() || "",
      clientEmail: clientEmailInput?.value.trim() || "",
      clientPhone: clientPhoneInput?.value.trim() || "",
      notifyByEmail: Boolean(notifyByEmailInput?.checked),
      notifyBySms: Boolean(notifyBySmsInput?.checked),
      engagementStartTime: startTimeSync.value || "",
      engagementEndTime: endTimeSync.value || "",
      location: bookingLocationInput?.value.trim() || "",
      suggestedBudget: suggestedBudgetInput?.value.trim() || "",
      dateMode: state.mode,
      selectedDates: [],
      startDate: "",
      endDate: "",
      additionalInfo: additionalInfoEl?.value.trim() || ""
    };

    if (state.mode === "single") {
      payload.selectedDates = state.singleDate ? [state.singleDate] : [];
      payload.startDate = state.singleDate || "";
      payload.endDate = state.singleDate || "";
    } else if (state.mode === "multiple") {
      payload.selectedDates = state.multipleDates.slice();
      payload.startDate = payload.selectedDates[0] || "";
      payload.endDate = payload.selectedDates.at(-1) || "";
    } else {
      payload.startDate = state.rangeStart || "";
      payload.endDate = state.rangeEnd || state.rangeStart || "";
    }

    return payload;
  }

  async function submitBookingRequest() {
    if (!Backend) return;

    const payload = getBookingPayload();
    if (!payload.artistSlug) {
      showBookingError(t("booking_artist_missing", "Artist not selected."), [], submitRequestBtn);
      return;
    }
    if (!payload.clientName) {
      showBookingError(t("booking_missing_contact_name", "Please complete your name."), ["clientName"], clientNameInput);
      return;
    }
    if (!payload.notifyByEmail && !payload.notifyBySms) {
      updateNotificationHint();
      showBookingError(t("booking_missing_notification_method", "Choose at least one notification method."), ["notifyByEmail"], bookingNotifyOptions);
      return;
    }
    if (engagementStartTimeDisplayInput?.value.trim() && !payload.engagementStartTime) {
      showBookingError(t("invalid_time_format", "Use hh:mm and choose AM or PM."), ["engagementStartTime"], engagementStartTimeDisplayInput);
      return;
    }
    if (engagementEndTimeDisplayInput?.value.trim() && !payload.engagementEndTime) {
      showBookingError(t("invalid_time_format", "Use hh:mm and choose AM or PM."), ["engagementEndTime"], engagementEndTimeDisplayInput);
      return;
    }
    if (payload.notifyByEmail && !payload.clientEmail) {
      showBookingError(t("booking_missing_email_notification", "Please enter an email address or turn off email notifications."), ["clientEmail"], clientEmailInput);
      return;
    }
    if (payload.notifyBySms && !payload.clientPhone) {
      showBookingError(t("booking_missing_phone_notification", "Please enter a phone number or turn off WhatsApp notifications."), ["clientPhone"], clientPhoneInput);
      return;
    }
    if (
      (payload.dateMode === "single" && !payload.startDate) ||
      (payload.dateMode === "multiple" && !payload.selectedDates.length) ||
      (payload.dateMode === "range" && !payload.startDate)
    ) {
      showBookingError(t("booking_missing_dates", "Please choose at least one date."), ["selectedDates"], calendarPanel);
      return;
    }

    submitRequestBtn.disabled = true;
    clearBookingErrorTargets();
    setBookingStatus(t("booking_submitting", "Sending your request..."));
    try {
      await Backend.api("/api/public/booking-requests", {
        method: "POST",
        body: payload
      });
      clearBookingErrorTargets();
      setBookingStatus(t("booking_submit_success", "Your booking request was sent."), "success");
      clearSelection();
      if (additionalInfoEl) additionalInfoEl.value = "";
    } catch (error) {
      const parsedError = parseBookingApiError(error);
      showBookingError(parsedError.message, parsedError.targets, parsedError.focusTarget);
    } finally {
      submitRequestBtn.disabled = !state.artistName;
    }
  }

  function bindEvents() {
    const contactKey = `sophora_booking_contact_${state.artistSlug || "unknown"}`;
    try {
      const savedContact = JSON.parse(sessionStorage.getItem(contactKey) || "{}");
      if (clientNameInput && savedContact.clientName) clientNameInput.value = savedContact.clientName;
      if (clientEmailInput && savedContact.clientEmail) clientEmailInput.value = savedContact.clientEmail;
      if (clientPhoneInput && savedContact.clientPhone) clientPhoneInput.value = savedContact.clientPhone;
      if (notifyByEmailInput) notifyByEmailInput.checked = Boolean(savedContact.notifyByEmail);
      if (notifyBySmsInput) notifyBySmsInput.checked = Boolean(savedContact.notifyBySms);
      if (engagementStartTimeInput && savedContact.engagementStartTime) engagementStartTimeInput.value = savedContact.engagementStartTime;
      if (engagementEndTimeInput && savedContact.engagementEndTime) engagementEndTimeInput.value = savedContact.engagementEndTime;
      if (bookingLocationInput && savedContact.location) bookingLocationInput.value = savedContact.location;
      if (suggestedBudgetInput && savedContact.suggestedBudget) suggestedBudgetInput.value = savedContact.suggestedBudget;
    } catch {
      // Ignore malformed session data.
    }

    hydrateBookingTimeField({
      displayInput: engagementStartTimeDisplayInput,
      meridiemInput: engagementStartTimeMeridiemInput,
      hiddenInput: engagementStartTimeInput
    });
    hydrateBookingTimeField({
      displayInput: engagementEndTimeDisplayInput,
      meridiemInput: engagementEndTimeMeridiemInput,
      hiddenInput: engagementEndTimeInput
    });
    sanitizeIntegerInput(suggestedBudgetInput);

    updateNotificationHint();

    [
      clientNameInput,
      clientEmailInput,
      clientPhoneInput,
      notifyByEmailInput,
      notifyBySmsInput,
      engagementStartTimeDisplayInput,
      engagementStartTimeMeridiemInput,
      engagementEndTimeDisplayInput,
      engagementEndTimeMeridiemInput,
      bookingLocationInput,
      suggestedBudgetInput
    ].forEach((input) => {
      const eventName = input?.type === "checkbox" || input?.tagName === "SELECT" ? "change" : "input";
      input?.addEventListener(eventName, () => {
        if (input === suggestedBudgetInput) {
          sanitizeIntegerInput(suggestedBudgetInput);
        }
        syncBookingTimeField({
          displayInput: engagementStartTimeDisplayInput,
          meridiemInput: engagementStartTimeMeridiemInput,
          hiddenInput: engagementStartTimeInput
        });
        syncBookingTimeField({
          displayInput: engagementEndTimeDisplayInput,
          meridiemInput: engagementEndTimeMeridiemInput,
          hiddenInput: engagementEndTimeInput
        });
        sessionStorage.setItem(contactKey, JSON.stringify({
          clientName: clientNameInput?.value || "",
          clientEmail: clientEmailInput?.value || "",
          clientPhone: clientPhoneInput?.value || "",
          notifyByEmail: Boolean(notifyByEmailInput?.checked),
          notifyBySms: Boolean(notifyBySmsInput?.checked),
          engagementStartTime: engagementStartTimeInput?.value || "",
          engagementEndTime: engagementEndTimeInput?.value || "",
          location: bookingLocationInput?.value || "",
          suggestedBudget: suggestedBudgetInput?.value || ""
        }));
        updateNotificationHint();
      });
      input?.addEventListener(eventName, () => {
        if (bookingStatusEl?.classList.contains("error")) {
          setBookingStatus("");
        }
        clearBookingErrorTargets();
      });
    });

    if (additionalInfoEl) {
      const infoKey = `sophora_booking_info_${state.artistName || "unknown"}`;
      const savedInfo = sessionStorage.getItem(infoKey);
      if (savedInfo) {
        additionalInfoEl.value = savedInfo;
      }
      additionalInfoEl.addEventListener("input", () => {
        sessionStorage.setItem(infoKey, additionalInfoEl.value);
      });
    }

    modeSelect?.addEventListener("change", () => {
      state.mode = modeSelect.value;
      resetUnavailableSelections();
      clearBookingErrorTargets();
      renderCalendar();
    });

    prevMonthBtn?.addEventListener("click", () => {
      state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1);
      renderCalendar();
    });

    nextMonthBtn?.addEventListener("click", () => {
      state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1);
      renderCalendar();
    });

    clearSelectionBtn?.addEventListener("click", () => {
      clearBookingErrorTargets();
      clearSelection();
    });
    calendarGrid?.addEventListener("click", (event) => {
      clearBookingErrorTargets();
      handleCalendarClick(event);
    });
    submitRequestBtn?.addEventListener("click", submitBookingRequest);

    window.addEventListener("sophora:backend-language-change", () => {
      if (Backend && state.artistSlug) {
        Backend.api(`/api/public/artists/${encodeURIComponent(state.artistSlug)}`, { skipCsrf: true })
          .then((payload) => {
            state.artistName = Backend.translateContent(payload.artist.displayName);
            state.availabilityMode = payload.artist.availabilityMode || "custom";
            state.availableDates = Array.isArray(payload.artist.availability) ? payload.artist.availability.slice().sort() : [];
            state.bookedDates = Array.isArray(payload.artist.bookedDates) ? payload.artist.bookedDates.slice().sort() : [];
            state.availabilityLoaded = true;
            resetUnavailableSelections();
            renderArtist();
            renderCalendar();
          })
          .catch(() => {
            renderArtist();
            renderCalendar();
          });
      } else {
        renderArtist();
        renderCalendar();
      }
    });

    window.addEventListener("resize", queueCalendarStateFontSizeUpdate);
  }

  function init() {
    state.mode = modeSelect?.value || "single";
    renderArtist();
    renderCalendar();
    bindEvents();

    if (Backend && state.artistSlug) {
      Backend.api(`/api/public/artists/${encodeURIComponent(state.artistSlug)}`, { skipCsrf: true })
        .then((payload) => {
          state.artistName = Backend.translateContent(payload.artist.displayName);
          state.availabilityMode = payload.artist.availabilityMode || "custom";
          state.availableDates = Array.isArray(payload.artist.availability) ? payload.artist.availability.slice().sort() : [];
          state.bookedDates = Array.isArray(payload.artist.bookedDates) ? payload.artist.bookedDates.slice().sort() : [];
          state.availabilityLoaded = true;
          resetUnavailableSelections();
          syncCalendarMonthToAvailability();
          renderArtist();
          renderCalendar();
        })
        .catch(() => {
          renderArtist();
        });
    }
  }

  init();
})();
