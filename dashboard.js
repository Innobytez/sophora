(() => {
  const B = window.SophoraBackend;
  if (!B) return;

  const state = {
    payload: null,
    currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    createArtistOpen: false,
    tabDrag: null,
    sectionExpanded: {
      profile: false,
      calendar: false,
      timeline: false,
      bookingRequests: false,
      account: false
    },
    profileDirty: false,
    profilePublishedState: null,
    profileStatusOverride: null,
    suspendProfileSync: false,
    availabilityDirty: false,
    availabilityPublishedState: null,
    availabilityStatusOverride: null,
    eventCreateDirty: false,
    eventCreatePublishedState: null,
    eventCreateStatusOverride: null,
    eventEditPublishedState: {},
    eventEditStatusOverride: null,
    timelineStatusOverride: null,
    timelineDirty: false,
    accountDirty: false,
    accountPublishedState: null,
    accountStatusOverride: null,
    suspendAccountSync: false,
    calendarEditMode: false,
    selectedCalendarDate: "",
    selectedTimelineEventId: "",
    selectedBookingRequestId: null,
    timelineCreateOpen: false,
    eventComposerTarget: "",
    eventComposerMode: "create",
    eventComposerEventId: "",
    eventComposerReturnToDetail: false,
    eventComposerLaunchTarget: "timeline",
    eventCreateStep: "dates",
    eventCreateMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    eventCreateDraft: null,
    activeTimelineEditorId: null,
    requestPickerOpen: false,
    eventPaymentPending: {}
  };

  const dom = {};
  let calendarStateFontFrame = 0;
  let calendarMeasureContext = null;

  function cacheDom() {
    dom.title = document.getElementById("dashboard-title");
    dom.subtitle = document.getElementById("dashboard-subtitle");
    dom.heroNotifications = document.getElementById("dashboard-hero-notifications");
    dom.adminBrowser = document.getElementById("dashboard-admin-browser");
    dom.artistTabs = document.getElementById("dashboard-artist-tabs");
    dom.adminTabsStatus = document.getElementById("dashboard-admin-tabs-status");
    dom.adminRequestPanel = document.getElementById("dashboard-admin-request-panel");
    dom.adminRequestStatus = document.getElementById("dashboard-admin-request-status");
    dom.adminNotices = document.getElementById("dashboard-admin-notices");
    dom.adminCreatePanel = document.getElementById("dashboard-admin-create-panel");
    dom.adminCreateForm = document.getElementById("dashboard-admin-create-form");
    dom.adminCreateStatus = document.getElementById("dashboard-admin-create-status");
    dom.adminCreateCancel = document.getElementById("dashboard-admin-create-cancel");
    dom.publicLink = document.getElementById("dashboard-public-link");
    dom.logout = document.getElementById("dashboard-logout-btn");
    dom.profileCard = document.getElementById("profile-card");
    dom.calendarCard = document.getElementById("calendar-card");
    dom.timelineCard = document.getElementById("timeline-card");
    dom.bookingRequestsCard = document.getElementById("booking-requests-card");
    dom.accountCard = document.getElementById("account-card");
    dom.profileToggle = document.getElementById("profile-toggle-btn");
    dom.profileBody = document.getElementById("profile-card-body");
    dom.profileForm = document.getElementById("profile-form");
    dom.profileStatus = document.getElementById("profile-status");
    dom.profileStatusBottom = document.getElementById("profile-status-bottom");
    dom.profilePublish = document.getElementById("profile-publish-btn");
    dom.profilePublishBottom = document.getElementById("profile-publish-btn-bottom");
    dom.profileReset = document.getElementById("profile-reset-btn");
    dom.profileResetBottom = document.getElementById("profile-reset-btn-bottom");
    dom.profileArtistIndicator = document.getElementById("profile-artist-indicator");
    dom.profilePageMode = document.getElementById("page-mode-input");
    dom.profilePageFields = document.getElementById("profile-page-fields");
    dom.slugInput = document.getElementById("slug-input");
    dom.slugPreviewLink = document.getElementById("slug-preview-link");
    dom.audioHiddenInput = document.getElementById("audio-preview-input");
    dom.audioSourceInput = document.getElementById("audio-source-input");
    dom.audioUploadBtn = document.getElementById("audio-upload-btn");
    dom.audioClearBtn = document.getElementById("audio-clear-btn");
    dom.audioPreviewSlot = document.getElementById("audio-preview-slot");
    dom.videoUrlsInput = document.getElementById("video-urls-input");
    dom.photoUrlsInput = document.getElementById("photo-urls-input");
    dom.videoMediaList = document.getElementById("video-media-list");
    dom.photoMediaList = document.getElementById("photo-media-list");
    dom.videoAddLinkBtn = document.getElementById("video-add-link-btn");
    dom.videoUploadBtn = document.getElementById("video-upload-btn");
    dom.photoAddLinkBtn = document.getElementById("photo-add-link-btn");
    dom.photoUploadBtn = document.getElementById("photo-upload-btn");
    dom.accountToggle = document.getElementById("account-toggle-btn");
    dom.settingsStatus = document.getElementById("dashboard-settings-status");
    dom.accountBody = document.getElementById("account-card-body");
    dom.accountReset = document.getElementById("account-reset-btn");
    dom.accountArtistIndicator = document.getElementById("account-artist-indicator");
    dom.accountSettingsEmpty = document.getElementById("account-settings-empty");
    dom.accountSettingsContent = document.getElementById("account-settings-content");
    dom.accountCurrentUsername = document.getElementById("account-current-username");
    dom.accountCurrentEmail = document.getElementById("account-current-email");
    dom.accountCurrentPhone = document.getElementById("account-current-phone");
    dom.accountEmailStatus = document.getElementById("account-email-status");
    dom.accountIdentityForm = document.getElementById("account-identity-form");
    dom.accountPasswordForm = document.getElementById("account-password-form");
    dom.accountUsernameInput = document.getElementById("account-username-input");
    dom.accountEmailInput = document.getElementById("account-email-input");
    dom.accountPhoneInput = document.getElementById("account-phone-input");
    dom.accountPasswordInput = document.getElementById("account-password-input");
    dom.accountPasswordConfirmInput = document.getElementById("account-password-confirm-input");
    dom.accountAttachForm = document.getElementById("account-attach-form");
    dom.accountAttachEmailInput = document.getElementById("account-attach-email");
    dom.accountAttachUsernameInput = document.getElementById("account-attach-username");
    dom.accountAttachPasswordInput = document.getElementById("account-attach-password");
    dom.accountDeleteArtist = document.getElementById("account-delete-artist-btn");
    dom.accountOauthWrap = document.getElementById("account-oauth-wrap");
    dom.calendarBody = document.getElementById("calendar-card-body");
    dom.calendarToggle = document.getElementById("calendar-toggle-btn");
    dom.calendarStatus = document.getElementById("calendar-status");
    dom.calendarReset = document.getElementById("calendar-reset-btn");
    dom.calendarSave = document.getElementById("calendar-save-btn");
    dom.calendarAdd = document.getElementById("calendar-add-btn");
    dom.calendarEdit = document.getElementById("calendar-edit-btn");
    dom.calendarModeNote = document.getElementById("calendar-mode-note");
    dom.calendarEditActions = document.getElementById("calendar-edit-actions");
    dom.calendarArtistIndicator = document.getElementById("calendar-artist-indicator");
    dom.calendarDayDetail = document.getElementById("calendar-day-detail");
    dom.calendarDayDetailContent = document.getElementById("calendar-day-detail-content");
    dom.calendarDayDetailClose = document.getElementById("calendar-day-detail-close");
    dom.timelineBody = document.getElementById("timeline-card-body");
    dom.timelineToggle = document.getElementById("timeline-toggle-btn");
    dom.timelineStatus = document.getElementById("timeline-status");
    dom.timelineReset = document.getElementById("timeline-reset-btn");
    dom.timelineAdd = document.getElementById("timeline-add-btn");
    dom.timelineArtistIndicator = document.getElementById("timeline-artist-indicator");
    dom.bookingRequestsToggle = document.getElementById("booking-requests-toggle-btn");
    dom.bookingRequestsBody = document.getElementById("booking-requests-card-body");
    dom.bookingRequestsArtistIndicator = document.getElementById("booking-requests-artist-indicator");
    dom.bookingHistoryStatus = document.getElementById("booking-history-status");
    dom.bookingHistoryEmpty = document.getElementById("booking-history-empty");
    dom.bookingHistoryList = document.getElementById("booking-history-list");
    dom.timelineList = document.getElementById("timeline-events");
    dom.timelineDetail = document.getElementById("timeline-detail");
    dom.timelineDetailContent = document.getElementById("timeline-detail-content");
    dom.timelineDetailClose = document.getElementById("timeline-detail-close");
    dom.calendarMonthLabel = document.getElementById("calendar-month-label");
    dom.calendarGrid = document.getElementById("calendar-grid");
    dom.calendarPrev = document.getElementById("calendar-prev-btn");
    dom.calendarNext = document.getElementById("calendar-next-btn");
    dom.availabilityMonthAvailable = document.getElementById("availability-month-available-btn");
    dom.availabilityMonthUnavailable = document.getElementById("availability-month-unavailable-btn");
    dom.timelineCreatePanel = document.getElementById("timeline-event-create-panel");
    dom.eventCreateForm = document.getElementById("event-create-form");
    dom.eventCreateSubmit = document.getElementById("event-create-submit-btn");
    dom.eventDateModeInput = document.getElementById("event-date-mode-input");
    dom.eventSelectedDatesWrap = document.getElementById("event-selected-dates-wrap");
    dom.eventSelectedDatesInput = document.getElementById("event-selected-dates-input");
    dom.eventClientNameInput = document.getElementById("event-client-name-input");
    dom.eventClientEmailInput = document.getElementById("event-client-email-input");
    dom.eventClientPhoneInput = document.getElementById("event-client-phone-input");
    dom.eventRequireSignatureInput = document.getElementById("event-require-signature-input");
    dom.eventRequestSourceWrap = document.getElementById("event-request-source-wrap");
    dom.eventRequestSource = document.getElementById("event-request-source");
    dom.sectionToggles = document.querySelectorAll("[data-section-toggle]");
    dom.tour = document.getElementById("tour-modal");
    dom.tourDismiss = document.getElementById("tour-dismiss-btn");
    dom.tourDontShow = document.getElementById("tour-dont-show");
    dom.requestPickerModal = document.getElementById("request-picker-modal");
    dom.requestPickerList = document.getElementById("request-picker-list");
    dom.requestPickerClose = document.getElementById("request-picker-close-btn");
    dom.requestPickerSkip = document.getElementById("request-picker-skip-btn");
  }

  function isAdmin() {
    return B.state.user?.role === "admin";
  }

  function currentArtist() {
    return state.payload?.artist || null;
  }

  function currentArtistId() {
    return currentArtist()?.id || null;
  }

  function isEditingEventComposer() {
    return state.eventComposerMode === "edit" && Boolean(state.eventComposerEventId);
  }

  function currentEventComposerEvent() {
    if (!isEditingEventComposer()) return null;
    return listTimelineEvents().find((event) => String(event.id) === String(state.eventComposerEventId || "")) || null;
  }

  function listArtists() {
    return state.payload?.artists || [];
  }

  function listBookingRequests() {
    return state.payload?.bookingRequests || [];
  }

  function sortBookingRequestsBySubmittedDate(requests) {
    return [...(requests || [])].sort((left, right) => {
      return (
        String(right.createdAt || "").localeCompare(String(left.createdAt || "")) ||
        Number(right.id) - Number(left.id)
      );
    });
  }

  function listPendingBookingRequests() {
    return sortBookingRequestsBySubmittedDate(
      listBookingRequests().filter((request) => request.status === "new")
    );
  }

  function listSignatureNotifications() {
    return state.payload?.signatureNotifications || [];
  }

  function currentEventById(eventId) {
    return (state.payload?.events || []).find((event) => String(event.id) === String(eventId)) || null;
  }

  function getArtistPendingNoticeKinds(event) {
    if (!event || isAdmin()) return [];
    return [
      !event.artistAcknowledgedAt ? "event" : "",
      Boolean(event.clientPaidAt) !== Boolean(event.clientPaidArtistSeenState) ? "client_paid" : "",
      Boolean(event.artistPaidAt) !== Boolean(event.artistPaidArtistSeenState) ? "artist_paid" : ""
    ].filter(Boolean);
  }

  function listArtistEventNotifications() {
    if (isAdmin()) return [];
    return [...(state.payload?.events || [])]
      .filter((event) => getArtistPendingNoticeKinds(event).length > 0)
      .sort((left, right) => {
        return (
          String(right.updatedAt || right.createdAt || "").localeCompare(String(left.updatedAt || left.createdAt || "")) ||
          Number(right.id) - Number(left.id)
        );
      });
  }

  function currentSelectedBookingRequest() {
    const requestId = String(state.selectedBookingRequestId || "");
    return listBookingRequests().find((request) => String(request.id) === requestId) || null;
  }

  function createTranslations(esValue) {
    const es = String(esValue || "").trim();
    return { es, en: es };
  }

  function createTranslationsFromInput(id) {
    return createTranslations(document.getElementById(id)?.value || "");
  }

  function getAdminGreetingName() {
    const username = String(B.state.user?.username || "").trim();
    if (!username || username.toLowerCase() === "admin") {
      return "Javi";
    }
    return username;
  }

  function currentArtistLabel() {
    return B.translateContent(currentArtist()?.displayName);
  }

  function getSectionElements(section) {
    const map = {
      profile: { toggle: dom.profileToggle, body: dom.profileBody, card: dom.profileCard },
      calendar: { toggle: dom.calendarToggle, body: dom.calendarBody, card: dom.calendarCard },
      timeline: { toggle: dom.timelineToggle, body: dom.timelineBody, card: dom.timelineCard },
      bookingRequests: { toggle: dom.bookingRequestsToggle, body: dom.bookingRequestsBody, card: dom.bookingRequestsCard },
      account: { toggle: dom.accountToggle, body: dom.accountBody, card: dom.accountCard }
    };
    return map[section] || {};
  }

  function setSectionExpanded(section, expanded) {
    state.sectionExpanded[section] = Boolean(expanded);
    const { toggle, body, card } = getSectionElements(section);
    toggle?.setAttribute("aria-expanded", state.sectionExpanded[section] ? "true" : "false");
    body?.classList.toggle("hidden", !state.sectionExpanded[section]);
    card?.classList.toggle("section-collapsed", !state.sectionExpanded[section]);
    if (section === "calendar" && state.sectionExpanded[section]) {
      queueCalendarStateFontSizeUpdate();
    }
  }

  function toggleSection(section) {
    const nextExpanded = !state.sectionExpanded[section];
    setSectionExpanded(section, nextExpanded);
    if ((section === "calendar" || section === "timeline") && window.matchMedia("(min-width: 900px)").matches) {
      setSectionExpanded(section === "calendar" ? "timeline" : "calendar", nextExpanded);
    }
  }

  function ensureScheduleSectionVisible(section = "timeline") {
    setSectionExpanded(section, true);
    if ((section === "calendar" || section === "timeline") && window.matchMedia("(min-width: 900px)").matches) {
      setSectionExpanded(section === "calendar" ? "timeline" : "calendar", true);
    }
  }

  function scrollCardToTop(card) {
    if (!card) return;
    window.requestAnimationFrame(() => {
      const top = Math.max(0, card.getBoundingClientRect().top + window.scrollY - 12);
      window.scrollTo({
        top,
        behavior: "smooth"
      });
    });
  }

  function renderSectionIndicators() {
    const artistLabel = isAdmin() ? (currentArtistLabel() || "") : "";
    [
      dom.profileArtistIndicator,
      dom.calendarArtistIndicator,
      dom.timelineArtistIndicator,
      dom.bookingRequestsArtistIndicator,
      dom.accountArtistIndicator
    ].forEach((element) => {
      if (element) {
        element.textContent = artistLabel;
        element.classList.toggle("hidden", !artistLabel);
      }
    });
  }

  function normalizeSlugPreview(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    let candidate = raw;
    if (/^https?:\/\//i.test(raw)) {
      try {
        candidate = new URL(raw).pathname.split("/").filter(Boolean).at(-1) || "";
      } catch {
        candidate = raw;
      }
    } else if (raw.includes("/")) {
      candidate = raw.split("/").filter(Boolean).at(-1) || raw;
    }

    try {
      candidate = decodeURIComponent(candidate);
    } catch {
      candidate = candidate;
    }

    return candidate
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  function updateSlugPreview() {
    if (!dom.slugPreviewLink) return;
    const candidate = normalizeSlugPreview(dom.slugInput?.value || "");
    if (!candidate) {
      dom.slugPreviewLink.textContent = "";
      dom.slugPreviewLink.removeAttribute("href");
      return;
    }

    const href = `/artists/${candidate}/`;
    dom.slugPreviewLink.href = href;
    dom.slugPreviewLink.textContent = href;
  }

  function toDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getCalendarMeasureContext() {
    if (!calendarMeasureContext) {
      calendarMeasureContext = document.createElement("canvas").getContext("2d");
    }
    return calendarMeasureContext;
  }

  function updateCalendarStateFontSize() {
    if (!dom.calendarGrid) return;
    const sampleDay = dom.calendarGrid.querySelector(".calendar-day:not(.muted)");
    if (!sampleDay) return;

    const dayWidth = sampleDay.getBoundingClientRect().width;
    if (!dayWidth) return;

    const availableWidth = Math.max(dayWidth - 16, 24);
    const context = getCalendarMeasureContext();
    if (!context) return;

    const fontFamily = window.getComputedStyle(sampleDay).fontFamily || '"Inter", sans-serif';
    const baseFontSize = 10;
    context.font = `${baseFontSize}px ${fontFamily}`;

    const longestWidth = Math.max(
      context.measureText(B.t("available")).width,
      context.measureText(B.t("unavailable")).width
    );

    if (!longestWidth) return;

    const nextFontSize = Math.max(5, Math.min(baseFontSize, (availableWidth / longestWidth) * baseFontSize));
    dom.calendarGrid.style.setProperty("--calendar-day-state-font-size", `${nextFontSize.toFixed(2)}px`);

    const eventFontSize = Math.max(5, nextFontSize);
    const eventLabels = dom.calendarGrid.querySelectorAll(".calendar-day-event");
    context.font = `${baseFontSize}px ${fontFamily}`;
    eventLabels.forEach((label) => {
      const labelText = String(label.textContent || "").trim();
      if (!labelText) {
        label.style.fontSize = "";
        return;
      }
      const labelWidth = context.measureText(labelText).width;
      if (labelWidth > availableWidth) {
        label.style.fontSize = `${eventFontSize.toFixed(2)}px`;
      } else {
        label.style.fontSize = "";
      }
    });
  }

  function queueCalendarStateFontSizeUpdate() {
    window.cancelAnimationFrame(calendarStateFontFrame);
    calendarStateFontFrame = window.requestAnimationFrame(() => {
      updateCalendarStateFontSize();
    });
  }

  function currentAvailabilityMode() {
    return normalizeAvailabilityMode(currentArtist()?.availabilityMode || "all_unavailable");
  }

  function normalizeAvailabilityMode(mode) {
    return mode === "all_available" ? "all_available" : "all_unavailable";
  }

  function normalizeAvailabilityState(availabilityState = {}) {
    return {
      mode: normalizeAvailabilityMode(availabilityState.mode),
      dates: sortDateList(availabilityState.dates || [])
    };
  }

  function isDateAvailableInDashboard(iso) {
    if (hasScheduledEventOnDate(iso)) return false;
    const availability = new Set(state.payload?.availability || []);
    const mode = currentAvailabilityMode();
    const todayIso = toDateString(new Date());
    if (mode === "all_available" && iso >= todayIso) {
      return !availability.has(iso);
    }
    return availability.has(iso);
  }

  function toVideoPayload(lines) {
    return B.linesToList(lines).map((url) => ({
      url,
      title: { es: "Video", en: "Video" }
    }));
  }

  function toPhotoPayload(lines, alt) {
    return B.linesToList(lines).map((url) => ({
      url,
      alt: { es: alt, en: alt }
    }));
  }

  function normalizeProfileMediaUrls(urls) {
    const seen = new Set();
    return (urls || [])
      .map((url) => String(url || "").trim())
      .filter((url) => {
        if (!url || seen.has(url)) return false;
        seen.add(url);
        return true;
      });
  }

  function buildProfilePhotoLibrary(artist) {
    return normalizeProfileMediaUrls([
      ...(artist.photos || []).map((item) => item.url),
      artist.cardImageUrl || "",
      artist.heroImageUrl || ""
    ]);
  }

  function ensureProfilePhotoSelections() {
    const photoUrls = normalizeProfileMediaUrls(B.linesToList(dom.photoUrlsInput?.value || ""));
    const firstPhoto = photoUrls[0] || "";
    const cardInput = document.getElementById("card-image-input");
    const heroInput = document.getElementById("hero-image-input");
    if (!cardInput || !heroInput) return;

    if (cardInput.value && !photoUrls.includes(cardInput.value)) {
      cardInput.value = firstPhoto;
    }
    if (heroInput.value && !photoUrls.includes(heroInput.value)) {
      heroInput.value = firstPhoto;
    }
    if (!cardInput.value && firstPhoto) {
      cardInput.value = firstPhoto;
    }
    if (!heroInput.value && firstPhoto) {
      heroInput.value = firstPhoto;
    }
    if (!firstPhoto) {
      cardInput.value = "";
      heroInput.value = "";
    }
  }

  function setProfilePhotoRole(role, url) {
    const input = document.getElementById(role === "card" ? "card-image-input" : "hero-image-input");
    if (!input) return;
    input.value = String(url || "").trim();
    state.profileStatusOverride = null;
    syncProfileDraftState();
    renderProfileMediaList("photo");
  }

  function isHostedVideoUrl(url) {
    const text = String(url || "").trim();
    return Boolean(text) && (text.startsWith("/uploads/") || /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(text));
  }

  function isAudioPreviewUrl(url) {
    const text = String(url || "").trim();
    return Boolean(text) && (text.startsWith("/uploads/") || /\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i.test(text));
  }

  function renderDashboardMediaPreview(kind, url) {
    const safeUrl = B.escapeHtml(url || "");
    if (!safeUrl) return "";

    if (kind === "photo") {
      return `<img src="${safeUrl}" alt="" />`;
    }

    if (kind === "video") {
      if (isHostedVideoUrl(url)) {
        return `
          <video controls preload="metadata">
            <source src="${safeUrl}" />
          </video>
        `;
      }
      return B.renderVideoEmbed(url, B.t("videos"));
    }

    if (kind === "audio") {
      if (isAudioPreviewUrl(url)) {
        return `
          <audio controls preload="none">
            <source src="${safeUrl}" />
          </audio>
        `;
      }
      return `<a class="btn outline" href="${safeUrl}" target="_blank" rel="noreferrer">${B.escapeHtml(B.t("open_media_link"))}</a>`;
    }

    return "";
  }

  function getProfileMediaHiddenInput(kind) {
    if (kind === "video") return dom.videoUrlsInput;
    if (kind === "photo") return dom.photoUrlsInput;
    if (kind === "audio") return dom.audioHiddenInput;
    return null;
  }

  function getProfileMediaListElement(kind) {
    if (kind === "video") return dom.videoMediaList;
    if (kind === "photo") return dom.photoMediaList;
    return null;
  }

  function buildProfileMediaItemHtml(kind, url = "") {
    const trimmed = String(url || "").trim();
    const previewHtml = renderDashboardMediaPreview(kind, trimmed);
    const uploadLabel = kind === "video" ? B.t("upload_video") : B.t("upload_image");
    const emptyTextKey = kind === "video" ? "video_media_empty" : "photo_media_empty";
    const cardSelected = kind === "photo" && trimmed && trimmed === document.getElementById("card-image-input")?.value;
    const heroSelected = kind === "photo" && trimmed && trimmed === document.getElementById("hero-image-input")?.value;
    return `
      <div class="backend-media-item" data-media-item="${kind}">
        <div class="backend-media-item-preview ${previewHtml ? "" : "is-empty"}" data-media-preview>
          ${previewHtml || `<span class="backend-hint">${B.escapeHtml(B.t(emptyTextKey))}</span>`}
        </div>
        <div class="backend-media-item-controls">
          <input
            type="text"
            value="${B.escapeHtml(trimmed)}"
            data-media-url-input="${kind}"
            placeholder="${B.escapeHtml(B.t("media_source_placeholder"))}" />
          <div class="backend-inline-actions">
            ${kind === "photo" ? `
              <button class="btn outline ${cardSelected ? "is-active" : ""}" type="button" data-media-role="card" data-media-role-url="${B.escapeHtml(trimmed)}" ${trimmed ? "" : "disabled"}>${B.escapeHtml(B.t("card_image"))}</button>
              <button class="btn outline ${heroSelected ? "is-active" : ""}" type="button" data-media-role="hero" data-media-role-url="${B.escapeHtml(trimmed)}" ${trimmed ? "" : "disabled"}>${B.escapeHtml(B.t("hero_image"))}</button>
            ` : ""}
            <button class="btn outline" type="button" data-media-upload="${kind}">${B.escapeHtml(uploadLabel)}</button>
            <button class="btn outline" type="button" data-media-remove="${kind}">${B.escapeHtml(B.t("remove_media"))}</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderProfileMediaList(kind) {
    const list = getProfileMediaListElement(kind);
    const input = getProfileMediaHiddenInput(kind);
    if (!list || !input) return;
    const urls = normalizeProfileMediaUrls(B.linesToList(input.value));
    if (kind === "photo") {
      ensureProfilePhotoSelections();
    }
    list.innerHTML = urls.length
      ? urls.map((url) => buildProfileMediaItemHtml(kind, url)).join("")
      : `<div class="backend-media-empty">${B.escapeHtml(B.t(kind === "video" ? "video_media_empty" : "photo_media_empty"))}</div>`;
  }

  function renderAudioMediaField() {
    if (!dom.audioSourceInput || !dom.audioHiddenInput || !dom.audioPreviewSlot || !dom.audioClearBtn) return;
    const url = String(dom.audioHiddenInput.value || "").trim();
    dom.audioSourceInput.value = url;
    const previewHtml = renderDashboardMediaPreview("audio", url);
    dom.audioPreviewSlot.innerHTML = previewHtml;
    dom.audioPreviewSlot.classList.toggle("hidden", !previewHtml);
    dom.audioClearBtn.classList.toggle("hidden", !url);
  }

  function renderProfileMediaManagers() {
    renderAudioMediaField();
    renderProfileMediaList("video");
    renderProfileMediaList("photo");
  }

  function syncAudioMediaField(options = {}) {
    if (!dom.audioHiddenInput || !dom.audioSourceInput) return;
    dom.audioHiddenInput.value = String(dom.audioSourceInput.value || "").trim();
    if (dom.audioHiddenInput.value) {
      document.getElementById("section-audio-input").checked = true;
    }
    if (!options.skipRender) {
      renderAudioMediaField();
    }
    if (!options.skipDraftSync) {
      state.profileStatusOverride = null;
      syncProfileDraftState();
    }
  }

  function syncProfileMediaUrls(kind, options = {}) {
    const input = getProfileMediaHiddenInput(kind);
    const list = getProfileMediaListElement(kind);
    if (!input) return [];

    const urls = list
      ? normalizeProfileMediaUrls(
          [...list.querySelectorAll(`[data-media-url-input="${kind}"]`)].map((field) => field.value)
        )
      : normalizeProfileMediaUrls([input.value]);

    input.value = urls.join("\n");
    if (kind === "photo") {
      ensureProfilePhotoSelections();
    }
    if (kind === "video" && urls.length) {
      document.getElementById("section-videos-input").checked = true;
    }
    if (kind === "photo" && urls.length) {
      document.getElementById("section-photos-input").checked = true;
    }
    if (!options.skipDraftSync) {
      state.profileStatusOverride = null;
      syncProfileDraftState();
    }
    return urls;
  }

  function appendBlankProfileMediaItem(kind) {
    const list = getProfileMediaListElement(kind);
    if (!list) return;
    const empty = list.querySelector(".backend-media-empty");
    if (empty) list.innerHTML = "";
    list.insertAdjacentHTML("beforeend", buildProfileMediaItemHtml(kind, ""));
    list.querySelector(`[data-media-item="${kind}"]:last-child [data-media-url-input="${kind}"]`)?.focus();
  }

  async function uploadDashboardFile(kind, file) {
    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("file", file);
    if (isAdmin()) {
      formData.append("artistId", String(currentArtistId()));
    }
    const payload = await B.api("/api/dashboard/upload", {
      method: "POST",
      body: formData
    });
    return payload.file.url;
  }

  async function promptMediaUpload(kind, { multiple = false, onComplete } = {}) {
    const picker = document.createElement("input");
    picker.type = "file";
    picker.accept = kind === "photo" ? "image/*" : kind === "video" ? "video/*" : "audio/*";
    picker.multiple = Boolean(multiple);

    picker.addEventListener("change", async () => {
      const files = [...(picker.files || [])];
      if (!files.length) return;
      try {
        const uploadedUrls = [];
        for (const file of files) {
          uploadedUrls.push(await uploadDashboardFile(kind, file));
        }
        if (typeof onComplete === "function") {
          onComplete(uploadedUrls);
        }
      } catch (error) {
        state.profileStatusOverride = { message: error.message, tone: "error" };
        renderProfileStatus();
      }
    }, { once: true });

    picker.click();
  }

  function setArtistQueryParam(artistId) {
    const url = new URL(window.location.href);
    if (artistId) url.searchParams.set("artistId", artistId);
    else url.searchParams.delete("artistId");
    window.history.replaceState({}, "", url);
  }

  function setProfileExpanded(expanded) {
    setSectionExpanded("profile", expanded);
  }

  function safeGetStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function safeSetStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      return null;
    }
    return value;
  }

  function safeRemoveStorage(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      return null;
    }
    return null;
  }

  function readStoredJson(key) {
    if (!key) return null;
    const raw = safeGetStorage(key);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    } catch {
      safeRemoveStorage(key);
      return null;
    }
  }

  function sortDateList(dates) {
    return [...new Set(dates || [])].map((item) => String(item)).sort();
  }

  function getDraftStorageKey(prefix, artistId = currentArtistId()) {
    if (!artistId || !B.state.user?.id) return null;
    return `sophora_${prefix}_draft_${B.state.user.id}_${artistId}`;
  }

  function getProfileDraftKey(artistId = currentArtistId()) {
    return getDraftStorageKey("profile", artistId);
  }

  function getAvailabilityDraftKey(artistId = currentArtistId()) {
    return getDraftStorageKey("availability", artistId);
  }

  function getEventCreateDraftKey(artistId = currentArtistId()) {
    return getDraftStorageKey("event_create", artistId);
  }

  function getEventEditDraftKey(artistId = currentArtistId()) {
    return getDraftStorageKey("event_edit", artistId);
  }

  function getAccountDraftKey(artistId = currentArtistId()) {
    return getDraftStorageKey("account", artistId);
  }

  function buildPublishedProfileState(artist) {
    return {
      slug: artist.slug || "",
      publicStatus: artist.publicStatus || "published",
      pageMode: artist.pageMode || "page",
      displayNameEs: artist.displayName?.es || "",
      shortBioEs: artist.shortBio?.es || "",
      aboutEs: artist.about?.es || "",
      showEs: artist.showDetails?.es || "",
      cardImageUrl: artist.cardImageUrl || "",
      heroImageUrl: artist.heroImageUrl || "",
      cardAudioUrl: artist.cardAudioUrl || "",
      technicalRiderPath: artist.technicalRiderPath || "",
      videoUrls: (artist.videos || []).map((item) => item.url).join("\n"),
      photoUrls: buildProfilePhotoLibrary(artist).join("\n"),
      pageSections: {
        about: Boolean(artist.pageSections?.about),
        audio: artist.pageSections?.audio ?? Boolean(artist.cardAudioUrl),
        videos: Boolean(artist.pageSections?.videos),
        photos: Boolean(artist.pageSections?.photos),
        showDetails: Boolean(artist.pageSections?.showDetails),
        technicalRider: Boolean(artist.pageSections?.technicalRider)
      }
    };
  }

  function readProfileFormState() {
    return {
      slug: document.getElementById("slug-input").value,
      publicStatus: document.getElementById("public-status-input").value,
      pageMode: document.getElementById("page-mode-input").value,
      displayNameEs: document.getElementById("display-name-es").value,
      shortBioEs: document.getElementById("short-bio-es").value,
      aboutEs: document.getElementById("about-es").value,
      showEs: document.getElementById("show-es").value,
      cardImageUrl: document.getElementById("card-image-input").value,
      heroImageUrl: document.getElementById("hero-image-input").value,
      cardAudioUrl: document.getElementById("audio-preview-input").value,
      technicalRiderPath: document.getElementById("technical-rider-input").value,
      videoUrls: document.getElementById("video-urls-input").value,
      photoUrls: document.getElementById("photo-urls-input").value,
      pageSections: {
        about: document.getElementById("section-about-input").checked,
        audio: document.getElementById("section-audio-input").checked,
        videos: document.getElementById("section-videos-input").checked,
        photos: document.getElementById("section-photos-input").checked,
        showDetails: document.getElementById("section-show-input").checked,
        technicalRider: document.getElementById("section-rider-input").checked
      }
    };
  }

  function applyProfileFormState(formState) {
    document.getElementById("slug-input").value = formState.slug || "";
    document.getElementById("public-status-input").value = formState.publicStatus || "published";
    if (dom.profilePageMode) dom.profilePageMode.value = formState.pageMode || "page";
    document.getElementById("display-name-es").value = formState.displayNameEs || "";
    document.getElementById("short-bio-es").value = formState.shortBioEs || "";
    document.getElementById("about-es").value = formState.aboutEs || "";
    document.getElementById("show-es").value = formState.showEs || "";
    document.getElementById("card-image-input").value = formState.cardImageUrl || "";
    document.getElementById("hero-image-input").value = formState.heroImageUrl || "";
    document.getElementById("audio-preview-input").value = formState.cardAudioUrl || "";
    document.getElementById("technical-rider-input").value = formState.technicalRiderPath || "";
    document.getElementById("video-urls-input").value = formState.videoUrls || "";
    document.getElementById("photo-urls-input").value = formState.photoUrls || "";
    document.getElementById("card-image-input").value = formState.cardImageUrl || "";
    document.getElementById("hero-image-input").value = formState.heroImageUrl || "";
    document.getElementById("section-about-input").checked = Boolean(formState.pageSections?.about);
    document.getElementById("section-audio-input").checked = Boolean(formState.pageSections?.audio);
    document.getElementById("section-videos-input").checked = Boolean(formState.pageSections?.videos);
    document.getElementById("section-photos-input").checked = Boolean(formState.pageSections?.photos);
    document.getElementById("section-show-input").checked = Boolean(formState.pageSections?.showDetails);
    document.getElementById("section-rider-input").checked = Boolean(formState.pageSections?.technicalRider);
    updateSlugPreview();
    renderProfilePageModeState();
    renderProfileMediaManagers();
  }

  function renderProfilePageModeState() {
    const bookingOnly = (dom.profilePageMode?.value || "page") === "booking_only";
    dom.profilePageFields?.querySelectorAll("[data-page-only-field='true']").forEach((field) => {
      field.classList.toggle("hidden", bookingOnly);
      field.querySelectorAll("input, textarea, select, button").forEach((element) => {
        element.disabled = bookingOnly;
      });
    });
  }

  function loadStoredProfileDraft(artistId = currentArtistId()) {
    return readStoredJson(getProfileDraftKey(artistId));
  }

  function clearStoredProfileDraft(artistId = currentArtistId()) {
    const key = getProfileDraftKey(artistId);
    if (key) safeRemoveStorage(key);
  }

  function renderProfileStatus() {
    const statusMessage = state.profileDirty
      ? B.t("unsaved_changes")
      : (state.profileStatusOverride?.message || "");
    const statusTone = state.profileDirty
      ? "error"
      : (state.profileStatusOverride?.tone || "info");

    [dom.profileStatus, dom.profileStatusBottom].forEach((element) => {
      if (!element) return;
      B.setStatus(element, statusMessage, statusTone);
    });

    [dom.profileReset, dom.profileResetBottom].forEach((element) => {
      element?.classList.toggle("hidden", !state.profileDirty);
    });

    [dom.profilePublish, dom.profilePublishBottom].forEach((element) => {
      if (!element) return;
      element.disabled = !state.profileDirty;
    });
  }

  function resetProfileDraftState() {
    if (!state.profilePublishedState) return;
    state.suspendProfileSync = true;
    applyProfileFormState(state.profilePublishedState);
    state.suspendProfileSync = false;
    clearStoredProfileDraft();
    state.profileDirty = false;
    state.profileStatusOverride = null;
    renderProfileStatus();
  }

  function syncProfileDraftState(options = {}) {
    if (state.suspendProfileSync || !currentArtist()) return;

    const currentState = readProfileFormState();
    const publishedString = JSON.stringify(state.profilePublishedState || {});
    const currentString = JSON.stringify(currentState);
    const hasUnsavedChanges = currentString !== publishedString;
    const draftKey = getProfileDraftKey();

    state.profileDirty = hasUnsavedChanges;

    if (hasUnsavedChanges && draftKey) {
      safeSetStorage(draftKey, currentString);
      if (!options.keepStatusOverride) {
        state.profileStatusOverride = null;
      }
    } else {
      clearStoredProfileDraft();
      if (!options.keepStatusOverride) {
        state.profileStatusOverride = null;
      }
    }

    renderProfileStatus();
  }

  function loadProfileEditor(artist) {
    state.profilePublishedState = buildPublishedProfileState(artist);
    state.suspendProfileSync = true;
    applyProfileFormState(state.profilePublishedState);

    const draft = loadStoredProfileDraft(artist.id);
    if (draft) {
      applyProfileFormState({
        ...state.profilePublishedState,
        ...draft,
        pageSections: {
          ...state.profilePublishedState.pageSections,
          ...draft.pageSections
        }
      });
    }

    state.suspendProfileSync = false;
    syncProfileDraftState({ keepStatusOverride: false });
  }

  function collectProfilePayload() {
    const artist = currentArtist();
    const formState = readProfileFormState();
    const artistName = formState.displayNameEs || B.translateContent(artist.displayName);
    return {
      artistId: currentArtistId(),
      slug: formState.slug,
      publicStatus: formState.publicStatus,
      pageMode: formState.pageMode,
      displayName: createTranslations(formState.displayNameEs),
      shortBio: createTranslations(formState.shortBioEs),
      about: createTranslations(formState.aboutEs),
      showDetails: createTranslations(formState.showEs),
      cardImageUrl: formState.cardImageUrl,
      heroImageUrl: formState.heroImageUrl,
      cardAudioUrl: formState.cardAudioUrl,
      technicalRiderPath: formState.technicalRiderPath,
      videos: toVideoPayload(formState.videoUrls),
      photos: toPhotoPayload(formState.photoUrls, artistName),
      pageSections: formState.pageSections
    };
  }

  function buildPublishedAvailabilityState(artist) {
    return normalizeAvailabilityState({
      mode: artist?.availabilityMode || "all_unavailable",
      dates: state.payload?.availability || []
    });
  }

  function readAvailabilityState() {
    return normalizeAvailabilityState({
      mode: currentAvailabilityMode(),
      dates: state.payload?.availability || []
    });
  }

  function applyAvailabilityState(availabilityState) {
    if (!state.payload?.artist) return;
    const normalized = normalizeAvailabilityState(availabilityState);
    state.payload.artist.availabilityMode = normalized.mode;
    state.payload.availability = normalized.dates;
    renderCalendar();
  }

  function loadStoredAvailabilityDraft(artistId = currentArtistId()) {
    return readStoredJson(getAvailabilityDraftKey(artistId));
  }

  function clearStoredAvailabilityDraft(artistId = currentArtistId()) {
    const key = getAvailabilityDraftKey(artistId);
    if (key) safeRemoveStorage(key);
  }

  function renderAvailabilityStatus() {
    if (state.availabilityDirty) {
      B.setStatus(dom.calendarStatus, B.t("unsaved_changes"), "error");
    } else if (state.availabilityStatusOverride?.message) {
      B.setStatus(dom.calendarStatus, state.availabilityStatusOverride.message, state.availabilityStatusOverride.tone || "info");
    } else {
      B.setStatus(dom.calendarStatus, "", "info");
    }

    dom.calendarEdit.textContent = B.t("calendar_edit");
    dom.calendarEdit?.classList.toggle("hidden", state.calendarEditMode);
    dom.calendarEditActions?.classList.toggle("hidden", !state.calendarEditMode);
    dom.calendarModeNote?.classList.toggle("hidden", !state.calendarEditMode);
    dom.calendarReset?.classList.toggle("hidden", !state.calendarEditMode);
    dom.calendarSave?.classList.toggle("hidden", !state.calendarEditMode);
    dom.calendarSave.disabled = !state.availabilityDirty;
  }

  function syncAvailabilityDraftState(options = {}) {
    if (!currentArtist()) return;

    const currentState = readAvailabilityState();
    const publishedString = JSON.stringify(state.availabilityPublishedState || {});
    const currentString = JSON.stringify(currentState);
    const hasUnsavedChanges = currentString !== publishedString;
    const draftKey = getAvailabilityDraftKey();

    state.availabilityDirty = hasUnsavedChanges;

    if (hasUnsavedChanges && draftKey) {
      safeSetStorage(draftKey, currentString);
      if (!options.keepStatusOverride) {
        state.availabilityStatusOverride = null;
      }
    } else {
      clearStoredAvailabilityDraft();
      if (!options.keepStatusOverride) {
        state.availabilityStatusOverride = null;
      }
    }

    renderAvailabilityStatus();
  }

  function loadAvailabilityEditor(artist) {
    state.availabilityPublishedState = buildPublishedAvailabilityState(artist);
    applyAvailabilityState(state.availabilityPublishedState);
    state.calendarEditMode = false;

    const draft = loadStoredAvailabilityDraft(artist.id);
    if (draft) {
      const normalizedDraft = normalizeAvailabilityState({
        mode: draft.mode || state.availabilityPublishedState.mode,
        dates: draft.dates || []
      });
      const draftMatchesPublished = JSON.stringify(normalizedDraft) === JSON.stringify(state.availabilityPublishedState);
      if (draftMatchesPublished) {
        clearStoredAvailabilityDraft(artist.id);
      } else {
        state.calendarEditMode = true;
        applyAvailabilityState({
          ...state.availabilityPublishedState,
          ...normalizedDraft
        });
      }
    }

    syncAvailabilityDraftState({ keepStatusOverride: false });
  }

  function buildDefaultEventCreateState() {
    const artistName = B.translateContent(currentArtist()?.displayName) || "";
    return {
      bookingRequestId: "",
      title: artistName ? `${artistName} gig` : "",
      dateMode: "single",
      selectedDates: "",
      venue: "",
      engagementStartTime: "",
      engagementEndTime: "",
      startDate: "",
      endDate: "",
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      paymentAmount: "",
      currency: "CLP",
      requireSignature: true,
      createArtistPdf: true,
      createClientPdf: true,
      contractPath: "",
      clientPdfPath: "",
      notes: ""
    };
  }

  function readEventCreateState() {
    return {
      ...buildDefaultEventCreateState(),
      ...sanitizeEventComposerState(state.eventCreateDraft || {}),
      bookingRequestId: state.selectedBookingRequestId ? String(state.selectedBookingRequestId) : ""
    };
  }

  function applyEventCreateState(eventState) {
    state.selectedBookingRequestId = eventState?.bookingRequestId || null;
    state.eventCreateDraft = {
      ...buildDefaultEventCreateState(),
      ...sanitizeEventComposerState(eventState || {}),
      bookingRequestId: eventState?.bookingRequestId || state.selectedBookingRequestId || "",
      paymentAmount: eventState?.paymentAmount ? String(eventState.paymentAmount) : buildDefaultEventCreateState().paymentAmount,
      requireSignature: true,
      createArtistPdf: true,
      createClientPdf: true
    };
    renderEventComposerState();
  }

  function loadStoredEventCreateDraft(artistId = currentArtistId()) {
    return readStoredJson(getEventCreateDraftKey(artistId));
  }

  function loadCurrentEventComposerDraft() {
    if (isEditingEventComposer()) {
      return loadStoredEventEditDrafts()[String(state.eventComposerEventId || "")] || null;
    }
    return loadStoredEventCreateDraft();
  }

  function clearCurrentEventComposerDraft() {
    if (isEditingEventComposer()) {
      clearStoredEventEditDraft(String(state.eventComposerEventId || ""));
      return;
    }
    clearStoredEventCreateDraft();
  }

  function clearStoredEventCreateDraft(artistId = currentArtistId()) {
    const key = getEventCreateDraftKey(artistId);
    if (key) safeRemoveStorage(key);
  }

  function parseSelectedDatesInput(rawValue) {
    return String(rawValue || "")
      .split(/\r?\n|,/)
      .map((value) => value.trim())
      .filter(Boolean)
      .sort();
  }

  function formatRequestDates(request) {
    if (!request) return "";
    if (request.dateMode === "multiple") {
      return (request.selectedDates || []).join(", ");
    }
    if (request.dateMode === "range") {
      return `${request.startDate} - ${request.endDate}`;
    }
    return request.startDate || request.selectedDates?.[0] || "";
  }

  function formatMoneyLabel(amount, currency = "CLP") {
    if (amount === null || amount === undefined || amount === "") return "";
    return `${amount} ${currency}`;
  }

  function getArtistPayAmount(event) {
    const explicitAmount = Number(event?.artistPayAmount);
    if (Number.isFinite(explicitAmount) && explicitAmount >= 0) {
      return explicitAmount;
    }
    const grossAmount = Number(event?.paymentAmount);
    if (!Number.isFinite(grossAmount) || grossAmount <= 0) return 0;
    return Math.max(0, Math.floor(grossAmount * 0.9));
  }

  function getEventFinancialInfoLines(event, options = {}) {
    const adminView = options.adminView ?? isAdmin();
    const lines = [];
    if (adminView) {
      lines.push(`${B.t("payment_amount")}: ${formatMoneyLabel(event.paymentAmount, event.currency)}`);
    }
    lines.push(`${B.t("artist_pay")}: ${formatMoneyLabel(getArtistPayAmount(event), event.currency)}`);
    return lines;
  }

  function splitLegacyTimeWindow(value) {
    const text = String(value || "").trim();
    if (!text) return { startTime: "", endTime: "" };
    const match = text.match(/^(.+?)\s*-\s*(.+)$/);
    if (match) {
      return {
        startTime: match[1].trim(),
        endTime: match[2].trim()
      };
    }
    return { startTime: text, endTime: "" };
  }

  function resolveTimeWindow(entity) {
    const startTime = String(entity?.engagementStartTime || "").trim();
    const endTime = String(entity?.engagementEndTime || "").trim();
    if (startTime || endTime) {
      return { startTime, endTime };
    }
    return splitLegacyTimeWindow(entity?.engagementTime || "");
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

  function renderTimeFieldControl({ displayId, hiddenId, fieldName, value = "", hiddenAttribute = "", inputName = "" }) {
    const parts = splitTimeForDisplay(value);
    const hiddenAttr = hiddenAttribute || (inputName ? `name="${B.escapeHtml(inputName)}"` : "");
    return `
      <div class="time-field-combo" data-time-field-group="${B.escapeHtml(fieldName)}">
        <input
          id="${B.escapeHtml(displayId)}"
          type="text"
          inputmode="numeric"
          placeholder="07:00"
          value="${B.escapeHtml(parts.time)}"
          data-time-display="true" />
        <select data-time-meridiem="true" aria-label="${B.escapeHtml(fieldName)} meridiem">
          <option value="AM" ${parts.meridiem === "AM" ? "selected" : ""}>AM</option>
          <option value="PM" ${parts.meridiem === "PM" ? "selected" : ""}>PM</option>
        </select>
        <input id="${B.escapeHtml(hiddenId)}" type="hidden" ${hiddenAttr} value="${B.escapeHtml(value || "")}" />
      </div>
    `;
  }

  function syncDashboardTimeFieldGroup(group) {
    if (!group) return { valid: true, value: "" };
    const displayInput = group.querySelector("[data-time-display]");
    const meridiemInput = group.querySelector("[data-time-meridiem]");
    const hiddenInput = group.querySelector("input[type=\"hidden\"]");
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

  function sanitizeIntegerInputValue(value) {
    return String(value || "").replace(/[^\d]/g, "");
  }

  function findInvalidTimeFieldGroup(root) {
    if (!root) return null;
    return [...root.querySelectorAll("[data-time-field-group]")].find((group) => {
      const displayInput = group.querySelector("[data-time-display]");
      const result = syncDashboardTimeFieldGroup(group);
      return Boolean(displayInput?.value.trim()) && !result.valid;
    }) || null;
  }

  function buildTimeMetaLines(entity, { startLabelKey = "engagement_start_time", endLabelKey = "engagement_end_time" } = {}) {
    const { startTime, endTime } = resolveTimeWindow(entity);
    return [
      startTime ? `${B.t(startLabelKey)}: ${startTime}` : "",
      endTime ? `${B.t(endLabelKey)}: ${endTime}` : ""
    ].filter(Boolean);
  }

  function renderHintMetaLines(lines) {
    return lines
      .filter(Boolean)
      .map((line) => `<p class="backend-hint">${B.escapeHtml(line)}</p>`)
      .join("");
  }

  function renderInlineMetaLines(lines) {
    return lines
      .filter(Boolean)
      .map((line) => `<span>${B.escapeHtml(line)}</span>`)
      .join("");
  }

  function renderArtistPendingNoticePills(event) {
    const labels = {
      event: B.t("new_gig_notice"),
      client_paid: B.t("client_payment_update"),
      artist_paid: B.t("artist_payment_update")
    };
    return getArtistPendingNoticeKinds(event)
      .map((kind) => `<span class="backend-pill active">${B.escapeHtml(labels[kind] || kind)}</span>`)
      .join("");
  }

  function renderArtistPendingNoticeMessages(event) {
    const messages = [];
    if (getArtistPendingNoticeKinds(event).includes("client_paid")) {
      messages.push(B.t(event.clientPaidAt ? "client_paid_notice" : "client_unpaid_notice"));
    }
    if (getArtistPendingNoticeKinds(event).includes("artist_paid")) {
      messages.push(B.t(event.artistPaidAt ? "artist_paid_notice" : "artist_unpaid_notice"));
    }
    return renderHintMetaLines(messages);
  }

  function getEventPaymentMeta(event) {
    const clientPaid = Boolean(event?.clientPaidAt);
    const artistPaid = Boolean(event?.artistPaidAt);
    if (clientPaid || artistPaid) {
      return [
        clientPaid ? { key: "client_paid", active: true } : null,
        artistPaid ? { key: "artist_paid", active: true } : null
      ].filter(Boolean);
    }
    if (String(event?.paymentStatus || "").trim() === "waived") {
      return [{ key: "payment_waived", active: false }];
    }
    return [{ key: "payment_pending", active: false }];
  }

  function renderEventPaymentPills(event, options = {}) {
    const meta = getEventPaymentMeta(event);
    const filteredMeta = options.includePending === false
      ? meta.filter((item) => item.key !== "payment_pending")
      : meta;
    return filteredMeta
      .map((item) => `<span class="backend-pill ${item.active ? "active" : ""}">${B.escapeHtml(B.t(item.key))}</span>`)
      .join("");
  }

  function paymentPendingKey(eventId, field) {
    return `${eventId}:${field}`;
  }

  function isPaymentTogglePending(eventId, field) {
    return Boolean(state.eventPaymentPending[paymentPendingKey(eventId, field)]);
  }

  function deriveOptimisticPaymentStatus(clientPaidAt, artistPaidAt, fallbackStatus = "pending") {
    if (clientPaidAt && artistPaidAt) return "paid";
    if (clientPaidAt || artistPaidAt) return "partial";
    if (fallbackStatus === "waived") return "waived";
    return "pending";
  }

  function applyLocalEventPaymentState(eventId, field, nextValue) {
    const event = currentEventById(eventId);
    if (!event) return null;
    const previous = {
      clientPaidAt: event.clientPaidAt || "",
      artistPaidAt: event.artistPaidAt || "",
      paymentStatus: event.paymentStatus || "pending",
      updatedAt: event.updatedAt || ""
    };
    const now = new Date().toISOString();

    if (field === "clientPaid") {
      event.clientPaidAt = nextValue ? (event.clientPaidAt || now) : "";
    } else if (field === "artistPaid") {
      event.artistPaidAt = nextValue ? (event.artistPaidAt || now) : "";
    }

    event.paymentStatus = deriveOptimisticPaymentStatus(event.clientPaidAt, event.artistPaidAt, previous.paymentStatus);
    event.updatedAt = now;
    return previous;
  }

  function restoreLocalEventPaymentState(eventId, previous) {
    const event = currentEventById(eventId);
    if (!event || !previous) return;
    event.clientPaidAt = previous.clientPaidAt || "";
    event.artistPaidAt = previous.artistPaidAt || "";
    event.paymentStatus = previous.paymentStatus || "pending";
    event.updatedAt = previous.updatedAt || event.updatedAt || "";
  }

  function renderEventPaymentHintLines(event) {
    return renderHintMetaLines(
      getEventPaymentMeta(event).map((item) => B.t(item.key))
    );
  }

  function formatRequestNotificationMethods(request) {
    if (!request) return "";
    const methods = [];
    if (request.notifyByEmail) methods.push(B.t("booking_notify_email"));
    if (request.notifyBySms) methods.push(B.t("booking_notify_sms"));
    return methods.join(", ");
  }

  function sanitizeEventComposerState(eventState = {}) {
    const nextState = { ...(eventState || {}) };
    delete nextState.paymentStatus;
    delete nextState.status;
    delete nextState.clientPaid;
    delete nextState.artistPaid;
    nextState.requireSignature = true;
    nextState.createArtistPdf = true;
    nextState.createClientPdf = true;
    return nextState;
  }

  function buildRequestMetaLines(request) {
    if (!request) return [];
    return [
      formatRequestNotificationMethods(request) ? `${B.t("booking_notify_methods_label")}: ${formatRequestNotificationMethods(request)}` : "",
      request.location ? `${B.t("booking_location")}: ${request.location}` : "",
      ...buildTimeMetaLines(request),
      request.suggestedBudget != null ? `${B.t("suggested_budget")}: ${formatMoneyLabel(request.suggestedBudget)}` : ""
    ].filter(Boolean);
  }

  function getEventCreateSelectionSummaryLines() {
    const draft = readEventCreateState();
    if (draft.dateMode === "single") {
      return draft.startDate ? [draft.startDate] : [];
    }
    if (draft.dateMode === "multiple") {
      return parseSelectedDatesInput(draft.selectedDates);
    }
    const lines = [];
    if (draft.startDate) {
      lines.push(`${B.t("booking_range_start_label")}: ${draft.startDate}`);
    }
    if (draft.endDate) {
      lines.push(`${B.t("booking_range_end_label")}: ${draft.endDate}`);
    }
    return lines;
  }

  function getEventCreateModeHelp() {
    const draft = readEventCreateState();
    if (draft.dateMode === "multiple") {
      return B.t("booking_pick_multiple");
    }
    if (draft.dateMode === "range") {
      return draft.startDate && !draft.endDate
        ? B.t("booking_pick_range_end")
        : B.t("booking_pick_range_start");
    }
    return B.t("booking_pick_single");
  }

  function syncEventCreateSelectionFields() {
    const draft = readEventCreateState();
    if (draft.dateMode === "single") {
      const selected = draft.startDate || parseSelectedDatesInput(draft.selectedDates)[0] || "";
      state.eventCreateDraft.startDate = selected;
      state.eventCreateDraft.endDate = selected;
      state.eventCreateDraft.selectedDates = selected;
      return;
    }
    if (draft.dateMode === "multiple") {
      const selectedDates = parseSelectedDatesInput(draft.selectedDates);
      state.eventCreateDraft.selectedDates = selectedDates.join("\n");
      state.eventCreateDraft.startDate = selectedDates[0] || "";
      state.eventCreateDraft.endDate = selectedDates.at(-1) || "";
      return;
    }
    state.eventCreateDraft.selectedDates = "";
    if (!state.eventCreateDraft.startDate) {
      state.eventCreateDraft.endDate = "";
    } else if (!state.eventCreateDraft.endDate) {
      state.eventCreateDraft.endDate = "";
    }
  }

  function clearEventCreateSelection() {
    const draft = readEventCreateState();
    if (draft.dateMode === "single") {
      state.eventCreateDraft.startDate = "";
      state.eventCreateDraft.endDate = "";
      state.eventCreateDraft.selectedDates = "";
    } else if (draft.dateMode === "multiple") {
      state.eventCreateDraft.selectedDates = "";
      state.eventCreateDraft.startDate = "";
      state.eventCreateDraft.endDate = "";
    } else {
      state.eventCreateDraft.startDate = "";
      state.eventCreateDraft.endDate = "";
      state.eventCreateDraft.selectedDates = "";
    }
    syncEventCreateDraftState();
    renderEventComposerState();
  }

  function isEventCreateDateSelected(iso) {
    const draft = readEventCreateState();
    if (draft.dateMode === "single") {
      return draft.startDate === iso;
    }
    if (draft.dateMode === "multiple") {
      return parseSelectedDatesInput(draft.selectedDates).includes(iso);
    }
    if (draft.startDate && draft.endDate) {
      return iso >= draft.startDate && iso <= draft.endDate;
    }
    return draft.startDate === iso;
  }

  function getEventCreateRangeClass(iso) {
    const draft = readEventCreateState();
    if (draft.dateMode !== "range" || !draft.startDate) return "";
    if (draft.startDate === iso && draft.endDate === iso) return "range-start range-end";
    if (draft.startDate === iso) return "range-start";
    if (draft.endDate === iso) return "range-end";
    if (draft.endDate && iso > draft.startDate && iso < draft.endDate) return "range-middle";
    return "";
  }

  function handleEventCreateDatePick(date) {
    const draft = readEventCreateState();
    if (draft.dateMode === "single") {
      state.eventCreateDraft.startDate = date;
      state.eventCreateDraft.endDate = date;
      state.eventCreateDraft.selectedDates = date;
    } else if (draft.dateMode === "multiple") {
      const current = new Set(parseSelectedDatesInput(draft.selectedDates));
      if (current.has(date)) current.delete(date);
      else current.add(date);
      const nextDates = [...current].sort();
      state.eventCreateDraft.selectedDates = nextDates.join("\n");
      state.eventCreateDraft.startDate = nextDates[0] || "";
      state.eventCreateDraft.endDate = nextDates.at(-1) || "";
    } else if (!draft.startDate || (draft.startDate && draft.endDate)) {
      state.eventCreateDraft.startDate = date;
      state.eventCreateDraft.endDate = "";
    } else if (date < draft.startDate) {
      state.eventCreateDraft.endDate = draft.startDate;
      state.eventCreateDraft.startDate = date;
    } else {
      state.eventCreateDraft.endDate = date;
    }
    syncEventCreateSelectionFields();
    syncEventCreateDraftState();
    renderEventComposerState();
  }

  function formatCompactCalendarEventTitle(title) {
    const rawTitle = String(title || "").trim();
    if (!rawTitle) return "";
    const words = rawTitle.split(/\s+/).filter(Boolean);
    if (words.length <= 3) return rawTitle;
    return `${words.slice(0, 3).join(" ")}...`;
  }

  function renderEventCreateCalendarGrid() {
    const month = state.eventCreateMonth;
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const offset = firstDay.getDay();
    const weekdayBase = new Date(2026, 0, 4);
    const todayIso = toDateString(new Date());
    const parts = [];

    for (let weekday = 0; weekday < 7; weekday += 1) {
      const day = new Date(weekdayBase);
      day.setDate(weekdayBase.getDate() + weekday);
      parts.push(`<div class="calendar-weekday">${new Intl.DateTimeFormat(B.getLanguage(), { weekday: "short" }).format(day)}</div>`);
    }

    for (let index = 0; index < offset; index += 1) {
      parts.push(`<div class="calendar-day muted" aria-hidden="true"></div>`);
    }

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      const date = new Date(year, monthIndex, day);
      const iso = toDateString(date);
      const isPast = iso < todayIso;
      const isAvailable = isDateAvailableInDashboard(iso);
      const events = getEventsForDate(iso);
      const availabilityClass = isAvailable ? "available" : "unavailable";
      const selected = isEventCreateDateSelected(iso);
      const rangeClass = getEventCreateRangeClass(iso);
      const eventLabel = events.length
        ? B.escapeHtml(formatCompactCalendarEventTitle(events[0].title))
        : "";
      parts.push(`
        <button
          class="calendar-day ${availabilityClass} ${events.length ? "has-event" : ""} ${selected ? "selected" : ""} ${rangeClass} ${isPast ? "muted" : ""}"
          type="button"
          data-event-create-date="${iso}"
          ${isPast ? "disabled" : ""}>
          <span class="calendar-day-number">${day}</span>
          ${events.length ? `<span class="calendar-day-event">${eventLabel}</span>` : ""}
        </button>
      `);
    }

    return parts.join("");
  }

  function buildEventCreateSourceHtml() {
    const selectedRequest = currentSelectedBookingRequest();
    if (!selectedRequest) return "";
    const metaLines = buildRequestMetaLines(selectedRequest);
    return `
      <div class="backend-field full">
        <label>${B.escapeHtml(B.t("event_request_source"))}</label>
        <div class="backend-request-source">
          <strong>${B.escapeHtml(selectedRequest.clientName)}</strong>
          <span>${B.escapeHtml(formatRequestDates(selectedRequest))}</span>
          ${selectedRequest.clientEmail ? `<span>${B.escapeHtml(selectedRequest.clientEmail)}</span>` : ""}
          ${selectedRequest.clientPhone ? `<span>${B.escapeHtml(selectedRequest.clientPhone)}</span>` : ""}
          ${metaLines.map((line) => `<span>${B.escapeHtml(line)}</span>`).join("")}
        </div>
      </div>
    `;
  }

  function renderEventCreateDateStep() {
    const draft = readEventCreateState();
    const monthLabel = new Intl.DateTimeFormat(B.getLanguage(), { month: "long", year: "numeric" }).format(state.eventCreateMonth);
    return `
      <form class="backend-form-grid event-create-overlay-form" data-event-create-form data-event-create-step="dates">
        ${buildEventCreateSourceHtml()}
        <div class="backend-field">
          <label for="event-create-date-mode">${B.escapeHtml(B.t("booking_date_label"))}</label>
          <select id="event-create-date-mode" data-event-create-field="dateMode">
            ${["single", "multiple", "range"].map((value) => `<option value="${value}" ${value === draft.dateMode ? "selected" : ""}>${B.escapeHtml(B.t(`booking_${value}`))}</option>`).join("")}
          </select>
        </div>
        <div class="backend-field full">
          <label>${B.escapeHtml(B.t("booking_date_label"))}</label>
          <div class="booking-calendar-panel event-create-calendar-panel">
            <p class="backend-hint">${B.escapeHtml(getEventCreateModeHelp())}</p>
            <div class="backend-toolbar">
              <button class="btn outline" type="button" data-event-create-calendar-nav="-1">${B.escapeHtml(B.t("previous_month"))}</button>
              <strong>${B.escapeHtml(monthLabel)}</strong>
              <button class="btn outline" type="button" data-event-create-calendar-nav="1">${B.escapeHtml(B.t("next_month"))}</button>
            </div>
            <div class="calendar-grid" data-event-create-calendar-grid>
              ${renderEventCreateCalendarGrid()}
            </div>
            <div class="backend-inline-actions">
              <button class="btn outline" type="button" data-event-create-clear>${B.escapeHtml(B.t("booking_clear_selection"))}</button>
            </div>
          </div>
        </div>
        <div class="backend-inline-actions full">
          <button class="btn outline" type="button" data-event-create-close>${B.escapeHtml(B.t("cancel"))}</button>
          <button class="btn outline" type="button" data-event-create-next ${canAdvanceEventCreateStep() ? "" : "disabled"}>${B.escapeHtml(B.t("next_step"))}</button>
        </div>
      </form>
    `;
  }

  function renderEventCreateDetailsStep() {
    const draft = readEventCreateState();
    const editingEvent = currentEventComposerEvent();
    const isEditMode = isEditingEventComposer();
    const contentDirty = isEditMode && editingEvent
      ? isEventEditContentDirty(editingEvent.id, draft)
      : false;
    const showRegenerateOption = Boolean(isEditMode && editingEvent?.contractPath && contentDirty);
    const contractButton = isEditMode && editingEvent?.contractPath
      ? `<a class="btn outline" href="${B.escapeHtml(editingEvent.contractPath)}" target="_blank" rel="noreferrer">${B.escapeHtml(B.t("artist_pdf"))}</a>`
      : "";
    const clientPdfButton = isEditMode && editingEvent?.clientPdfPath
      ? `<a class="btn outline" href="${B.escapeHtml(editingEvent.clientPdfPath)}" target="_blank" rel="noreferrer">${B.escapeHtml(B.t("client_pdf"))}</a>`
      : "";
    return `
      <form class="backend-form-grid event-create-overlay-form" data-event-create-form data-event-create-step="details">
        ${buildEventCreateSourceHtml()}
        ${contractButton || clientPdfButton ? `
          <div class="backend-status-row full">
            <p class="backend-status"></p>
            <div class="backend-inline-actions">
              ${contractButton}
              ${clientPdfButton}
            </div>
          </div>
        ` : ""}
        <div class="backend-field full">
          <label for="event-create-title">${B.escapeHtml(B.t("event_title"))}</label>
          <input id="event-create-title" type="text" data-event-create-field="title" value="${B.escapeHtml(draft.title)}" />
        </div>
        <div class="backend-field">
          <label for="event-create-venue">${B.escapeHtml(B.t("venue"))}</label>
          <input id="event-create-venue" type="text" data-event-create-field="venue" value="${B.escapeHtml(draft.venue)}" />
        </div>
        <div class="backend-field">
          <label for="event-create-engagement-start-time-display">${B.escapeHtml(B.t("engagement_start_time"))}</label>
          ${renderTimeFieldControl({
            displayId: "event-create-engagement-start-time-display",
            hiddenId: "event-create-engagement-start-time",
            fieldName: "engagementStartTime",
            value: draft.engagementStartTime || "",
            hiddenAttribute: 'data-event-create-field="engagementStartTime"'
          })}
        </div>
        <div class="backend-field">
          <label for="event-create-engagement-end-time-display">${B.escapeHtml(B.t("engagement_end_time"))}</label>
          ${renderTimeFieldControl({
            displayId: "event-create-engagement-end-time-display",
            hiddenId: "event-create-engagement-end-time",
            fieldName: "engagementEndTime",
            value: draft.engagementEndTime || "",
            hiddenAttribute: 'data-event-create-field="engagementEndTime"'
          })}
        </div>
        <div class="backend-field">
          <label for="event-create-client-name">${B.escapeHtml(B.t("booking_client_name"))}</label>
          <input id="event-create-client-name" type="text" data-event-create-field="clientName" value="${B.escapeHtml(draft.clientName)}" />
        </div>
        <div class="backend-field">
          <label for="event-create-client-email">${B.escapeHtml(B.t("booking_client_email"))}</label>
          <input id="event-create-client-email" type="email" data-event-create-field="clientEmail" value="${B.escapeHtml(draft.clientEmail)}" />
        </div>
        <div class="backend-field full">
          <label for="event-create-client-phone">${B.escapeHtml(B.t("booking_client_phone"))}</label>
          <input id="event-create-client-phone" type="text" data-event-create-field="clientPhone" value="${B.escapeHtml(draft.clientPhone)}" />
        </div>
        <div class="backend-field">
          <label for="event-create-payment-amount">${B.escapeHtml(B.t("payment_amount"))}</label>
          <input id="event-create-payment-amount" type="text" inputmode="numeric" pattern="[0-9]*" data-event-create-field="paymentAmount" value="${B.escapeHtml(draft.paymentAmount || "")}" />
        </div>
        <div class="backend-field">
          <label for="event-create-currency">${B.escapeHtml(B.t("currency"))}</label>
          <input id="event-create-currency" type="text" data-event-create-field="currency" value="${B.escapeHtml(draft.currency)}" />
        </div>
        <div class="backend-field full">
          <label for="event-create-notes">${B.escapeHtml(B.t("notes"))}</label>
          <textarea id="event-create-notes" data-event-create-field="notes">${B.escapeHtml(draft.notes || "")}</textarea>
        </div>
        <p class="backend-hint full ${showRegenerateOption && editingEvent?.signedAt ? "" : "hidden"}">${B.escapeHtml(B.t("regenerate_artist_pdf_signed_note"))}</p>
        <div class="backend-inline-actions full">
          <button class="btn outline" type="button" data-event-create-back>${B.escapeHtml(B.t("back"))}</button>
          ${isEditMode ? `<button class="btn outline event-delete-btn" type="button" data-event-create-delete>${B.escapeHtml(B.t("delete"))}</button>` : ""}
          ${isEditMode ? `<button class="btn outline" type="button" data-event-create-duplicate>${B.escapeHtml(B.t("create_new_gig"))}</button>` : ""}
          <button class="btn outline" type="submit">${B.escapeHtml(B.t(isEditMode ? "update" : "create_event"))}</button>
        </div>
      </form>
    `;
  }

  function renderEventComposerMarkup() {
    const headingKey = state.eventCreateStep === "dates" ? "event_date_step_title" : "event_details_step_title";
    const statusTone = state.eventCreateStatusOverride?.tone || "info";
    const indicatorKey = isEditingEventComposer() ? "edit_gig" : "timeline_add_event";
    return `
      <div class="calendar-detail-header">
        <div>
          <p class="backend-section-indicator">${B.escapeHtml(B.t(indicatorKey))}</p>
          <h3>${B.escapeHtml(B.t(headingKey))}</h3>
        </div>
      </div>
      <p class="backend-status ${state.eventCreateStatusOverride?.message ? `active ${statusTone}` : ""}">${B.escapeHtml(state.eventCreateStatusOverride?.message || "")}</p>
      ${state.eventCreateStep === "dates" ? renderEventCreateDateStep() : renderEventCreateDetailsStep()}
    `;
  }

  function clearEventCreateOverlayStatus() {
    [dom.calendarDayDetailContent, dom.timelineDetailContent].forEach((container) => {
      const status = container?.querySelector(".backend-status");
      if (!status) return;
      status.textContent = "";
      status.className = "backend-status";
    });
  }

  function renderEventComposerState() {
    if (!state.timelineCreateOpen || !state.eventComposerTarget) return;
    if (state.eventComposerTarget === "calendar") {
      renderCalendarDayDetail();
      return;
    }
    renderTimelineDetail();
  }

  function renderTimelineStatus() {
    const timelineComposerOpen = state.timelineCreateOpen && state.eventComposerTarget === "timeline";
    state.timelineDirty = timelineComposerOpen && state.eventCreateDirty;

    if (state.timelineDirty) {
      B.setStatus(dom.timelineStatus, B.t("unsaved_changes"), "error");
    } else if (state.timelineStatusOverride?.message) {
      B.setStatus(dom.timelineStatus, state.timelineStatusOverride.message, state.timelineStatusOverride.tone || "info");
    } else if (timelineComposerOpen && state.eventCreateStatusOverride?.message) {
      B.setStatus(dom.timelineStatus, state.eventCreateStatusOverride.message, state.eventCreateStatusOverride.tone || "info");
    } else {
      B.setStatus(dom.timelineStatus, "", "info");
    }

    dom.timelineReset?.classList.toggle("hidden", !timelineComposerOpen || !state.eventCreateDirty);
  }

  function syncEventCreateDraftState(options = {}) {
    if (!currentArtist() || !isAdmin()) return;

    const currentState = readEventCreateState();
    const publishedString = JSON.stringify(state.eventCreatePublishedState || buildDefaultEventCreateState());
    const currentString = JSON.stringify(currentState);
    const hasUnsavedChanges = currentString !== publishedString;

    state.eventCreateDirty = hasUnsavedChanges;

    if (isEditingEventComposer()) {
      const eventId = String(state.eventComposerEventId || "");
      const drafts = loadStoredEventEditDrafts();
      if (hasUnsavedChanges && eventId) {
        drafts[eventId] = currentState;
      } else if (eventId) {
        delete drafts[eventId];
      }
      saveStoredEventEditDrafts(drafts);
    } else {
      const draftKey = getEventCreateDraftKey();
      if (hasUnsavedChanges && draftKey) {
        safeSetStorage(draftKey, currentString);
      } else {
        clearStoredEventCreateDraft();
      }
    }

    if (!options.keepStatusOverride) {
      state.eventCreateStatusOverride = null;
    }

    renderTimelineStatus();
  }

  function loadEventCreateEditor() {
    state.eventComposerMode = "create";
    state.eventComposerEventId = "";
    state.eventCreatePublishedState = buildDefaultEventCreateState();
    applyEventCreateState(state.eventCreatePublishedState);
    state.selectedBookingRequestId = null;
    state.eventCreateMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const draft = loadStoredEventCreateDraft();
    if (draft) {
      applyEventCreateState({
        ...state.eventCreatePublishedState,
        ...draft
      });
      const [year, month] = String(draft.startDate || parseSelectedDatesInput(draft.selectedDates).at(0) || "").split("-").map(Number);
      if (year && month) {
        state.eventCreateMonth = new Date(year, month - 1, 1);
      }
    }

    renderEventComposerState();
    syncEventCreateDraftState({ keepStatusOverride: false });
  }

  function getEventSectionName(event) {
    return event.status === "upcoming" ? "upcoming" : "past";
  }

  function buildPublishedEventState(event) {
    const dateMode = event.dateMode || "single";
    const selectedDates = dateMode === "multiple"
      ? (event.selectedDates || []).join("\n")
      : dateMode === "single"
        ? (event.startDate || event.selectedDates?.[0] || "")
        : "";
    return {
      bookingRequestId: String(event.bookingRequestId || ""),
      title: event.title || "",
      dateMode,
      selectedDates,
      venue: event.venue || "",
      engagementStartTime: event.engagementStartTime || "",
      engagementEndTime: event.engagementEndTime || "",
      startDate: event.startDate || "",
      endDate: event.endDate || "",
      clientName: event.clientName || "",
      clientEmail: event.clientEmail || "",
      clientPhone: event.clientPhone || "",
      paymentAmount: event.paymentAmount ? String(event.paymentAmount) : "",
      currency: event.currency || "CLP",
      requireSignature: true,
      notes: event.notes || "",
      createArtistPdf: true,
      createClientPdf: true
    };
  }

  function stripEventEditAuxState(eventState = {}) {
    const nextState = { ...eventState };
    delete nextState.createArtistPdf;
    delete nextState.createClientPdf;
    return nextState;
  }

  function isEventEditDirty(eventId, eventState) {
    return JSON.stringify(eventState || {}) !== JSON.stringify(state.eventEditPublishedState[String(eventId)] || {});
  }

  function isEventEditContentDirty(eventId, eventState) {
    return JSON.stringify(stripEventEditAuxState(eventState)) !== JSON.stringify(stripEventEditAuxState(state.eventEditPublishedState[String(eventId)] || {}));
  }

  function readEventEditFormState(form) {
    const formData = new FormData(form);
    const eventState = {
      bookingRequestId: String(formData.get("bookingRequestId") || ""),
      title: String(formData.get("title") || ""),
      dateMode: String(formData.get("dateMode") || "single"),
      selectedDates: String(formData.get("selectedDates") || ""),
      venue: String(formData.get("venue") || ""),
      engagementStartTime: String(formData.get("engagementStartTime") || ""),
      engagementEndTime: String(formData.get("engagementEndTime") || ""),
      startDate: String(formData.get("startDate") || ""),
      endDate: String(formData.get("endDate") || ""),
      clientName: String(formData.get("clientName") || ""),
      clientEmail: String(formData.get("clientEmail") || ""),
      clientPhone: String(formData.get("clientPhone") || ""),
      paymentAmount: sanitizeIntegerInputValue(formData.get("paymentAmount") || ""),
      currency: String(formData.get("currency") || "CLP"),
      requireSignature: true,
      notes: String(formData.get("notes") || ""),
      createArtistPdf: true,
      createClientPdf: true
    };

    if (eventState.dateMode === "single") {
      const singleDate = eventState.startDate || parseSelectedDatesInput(eventState.selectedDates)[0] || "";
      eventState.startDate = singleDate;
      eventState.endDate = singleDate;
      eventState.selectedDates = singleDate;
      return eventState;
    }

    if (eventState.dateMode === "multiple") {
      const selectedDates = parseSelectedDatesInput(eventState.selectedDates);
      eventState.selectedDates = selectedDates.join("\n");
      eventState.startDate = selectedDates[0] || "";
      eventState.endDate = selectedDates.at(-1) || "";
      return eventState;
    }

    eventState.selectedDates = "";
    return eventState;
  }

  function syncEventEditDateFieldVisibility(form) {
    if (!form) return;
    const dateMode = String(form.elements.namedItem("dateMode")?.value || "single");
    form.querySelectorAll("[data-event-edit-mode]").forEach((field) => {
      const modes = String(field.dataset.eventEditMode || "").split(/\s+/).filter(Boolean);
      field.classList.toggle("hidden", !modes.includes(dateMode));
    });
    const startLabel = form.querySelector("[data-event-edit-start-label]");
    if (startLabel) {
      startLabel.textContent = B.t(dateMode === "single" ? "booking_single_date_label" : "start_date");
    }
  }

  function applyEventEditFormState(form, eventState) {
    if (!form || !eventState) return;
    for (const [key, value] of Object.entries(eventState)) {
      const field = form.elements.namedItem(key);
      if (field) {
        if (field instanceof RadioNodeList) {
          Array.from(field).forEach((option) => {
            option.checked = option.value === value;
          });
        } else if (field.type === "checkbox") {
          field.checked = Boolean(value);
        } else {
          field.value = value ?? "";
        }
      }
    }
  }

  function loadStoredEventEditDrafts(artistId = currentArtistId()) {
    return readStoredJson(getEventEditDraftKey(artistId)) || {};
  }

  function clearStoredEventEditDraft(eventId, artistId = currentArtistId()) {
    const drafts = loadStoredEventEditDrafts(artistId);
    delete drafts[String(eventId)];
    saveStoredEventEditDrafts(drafts, artistId);
  }

  function saveStoredEventEditDrafts(drafts, artistId = currentArtistId()) {
    const key = getEventEditDraftKey(artistId);
    if (!key) return;
    if (drafts && Object.keys(drafts).length) {
      safeSetStorage(key, JSON.stringify(drafts));
    } else {
      safeRemoveStorage(key);
    }
  }

  function renderEventSectionStatuses() {
    renderTimelineStatus();
  }

  function syncEventEditDraftState(form, options = {}) {
    if (!form || !isAdmin()) return;

    const eventId = String(form.dataset.eventId || "");
    const drafts = loadStoredEventEditDrafts();
    const regenerateSignedNote = form.querySelector("[data-event-edit-regenerate-signed-note]");
    const status = form.querySelector("[data-event-edit-status]");
    const currentEvent = listTimelineEvents().find((entry) => String(entry.id) === eventId);
    const currentState = readEventEditFormState(form);
    const contentDirty = isEventEditContentDirty(eventId, currentState);

    const publishedString = JSON.stringify(state.eventEditPublishedState[eventId] || {});
    const currentString = JSON.stringify(currentState);
    const dirty = currentString !== publishedString;

    if (dirty) {
      drafts[eventId] = currentState;
    } else {
      delete drafts[eventId];
    }

    if (!options.keepStatusOverride) {
      state.eventEditStatusOverride = null;
    }

    saveStoredEventEditDrafts(drafts);
    regenerateSignedNote?.classList.toggle("hidden", !(contentDirty && currentEvent?.signedAt));
    if (dirty) {
      B.setStatus(status, B.t("unsaved_changes"), "error");
    } else if (state.eventEditStatusOverride?.message) {
      B.setStatus(status, state.eventEditStatusOverride.message, state.eventEditStatusOverride.tone || "info");
    } else {
      B.setStatus(status, "", "info");
    }
    renderTimelineStatus();
  }

  function resetEventDrafts() {
    const drafts = loadStoredEventEditDrafts();
    Object.keys(drafts).forEach((key) => delete drafts[key]);
    saveStoredEventEditDrafts(drafts);
    state.timelineStatusOverride = null;
    state.eventEditStatusOverride = null;
    renderTimeline();
  }

  function currentAccountSubject() {
    if (isAdmin()) {
      const artist = currentArtist();
      if (!artist?.account) return null;
      return {
        ...artist.account,
        contactPhone: artist.contactPhone || ""
      };
    }

    if (B.state.user) {
      return {
        id: B.state.user.id,
        username: B.state.user.username,
        email: B.state.user.email,
        emailVerifiedAt: B.state.user.emailVerifiedAt,
        contactPhone: currentArtist()?.contactPhone || ""
      };
    }

    return null;
  }

  function buildPublishedAccountState() {
    const account = currentAccountSubject();
    if (account?.username && account?.email) {
      return {
        mode: "identity",
        username: account.username || "",
        email: account.email || "",
        contactPhone: account.contactPhone || ""
      };
    }

    if (isAdmin() && currentArtist()) {
      return {
        mode: "attach",
        attachEmail: "",
        attachUsername: ""
      };
    }

    return null;
  }

  function readAccountFormState() {
    if (!currentArtist()) return null;

    if (!dom.accountSettingsContent?.classList.contains("hidden")) {
      return {
        mode: "identity",
        username: dom.accountUsernameInput?.value || "",
        email: dom.accountEmailInput?.value || "",
        contactPhone: dom.accountPhoneInput?.value || ""
      };
    }

    if (!dom.accountAttachForm?.classList.contains("hidden")) {
      return {
        mode: "attach",
        attachEmail: dom.accountAttachEmailInput?.value || "",
        attachUsername: dom.accountAttachUsernameInput?.value || ""
      };
    }

    return null;
  }

  function applyAccountFormState(accountState) {
    if (!accountState) return;
    if (accountState.mode === "identity") {
      if (dom.accountUsernameInput) dom.accountUsernameInput.value = accountState.username || "";
      if (dom.accountEmailInput) dom.accountEmailInput.value = accountState.email || "";
      if (dom.accountPhoneInput) dom.accountPhoneInput.value = accountState.contactPhone || "";
      return;
    }

    if (accountState.mode === "attach") {
      if (dom.accountAttachEmailInput) dom.accountAttachEmailInput.value = accountState.attachEmail || "";
      if (dom.accountAttachUsernameInput) dom.accountAttachUsernameInput.value = accountState.attachUsername || "";
    }
  }

  function loadStoredAccountDraft(artistId = currentArtistId()) {
    return readStoredJson(getAccountDraftKey(artistId));
  }

  function clearStoredAccountDraft(artistId = currentArtistId()) {
    const key = getAccountDraftKey(artistId);
    if (key) safeRemoveStorage(key);
  }

  function renderAccountStatus() {
    if (state.accountDirty) {
      B.setStatus(dom.settingsStatus, B.t("unsaved_changes"), "error");
    } else if (state.accountStatusOverride?.message) {
      B.setStatus(dom.settingsStatus, state.accountStatusOverride.message, state.accountStatusOverride.tone || "info");
    } else {
      B.setStatus(dom.settingsStatus, "", "info");
    }

    dom.accountReset?.classList.toggle("hidden", !state.accountDirty);
  }

  function syncAccountDraftState(options = {}) {
    if (state.suspendAccountSync || !currentArtist()) return;

    const currentState = readAccountFormState();
    const publishedString = JSON.stringify(state.accountPublishedState || {});
    const currentString = JSON.stringify(currentState || {});
    const hasUnsavedChanges = currentString !== publishedString;
    const draftKey = getAccountDraftKey();

    state.accountDirty = hasUnsavedChanges;

    if (hasUnsavedChanges && draftKey) {
      safeSetStorage(draftKey, currentString);
      if (!options.keepStatusOverride) {
        state.accountStatusOverride = null;
      }
    } else {
      clearStoredAccountDraft();
      if (!options.keepStatusOverride) {
        state.accountStatusOverride = null;
      }
    }

    renderAccountStatus();
  }

  function renderProviderStatus() {
    const linked = new Set(B.state.user?.linkedProviders || []);
    for (const provider of ["google", "apple"]) {
      const pill = document.getElementById(`provider-${provider}-state`);
      const link = document.getElementById(`provider-${provider}-link`);
      if (!pill || !link) continue;
      const isLinked = linked.has(provider);
      pill.className = `backend-pill ${isLinked ? "success" : ""}`;
      pill.textContent = isLinked ? B.t("oauth_linked") : B.t("oauth_not_linked");
      link.textContent = isLinked ? B.t("oauth_linked") : B.t("link_provider");
      link.classList.toggle("hidden", isLinked);
    }
  }

  function renderAccountSettings() {
    const artist = currentArtist();
    const account = currentAccountSubject();
    const hasLinkedAccount = Boolean(account?.username && account?.email);
    const showAttachForm = Boolean(isAdmin() && artist && !hasLinkedAccount);
    state.suspendAccountSync = true;
    dom.accountSettingsEmpty?.classList.toggle("hidden", hasLinkedAccount || !artist);
    dom.accountSettingsContent?.classList.toggle("hidden", !hasLinkedAccount);
    dom.accountAttachForm?.classList.toggle("hidden", !showAttachForm);
    dom.accountDeleteArtist?.classList.toggle("hidden", !isAdmin() || !artist);

    if (!artist) {
      dom.accountAttachForm?.reset();
      state.accountPublishedState = null;
      state.accountDirty = false;
      state.accountStatusOverride = null;
      state.suspendAccountSync = false;
      renderAccountStatus();
      return;
    }

    if (!hasLinkedAccount) {
      dom.accountAttachForm?.reset();
      state.accountPublishedState = buildPublishedAccountState();
      const draft = loadStoredAccountDraft(artist.id);
      if (draft?.mode === "attach") {
        applyAccountFormState({
          ...state.accountPublishedState,
          ...draft
        });
      }
      state.suspendAccountSync = false;
      syncAccountDraftState({ keepStatusOverride: false });
      return;
    }

    dom.accountCurrentUsername.textContent = account.username || "";
    dom.accountCurrentEmail.textContent = account.email || "";
    if (dom.accountCurrentPhone) {
      dom.accountCurrentPhone.textContent = account.contactPhone || "-";
    }
    dom.accountUsernameInput.value = account.username || "";
    dom.accountEmailInput.value = account.email || "";
    if (dom.accountPhoneInput) dom.accountPhoneInput.value = account.contactPhone || "";
    dom.accountEmailStatus.className = `backend-pill ${account.emailVerifiedAt ? "success" : ""}`;
    dom.accountEmailStatus.textContent = account.emailVerifiedAt ? B.t("email_verified") : B.t("email_unverified");

    const showOauth = !isAdmin();
    dom.accountOauthWrap?.classList.toggle("hidden", !showOauth);
    if (showOauth) {
      renderProviderStatus();
    }

    state.accountPublishedState = buildPublishedAccountState();
    const draft = loadStoredAccountDraft(artist.id);
    if (draft?.mode === "identity") {
      applyAccountFormState({
        ...state.accountPublishedState,
        ...draft
      });
    }
    state.suspendAccountSync = false;
    syncAccountDraftState({ keepStatusOverride: false });
  }

  function openCreateArtistPanel(forceOpen) {
    state.createArtistOpen = typeof forceOpen === "boolean" ? forceOpen : !state.createArtistOpen;
    dom.adminCreatePanel?.classList.toggle("hidden", !state.createArtistOpen);
    if (!state.createArtistOpen) {
      dom.adminCreateForm?.reset();
      B.setStatus(dom.adminCreateStatus, "", "info");
    }
  }

  function captureArtistTabRects() {
    const rects = new Map();
    dom.artistTabs?.querySelectorAll(".backend-artist-tab[data-artist-id]").forEach((element) => {
      rects.set(element.dataset.artistId, element.getBoundingClientRect());
    });
    return rects;
  }

  function animateArtistTabPositions(previousRects, skipArtistId = null) {
    dom.artistTabs?.querySelectorAll(".backend-artist-tab[data-artist-id]").forEach((element) => {
      const artistId = element.dataset.artistId;
      if (!artistId || artistId === String(skipArtistId)) return;
      const previous = previousRects.get(artistId);
      if (!previous) return;
      const next = element.getBoundingClientRect();
      const deltaX = previous.left - next.left;
      const deltaY = previous.top - next.top;
      if (!deltaX && !deltaY) return;
      element.style.transition = "none";
      element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      element.getBoundingClientRect();
      element.style.transition = "";
      element.style.transform = "";
    });
  }

  function reorderArtistsByIds(artistIds) {
    const byId = new Map(listArtists().map((artist) => [String(artist.id), artist]));
    return artistIds.map((artistId) => byId.get(String(artistId))).filter(Boolean);
  }

  async function persistArtistOrder(nextArtistIds, previousArtistIds) {
    try {
      const payload = await B.api("/api/admin/artists/reorder", {
        method: "POST",
        body: {
          artistIds: nextArtistIds.map((artistId) => Number(artistId))
        }
      });
      state.payload.artists = payload.artists || reorderArtistsByIds(nextArtistIds);
      B.setStatus(dom.adminTabsStatus, B.t("saved"), "success");
    } catch (error) {
      state.payload.artists = reorderArtistsByIds(previousArtistIds);
      renderAdminTabs();
      B.setStatus(dom.adminTabsStatus, error.message, "error");
    }
  }

  function endArtistTabDrag(event) {
    if (!state.tabDrag) return;
    if (event && event.pointerId != null && event.pointerId !== state.tabDrag.pointerId) return;

    const { handle, tab, startOrder } = state.tabDrag;
    state.tabDrag = null;
    handle?.releasePointerCapture?.(event?.pointerId);
    tab?.classList.remove("dragging");
    window.removeEventListener("pointermove", handleArtistTabPointerMove);
    window.removeEventListener("pointerup", endArtistTabDrag);
    window.removeEventListener("pointercancel", endArtistTabDrag);

    const nextOrder = Array.from(dom.artistTabs?.querySelectorAll(".backend-artist-tab[data-artist-id]") || [])
      .map((element) => element.dataset.artistId)
      .filter(Boolean);

    if (nextOrder.join("|") !== startOrder.join("|")) {
      state.payload.artists = reorderArtistsByIds(nextOrder);
      persistArtistOrder(nextOrder, startOrder);
    }
  }

  function handleArtistTabPointerMove(event) {
    if (!state.tabDrag || event.pointerId !== state.tabDrag.pointerId) return;
    event.preventDefault();

    const pointerTarget = document.elementFromPoint(event.clientX, event.clientY);
    const targetTab = pointerTarget?.closest(".backend-artist-tab[data-artist-id]");
    const draggingTab = state.tabDrag.tab;
    if (!targetTab || targetTab === draggingTab) return;

    const targetRect = targetTab.getBoundingClientRect();
    const draggingRect = draggingTab.getBoundingClientRect();
    const sameRow = Math.abs(targetRect.top - draggingRect.top) < targetRect.height * 0.6;
    const insertBefore = sameRow
      ? event.clientX < targetRect.left + targetRect.width / 2
      : event.clientY < targetRect.top + targetRect.height / 2;

    const currentPrevious = draggingTab.previousElementSibling;
    const currentNext = draggingTab.nextElementSibling;
    if (insertBefore && currentNext === targetTab) return;
    if (!insertBefore && currentPrevious === targetTab) return;

    const previousRects = captureArtistTabRects();
    if (insertBefore) {
      dom.artistTabs.insertBefore(draggingTab, targetTab);
    } else {
      dom.artistTabs.insertBefore(draggingTab, targetTab.nextElementSibling);
    }
    animateArtistTabPositions(previousRects, state.tabDrag.artistId);
  }

  function beginArtistTabDrag(event, handle) {
    if (!isAdmin() || !dom.artistTabs) return;
    if (event.button != null && event.button !== 0) return;

    const tab = handle.closest(".backend-artist-tab[data-artist-id]");
    if (!tab || listArtists().length < 2) return;

    state.tabDrag = {
      artistId: tab.dataset.artistId,
      handle,
      tab,
      pointerId: event.pointerId,
      startOrder: Array.from(dom.artistTabs.querySelectorAll(".backend-artist-tab[data-artist-id]"))
        .map((element) => element.dataset.artistId)
        .filter(Boolean)
    };

    handle.setPointerCapture?.(event.pointerId);
    tab.classList.add("dragging");
    B.setStatus(dom.adminTabsStatus, "", "info");
    window.addEventListener("pointermove", handleArtistTabPointerMove, { passive: false });
    window.addEventListener("pointerup", endArtistTabDrag);
    window.addEventListener("pointercancel", endArtistTabDrag);
  }

  function buildForwardMessage(bookingRequest) {
    const artistName = B.translateContent(currentArtist()?.displayName);
    return [
      `${artistName}: ${bookingRequest.clientName}`,
      bookingRequest.clientEmail,
      bookingRequest.clientPhone || "",
      bookingRequest.location ? `${B.t("booking_location")}: ${bookingRequest.location}` : "",
      ...buildTimeMetaLines(bookingRequest),
      bookingRequest.suggestedBudget != null ? `${B.t("suggested_budget")}: ${formatMoneyLabel(bookingRequest.suggestedBudget)}` : "",
      formatRequestDates(bookingRequest),
      bookingRequest.additionalInfo || ""
    ].filter(Boolean).join("\n");
  }

  function getBookingRequestStatusKey(request) {
    if (request.status === "converted") return "booking_request_converted";
    if (request.status === "forwarded") return "booking_request_forwarded";
    if (request.status === "archived") return "booking_request_archived";
    return "booking_request_new";
  }

  function setBookingRequestStatus(message, tone = "info") {
    B.setStatus(dom.adminRequestStatus, message, tone);
    B.setStatus(dom.bookingHistoryStatus, message, tone);
  }

  function buildBookingRequestCard(request, options = {}) {
    const metaLines = buildRequestMetaLines(request);
    const showClose = Boolean(options.showClose);
    return `
      <article class="backend-request-card backend-notification-card">
        <div class="backend-request-card-copy">
          <div class="timeline-meta">
            <span class="backend-pill active">${B.escapeHtml(B.t(getBookingRequestStatusKey(request)))}</span>
            <span class="backend-pill">${B.escapeHtml(formatRequestDates(request))}</span>
          </div>
          <strong>${B.escapeHtml(request.clientName)}</strong>
          ${request.clientEmail ? `<span>${B.escapeHtml(request.clientEmail)}</span>` : ""}
          ${request.clientPhone ? `<span>${B.escapeHtml(request.clientPhone)}</span>` : ""}
          ${metaLines.map((line) => `<span>${B.escapeHtml(line)}</span>`).join("")}
          ${request.additionalInfo ? `<p>${B.escapeHtml(request.additionalInfo)}</p>` : ""}
        </div>
        <div class="backend-inline-actions">
          <button class="btn outline" type="button" data-request-email="${request.id}" ${currentArtist()?.account?.email ? "" : "disabled"}>${B.escapeHtml(B.t("booking_request_contact_artist_email"))}</button>
          <button class="btn outline" type="button" data-request-whatsapp="${request.id}" ${currentArtist()?.contactPhone ? "" : "disabled"}>${B.escapeHtml(B.t("booking_request_contact_artist_whatsapp"))}</button>
          <button class="btn outline" type="button" data-request-use="${request.id}">${B.escapeHtml(B.t("booking_request_use_for_event"))}</button>
          ${showClose ? `<button class="btn outline" type="button" data-request-close="${request.id}">${B.escapeHtml(B.t("close_request"))}</button>` : ""}
        </div>
      </article>
    `;
  }

  function renderAdminRequestPanel() {
    if (!dom.adminRequestPanel || !isAdmin()) return;
    const bookingRequests = listPendingBookingRequests();
    const signatureNotifications = listSignatureNotifications();
    const notifications = [
      ...signatureNotifications.map((entry) => ({
        sortKey: String(entry.signedAt || entry.updatedAt || entry.createdAt || ""),
        html: buildAdminSignatureNotificationCard(entry)
      })),
      ...bookingRequests.map((entry) => ({
        sortKey: String(entry.updatedAt || entry.createdAt || ""),
        html: buildBookingRequestCard(entry, { showClose: true })
      }))
    ].sort((left, right) => right.sortKey.localeCompare(left.sortKey));

    dom.adminRequestPanel.classList.toggle("hidden", !currentArtist() || !notifications.length);
    if (!currentArtist() || !notifications.length) {
      dom.adminNotices.innerHTML = "";
      return;
    }

    dom.adminNotices.innerHTML = notifications.map((entry) => entry.html).join("");
  }

  function renderBookingRequestHistorySection() {
    if (!dom.bookingRequestsCard) return;
    const showSection = isAdmin() && Boolean(currentArtist());
    dom.bookingRequestsCard.classList.toggle("hidden", !showSection);
    if (!showSection) {
      dom.bookingHistoryList.innerHTML = "";
      dom.bookingHistoryEmpty.classList.add("hidden");
      return;
    }

    const bookingRequests = sortBookingRequestsBySubmittedDate(listBookingRequests());
    dom.bookingHistoryList.innerHTML = bookingRequests.map((request) => buildBookingRequestCard(request)).join("");
    dom.bookingHistoryEmpty.classList.toggle("hidden", bookingRequests.length > 0);
  }

  function renderAdminTabs() {
    if (!dom.artistTabs) return;
    if (!isAdmin()) {
      dom.artistTabs.innerHTML = "";
      return;
    }

    const selectedArtistId = String(currentArtistId() || "");
    dom.artistTabs.innerHTML = listArtists()
      .map((artist) => {
        const artistId = String(artist.id);
        const name = B.translateContent(artist.displayName);
        const publicLabel = artist.publicStatus === "published" ? B.t("published") : B.t("hidden");
        const metaPills = [];
        if (!artist.account) {
          metaPills.push(`<span class="backend-pill">${B.escapeHtml(B.t("account_missing"))}</span>`);
        }
        metaPills.push(`<span class="backend-pill ${artist.publicStatus === "published" ? "active" : ""}">${B.escapeHtml(publicLabel)}</span>`);
        const notificationCount = Number(artist.notifications?.total || 0);
        if (notificationCount > 0) {
          metaPills.unshift(`<span class="backend-pill active">${notificationCount}</span>`);
        }
        return `
          <article class="backend-artist-tab ${artistId === selectedArtistId ? "selected" : ""}" data-artist-id="${artistId}">
            <button class="backend-artist-tab-main" type="button" data-artist-select="${artistId}">
              <span class="backend-artist-tab-label">${B.escapeHtml(name)}</span>
              <span class="backend-artist-tab-meta">
                ${metaPills.join("")}
              </span>
            </button>
            <button
              class="backend-tab-grip"
              type="button"
              data-artist-drag-handle="${artistId}"
              aria-label="${B.escapeHtml(B.t("reorder_artist_tabs"))}">
              <span class="backend-tab-grip-icon" aria-hidden="true">::</span>
            </button>
          </article>
        `;
      })
      .join("");

    dom.artistTabs.insertAdjacentHTML(
      "beforeend",
      `
        <button class="backend-artist-tab-plus" id="dashboard-add-artist-tab" type="button">
          <strong aria-hidden="true">+</strong>
          <span>${B.escapeHtml(B.t("add_artist_tab"))}</span>
        </button>
      `
    );
  }

  function renderHeader() {
    const user = B.state.user;
    const artist = currentArtist();
    if (!user) return;

    document.body.classList.toggle("dashboard-admin-view", user.role === "admin");
    document.body.classList.toggle("dashboard-artist-view", user.role !== "admin");

    const artistName = B.translateContent(artist?.displayName);
    const welcomePrefix = B.t("welcome_artist");
    dom.title.textContent = user.role === "admin" ? B.t("dashboard_admin_title") : B.t("dashboard_title");
    dom.subtitle.textContent = user.role === "admin"
      ? `${welcomePrefix} ${getAdminGreetingName()}!`
      : `${welcomePrefix} ${artistName}!`;
    renderSectionIndicators();
    if (dom.publicLink) {
      dom.publicLink.classList.toggle("hidden", !artist);
    }
    if (artist && dom.publicLink) {
      dom.publicLink.href = artist.publicDestination;
      dom.publicLink.textContent = B.t("public_preview");
    }

    renderHeroNotifications();

    if (isAdmin()) {
      dom.adminBrowser?.classList.remove("hidden");
      renderAdminTabs();
      renderAdminRequestPanel();
      dom.adminCreatePanel?.classList.toggle("hidden", !state.createArtistOpen);
    } else {
      dom.adminBrowser?.classList.add("hidden");
    }
  }

  function listTimelineEvents() {
    return [...(state.payload?.events || [])].sort((left, right) => {
      return (
        left.startDate.localeCompare(right.startDate) ||
        String(left.endDate || left.startDate).localeCompare(String(right.endDate || right.startDate)) ||
        Number(left.id) - Number(right.id)
      );
    });
  }

  function getEventDateRange(event) {
    if (Array.isArray(event.selectedDates) && event.selectedDates.length) {
      return event.selectedDates.slice();
    }
    const start = new Date(`${event.startDate}T12:00:00`);
    const end = new Date(`${(event.endDate || event.startDate)}T12:00:00`);
    const dates = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      dates.push(toDateString(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  }

  function getEventsForDate(iso) {
    return listTimelineEvents().filter((event) => getEventDateRange(event).includes(iso));
  }

  function hasScheduledEventOnDate(iso) {
    return getEventsForDate(iso).some((event) => event.status !== "cancelled");
  }

  function currentSelectedTimelineEvent() {
    return listTimelineEvents().find((event) => String(event.id) === String(state.selectedTimelineEventId || "")) || null;
  }

  function closeEventComposer() {
    state.timelineCreateOpen = false;
    state.eventComposerTarget = "";
    state.eventComposerMode = "create";
    state.eventComposerEventId = "";
    state.eventComposerReturnToDetail = false;
    state.eventCreateStep = "dates";
    state.activeTimelineEditorId = null;
  }

  function closeCalendarDayDetail() {
    if (state.timelineCreateOpen && state.eventComposerTarget === "calendar") {
      const returnToDetail = Boolean(state.eventComposerReturnToDetail && state.selectedCalendarDate);
      closeEventComposer();
      if (!returnToDetail) {
        state.selectedCalendarDate = "";
        dom.calendarDayDetail?.classList.add("hidden");
        dom.calendarDayDetailContent.innerHTML = "";
      }
      renderCalendar();
      renderTimeline();
      return;
    }
    state.selectedCalendarDate = "";
    dom.calendarDayDetail?.classList.add("hidden");
    dom.calendarDayDetailContent.innerHTML = "";
    renderCalendar();
  }

  function closeTimelineDetail() {
    if (state.timelineCreateOpen && state.eventComposerTarget === "timeline") {
      const returnToDetail = Boolean(state.eventComposerReturnToDetail && state.selectedTimelineEventId);
      closeEventComposer();
      if (!returnToDetail) {
        state.selectedTimelineEventId = "";
        dom.timelineDetail?.classList.add("hidden");
        if (dom.timelineDetailContent) {
          dom.timelineDetailContent.innerHTML = "";
        }
      }
      renderTimeline();
      if (returnToDetail) {
        renderTimelineDetail();
      }
      renderCalendar();
      return;
    }
    state.activeTimelineEditorId = null;
    state.eventEditStatusOverride = null;
    state.selectedTimelineEventId = "";
    dom.timelineDetail?.classList.add("hidden");
    if (dom.timelineDetailContent) {
      dom.timelineDetailContent.innerHTML = "";
    }
  }

  function openCalendarDay(iso) {
    state.selectedCalendarDate = iso;
    if (!isAdmin()) {
      getEventsForDate(iso)
        .filter((event) => getArtistPendingNoticeKinds(event).includes("event"))
        .forEach((event) => {
          B.api(`/api/dashboard/events/${event.id}/acknowledge`, {
            method: "POST",
            body: { kinds: ["event"] }
          }).catch(() => {});
        });
    }
    renderCalendar();
    renderCalendarDayDetail();
  }

  function openTimelineEvent(eventId, options = {}) {
    if (!options.keepEditor || String(state.activeTimelineEditorId || "") !== String(eventId || "")) {
      state.activeTimelineEditorId = null;
      state.eventEditStatusOverride = null;
    }
    state.selectedTimelineEventId = String(eventId || "");
    if (!isAdmin()) {
      const selectedEvent = currentSelectedTimelineEvent();
      if (selectedEvent && getArtistPendingNoticeKinds(selectedEvent).includes("event")) {
        B.api(`/api/dashboard/events/${selectedEvent.id}/acknowledge`, {
          method: "POST",
          body: { kinds: ["event"] }
        }).catch(() => {});
      }
    }
    renderTimeline();
  }

  function getEventEditState(event) {
    const eventId = String(event?.id || "");
    return {
      ...(state.eventEditPublishedState[eventId] || buildPublishedEventState(event)),
      ...(loadStoredEventEditDrafts()[eventId] || {})
    };
  }

  function renderTimelineEditDetail(event, eventState) {
    const regenerateAvailable = Boolean(event.contractPath);
    const contentDirty = isEventEditContentDirty(event.id, eventState);
    const showRegenerateOption = regenerateAvailable && contentDirty;
    const contractButton = event.contractPath
      ? `<a class="btn outline" href="${B.escapeHtml(event.contractPath)}" target="_blank" rel="noreferrer">${B.escapeHtml(B.t("artist_pdf"))}</a>`
      : "";
    const clientPdfButton = event.clientPdfPath
      ? `<a class="btn outline" href="${B.escapeHtml(event.clientPdfPath)}" target="_blank" rel="noreferrer">${B.escapeHtml(B.t("client_pdf"))}</a>`
      : "";

    return `
      <div class="calendar-detail-header">
        <div>
          <p class="backend-section-indicator">${B.escapeHtml(B.formatDate(event.startDate))}</p>
          <h3>${B.escapeHtml(event.title)}</h3>
          <p class="backend-hint">${B.escapeHtml(event.venue || "")}</p>
        </div>
        <div class="backend-inline-actions">
          <button class="btn outline" type="button" data-event-detail-edit-toggle="${event.id}">${B.escapeHtml(B.t("update"))}</button>
        </div>
      </div>
      <form class="backend-form-grid event-edit-form" data-event-id="${event.id}">
        <input name="bookingRequestId" type="hidden" value="${B.escapeHtml(String(eventState.bookingRequestId || ""))}" />
        <div class="backend-status-row full">
          <p class="backend-status" data-event-edit-status></p>
          <div class="backend-inline-actions">
            ${contractButton}
            ${clientPdfButton}
          </div>
        </div>
        <div class="backend-field full">
          <label>${B.escapeHtml(B.t("event_title"))}</label>
          <input name="title" type="text" value="${B.escapeHtml(eventState.title)}" />
        </div>
        <div class="backend-field">
          <label>${B.escapeHtml(B.t("booking_date_label"))}</label>
          <select name="dateMode">
            ${["single", "multiple", "range"].map((value) => `<option value="${value}" ${value === eventState.dateMode ? "selected" : ""}>${B.escapeHtml(B.t(`booking_${value}`))}</option>`).join("")}
          </select>
        </div>
        <div class="backend-field">
          <label>${B.escapeHtml(B.t("venue"))}</label>
          <input name="venue" type="text" value="${B.escapeHtml(eventState.venue || "")}" />
        </div>
        <div class="backend-field">
          <label>${B.escapeHtml(B.t("engagement_start_time"))}</label>
          ${renderTimeFieldControl({
            displayId: `event-edit-engagement-start-time-display-${event.id}`,
            hiddenId: `event-edit-engagement-start-time-${event.id}`,
            fieldName: "engagementStartTime",
            value: eventState.engagementStartTime || "",
            inputName: "engagementStartTime"
          })}
        </div>
        <div class="backend-field">
          <label>${B.escapeHtml(B.t("engagement_end_time"))}</label>
          ${renderTimeFieldControl({
            displayId: `event-edit-engagement-end-time-display-${event.id}`,
            hiddenId: `event-edit-engagement-end-time-${event.id}`,
            fieldName: "engagementEndTime",
            value: eventState.engagementEndTime || "",
            inputName: "engagementEndTime"
          })}
        </div>
        <div class="backend-field ${eventState.dateMode === "multiple" ? "hidden" : ""}" data-event-edit-mode="single range">
          <label data-event-edit-start-label>${B.escapeHtml(B.t(eventState.dateMode === "single" ? "booking_single_date_label" : "start_date"))}</label>
          <input name="startDate" type="date" value="${B.escapeHtml(eventState.startDate || "")}" />
        </div>
        <div class="backend-field ${eventState.dateMode === "range" ? "" : "hidden"}" data-event-edit-mode="range">
          <label>${B.escapeHtml(B.t("end_date"))}</label>
          <input name="endDate" type="date" value="${B.escapeHtml(eventState.endDate || "")}" />
        </div>
        <div class="backend-field full ${eventState.dateMode === "multiple" ? "" : "hidden"}" data-event-edit-mode="multiple">
          <label>${B.escapeHtml(B.t("booking_multiple_dates_label"))}</label>
          <textarea name="selectedDates">${B.escapeHtml(eventState.selectedDates || "")}</textarea>
        </div>
        <div class="backend-field">
          <label>${B.escapeHtml(B.t("booking_client_name"))}</label>
          <input name="clientName" type="text" value="${B.escapeHtml(eventState.clientName || "")}" />
        </div>
        <div class="backend-field">
          <label>${B.escapeHtml(B.t("booking_client_email"))}</label>
          <input name="clientEmail" type="email" value="${B.escapeHtml(eventState.clientEmail || "")}" />
        </div>
        <div class="backend-field full">
          <label>${B.escapeHtml(B.t("booking_client_phone"))}</label>
          <input name="clientPhone" type="text" value="${B.escapeHtml(eventState.clientPhone || "")}" />
        </div>
        <div class="backend-field">
          <label>${B.escapeHtml(B.t("payment_amount"))}</label>
          <input name="paymentAmount" type="text" inputmode="numeric" pattern="[0-9]*" value="${B.escapeHtml(eventState.paymentAmount || "")}" />
        </div>
        <div class="backend-field">
          <label>${B.escapeHtml(B.t("currency"))}</label>
          <input name="currency" type="text" value="${B.escapeHtml(eventState.currency)}" />
        </div>
        <div class="backend-field full">
          <label>${B.escapeHtml(B.t("notes"))}</label>
          <textarea name="notes">${B.escapeHtml(eventState.notes || "")}</textarea>
        </div>
        <p class="backend-hint full ${showRegenerateOption && event.signedAt ? "" : "hidden"}" data-event-edit-regenerate-signed-note>${B.escapeHtml(B.t("regenerate_artist_pdf_signed_note"))}</p>
        <div class="backend-inline-actions full">
          <button class="btn outline event-delete-btn" type="button">${B.escapeHtml(B.t("delete"))}</button>
        </div>
      </form>
    `;
  }

  function focusCalendarDate(iso) {
    const [year, month] = String(iso).split("-").map(Number);
    if (year && month) {
      state.currentMonth = new Date(year, month - 1, 1);
    }
    openCalendarDay(iso);
  }

  function formatEventDateLabel(event) {
    if (!event) return "";
    if (event.dateMode === "multiple") {
      return (event.selectedDates || []).map((date) => B.formatDate(date)).join(", ");
    }
    if (event.endDate && event.endDate !== event.startDate) {
      return `${B.formatDate(event.startDate)} - ${B.formatDate(event.endDate)}`;
    }
    return B.formatDate(event.startDate);
  }

  function canArtistSignContract(event) {
    return Boolean(
      !isAdmin()
      && event?.contractPath
      && event?.requireSignature
      && event?.status === "upcoming"
      && !event?.signedAt
    );
  }

  function buildContractSignForm(event) {
    const previewSupported = Boolean(event.documentGeneratedAt);
    if (!canArtistSignContract(event)) {
      return "";
    }

    return `
      <form class="backend-form-grid calendar-sign-form" data-event-id="${event.id}" data-preview-supported="${previewSupported ? "true" : "false"}">
        <div class="backend-field full">
          <label>${B.escapeHtml(B.t("signature_name"))}</label>
          <input name="fullName" type="text" required />
        </div>
        <div class="backend-field full">
          <label>${B.escapeHtml(B.t("draw_signature"))}</label>
          <div class="signature-pad-shell">
            <canvas class="signature-pad-canvas" data-signature-canvas></canvas>
          </div>
        </div>
        <p class="backend-hint full">${B.escapeHtml(B.t(previewSupported ? "review_signature_before_confirm" : "signature_preview_unavailable"))}</p>
        <p class="backend-status full signature-form-status"></p>
        <div class="backend-inline-actions full">
          <button class="btn outline" type="button" data-signature-clear>${B.escapeHtml(B.t("clear_signature"))}</button>
          ${previewSupported ? `<button class="btn outline" type="button" data-signature-preview>${B.escapeHtml(B.t("preview_signature"))}</button>` : ""}
          <button class="btn outline" type="submit" data-signature-confirm ${previewSupported ? "disabled" : ""}>${B.escapeHtml(B.t("confirm_signature"))}</button>
        </div>
        <div class="signature-preview hidden full" data-signature-preview-wrap>
          <div class="signature-preview-head">
            <strong>${B.escapeHtml(B.t("signature_preview_title"))}</strong>
            <a class="btn outline" data-signature-preview-link target="_blank" rel="noreferrer">${B.escapeHtml(B.t("open_preview_tab"))}</a>
          </div>
          <iframe class="signature-preview-frame" data-signature-preview-frame title="${B.escapeHtml(B.t("signature_preview_title"))}"></iframe>
        </div>
      </form>
    `;
  }

  function buildAdminPaymentActionButtons(event, target = "timeline") {
    if (!isAdmin()) return "";
    const clientActive = Boolean(event.clientPaidAt);
    const artistActive = Boolean(event.artistPaidAt);
    const clientPending = isPaymentTogglePending(event.id, "clientPaid");
    const artistPending = isPaymentTogglePending(event.id, "artistPaid");
    return [
      `
        <button
          class="btn outline timeline-payment-button ${clientActive ? "is-active" : ""} ${clientPending ? "is-pending" : ""}"
          type="button"
          data-event-payment-update="${event.id}"
          data-payment-field="clientPaid"
          data-payment-value="${clientActive ? "false" : "true"}"
          data-payment-target="${target}"
          aria-pressed="${clientActive ? "true" : "false"}"
          title="${B.escapeHtml(B.t(clientActive ? "mark_client_unpaid" : "mark_client_paid"))}"
          ${clientPending ? "disabled" : ""}>
          <span class="timeline-payment-check" aria-hidden="true"></span>
          <span>${B.escapeHtml(B.t("client_toggle_label"))}</span>
        </button>
      `,
      `
        <button
          class="btn outline timeline-payment-button ${artistActive ? "is-active" : ""} ${artistPending ? "is-pending" : ""}"
          type="button"
          data-event-payment-update="${event.id}"
          data-payment-field="artistPaid"
          data-payment-value="${artistActive ? "false" : "true"}"
          data-payment-target="${target}"
          aria-pressed="${artistActive ? "true" : "false"}"
          title="${B.escapeHtml(B.t(artistActive ? "mark_artist_unpaid" : "mark_artist_paid"))}"
          ${artistPending ? "disabled" : ""}>
          <span class="timeline-payment-check" aria-hidden="true"></span>
          <span>${B.escapeHtml(B.t("artist_toggle_label"))}</span>
        </button>
      `
    ].join("");
  }

  function buildCalendarDayDetailEvent(event, options = {}) {
    const contractButton = event.contractPath
      ? `<a class="btn outline" href="${B.escapeHtml(event.contractPath)}" target="_blank" rel="noreferrer">${B.escapeHtml(isAdmin() ? B.t("artist_pdf") : B.t("view_contract"))}</a>`
      : "";
    const clientPdfButton = isAdmin() && event.clientPdfPath
      ? `<a class="btn outline" href="${B.escapeHtml(event.clientPdfPath)}" target="_blank" rel="noreferrer">${B.escapeHtml(B.t("client_pdf"))}</a>`
      : "";
    const editButton = isAdmin() && options.allowCalendarEdit
      ? `<button class="btn outline" type="button" data-calendar-event-edit="${event.id}">${B.escapeHtml(B.t("edit"))}</button>`
      : "";
    const signForm = buildContractSignForm(event);

    return `
      <article class="calendar-detail-event">
        <div class="calendar-detail-event-head">
          <div>
            <h4>${B.escapeHtml(event.title)}</h4>
            <p class="backend-hint">${B.escapeHtml(event.venue || "")}</p>
          </div>
          <div class="timeline-meta">
            <span class="backend-pill">${B.escapeHtml(event.status)}</span>
            ${renderEventPaymentPills(event)}
          </div>
        </div>
        ${event.clientName || event.clientEmail || event.clientPhone ? `
          <p class="backend-hint">${B.escapeHtml([event.clientName, event.clientEmail, event.clientPhone].filter(Boolean).join(" · "))}</p>
        ` : ""}
        ${renderHintMetaLines(buildTimeMetaLines(event, {
          startLabelKey: "estimated_start_time",
          endLabelKey: "estimated_end_time"
        }))}
        ${renderHintMetaLines(getEventFinancialInfoLines(event))}
        ${event.notes ? `<p>${B.escapeHtml(event.notes)}</p>` : ""}
        <div class="backend-inline-actions">
          ${editButton}
          ${contractButton}
          ${clientPdfButton}
        </div>
        ${!isAdmin() && getArtistPendingNoticeKinds(event).includes("event") ? `<p class="backend-hint">${B.escapeHtml(B.t("new_gig_notice"))}</p>` : ""}
        ${event.signedAt ? `<p class="backend-hint">${B.escapeHtml(B.t("signed_at"))}: ${B.escapeHtml(B.formatDate(event.signedAt.slice(0, 10)))} • ${B.escapeHtml(event.signedByName || "")}</p>` : ""}
        ${signForm}
      </article>
    `;
  }

  function buildArtistHeroNotificationCard(event) {
    const contractButton = event.contractPath
      ? `<a class="btn outline" href="${B.escapeHtml(event.contractPath)}" target="_blank" rel="noreferrer">${B.escapeHtml(B.t("view_contract"))}</a>`
      : "";
    const dateLabel = formatEventDateLabel(event);
    const signForm = buildContractSignForm(event);

    return `
      <article class="calendar-detail-event backend-hero-notice-card">
        <div class="backend-notice-panel-head">
          <div>
            <div class="timeline-meta">
              ${renderArtistPendingNoticePills(event)}
              <span class="backend-pill">${B.escapeHtml(dateLabel)}</span>
            </div>
            <h4>${B.escapeHtml(event.title)}</h4>
            <p class="backend-hint">${B.escapeHtml(event.venue || "")}</p>
          </div>
          <button class="btn outline" type="button" data-notice-close="${event.id}" data-notice-kinds="${B.escapeHtml(getArtistPendingNoticeKinds(event).join(","))}">${B.escapeHtml(B.t("close_notice"))}</button>
        </div>
        ${event.clientName ? `<p class="backend-hint">${B.escapeHtml(event.clientName)}</p>` : ""}
        ${renderHintMetaLines(buildTimeMetaLines(event, {
          startLabelKey: "estimated_start_time",
          endLabelKey: "estimated_end_time"
        }))}
        ${renderArtistPendingNoticeMessages(event)}
        ${renderHintMetaLines(getEventFinancialInfoLines(event, { adminView: false }))}
        ${event.notes ? `<p>${B.escapeHtml(event.notes)}</p>` : ""}
        <div class="backend-inline-actions">
          ${contractButton}
        </div>
        ${event.signedAt ? `<p class="backend-hint">${B.escapeHtml(B.t("signed_at"))}: ${B.escapeHtml(B.formatDate(event.signedAt.slice(0, 10)))} • ${B.escapeHtml(event.signedByName || "")}</p>` : ""}
        ${signForm}
      </article>
    `;
  }

  function buildAdminSignatureNotificationCard(event) {
    const contractButton = event.contractPath
      ? `<a class="btn outline" href="${B.escapeHtml(event.contractPath)}" target="_blank" rel="noreferrer">${B.escapeHtml(B.t("artist_pdf"))}</a>`
      : "";
    const clientPdfButton = event.clientPdfPath
      ? `<a class="btn outline" href="${B.escapeHtml(event.clientPdfPath)}" target="_blank" rel="noreferrer">${B.escapeHtml(B.t("client_pdf"))}</a>`
      : "";

    return `
      <article class="backend-request-card signature backend-notification-card">
        <div class="backend-request-card-copy">
          <div class="timeline-meta">
            <span class="backend-pill active">${B.escapeHtml(B.t("signature_notice"))}</span>
            <span class="backend-pill">${B.escapeHtml(formatEventDateLabel(event))}</span>
          </div>
          <strong>${B.escapeHtml(event.title)}</strong>
          ${event.venue ? `<span>${B.escapeHtml(event.venue)}</span>` : ""}
          ${event.clientName || event.clientEmail || event.clientPhone ? `<span>${B.escapeHtml([event.clientName, event.clientEmail, event.clientPhone].filter(Boolean).join(" · "))}</span>` : ""}
          ${renderInlineMetaLines(buildTimeMetaLines(event, {
            startLabelKey: "estimated_start_time",
            endLabelKey: "estimated_end_time"
          }))}
          ${renderInlineMetaLines(getEventPaymentMeta(event).map((item) => B.t(item.key)))}
          ${renderInlineMetaLines(getEventFinancialInfoLines(event))}
          ${event.notes ? `<p>${B.escapeHtml(event.notes)}</p>` : ""}
          ${event.signedAt ? `<span class="backend-hint">${B.escapeHtml(B.t("signed_at"))}: ${B.escapeHtml(B.formatDate(event.signedAt.slice(0, 10)))} • ${B.escapeHtml(event.signedByName || "")}</span>` : ""}
        </div>
        <div class="backend-inline-actions">
          ${contractButton}
          ${clientPdfButton}
          <button class="btn outline" type="button" data-notice-close="${event.id}">${B.escapeHtml(B.t("close_notice"))}</button>
        </div>
      </article>
    `;
  }

  function renderHeroNotifications() {
    if (!dom.heroNotifications) return;
    if (isAdmin()) {
      dom.heroNotifications.classList.add("hidden");
      dom.heroNotifications.innerHTML = "";
      return;
    }

    const notices = listArtistEventNotifications();
    dom.heroNotifications.classList.toggle("hidden", !notices.length);
    if (!notices.length) {
      dom.heroNotifications.innerHTML = "";
      return;
    }

    dom.heroNotifications.innerHTML = `
      <div class="backend-notice-tray">
        <div class="backend-notice-tray-head">
          <div>
            <h3>${B.escapeHtml(B.t("artist_updates_title"))}</h3>
            <p class="backend-hint">${B.escapeHtml(B.t("artist_updates_hint"))}</p>
          </div>
        </div>
        <div class="backend-notice-list">
          ${notices.map((event) => buildArtistHeroNotificationCard(event)).join("")}
        </div>
      </div>
    `;
    bindContractSignForms(dom.heroNotifications);
  }

  async function fetchSignaturePreview(eventId, payload) {
    const response = await fetch(`/api/dashboard/events/${encodeURIComponent(eventId)}/sign-preview`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": B.state.csrfToken || ""
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let message = B.t("signature_preview_unavailable");
      try {
        const errorPayload = await response.json();
        message = errorPayload?.error || message;
      } catch {
        // Ignore malformed JSON from preview response.
      }
      throw new Error(message);
    }

    return response.blob();
  }

  function createSignaturePadPoint(pointerEvent, canvas) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: Math.max(0, Math.min(1, (pointerEvent.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (pointerEvent.clientY - rect.top) / rect.height))
    };
  }

  function drawSignaturePad(canvas, strokes) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const targetWidth = Math.round(rect.width * dpr);
    const targetHeight = Math.round(rect.height * dpr);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    const context = canvas.getContext("2d");
    if (!context) return;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 2;
    context.strokeStyle = "#0E0E0E";

    (strokes || []).forEach((stroke) => {
      if (!Array.isArray(stroke) || !stroke.length) return;
      context.beginPath();
      context.moveTo(stroke[0].x * rect.width, stroke[0].y * rect.height);
      stroke.slice(1).forEach((point) => {
        context.lineTo(point.x * rect.width, point.y * rect.height);
      });
      context.stroke();
    });
  }

  function bindContractSignForms(root) {
    root?.querySelectorAll(".calendar-sign-form").forEach((form) => {
      if (form.dataset.signatureBound === "true") return;
      form.dataset.signatureBound = "true";

      const eventId = form.dataset.eventId;
      const previewSupported = form.dataset.previewSupported === "true";
      const nameInput = form.querySelector('input[name="fullName"]');
      const status = form.querySelector(".signature-form-status");
      const canvas = form.querySelector("[data-signature-canvas]");
      const clearButton = form.querySelector("[data-signature-clear]");
      const previewButton = form.querySelector("[data-signature-preview]");
      const confirmButton = form.querySelector("[data-signature-confirm]");
      const previewWrap = form.querySelector("[data-signature-preview-wrap]");
      const previewFrame = form.querySelector("[data-signature-preview-frame]");
      const previewLink = form.querySelector("[data-signature-preview-link]");
      const signatureState = {
        strokes: [],
        activeStroke: null,
        previewUrl: "",
        previewReady: false
      };

      const setStatus = (message, tone = "info") => {
        B.setStatus(status, message || "", tone);
      };

      const revokePreview = () => {
        if (signatureState.previewUrl) {
          URL.revokeObjectURL(signatureState.previewUrl);
          signatureState.previewUrl = "";
        }
        signatureState.previewReady = false;
        previewWrap?.classList.add("hidden");
        previewFrame?.removeAttribute("src");
        previewLink?.removeAttribute("href");
        if (confirmButton) {
          confirmButton.disabled = previewSupported;
        }
      };

      const invalidatePreview = () => {
        revokePreview();
        setStatus("", "info");
      };

      const redraw = () => {
        drawSignaturePad(canvas, signatureState.strokes);
      };

      const hasSignature = () => signatureState.strokes.some((stroke) => Array.isArray(stroke) && stroke.length >= 2);
      const buildSignaturePayload = () => ({
        fullName: String(nameInput?.value || "").trim(),
        signatureStrokes: signatureState.strokes
          .filter((stroke) => Array.isArray(stroke) && stroke.length >= 2)
          .map((stroke) => stroke.map((point) => ({
            x: Number(point.x.toFixed(4)),
            y: Number(point.y.toFixed(4))
          })))
      });

      const validateSignatureInput = () => {
        const payload = buildSignaturePayload();
        if (!payload.fullName || !hasSignature()) {
          throw new Error(B.t("signature_required_draw"));
        }
        return payload;
      };

      const finishStroke = () => {
        if (!signatureState.activeStroke) return;
        if (signatureState.activeStroke.length === 1) {
          signatureState.activeStroke.push({ ...signatureState.activeStroke[0] });
        }
        signatureState.activeStroke = null;
        redraw();
        invalidatePreview();
      };

      if (canvas) {
        canvas.addEventListener("pointerdown", (pointerEvent) => {
          const point = createSignaturePadPoint(pointerEvent, canvas);
          if (!point) return;
          canvas.setPointerCapture(pointerEvent.pointerId);
          signatureState.activeStroke = [point];
          signatureState.strokes.push(signatureState.activeStroke);
          redraw();
          invalidatePreview();
        });

        canvas.addEventListener("pointermove", (pointerEvent) => {
          if (!signatureState.activeStroke) return;
          const point = createSignaturePadPoint(pointerEvent, canvas);
          if (!point) return;
          const lastPoint = signatureState.activeStroke[signatureState.activeStroke.length - 1];
          if (!lastPoint || lastPoint.x !== point.x || lastPoint.y !== point.y) {
            signatureState.activeStroke.push(point);
            redraw();
          }
        });

        canvas.addEventListener("pointerup", finishStroke);
        canvas.addEventListener("pointercancel", finishStroke);
        drawSignaturePad(canvas, signatureState.strokes);
      }

      if (window.ResizeObserver && canvas) {
        const resizeObserver = new ResizeObserver(() => {
          redraw();
        });
        resizeObserver.observe(canvas);
      }

      nameInput?.addEventListener("input", invalidatePreview);

      clearButton?.addEventListener("click", () => {
        signatureState.strokes = [];
        signatureState.activeStroke = null;
        redraw();
        invalidatePreview();
      });

      previewButton?.addEventListener("click", async () => {
        try {
          const payload = validateSignatureInput();
          setStatus(B.t("loading"), "info");
          const previewBlob = await fetchSignaturePreview(eventId, payload);
          revokePreview();
          signatureState.previewUrl = URL.createObjectURL(previewBlob);
          signatureState.previewReady = true;
          previewFrame?.setAttribute("src", signatureState.previewUrl);
          if (previewLink) {
            previewLink.href = signatureState.previewUrl;
          }
          previewWrap?.classList.remove("hidden");
          if (confirmButton) {
            confirmButton.disabled = false;
          }
          setStatus(B.t("signature_preview_ready"), "success");
        } catch (error) {
          setStatus(error.message, "error");
        }
      });

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
          const payload = validateSignatureInput();
          if (previewSupported && !signatureState.previewReady) {
            throw new Error(B.t("review_signature_before_confirm"));
          }
          await B.api(`/api/dashboard/events/${eventId}/sign`, {
            method: "POST",
            body: payload
          });
          revokePreview();
          await loadDashboard(currentArtistId(), {
            statusTarget: "timeline",
            message: B.t("saved"),
            tone: "success"
          });
          if (state.selectedCalendarDate) {
            renderCalendarDayDetail();
          }
          if (state.selectedTimelineEventId) {
            renderTimelineDetail();
          }
        } catch (error) {
          setStatus(error.message, "error");
          state.timelineStatusOverride = { message: error.message, tone: "error" };
          renderTimelineStatus();
        }
      });
    });
  }

  function renderCalendarDayDetail() {
    if (!dom.calendarDayDetail) return;
    if (state.timelineCreateOpen && state.eventComposerTarget === "calendar") {
      dom.calendarDayDetailContent.innerHTML = renderEventComposerMarkup();
      dom.calendarDayDetail.classList.remove("hidden");
      return;
    }
    if (!state.selectedCalendarDate) {
      dom.calendarDayDetail.classList.add("hidden");
      dom.calendarDayDetailContent.innerHTML = "";
      return;
    }

    const events = getEventsForDate(state.selectedCalendarDate);
    const availabilityLabel = isDateAvailableInDashboard(state.selectedCalendarDate) ? B.t("available") : B.t("unavailable");

    dom.calendarDayDetailContent.innerHTML = `
      <div class="calendar-detail-header">
        <div>
          <p class="backend-section-indicator">${B.escapeHtml(state.selectedCalendarDate)}</p>
          <h3>${B.escapeHtml(B.formatDate(state.selectedCalendarDate))}</h3>
          <p class="backend-hint">${B.escapeHtml(availabilityLabel)}</p>
        </div>
      </div>
      ${
        events.length
          ? `<div class="calendar-detail-events">${events.map((event) => buildCalendarDayDetailEvent(event, { allowCalendarEdit: true, detailTarget: "calendar" })).join("")}</div>`
          : `<p class="backend-hint">${B.escapeHtml(B.t("calendar_no_gigs"))}</p>`
      }
    `;
    dom.calendarDayDetail.classList.remove("hidden");
    bindContractSignForms(dom.calendarDayDetailContent);
  }

  function renderTimelineDetail() {
    if (!dom.timelineDetail || !dom.timelineDetailContent) return;
    if (state.timelineCreateOpen && state.eventComposerTarget === "timeline") {
      dom.timelineDetailContent.innerHTML = renderEventComposerMarkup();
      dom.timelineDetail.classList.remove("hidden");
      return;
    }
    const selectedEvent = currentSelectedTimelineEvent();
    if (!selectedEvent) {
      closeTimelineDetail();
      return;
    }
    const isEditing = isAdmin()
      && state.eventComposerTarget === "timeline"
      && String(state.activeTimelineEditorId || "") === String(selectedEvent.id);

    const dateLabel = selectedEvent.dateMode === "multiple"
      ? (selectedEvent.selectedDates || []).map((date) => B.formatDate(date)).join(", ")
      : selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.startDate
        ? `${B.formatDate(selectedEvent.startDate)} - ${B.formatDate(selectedEvent.endDate)}`
        : B.formatDate(selectedEvent.startDate);

    dom.timelineDetailContent.innerHTML = isEditing
      ? renderTimelineEditDetail(selectedEvent, getEventEditState(selectedEvent))
      : `
        <div class="calendar-detail-header">
          <div>
            <p class="backend-section-indicator">${B.escapeHtml(dateLabel)}</p>
            <h3>${B.escapeHtml(selectedEvent.title)}</h3>
            <p class="backend-hint">${B.escapeHtml(selectedEvent.venue || "")}</p>
          </div>
          ${isAdmin() ? `<div class="backend-inline-actions"><button class="btn outline" type="button" data-event-detail-edit-toggle="${selectedEvent.id}">${B.escapeHtml(B.t("edit"))}</button></div>` : ""}
        </div>
        <div class="calendar-detail-events">
          ${buildCalendarDayDetailEvent(selectedEvent)}
        </div>
      `;
    dom.timelineDetail.classList.remove("hidden");
    bindTimelineDetailActions();
    if (!isEditing) {
      bindContractSignForms(dom.timelineDetailContent);
    }
  }

  function renderCalendar() {
    const artist = currentArtist();
    if (!artist) {
      dom.calendarMonthLabel.textContent = "";
      dom.calendarGrid.innerHTML = "";
      renderCalendarDayDetail();
      return;
    }

    const month = state.currentMonth;
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const offset = firstDay.getDay();
    const weekdayBase = new Date(2026, 0, 4);

    dom.calendarMonthLabel.textContent = new Intl.DateTimeFormat(B.getLanguage(), {
      month: "long",
      year: "numeric"
    }).format(month);

    const parts = [];
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const day = new Date(weekdayBase);
      day.setDate(weekdayBase.getDate() + weekday);
      parts.push(`<div class="calendar-weekday">${new Intl.DateTimeFormat(B.getLanguage(), { weekday: "short" }).format(day)}</div>`);
    }

    for (let index = 0; index < offset; index += 1) {
      parts.push(`<div class="calendar-day muted" aria-hidden="true"></div>`);
    }

    const todayIso = toDateString(new Date());

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      const date = new Date(year, monthIndex, day);
      const iso = toDateString(date);
      const isPast = iso < todayIso;
      const isAvailable = isDateAvailableInDashboard(iso);
      const events = getEventsForDate(iso);
      const isSelected = state.selectedCalendarDate === iso;
      const availabilityClass = isAvailable ? "available" : "unavailable";
      const eventLabel = events.length
        ? B.escapeHtml(events.length === 1 ? events[0].title : `${events.length} ${B.t("calendar_multiple_events")}`)
        : "";
      parts.push(`
        <button
          class="calendar-day ${availabilityClass} ${events.length ? "has-event" : ""} ${isSelected ? "is-focused" : ""} ${isPast ? "muted" : ""}"
          type="button"
          data-date="${iso}"
          data-mode="${state.calendarEditMode ? "edit" : "view"}"
          ${isPast && state.calendarEditMode ? "disabled" : ""}>
          <span class="calendar-day-number">${day}</span>
          ${events.length ? "" : `<span class="calendar-day-state">${B.escapeHtml(isAvailable ? B.t("available") : B.t("unavailable"))}</span>`}
          ${events.length ? `<span class="calendar-day-event">${eventLabel}</span>` : ""}
        </button>
      `);
    }

    dom.calendarGrid.innerHTML = parts.join("");
    renderCalendarDayDetail();
    queueCalendarStateFontSizeUpdate();
  }

  function renderTimelineEventItem(event, adminView) {
    const dateTile = new Intl.DateTimeFormat(B.getLanguage(), {
      day: "2-digit",
      month: "short"
    }).format(new Date(`${event.startDate}T12:00:00`));
    const dateLabel = event.dateMode === "multiple"
      ? (event.selectedDates || []).map((date) => B.formatDate(date)).join(", ")
      : event.endDate && event.endDate !== event.startDate
        ? `${B.formatDate(event.startDate)} - ${B.formatDate(event.endDate)}`
        : B.formatDate(event.startDate);
    const contractLink = event.contractPath
      ? `<a class="btn outline" href="${B.escapeHtml(event.contractPath)}" target="_blank" rel="noreferrer">${B.escapeHtml(adminView ? B.t("artist_pdf") : B.t("view_contract"))}</a>`
      : "";
    const clientPdfLink = adminView && event.clientPdfPath
      ? `<a class="btn outline" href="${B.escapeHtml(event.clientPdfPath)}" target="_blank" rel="noreferrer">${B.escapeHtml(B.t("client_pdf"))}</a>`
      : "";
    const artistNotice = !adminView && getArtistPendingNoticeKinds(event).includes("event")
      ? `<span class="backend-pill active">${B.escapeHtml(B.t("new_gig_notice"))}</span>`
      : "";
    const signatureNeededPill = !adminView && canArtistSignContract(event)
      ? `<span class="backend-pill active">${B.escapeHtml(B.t("signature_needed"))}</span>`
      : "";
    const paymentNotifications = adminView ? "" : renderEventPaymentPills(event, { includePending: false });
    const paymentButtons = adminView ? buildAdminPaymentActionButtons(event, "timeline") : "";
    const signContractButton = !adminView && canArtistSignContract(event)
      ? `<button class="btn outline" type="button" data-timeline-sign="${event.id}">${B.escapeHtml(B.t("sign_contract"))}</button>`
      : "";
    const isEditing = adminView
      && state.eventComposerTarget === "timeline"
      && String(state.activeTimelineEditorId || "") === String(event.id)
      && String(state.selectedTimelineEventId || "") === String(event.id);

    return `
      <article class="timeline-agenda-item ${isEditing ? "is-editing" : ""}" data-timeline-item="${B.escapeHtml(String(event.id))}">
        <button class="timeline-agenda-main" type="button" data-timeline-open="${B.escapeHtml(String(event.id))}">
          <span class="timeline-agenda-date">${B.escapeHtml(dateTile)}</span>
          <span class="timeline-agenda-copy">
            <strong>${B.escapeHtml(event.title)}</strong>
            <span>${B.escapeHtml(event.venue || "")}</span>
            <span class="timeline-agenda-meta">${B.escapeHtml(dateLabel)}</span>
          </span>
        </button>
        <div class="timeline-agenda-indicators">
          <span class="backend-pill">${B.escapeHtml(event.status)}</span>
          ${artistNotice}
          ${signatureNeededPill}
          ${paymentNotifications}
        </div>
        <div class="timeline-agenda-controls ${adminView ? "timeline-agenda-controls--admin" : ""}">
          ${adminView
            ? `
              <div class="timeline-agenda-controls-row timeline-agenda-controls-row--primary">
                <button class="btn outline" type="button" data-event-edit-toggle="${event.id}">${B.escapeHtml(B.t("edit"))}</button>
                ${contractLink}
                ${clientPdfLink}
              </div>
              <div class="timeline-agenda-controls-row timeline-agenda-controls-row--payment">
                ${paymentButtons}
              </div>
            `
            : `
              <div class="timeline-agenda-controls-row timeline-agenda-controls-row--docs">
                ${contractLink}
                ${signContractButton}
              </div>
            `}
        </div>
      </article>
    `;
  }

  function bindTimelineActions() {
    dom.timelineList?.querySelectorAll("[data-timeline-open]").forEach((button) => {
      button.addEventListener("click", () => {
        openTimelineEvent(button.dataset.timelineOpen);
      });
    });

    dom.timelineList?.querySelectorAll("[data-timeline-item]").forEach((item) => {
      item.addEventListener("click", (event) => {
        if (
          event.target.closest("[data-timeline-open]") ||
          event.target.closest("[data-timeline-sign]") ||
          event.target.closest("[data-event-edit-toggle]") ||
          event.target.closest("[data-event-payment-update]") ||
          event.target.closest(".timeline-agenda-controls a")
        ) {
          return;
        }
        openTimelineEvent(item.dataset.timelineItem);
      });
    });

    dom.timelineList?.querySelectorAll("[data-event-edit-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        toggleTimelineEventEdit(button.dataset.eventEditToggle);
      });
    });

    dom.timelineList?.querySelectorAll("[data-timeline-sign]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        openTimelineEvent(button.dataset.timelineSign);
        window.requestAnimationFrame(() => {
          dom.timelineDetailContent?.querySelector('input[name="fullName"]')?.focus();
        });
      });
    });

    dom.timelineList?.querySelectorAll("[data-event-payment-update]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        updateEventPaymentState(
          button.dataset.eventPaymentUpdate,
          button.dataset.paymentField,
          String(button.dataset.paymentValue || "true") === "true",
          button.dataset.paymentTarget || "timeline"
        );
      });
    });
  }

  function toggleTimelineEventEdit(eventId) {
    const nextEventId = String(eventId || "");
    if (!nextEventId) return;

    if (
      isEditingEventComposer()
      && String(state.eventComposerEventId || "") === nextEventId
      && state.eventComposerTarget === "timeline"
    ) {
      closeEventComposer();
      state.eventCreateStatusOverride = null;
      state.timelineStatusOverride = null;
      state.selectedTimelineEventId = "";
      renderTimeline();
      renderTimelineDetail();
      return;
    }

    openEventEditComposer(nextEventId, { target: "timeline", returnToDetail: false });
  }

  function bindTimelineDetailActions() {
    const toggleButton = dom.timelineDetailContent?.querySelector("[data-event-detail-edit-toggle]");
    if (toggleButton && toggleButton.dataset.bound !== "true") {
      toggleButton.dataset.bound = "true";
      toggleButton.addEventListener("click", () => {
        openEventEditComposer(toggleButton.dataset.eventDetailEditToggle, {
          target: "timeline",
          returnToDetail: true
        });
      });
    }

    const form = dom.timelineDetailContent?.querySelector(".event-edit-form");
    if (!form || form.dataset.bound === "true") return;
    form.dataset.bound = "true";
    syncEventEditDateFieldVisibility(form);

    form.querySelectorAll("[data-time-field-group]").forEach((group) => {
      syncDashboardTimeFieldGroup(group);
    });

    form.addEventListener("input", (inputEvent) => {
      const timeGroup = inputEvent.target?.closest?.("[data-time-field-group]");
      if (timeGroup) {
        syncDashboardTimeFieldGroup(timeGroup);
      }
      if (inputEvent.target?.name === "paymentAmount") {
        inputEvent.target.value = sanitizeIntegerInputValue(inputEvent.target.value);
      }
      syncEventEditDraftState(form);
    });

    form.addEventListener("change", (changeEvent) => {
      const timeGroup = changeEvent.target?.closest?.("[data-time-field-group]");
      if (timeGroup) {
        syncDashboardTimeFieldGroup(timeGroup);
      }
      if (changeEvent.target?.name === "dateMode") {
        syncEventEditDateFieldVisibility(form);
      }
      syncEventEditDraftState(form);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const invalidTimeGroup = findInvalidTimeFieldGroup(form);
      if (invalidTimeGroup) {
        state.eventEditStatusOverride = { message: B.t("invalid_time_format"), tone: "error" };
        syncEventEditDraftState(form, { keepStatusOverride: true });
        invalidTimeGroup.querySelector("[data-time-display]")?.focus();
        return;
      }
      const formData = new FormData(form);
      const eventId = String(form.dataset.eventId || "");
      const currentEvent = listTimelineEvents().find((entry) => String(entry.id) === eventId);
      const currentState = readEventEditFormState(form);
      const contentDirty = isEventEditContentDirty(eventId, currentState);
      const shouldGenerateArtistPdf = Boolean(!currentEvent?.contractPath || contentDirty);
      const shouldGenerateClientPdf = Boolean(!currentEvent?.clientPdfPath || contentDirty);
      let resetSignedContract = false;

      if (shouldGenerateArtistPdf && currentEvent?.contractPath && currentEvent?.signedAt) {
        const confirmed = window.confirm(B.t("replace_signed_contract_confirm"));
        if (!confirmed) return;
        resetSignedContract = true;
      }

      try {
        await B.api(`/api/dashboard/events/${eventId}`, {
          method: "PATCH",
          body: {
            bookingRequestId: formData.get("bookingRequestId") || undefined,
            title: formData.get("title"),
            dateMode: formData.get("dateMode"),
            selectedDates: parseSelectedDatesInput(formData.get("selectedDates")),
            venue: formData.get("venue"),
            engagementStartTime: formData.get("engagementStartTime"),
            engagementEndTime: formData.get("engagementEndTime"),
            startDate: formData.get("startDate"),
            endDate: formData.get("endDate"),
            clientName: formData.get("clientName"),
            clientEmail: formData.get("clientEmail"),
            clientPhone: formData.get("clientPhone"),
            paymentAmount: sanitizeIntegerInputValue(formData.get("paymentAmount") || ""),
            currency: formData.get("currency"),
            requireSignature: true,
            notes: formData.get("notes"),
            createArtistPdf: shouldGenerateArtistPdf || undefined,
            createClientPdf: shouldGenerateClientPdf || undefined,
            resetSignedContract: resetSignedContract || undefined
          }
        });
        clearStoredEventEditDraft(eventId);
        state.activeTimelineEditorId = null;
        state.eventEditStatusOverride = null;
        await loadDashboard(currentArtistId(), { statusTarget: "timeline", message: B.t("saved"), tone: "success" });
      } catch (error) {
        state.eventEditStatusOverride = { message: error.message, tone: "error" };
        syncEventEditDraftState(form, { keepStatusOverride: true });
      }
    });

    form.querySelector(".event-delete-btn")?.addEventListener("click", async () => {
      const eventId = form.dataset.eventId;
      if (!eventId || !window.confirm(B.t("delete_event_confirm"))) return;
      try {
        await B.api(`/api/dashboard/events/${eventId}`, { method: "DELETE" });
        clearStoredEventEditDraft(eventId);
        state.activeTimelineEditorId = null;
        await loadDashboard(currentArtistId(), { statusTarget: "timeline", message: B.t("deleted"), tone: "success" });
      } catch (error) {
        state.eventEditStatusOverride = { message: error.message, tone: "error" };
        syncEventEditDraftState(form, { keepStatusOverride: true });
      }
    });

    syncEventEditDraftState(form, { keepStatusOverride: true });
  }

  function renderTimeline() {
    if (!currentArtist()) {
      dom.timelineList.innerHTML = "";
      closeTimelineDetail();
      state.eventEditPublishedState = {};
      state.timelineDirty = false;
      state.eventEditStatusOverride = null;
      state.timelineStatusOverride = null;
      renderTimelineStatus();
      return;
    }

    const events = listTimelineEvents();
    const adminView = isAdmin();
    state.eventEditPublishedState = Object.fromEntries(events.map((event) => [String(event.id), buildPublishedEventState(event)]));

    dom.timelineCreatePanel?.classList.add("hidden");
    dom.timelineAdd?.classList.toggle("hidden", !adminView || state.eventComposerTarget === "calendar" || Boolean(state.activeTimelineEditorId));
    dom.calendarAdd?.classList.toggle("hidden", !adminView || state.eventComposerTarget === "timeline");
    if (dom.timelineAdd) {
      dom.timelineAdd.textContent = state.timelineCreateOpen && state.eventComposerTarget === "timeline" ? B.t("cancel") : B.t("timeline_add_event");
    }
    if (dom.calendarAdd) {
      dom.calendarAdd.textContent = state.timelineCreateOpen && state.eventComposerTarget === "calendar" ? B.t("cancel") : B.t("timeline_add_event");
    }

    dom.timelineList.innerHTML = events.length
      ? events.map((event) => renderTimelineEventItem(event, adminView)).join("")
      : `<p class="backend-hint">${B.escapeHtml(B.t("timeline_no_events"))}</p>`;

    bindTimelineActions();
    renderEventComposerState();
    renderTimelineDetail();
    renderCalendarDayDetail();
    renderAdminRequestPanel();
    renderTimelineStatus();
  }

  function renderAll() {
    renderHeader();
    const artist = currentArtist();
    const hasArtist = Boolean(artist);
    dom.profileCard?.classList.toggle("hidden", !hasArtist);
    dom.calendarCard?.classList.toggle("hidden", !hasArtist);
    dom.timelineCard?.classList.toggle("hidden", !hasArtist);
    dom.bookingRequestsCard?.classList.toggle("hidden", !hasArtist || !isAdmin());
    dom.accountCard?.classList.toggle("hidden", !hasArtist);
    if (!artist) {
      closeEventComposer();
      state.profileDirty = false;
      state.profileStatusOverride = null;
      state.availabilityDirty = false;
      state.availabilityStatusOverride = null;
      state.eventCreateDirty = false;
      state.eventCreateStatusOverride = null;
      state.timelineDirty = false;
      state.eventEditStatusOverride = null;
      state.timelineStatusOverride = null;
      state.accountDirty = false;
      state.accountStatusOverride = null;
      renderAccountSettings();
      renderCalendar();
      renderTimeline();
      renderBookingRequestHistorySection();
      renderProfileStatus();
      renderAvailabilityStatus();
      renderTimelineStatus();
      renderAccountStatus();
      return;
    }

    loadProfileEditor(artist);
    loadAvailabilityEditor(artist);
    if (isAdmin()) {
      loadEventCreateEditor();
    } else {
      state.eventCreateDirty = false;
      state.eventCreateStatusOverride = null;
      closeEventComposer();
      renderTimelineStatus();
    }
    renderAccountSettings();
    renderCalendar();
    renderTimeline();
    renderBookingRequestHistorySection();
    renderProfileStatus();
    renderAvailabilityStatus();
    renderTimelineStatus();
    renderAccountStatus();
    Object.keys(state.sectionExpanded).forEach((section) => {
      setSectionExpanded(section, state.sectionExpanded[section]);
    });
  }

  function applyStatusMessage(options = {}) {
    if (!options.message) return;

    if (options.statusTarget === "settings") {
      state.accountStatusOverride = {
        message: options.message,
        tone: options.tone || "success"
      };
      renderAccountStatus();
      return;
    }

    if (options.statusTarget === "availability") {
      state.availabilityStatusOverride = {
        message: options.message,
        tone: options.tone || "success"
      };
      renderAvailabilityStatus();
      return;
    }

    if (options.statusTarget === "timeline" || options.statusTarget === "eventCreate") {
      state.timelineStatusOverride = {
        message: options.message,
        tone: options.tone || "success"
      };
      renderTimelineStatus();
      return;
    }

    if (options.statusTarget === "adminTabs") {
      B.setStatus(dom.adminTabsStatus, options.message, options.tone || "success");
      return;
    }

    state.profileStatusOverride = {
      message: options.message,
      tone: options.tone || "success"
    };
    renderProfileStatus();
  }

  async function loadDashboard(artistId, options = {}) {
    const params = isAdmin() && artistId
      ? `?artistId=${encodeURIComponent(artistId)}`
      : "";
    const payload = await B.api(`/api/dashboard${params}`);
    B.state.user = payload.user;
    B.state.csrfToken = payload.csrfToken;
    state.payload = payload;
    if (isAdmin() && !payload.artist && !(payload.artists || []).length) {
      state.createArtistOpen = true;
      setArtistQueryParam("");
    }
    if (!options.message) {
      state.timelineStatusOverride = null;
      state.eventEditStatusOverride = null;
    }
    if (!options.preserveComposer) {
      closeEventComposer();
    }
    renderAll();
    applyStatusMessage(options);
  }

  function maybeShowTour() {
    const user = B.state.user;
    if (!user || user.dashboardTourDismissedAt) return;
    const storageKey = `sophora_tour_seen_${user.id}`;
    if (safeGetStorage(storageKey)) return;
    dom.tour.classList.add("open");
    dom.tour.setAttribute("aria-hidden", "false");
    safeSetStorage(storageKey, "1");
  }

  async function handleUpload(input, fillTargetId, mode = "replace", draftScope = "profile") {
    if (!input.files?.length) return;

    const file = input.files[0];
    const kind = input.dataset.kind;
    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("file", file);
    if (isAdmin()) {
      formData.append("artistId", String(currentArtistId()));
    }

    try {
      const payload = await B.api("/api/dashboard/upload", {
        method: "POST",
        body: formData
      });
      const target = document.getElementById(fillTargetId);
      if (target) {
        target.value = mode === "append"
          ? [target.value, payload.file.url].filter(Boolean).join("\n")
          : payload.file.url;
      }
      if (draftScope === "eventCreate") {
        state.eventCreateStatusOverride = null;
        syncEventCreateDraftState();
        renderTimelineStatus();
      } else {
        state.profileStatusOverride = null;
        syncProfileDraftState();
      }
    } catch (error) {
      if (draftScope === "eventCreate") {
        state.eventCreateStatusOverride = { message: error.message, tone: "error" };
        renderTimelineStatus();
      } else {
        state.profileStatusOverride = { message: error.message, tone: "error" };
        renderProfileStatus();
      }
    } finally {
      input.value = "";
    }
  }

  async function handleAdminCreateSubmit(event) {
    event.preventDefault();
    const payload = {
      slug: document.getElementById("dashboard-admin-slug").value,
      displayName: createTranslationsFromInput("dashboard-admin-display-name-es"),
      shortBio: createTranslationsFromInput("dashboard-admin-short-bio-es"),
      publicStatus: document.getElementById("dashboard-admin-public-status").value,
      pageMode: document.getElementById("dashboard-admin-page-mode").value,
      email: document.getElementById("dashboard-admin-account-email").value,
      username: document.getElementById("dashboard-admin-account-username").value,
      password: document.getElementById("dashboard-admin-temp-password").value
    };

    try {
      const response = await B.api("/api/admin/artists", {
        method: "POST",
        body: payload
      });
      openCreateArtistPanel(false);
      setArtistQueryParam(response.artist?.id || "");
      await loadDashboard(response.artist?.id, {
        message: response.generatedPassword
          ? `${B.t("created")} Password: ${response.generatedPassword}`
          : B.t("created"),
        tone: "success"
      });
    } catch (error) {
      B.setStatus(dom.adminCreateStatus, error.message, "error");
    }
  }

  async function handleAdminTabClick(event) {
    const selectButton = event.target.closest("[data-artist-select]");
    if (selectButton) {
      const artistId = selectButton.dataset.artistSelect;
      if (artistId && artistId !== String(currentArtistId())) {
        setArtistQueryParam(artistId);
        await loadDashboard(artistId);
      }
      return;
    }

    if (event.target.closest("#dashboard-add-artist-tab")) {
      openCreateArtistPanel();
    }
  }

  function openRequestPicker(target = "timeline") {
    if (!dom.requestPickerModal || !dom.requestPickerList) return;
    state.eventComposerLaunchTarget = target;
    const availableRequests = listBookingRequests().filter((request) => request.status !== "converted");
    if (!availableRequests.length) {
      state.requestPickerOpen = false;
      openEventComposer(null, target);
      return;
    }

    dom.requestPickerList.innerHTML = availableRequests.map((request) => `
      <button class="backend-request-picker-option" type="button" data-request-picker-select="${request.id}">
        <strong>${B.escapeHtml(request.clientName)}</strong>
        <span>${B.escapeHtml(formatRequestDates(request))}</span>
        ${request.clientEmail ? `<span>${B.escapeHtml(request.clientEmail)}</span>` : ""}
        ${request.clientPhone ? `<span>${B.escapeHtml(request.clientPhone)}</span>` : ""}
        ${buildRequestMetaLines(request).map((line) => `<span>${B.escapeHtml(line)}</span>`).join("")}
      </button>
    `).join("");
    dom.requestPickerModal.classList.add("open");
    dom.requestPickerModal.setAttribute("aria-hidden", "false");
    state.requestPickerOpen = true;
  }

  function closeRequestPicker() {
    if (!dom.requestPickerModal) return;
    dom.requestPickerModal.classList.remove("open");
    dom.requestPickerModal.setAttribute("aria-hidden", "true");
    state.requestPickerOpen = false;
  }

  function prefillEventFromRequest(requestId) {
    const request = listBookingRequests().find((entry) => String(entry.id) === String(requestId));
    if (!request) return;
    const artistName = B.translateContent(currentArtist()?.displayName) || "Gig";
    const defaultState = buildDefaultEventCreateState();
    state.selectedBookingRequestId = String(request.id);
    applyEventCreateState({
      ...defaultState,
      bookingRequestId: String(request.id),
      title: `${artistName} gig`,
      dateMode: request.dateMode || "single",
      selectedDates: (request.selectedDates || []).join("\n"),
      venue: request.location || "",
      engagementStartTime: request.engagementStartTime || "",
      engagementEndTime: request.engagementEndTime || "",
      startDate: request.startDate || "",
      endDate: request.endDate || "",
      clientName: request.clientName || "",
      clientEmail: request.clientEmail || "",
      clientPhone: request.clientPhone || "",
      paymentAmount: request.suggestedBudget != null ? String(request.suggestedBudget) : defaultState.paymentAmount,
      notes: request.additionalInfo || "",
      requireSignature: true
    });
    const referenceDate = request.startDate || request.selectedDates?.[0] || "";
    const [year, month] = String(referenceDate).split("-").map(Number);
    if (year && month) {
      state.eventCreateMonth = new Date(year, month - 1, 1);
    }
    state.eventCreateStatusOverride = null;
    syncEventCreateDraftState();
  }

  function openEventComposer(requestId = null, target = "timeline") {
    closeRequestPicker();
    state.timelineCreateOpen = true;
    state.eventComposerTarget = target;
    state.eventComposerMode = "create";
    state.eventComposerEventId = "";
    state.eventComposerReturnToDetail = false;
    state.eventCreateStep = "dates";
    state.selectedCalendarDate = "";
    state.selectedTimelineEventId = "";
    state.activeTimelineEditorId = null;
    state.eventEditStatusOverride = null;
    state.timelineStatusOverride = null;
    state.eventCreatePublishedState = buildDefaultEventCreateState();
    if (requestId) {
      prefillEventFromRequest(requestId);
    } else {
      const storedDraft = loadStoredEventCreateDraft();
      applyEventCreateState(storedDraft ? {
        ...state.eventCreatePublishedState,
        ...storedDraft
      } : state.eventCreatePublishedState);
      const [year, month] = String(
        (storedDraft?.startDate) || parseSelectedDatesInput(storedDraft?.selectedDates).at(0) || ""
      ).split("-").map(Number);
      state.eventCreateMonth = year && month
        ? new Date(year, month - 1, 1)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    }
    syncEventCreateDraftState({ keepStatusOverride: false });
    renderTimeline();
    renderCalendarDayDetail();
    renderTimelineDetail();
  }

  function openEventEditComposer(eventId, options = {}) {
    const currentEvent = listTimelineEvents().find((entry) => String(entry.id) === String(eventId || ""));
    if (!currentEvent) return;
    const target = options.target === "calendar" ? "calendar" : "timeline";
    const returnToDetail = Boolean(options.returnToDetail);
    const calendarDate = options.calendarDate || state.selectedCalendarDate || currentEvent.startDate || "";

    closeRequestPicker();
    state.timelineCreateOpen = true;
    state.eventComposerTarget = target;
    state.eventComposerMode = "edit";
    state.eventComposerEventId = String(currentEvent.id);
    state.eventComposerReturnToDetail = returnToDetail;
    state.eventCreateStep = "dates";
    state.selectedCalendarDate = target === "calendar" ? calendarDate : "";
    state.selectedTimelineEventId = target === "timeline"
      ? (returnToDetail ? String(currentEvent.id) : "")
      : state.selectedTimelineEventId;
    state.activeTimelineEditorId = String(currentEvent.id);
    state.eventEditStatusOverride = null;
    state.timelineStatusOverride = null;
    state.eventCreatePublishedState = buildPublishedEventState(currentEvent);

    const storedDraft = loadCurrentEventComposerDraft();
    applyEventCreateState(storedDraft ? {
      ...state.eventCreatePublishedState,
      ...storedDraft
    } : state.eventCreatePublishedState);

    const referenceDate = storedDraft?.startDate
      || parseSelectedDatesInput(storedDraft?.selectedDates).at(0)
      || calendarDate
      || currentEvent.startDate
      || currentEvent.selectedDates?.[0]
      || "";
    const [year, month] = String(referenceDate).split("-").map(Number);
    state.eventCreateMonth = year && month
      ? new Date(year, month - 1, 1)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    syncEventCreateDraftState({ keepStatusOverride: true });
    renderTimeline();
    renderCalendarDayDetail();
    renderTimelineDetail();
  }

  function updateEventCreateField(field, value, options = {}) {
    if (!state.eventCreateDraft) {
      state.eventCreateDraft = buildDefaultEventCreateState();
    }
    state.eventCreateDraft[field] = value;
    if (field === "dateMode") {
      clearEventCreateSelection();
      return;
    }
    if (field === "requireSignature" || field === "createArtistPdf" || field === "createClientPdf") {
      state.eventCreateDraft.requireSignature = true;
      state.eventCreateDraft.createArtistPdf = true;
      state.eventCreateDraft.createClientPdf = true;
    }
    syncEventCreateDraftState();
    if (options.render) {
      renderEventComposerState();
    }
  }

  function canAdvanceEventCreateStep() {
    return getEventCreateSelectionSummaryLines().length > 0;
  }

  function buildEventCreatePayload() {
    syncEventCreateSelectionFields();
    const eventState = readEventCreateState();
    return {
      artistId: currentArtistId(),
      ...eventState,
      bookingRequestId: eventState.bookingRequestId || undefined,
      paymentAmount: sanitizeIntegerInputValue(eventState.paymentAmount),
      selectedDates: parseSelectedDatesInput(eventState.selectedDates),
      requireSignature: true,
      createArtistPdf: true,
      createClientPdf: true
    };
  }

  async function submitEventCreate(action = "save") {
    try {
      const composerRoot = state.eventComposerTarget === "calendar"
        ? dom.calendarDayDetailContent
        : dom.timelineDetailContent;
      const invalidTimeGroup = findInvalidTimeFieldGroup(composerRoot);
      if (invalidTimeGroup) {
        state.eventCreateStatusOverride = { message: B.t("invalid_time_format"), tone: "error" };
        renderTimelineStatus();
        invalidTimeGroup.querySelector("[data-time-display]")?.focus();
        return;
      }
      const currentDraftState = readEventCreateState();
      const payload = buildEventCreatePayload();
      const editingMode = isEditingEventComposer();
      if (editingMode && action === "save") {
        const eventId = String(state.eventComposerEventId || "");
        const currentEvent = currentEventComposerEvent();
        const contentDirty = isEventEditContentDirty(eventId, currentDraftState);
        const shouldGenerateArtistPdf = Boolean(!currentEvent?.contractPath || contentDirty);
        const shouldGenerateClientPdf = Boolean(!currentEvent?.clientPdfPath || contentDirty);
        let resetSignedContract = false;

        if (shouldGenerateArtistPdf && currentEvent?.contractPath && currentEvent?.signedAt) {
          const confirmed = window.confirm(B.t("replace_signed_contract_confirm"));
          if (!confirmed) return;
          resetSignedContract = true;
        }

        await B.api(`/api/dashboard/events/${eventId}`, {
          method: "PATCH",
          body: {
            ...payload,
            bookingRequestId: payload.bookingRequestId || undefined,
            clientPaid: undefined,
            artistPaid: undefined,
            requireSignature: true,
            createArtistPdf: shouldGenerateArtistPdf || undefined,
            createClientPdf: shouldGenerateClientPdf || undefined,
            resetSignedContract: resetSignedContract || undefined
          }
        });
        clearStoredEventEditDraft(eventId);
      } else {
        await B.api("/api/dashboard/events", {
          method: "POST",
          body: {
            ...payload,
            bookingRequestId: editingMode && action === "duplicate"
              ? undefined
              : (payload.bookingRequestId || undefined)
          }
        });
        if (editingMode) {
          clearStoredEventEditDraft(String(state.eventComposerEventId || ""));
        } else {
          clearStoredEventCreateDraft();
        }
      }

      state.eventCreateDirty = false;
      state.eventCreateStatusOverride = null;
      state.selectedBookingRequestId = null;
      closeEventComposer();
      await loadDashboard(currentArtistId(), {
        statusTarget: "timeline",
        message: B.t(editingMode && action === "save" ? "saved" : "created"),
        tone: "success"
      });
    } catch (error) {
      state.eventCreateStatusOverride = { message: error.message, tone: "error" };
      renderTimelineStatus();
      renderEventComposerState();
    }
  }

  async function updateEventPaymentState(eventId, field, nextValue, target = "timeline") {
    if (!isAdmin() || !eventId || !field) return;
    const pendingKey = paymentPendingKey(eventId, field);
    if (state.eventPaymentPending[pendingKey]) return;
    const previous = applyLocalEventPaymentState(eventId, field, nextValue);
    state.eventPaymentPending[pendingKey] = true;
    renderTimeline();
    try {
      await B.api(`/api/dashboard/events/${eventId}/payment`, {
        method: "PATCH",
        body: {
          [field]: nextValue
        }
      });
      delete state.eventPaymentPending[pendingKey];
      await loadDashboard(currentArtistId(), {
        statusTarget: target === "calendar" ? "availability" : "timeline",
        message: B.t("payment_tracker_updated"),
        tone: "success"
      });
    } catch (error) {
      delete state.eventPaymentPending[pendingKey];
      restoreLocalEventPaymentState(eventId, previous);
      renderTimeline();
      const tone = "error";
      if (target === "calendar") {
        state.availabilityStatusOverride = { message: error.message, tone };
        renderAvailabilityStatus();
      } else {
        state.timelineStatusOverride = { message: error.message, tone };
        renderTimelineStatus();
      }
    }
  }

  function handleEventComposerClick(event) {
    const paymentButton = event.target.closest("[data-event-payment-update]");
    if (paymentButton) {
      updateEventPaymentState(
        paymentButton.dataset.eventPaymentUpdate,
        paymentButton.dataset.paymentField,
        String(paymentButton.dataset.paymentValue || "true") === "true",
        paymentButton.dataset.paymentTarget || "timeline"
      );
      return;
    }

    const calendarEventEditButton = event.target.closest("[data-calendar-event-edit]");
    if (calendarEventEditButton) {
      openEventEditComposer(calendarEventEditButton.dataset.calendarEventEdit, {
        target: "calendar",
        returnToDetail: true,
        calendarDate: state.selectedCalendarDate
      });
      return;
    }

    const navButton = event.target.closest("[data-event-create-calendar-nav]");
    if (navButton) {
      const delta = Number(navButton.dataset.eventCreateCalendarNav || "0");
      state.eventCreateMonth = new Date(state.eventCreateMonth.getFullYear(), state.eventCreateMonth.getMonth() + delta, 1);
      renderEventComposerState();
      return;
    }

    if (event.target.closest("[data-event-create-clear]")) {
      clearEventCreateSelection();
      return;
    }

    const dateButton = event.target.closest("[data-event-create-date]");
    if (dateButton && !dateButton.disabled) {
      handleEventCreateDatePick(dateButton.dataset.eventCreateDate);
      return;
    }

    if (event.target.closest("[data-event-create-next]")) {
      if (!canAdvanceEventCreateStep()) return;
      state.eventCreateStep = "details";
      renderEventComposerState();
      return;
    }

    if (event.target.closest("[data-event-create-back]")) {
      state.eventCreateStep = "dates";
      renderEventComposerState();
      return;
    }

    if (event.target.closest("[data-event-create-duplicate]")) {
      submitEventCreate("duplicate");
      return;
    }

    const deleteButton = event.target.closest("[data-event-create-delete]");
    if (deleteButton) {
      const eventId = String(state.eventComposerEventId || "");
      if (!eventId || !window.confirm(B.t("delete_event_confirm"))) return;
      B.api(`/api/dashboard/events/${eventId}`, { method: "DELETE" })
        .then(async () => {
          clearStoredEventEditDraft(eventId);
          closeEventComposer();
          await loadDashboard(currentArtistId(), {
            statusTarget: "timeline",
            message: B.t("deleted"),
            tone: "success"
          });
        })
        .catch((error) => {
          state.eventCreateStatusOverride = { message: error.message, tone: "error" };
          renderTimelineStatus();
          renderEventComposerState();
        });
      return;
    }

    if (event.target.closest("[data-event-create-close]")) {
      if (state.eventComposerTarget === "calendar") {
        closeCalendarDayDetail();
      } else {
        closeTimelineDetail();
      }
    }
  }

  function handleEventComposerInput(event) {
    const timeGroup = event.target?.closest?.("[data-time-field-group]");
    if (timeGroup) {
      const hiddenInput = timeGroup.querySelector("[data-event-create-field]");
      if (hiddenInput?.dataset?.eventCreateField) {
        state.eventCreateStatusOverride = null;
        clearEventCreateOverlayStatus();
        syncDashboardTimeFieldGroup(timeGroup);
        updateEventCreateField(hiddenInput.dataset.eventCreateField, hiddenInput.value, {
          render: false
        });
        return;
      }
    }
    const field = event.target?.dataset?.eventCreateField;
    if (!field) return;
    state.eventCreateStatusOverride = null;
    clearEventCreateOverlayStatus();
    const value = field === "paymentAmount"
      ? sanitizeIntegerInputValue(event.target.value)
      : (event.target.type === "checkbox" ? Boolean(event.target.checked) : event.target.value);
    if (field === "paymentAmount" && event.target.value !== value) {
      event.target.value = value;
    }
    updateEventCreateField(field, value, {
      render: field === "requireSignature"
    });
  }

  function handleEventComposerSubmit(event) {
    const form = event.target.closest("[data-event-create-form]");
    if (!form) return;
    event.preventDefault();
    if (form.dataset.eventCreateStep !== "details") return;
    submitEventCreate("save");
  }

  async function handleForwardBookingRequest(requestId, channel) {
    const request = listBookingRequests().find((entry) => String(entry.id) === String(requestId));
    const artist = currentArtist();
    if (!request || !artist) return;
    const message = buildForwardMessage(request);

    if (channel === "email") {
      const recipient = artist.account?.email;
      if (!recipient) {
        setBookingRequestStatus(B.t("no_linked_account"), "error");
        return;
      }
      await B.api(`/api/dashboard/booking-requests/${request.id}/forward`, {
        method: "POST",
        body: { channel, message }
      });
      window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(`${artist.displayName?.es || "Artist"} booking request`)}&body=${encodeURIComponent(message)}`;
      setBookingRequestStatus(B.t("booking_request_sent_email"), "success");
      await loadDashboard(currentArtistId());
      return;
    }

    if (!artist.contactPhone) {
      setBookingRequestStatus(B.t("no_whatsapp_available"), "error");
      return;
    }

    await B.api(`/api/dashboard/booking-requests/${request.id}/forward`, {
      method: "POST",
      body: { channel, message }
    });
    window.open(`https://wa.me/${String(artist.contactPhone).replace(/[^\d]/g, "")}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
    setBookingRequestStatus(B.t("booking_request_sent_whatsapp"), "success");
    await loadDashboard(currentArtistId());
  }

  async function archiveBookingRequest(requestId) {
    if (!requestId) return;
    await B.api(`/api/dashboard/booking-requests/${requestId}/archive`, {
      method: "POST"
    });
    setBookingRequestStatus(B.t("saved"), "success");
    state.oldBookingRequestsVisible = true;
    await loadDashboard(currentArtistId());
  }

  async function acknowledgeEventNotice(eventId, kinds = []) {
    if (!eventId) return;
    await B.api(`/api/dashboard/events/${eventId}/acknowledge`, {
      method: "POST",
      body: kinds.length ? { kinds } : {}
    });
    await loadDashboard(currentArtistId());
  }

  async function handleAdminRequestPanelClick(event) {
    const noticeCloseButton = event.target.closest("[data-notice-close]");
    if (noticeCloseButton) {
      await acknowledgeEventNotice(noticeCloseButton.dataset.noticeClose);
      return;
    }

    const requestCloseButton = event.target.closest("[data-request-close]");
    if (requestCloseButton) {
      await archiveBookingRequest(requestCloseButton.dataset.requestClose);
      return;
    }

    const emailButton = event.target.closest("[data-request-email]");
    if (emailButton) {
      await handleForwardBookingRequest(emailButton.dataset.requestEmail, "email");
      return;
    }

    const whatsappButton = event.target.closest("[data-request-whatsapp]");
    if (whatsappButton) {
      await handleForwardBookingRequest(whatsappButton.dataset.requestWhatsapp, "whatsapp");
      return;
    }

    const useButton = event.target.closest("[data-request-use]");
    if (useButton) {
      ensureScheduleSectionVisible("timeline");
      openEventComposer(useButton.dataset.requestUse, "timeline");
      scrollCardToTop(dom.timelineCard);
      return;
    }

  }

  async function handleHeroNotificationsClick(event) {
    const noticeCloseButton = event.target.closest("[data-notice-close]");
    if (!noticeCloseButton) return;
    const kinds = String(noticeCloseButton.dataset.noticeKinds || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    await acknowledgeEventNotice(noticeCloseButton.dataset.noticeClose, kinds);
  }

  async function handleAccountIdentitySubmit(event) {
    event.preventDefault();
    const payload = {
      username: dom.accountUsernameInput.value,
      email: dom.accountEmailInput.value,
      contactPhone: dom.accountPhoneInput?.value || ""
    };

    if (isAdmin()) {
      payload.artistId = currentArtistId();
    }

    try {
      await B.api("/api/dashboard/account", {
        method: "PATCH",
        body: payload
      });
      await loadDashboard(currentArtistId(), {
        statusTarget: "settings",
        message: B.t("saved"),
        tone: "success"
      });
    } catch (error) {
      state.accountStatusOverride = { message: error.message, tone: "error" };
      renderAccountStatus();
    }
  }

  async function handleAccountPasswordSubmit(event) {
    event.preventDefault();
    const payload = {
      password: dom.accountPasswordInput.value,
      passwordConfirm: dom.accountPasswordConfirmInput.value
    };

    if (isAdmin()) {
      payload.artistId = currentArtistId();
    }

    try {
      await B.api("/api/dashboard/account/password", {
        method: "PATCH",
        body: payload
      });
      dom.accountPasswordForm.reset();
      await loadDashboard(currentArtistId(), {
        statusTarget: "settings",
        message: B.t("saved"),
        tone: "success"
      });
    } catch (error) {
      state.accountStatusOverride = { message: error.message, tone: "error" };
      renderAccountStatus();
    }
  }

  async function handleAccountAttachSubmit(event) {
    event.preventDefault();
    if (!currentArtistId()) return;

    try {
      const response = await B.api(`/api/admin/artists/${currentArtistId()}/account`, {
        method: "POST",
        body: {
          email: dom.accountAttachEmailInput.value,
          username: dom.accountAttachUsernameInput.value,
          password: dom.accountAttachPasswordInput.value
        }
      });
      dom.accountAttachForm.reset();
      await loadDashboard(currentArtistId(), {
        statusTarget: "settings",
        message: response.generatedPassword
          ? `${B.t("created")} Password: ${response.generatedPassword}`
          : B.t("created"),
        tone: "success"
      });
    } catch (error) {
      state.accountStatusOverride = { message: error.message, tone: "error" };
      renderAccountStatus();
    }
  }

  async function handleDeleteArtist() {
    if (!currentArtistId() || !isAdmin()) return;
    if (!window.confirm("Delete this artist and any linked account?")) return;

    try {
      await B.api(`/api/admin/artists/${currentArtistId()}`, {
        method: "DELETE"
      });
      setArtistQueryParam("");
      await loadDashboard(null, {
        statusTarget: "adminTabs",
        message: B.t("deleted"),
        tone: "success"
      });
    } catch (error) {
      state.accountStatusOverride = { message: error.message, tone: "error" };
      renderAccountStatus();
    }
  }

  function bindStaticHandlers() {
    dom.logout.addEventListener("click", () => {
      B.logout();
    });

    dom.sectionToggles?.forEach((button) => {
      button.addEventListener("click", () => {
        toggleSection(button.dataset.sectionToggle);
      });
    });

    [dom.profileReset, dom.profileResetBottom].forEach((button) => {
      button?.addEventListener("click", resetProfileDraftState);
    });

    dom.calendarReset?.addEventListener("click", () => {
      if (!state.availabilityPublishedState) return;
      applyAvailabilityState(state.availabilityPublishedState);
      clearStoredAvailabilityDraft();
      state.availabilityDirty = false;
      state.availabilityStatusOverride = null;
      state.calendarEditMode = false;
      renderAvailabilityStatus();
      renderCalendar();
    });

    dom.timelineReset?.addEventListener("click", () => {
      applyEventCreateState(state.eventCreatePublishedState || buildDefaultEventCreateState());
      clearCurrentEventComposerDraft();
      state.eventCreateDirty = false;
      state.eventCreateStatusOverride = null;
      if (!isEditingEventComposer()) {
        state.selectedBookingRequestId = null;
      }
      if (isEditingEventComposer()) {
        renderTimelineStatus();
        renderEventComposerState();
        return;
      }
      resetEventDrafts();
      closeEventComposer();
      renderTimelineStatus();
      renderEventComposerState();
    });

    dom.accountReset?.addEventListener("click", () => {
      if (!state.accountPublishedState) return;
      state.suspendAccountSync = true;
      applyAccountFormState(state.accountPublishedState);
      if (dom.accountAttachPasswordInput) dom.accountAttachPasswordInput.value = "";
      dom.accountPasswordForm?.reset();
      state.suspendAccountSync = false;
      clearStoredAccountDraft();
      state.accountDirty = false;
      state.accountStatusOverride = null;
      renderAccountStatus();
    });

    dom.profileForm.addEventListener("input", () => {
      state.profileStatusOverride = null;
      syncProfileDraftState();
    });

    dom.profileForm.addEventListener("change", () => {
      state.profileStatusOverride = null;
      syncProfileDraftState();
    });

    dom.profilePageMode?.addEventListener("change", () => {
      renderProfilePageModeState();
    });

    dom.audioSourceInput?.addEventListener("input", () => {
      syncAudioMediaField({ skipRender: true });
    });

    dom.audioSourceInput?.addEventListener("change", () => {
      syncAudioMediaField();
    });

    dom.audioUploadBtn?.addEventListener("click", () => {
      promptMediaUpload("audio", {
        onComplete: (uploadedUrls) => {
          dom.audioHiddenInput.value = uploadedUrls[0] || "";
          renderAudioMediaField();
          state.profileStatusOverride = null;
          syncProfileDraftState();
        }
      });
    });

    dom.audioClearBtn?.addEventListener("click", () => {
      dom.audioHiddenInput.value = "";
      renderAudioMediaField();
      state.profileStatusOverride = null;
      syncProfileDraftState();
    });

    dom.videoAddLinkBtn?.addEventListener("click", () => {
      appendBlankProfileMediaItem("video");
    });

    dom.photoAddLinkBtn?.addEventListener("click", () => {
      appendBlankProfileMediaItem("photo");
    });

    dom.videoUploadBtn?.addEventListener("click", () => {
      promptMediaUpload("video", {
        multiple: true,
        onComplete: (uploadedUrls) => {
          const existing = normalizeProfileMediaUrls(B.linesToList(dom.videoUrlsInput?.value || ""));
          dom.videoUrlsInput.value = normalizeProfileMediaUrls([...existing, ...uploadedUrls]).join("\n");
          renderProfileMediaList("video");
          document.getElementById("section-videos-input").checked = true;
          state.profileStatusOverride = null;
          syncProfileDraftState();
        }
      });
    });

    dom.photoUploadBtn?.addEventListener("click", () => {
      promptMediaUpload("photo", {
        multiple: true,
        onComplete: (uploadedUrls) => {
          const existing = normalizeProfileMediaUrls(B.linesToList(dom.photoUrlsInput?.value || ""));
          dom.photoUrlsInput.value = normalizeProfileMediaUrls([...existing, ...uploadedUrls]).join("\n");
          renderProfileMediaList("photo");
          document.getElementById("section-photos-input").checked = true;
          state.profileStatusOverride = null;
          syncProfileDraftState();
        }
      });
    });

    [dom.videoMediaList, dom.photoMediaList].forEach((list) => {
      list?.addEventListener("input", (event) => {
        const input = event.target.closest("[data-media-url-input]");
        if (!input) return;
        syncProfileMediaUrls(input.dataset.mediaUrlInput, { skipDraftSync: false });
      });

      list?.addEventListener("change", (event) => {
        const input = event.target.closest("[data-media-url-input]");
        if (!input) return;
        syncProfileMediaUrls(input.dataset.mediaUrlInput, { skipDraftSync: false });
        renderProfileMediaList(input.dataset.mediaUrlInput);
      });

      list?.addEventListener("click", (event) => {
        const roleButton = event.target.closest("[data-media-role]");
        if (roleButton) {
          const role = roleButton.dataset.mediaRole;
          const url = roleButton.dataset.mediaRoleUrl || "";
          setProfilePhotoRole(role, url);
          return;
        }

        const uploadButton = event.target.closest("[data-media-upload]");
        if (uploadButton) {
          const kind = uploadButton.dataset.mediaUpload;
          const item = uploadButton.closest("[data-media-item]");
          const urlInput = item?.querySelector(`[data-media-url-input="${kind}"]`);
          promptMediaUpload(kind, {
            onComplete: (uploadedUrls) => {
              if (!urlInput) return;
              urlInput.value = uploadedUrls[0] || "";
              syncProfileMediaUrls(kind, { skipDraftSync: false });
              renderProfileMediaList(kind);
            }
          });
          return;
        }

        const removeButton = event.target.closest("[data-media-remove]");
        if (removeButton) {
          const kind = removeButton.dataset.mediaRemove;
          removeButton.closest("[data-media-item]")?.remove();
          syncProfileMediaUrls(kind, { skipDraftSync: false });
          renderProfileMediaList(kind);
        }
      });
    });

    dom.artistTabs?.addEventListener("click", (event) => {
      handleAdminTabClick(event);
    });
    dom.adminRequestPanel?.addEventListener("click", (event) => {
      handleAdminRequestPanelClick(event);
    });
    dom.bookingRequestsBody?.addEventListener("click", (event) => {
      handleAdminRequestPanelClick(event);
    });
    dom.heroNotifications?.addEventListener("click", (event) => {
      handleHeroNotificationsClick(event);
    });

    dom.artistTabs?.addEventListener("pointerdown", (event) => {
      const handle = event.target.closest("[data-artist-drag-handle]");
      if (!handle) return;
      beginArtistTabDrag(event, handle);
    });

    dom.adminCreateForm?.addEventListener("submit", handleAdminCreateSubmit);
    dom.adminCreateCancel?.addEventListener("click", () => {
      openCreateArtistPanel(false);
    });

    dom.accountIdentityForm?.addEventListener("input", () => {
      state.accountStatusOverride = null;
      syncAccountDraftState();
    });

    dom.accountIdentityForm?.addEventListener("change", () => {
      state.accountStatusOverride = null;
      syncAccountDraftState();
    });

    dom.accountAttachForm?.addEventListener("input", () => {
      state.accountStatusOverride = null;
      syncAccountDraftState();
    });

    dom.accountAttachForm?.addEventListener("change", () => {
      state.accountStatusOverride = null;
      syncAccountDraftState();
    });

    dom.accountIdentityForm?.addEventListener("submit", handleAccountIdentitySubmit);
    dom.accountPasswordForm?.addEventListener("submit", handleAccountPasswordSubmit);
    dom.accountAttachForm?.addEventListener("submit", handleAccountAttachSubmit);
    dom.accountDeleteArtist?.addEventListener("click", handleDeleteArtist);

    dom.profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await B.api("/api/dashboard/profile", {
          method: "PATCH",
          body: collectProfilePayload()
        });
        clearStoredProfileDraft();
        state.profileDirty = false;
        state.profileStatusOverride = {
          message: B.t("saved"),
          tone: "success"
        };
        await loadDashboard(currentArtistId(), {
          message: B.t("saved"),
          tone: "success"
        });
      } catch (error) {
        state.profileStatusOverride = { message: error.message, tone: "error" };
        renderProfileStatus();
      }
    });

    dom.calendarPrev.addEventListener("click", () => {
      state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1);
      closeCalendarDayDetail();
      renderCalendar();
    });

    dom.calendarNext.addEventListener("click", () => {
      state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1);
      closeCalendarDayDetail();
      renderCalendar();
    });

    dom.calendarEdit?.addEventListener("click", () => {
      if (state.calendarEditMode) return;
      state.calendarEditMode = true;
      closeCalendarDayDetail();
      renderAvailabilityStatus();
      renderCalendar();
    });

    dom.calendarDayDetailClose?.addEventListener("click", () => {
      closeCalendarDayDetail();
    });
    dom.timelineDetailClose?.addEventListener("click", () => {
      const hadActiveEditor = Boolean(state.activeTimelineEditorId);
      closeTimelineDetail();
      if (hadActiveEditor) {
        renderTimeline();
      }
    });

    dom.calendarGrid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-date]");
      if (!button || button.disabled) return;
      const date = button.dataset.date;
      if (!state.calendarEditMode) {
        openCalendarDay(date);
        return;
      }

      const nextAvailability = !isDateAvailableInDashboard(date);
      if (nextAvailability && hasScheduledEventOnDate(date)) {
        state.availabilityStatusOverride = {
          message: B.t("calendar_event_stays_unavailable"),
          tone: "error"
        };
        renderAvailabilityStatus();
        return;
      }
      const next = new Set(state.payload.availability || []);
      if (currentAvailabilityMode() === "all_available") {
        if (isDateAvailableInDashboard(date)) next.add(date);
        else next.delete(date);
      } else if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      state.payload.availability = [...next].sort();
      state.availabilityStatusOverride = null;
      renderCalendar();
      syncAvailabilityDraftState();
    });

    dom.availabilityMonthAvailable?.addEventListener("click", () => {
      if (!currentArtist()) return;
      state.payload.artist.availabilityMode = "all_available";
      state.payload.availability = [];
      state.availabilityStatusOverride = null;
      renderCalendar();
      syncAvailabilityDraftState();
    });

    dom.availabilityMonthUnavailable?.addEventListener("click", () => {
      if (!currentArtist()) return;
      state.payload.artist.availabilityMode = "all_unavailable";
      state.payload.availability = [];
      state.availabilityStatusOverride = null;
      renderCalendar();
      syncAvailabilityDraftState();
    });

    dom.calendarSave.addEventListener("click", async () => {
      try {
        await B.api("/api/dashboard/availability", {
          method: "POST",
          body: {
            artistId: currentArtistId(),
            mode: currentAvailabilityMode(),
            dates: state.payload.availability || []
          }
        });
        clearStoredAvailabilityDraft();
        state.availabilityPublishedState = readAvailabilityState();
        state.availabilityDirty = false;
        state.availabilityStatusOverride = {
          message: B.t("saved"),
          tone: "success"
        };
        state.calendarEditMode = false;
        renderAvailabilityStatus();
        await loadDashboard(currentArtistId(), {
          statusTarget: "availability",
          message: B.t("saved"),
          tone: "success"
        });
      } catch (error) {
        state.availabilityStatusOverride = { message: error.message, tone: "error" };
        renderAvailabilityStatus();
      }
    });

    const handleComposerOverlayInput = (event) => {
      handleEventComposerInput(event);
    };
    const handleComposerOverlayClick = (event) => {
      handleEventComposerClick(event);
    };
    const handleComposerOverlaySubmit = (event) => {
      handleEventComposerSubmit(event);
    };

    dom.calendarDayDetailContent?.addEventListener("input", handleComposerOverlayInput);
    dom.calendarDayDetailContent?.addEventListener("change", handleComposerOverlayInput);
    dom.calendarDayDetailContent?.addEventListener("click", handleComposerOverlayClick);
    dom.calendarDayDetailContent?.addEventListener("submit", handleComposerOverlaySubmit);
    dom.timelineDetailContent?.addEventListener("input", handleComposerOverlayInput);
    dom.timelineDetailContent?.addEventListener("change", handleComposerOverlayInput);
    dom.timelineDetailContent?.addEventListener("click", handleComposerOverlayClick);
    dom.timelineDetailContent?.addEventListener("submit", handleComposerOverlaySubmit);

    const openComposerFromButton = (target) => {
      if (state.timelineCreateOpen && state.eventComposerTarget === target) {
        closeEventComposer();
        renderTimeline();
        renderCalendar();
        return;
      }
      openRequestPicker(target);
    };

    dom.timelineAdd?.addEventListener("click", () => openComposerFromButton("timeline"));
    dom.calendarAdd?.addEventListener("click", () => openComposerFromButton("calendar"));

    dom.requestPickerClose?.addEventListener("click", closeRequestPicker);
    dom.requestPickerSkip?.addEventListener("click", () => {
      closeRequestPicker();
      openEventComposer(null, state.eventComposerLaunchTarget);
    });
    dom.requestPickerList?.addEventListener("click", (event) => {
      const option = event.target.closest("[data-request-picker-select]");
      if (!option) return;
      closeRequestPicker();
      openEventComposer(option.dataset.requestPickerSelect, state.eventComposerLaunchTarget);
    });

    const uploadBindings = [
      { fileId: "rider-upload", targetId: "technical-rider-input", kind: "rider", mode: "replace", scope: "profile" },
      { fileId: "contract-upload", targetId: "event-contract-input", kind: "contract", mode: "replace", scope: "eventCreate" }
    ];

    uploadBindings.forEach(({ fileId, targetId, kind, mode, scope }) => {
      const input = document.getElementById(fileId);
      if (!input) return;
      input.dataset.kind = kind;
      input.addEventListener("change", () => handleUpload(input, targetId, mode, scope));
    });

    document.querySelectorAll("[data-upload-target]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = document.getElementById(button.dataset.uploadTarget);
        target?.click();
      });
    });

    dom.tourDismiss.addEventListener("click", async () => {
      dom.tour.classList.remove("open");
      dom.tour.setAttribute("aria-hidden", "true");
      if (dom.tourDontShow.checked) {
        try {
          await B.api("/api/dashboard/onboarding", {
            method: "POST",
            body: { dismissPermanently: true }
          });
        } catch (error) {
          state.accountStatusOverride = { message: error.message, tone: "error" };
          renderAccountStatus();
        }
      }
    });
  }

  async function init() {
    cacheDom();
    await B.bootstrapAuth();
    if (!B.requireUser()) return;

    bindStaticHandlers();
    dom.slugInput?.addEventListener("input", updateSlugPreview);

    const initialArtistId = B.getQueryParam("artistId");
    try {
      await loadDashboard(initialArtistId);
      maybeShowTour();
      const oauthStatus = B.getQueryParam("oauth");
      if (oauthStatus === "linked") {
        B.setStatus(dom.settingsStatus, B.t("saved"), "success");
      }
    } catch (error) {
      state.profileStatusOverride = { message: error.message, tone: "error" };
      renderProfileStatus();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("sophora:backend-language-change", () => {
    renderAll();
  });
  window.addEventListener("resize", queueCalendarStateFontSizeUpdate);
})();
