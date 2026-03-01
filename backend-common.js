(() => {
  const STORAGE_LANG = "sophora_lang";

  const DICT = {
    es: {
      auth_title: "Acceso de artistas",
      auth_subtitle: "Gestiona tu pagina, calendario, contratos y materiales desde un solo lugar.",
      login_tab: "Ingresar",
      signup_tab: "Crear cuenta",
      recovery_tab: "Recuperar acceso",
      login_identifier: "Usuario o correo",
      login_password: "Password",
      login_submit: "Ingresar",
      signup_username: "Nombre de usuario",
      signup_email: "Correo",
      signup_email_confirm: "Confirmar correo",
      signup_password: "Crear password",
      signup_password_confirm: "Confirmar password",
      signup_submit: "Crear cuenta",
      forgot_email: "Tu correo",
      forgot_submit: "Enviar recordatorio",
      oauth_login: "Entrar con",
      auth_google: "Google",
      auth_apple: "Apple",
      auth_link_note: "Tambien puedes vincular Google o Apple mas tarde desde tu dashboard.",
      auth_to_dashboard: "Ir al dashboard",
      auth_to_admin: "Ir a admin",
      logout: "Cerrar sesion",
      dashboard_title: "Dashboard del artista",
      dashboard_admin_title: "Admin Dashboard",
      admin_artist_tabs_title: "Artistas",
      admin_artist_tabs_hint: "Arrastra las pestanas para reordenarlas. Usa el boton + para crear otro artista.",
      profile_section: "Pagina publica",
      settings_section: "Configuracion",
      account_settings_section: "Ajustes de la cuenta",
      availability_section: "Calendario de disponibilidad",
      calendar_section: "Calendario",
      calendar_help: "Consulta disponibilidad y gigs desde un solo calendario. Usa Marcar disponibilidad para editar fechas libres.",
      calendar_edit: "Marcar disponibilidad",
      calendar_done_edit: "Cerrar edicion",
      new_event_section: "Nuevo evento",
      events_section: "Timeline y contratos",
      gig_timeline_section: "Gig timeline",
      save_profile: "Guardar pagina",
      publish_profile: "Publicar cambios",
      save_availability: "Guardar disponibilidad",
      selected_artist: "Artista seleccionado",
      public_status: "Estado publico",
      page_mode: "Modo de pagina",
      published: "Publicado",
      hidden: "Oculto",
      page_mode_page: "Pagina de artista y pagina de reserva",
      page_mode_booking_only: "Solo pagina de reserva",
      sort_order: "Orden",
      artist_name: "Nombre artistico",
      short_bio: "Bio corta",
      about_you: "Sobre ti",
      show_details_label: "Detalles del show",
      welcome_prefix: "Prefijo de bienvenida",
      public_url: "URL publico",
      public_url_hint: "Puedes escribir solo la parte final o pegar la URL completa. Sophora la normaliza automaticamente.",
      card_image: "Imagen de tarjeta",
      hero_image: "Imagen principal",
      audio_preview: "Audio",
      technical_rider: "PDF del rider tecnico",
      videos: "Videos",
      photos: "Fotos",
      one_per_line: "Uno por linea",
      upload_image: "Subir imagen",
      upload_video: "Subir video",
      upload_photos: "Subir fotos",
      upload_audio: "Subir audio",
      upload_pdf: "Subir PDF",
      add_video_link: "Agregar enlace",
      add_photo_link: "Agregar enlace",
      remove_media: "Quitar",
      show_item: "Mostrar",
      media_source_placeholder: "Pega un enlace o sube un archivo",
      audio_media_hint: "Pega un enlace externo de audio o sube un archivo para alojarlo aqui.",
      video_media_hint: "Cada video puede ser un enlace externo, como YouTube, o un archivo subido al sitio.",
      photo_media_hint: "Sube fotos directamente o pega un enlace externo si ya las tienes alojadas.",
      video_media_empty: "Todavia no hay videos.",
      photo_media_empty: "Todavia no hay fotos.",
      open_media_link: "Abrir enlace",
      section_about: "Mostrar sobre ti",
      section_videos: "Mostrar videos",
      section_photos: "Mostrar fotos",
      section_show: "Mostrar detalles del show",
      section_rider: "Mostrar rider tecnico",
      booking_single_date_label: "Fecha",
      availability_help: "Haz clic sobre las fechas en las que el artista esta disponible. Tambien puedes marcar desde hoy en adelante como todo disponible o todo no disponible.",
      availability_all_future_available: "Marcar todo disponible",
      availability_all_future_unavailable: "Marcar todo no disponible",
      calendar_multiple_events: "gigs",
      timeline_add_event: "Agregar gig",
      timeline_no_events: "Todavia no hay gigs cargados.",
      view_contract: "Ver contrato",
      artist_pdf: "PDF artista",
      client_pdf: "PDF cliente",
      calendar_no_gigs: "No hay gigs en esta fecha.",
      calendar_event_available_confirm: "Ese dia ya tiene un gig programado. Confirmas que igualmente debe quedar disponible?",
      calendar_event_stays_unavailable: "Ese dia ya tiene un gig programado y queda no disponible.",
      previous_month: "Mes anterior",
      next_month: "Mes siguiente",
      available: "Disponible",
      unavailable: "No disponible",
      upcoming_events: "Proximos eventos",
      past_events: "Eventos pasados",
      no_events: "Todavia no hay eventos cargados.",
      event_title: "Titulo",
      venue: "Lugar",
      start_date: "Inicio",
      end_date: "Termino",
      payment_status: "Pago",
      payment_pending: "Pago pendiente",
      client_paid: "Cliente pago",
      artist_paid: "Artista pagado",
      client_payment_update: "Pago del cliente actualizado",
      artist_payment_update: "Pago del artista actualizado",
      artist_pay: "Pago al artista",
      client_paid_notice: "El cliente ya pago a Sophora por este gig.",
      artist_paid_notice: "Sophora ya pago al artista por este gig.",
      client_unpaid_notice: "El pago del cliente figura actualmente como no pagado.",
      artist_unpaid_notice: "El pago al artista figura actualmente como no pagado.",
      payment_waived: "Sin cobro",
      client_toggle_label: "Cliente pagado",
      artist_toggle_label: "Artista pagado",
      mark_client_paid: "Marcar cliente pago",
      mark_client_unpaid: "Marcar cliente no pagado",
      mark_artist_paid: "Marcar artista pagado",
      mark_artist_unpaid: "Marcar artista no pagado",
      status: "Estado",
      payment_amount: "Monto",
      currency: "Moneda",
      contract_pdf: "Contrato PDF",
      notes: "Notas",
      create_event: "Crear evento",
      create_new_gig: "Crear gig nuevo",
      edit: "Editar",
      edit_gig: "Editar gig",
      update: "Guardar",
      delete: "Eliminar",
      delete_event_confirm: "Eliminar este gig?",
      sign_contract: "Firmar contrato",
      signature_needed: "Firma requerida",
      signature_name: "Tu nombre completo",
      draw_signature: "Dibuja tu firma",
      clear_signature: "Borrar firma",
      preview_signature: "Vista previa",
      confirm_signature: "Confirmar firma",
      review_signature_before_confirm: "Revisa el PDF final antes de confirmar la firma.",
      signature_preview_ready: "Vista previa lista. Revisa el PDF y luego confirma la firma.",
      signature_preview_unavailable: "La vista previa solo esta disponible para contratos generados por Sophora.",
      signature_required_draw: "Debes escribir tu nombre y dibujar tu firma.",
      signature_preview_title: "Vista previa del contrato firmado",
      open_preview_tab: "Abrir en otra pestana",
      signed_at: "Firmado",
      admin_title: "Admin de artistas",
      admin_subtitle: "Crea cuentas, publica paginas y entra al dashboard de cualquier artista.",
      create_artist_title: "Crear artista",
      add_artist_tab: "Nuevo artista",
      reorder_artist_tabs: "Reordenar artistas",
      current_username: "Usuario actual",
      current_email: "Correo actual",
      artist_whatsapp: "WhatsApp del artista",
      email_status: "Estado del correo",
      email_verified: "Verificado",
      email_unverified: "Sin verificar",
      save_account_details: "Guardar acceso",
      new_password: "Nuevo password",
      confirm_new_password: "Confirmar nuevo password",
      update_password: "Actualizar password",
      account_email: "Correo de la cuenta",
      account_username: "Usuario de la cuenta",
      temp_password: "Password temporal",
      create_artist: "Crear artista",
      cancel: "Cancelar",
      reset_to_current: "Restablecer",
      unsaved_changes: "Unsaved Changes",
      no_linked_account: "Este artista aun no tiene una cuenta vinculada.",
      attach_account_title: "Crear acceso para este artista",
      delete_artist: "Eliminar artista",
      open_dashboard: "Abrir dashboard",
      open_public_page: "Abrir pagina publica",
      account_connected: "Cuenta conectada",
      account_missing: "Sin cuenta",
      onboarding_title: "Como funciona tu dashboard",
      onboarding_body_1: "Todo el contenido de tu pagina es opcional. Si no cargas nada, Sophora puede llevar al cliente directo a la reserva.",
      onboarding_body_2: "Marca en el calendario los dias disponibles y revisa tu timeline para contratos, pagos y eventos pasados o futuros.",
      onboarding_body_3: "Tambien puedes subir fotos, videos, audios y tu rider tecnico, o vincular Google y Apple para entrar mas rapido.",
      dismiss: "Entendido",
      dont_show_again: "No volver a mostrar",
      public_preview: "Ver pagina publica",
      artist_updates_title: "Actualizaciones recientes",
      artist_updates_hint: "Aqui aparecen los nuevos gigs, contratos y PDFs compartidos por Sophora.",
      new_gig_notice: "Nuevo gig compartido",
      close_notice: "Cerrar mensaje",
      booking_requests_section: "Solicitudes de reserva",
      booking_requests_hint: "Las nuevas solicitudes aparecen aqui para el artista seleccionado.",
      booking_request_none: "No hay solicitudes ni firmas pendientes para este artista.",
      booking_request_new: "Nueva solicitud",
      booking_request_forwarded: "Enviada al artista",
      booking_request_converted: "Convertida en gig",
      booking_request_archived: "Solicitud cerrada",
      booking_request_dates: "Fechas solicitadas",
      booking_request_details: "Detalles del cliente",
      booking_request_contact_artist_email: "Enviar por correo",
      booking_request_contact_artist_whatsapp: "Enviar por WhatsApp",
      booking_request_use_for_event: "Usar para nuevo gig",
      booking_request_sent_email: "Mensaje preparado para correo.",
      booking_request_sent_whatsapp: "Mensaje preparado para WhatsApp.",
      show_old_booking_requests: "Mostrar solicitudes anteriores",
      no_old_booking_requests: "Todavia no hay solicitudes anteriores para este artista.",
      close_request: "Cerrar solicitud",
      signature_notice: "Firma recibida",
      signature_notice_hint: "El artista firmo el documento y el admin todavia no lo revisa.",
      event_request_source: "Solicitud seleccionada",
      require_signature: "Solicitar firma",
      create_artist_pdf: "Crear PDF artista",
      regenerate_artist_pdf: "Regenerar PDF artista con los nuevos detalles",
      regenerate_artist_pdf_signed_note: "Esto eliminara el contrato firmado actual y lo reemplazara por un contrato nuevo para volver a firmar.",
      replace_signed_contract_confirm: "Este gig ya tiene un contrato firmado. Se eliminara el contrato firmado anterior y se reemplazara por uno nuevo pendiente de firma. Continuar?",
      create_client_pdf: "Crear PDF cliente",
      engagement_time: "Tiempo de contratacion",
      engagement_start_time: "Hora de inicio",
      engagement_end_time: "Hora de termino",
      invalid_time_format: "Usa hh:mm y elige AM o PM.",
      estimated_start_time: "Hora estimada de inicio",
      estimated_end_time: "Hora estimada de termino",
      booking_location: "Lugar",
      suggested_budget: "Presupuesto sugerido",
      next_step: "Siguiente",
      back: "Atras",
      event_date_step_title: "Elegir fechas",
      event_details_step_title: "Detalles del gig",
      booking_date_label: "Opciones de fecha",
      booking_single: "Fecha unica",
      booking_multiple: "Multiples fechas",
      booking_range: "Rango de fechas",
      booking_multiple_dates_label: "Fechas",
      booking_range_start_label: "Fecha de inicio",
      booking_range_end_label: "Fecha de termino",
      booking_client_name: "Nombre",
      booking_client_email: "Correo",
      booking_client_phone: "Telefono / WhatsApp",
      booking_notify_heading: "Como quieres que te avisemos?",
      booking_notify_email: "Correo",
      booking_notify_sms: "WhatsApp",
      booking_notify_hint: "Elige al menos un metodo de aviso.",
      booking_notify_methods_label: "Avisar por",
      request_picker_title: "Elegir solicitud",
      request_picker_hint: "Selecciona una solicitud para rellenar el nuevo gig, o continua sin prefijar.",
      request_picker_skip: "Continuar sin solicitud",
      no_whatsapp_available: "Este artista aun no tiene un WhatsApp configurado.",
      oauth_linked: "Vinculado",
      oauth_not_linked: "Sin vincular",
      link_provider: "Vincular",
      auth_required: "Necesitas ingresar para continuar.",
      created: "Creado correctamente.",
      saved: "Cambios guardados.",
      payment_tracker_updated: "Estado de pago actualizado.",
      deleted: "Eliminado correctamente.",
      loading: "Cargando...",
      view_artist_page: "Ver artista",
      other_artists_label: "Lista de artistas",
      book_artist: "Reservar ahora",
      welcome_artist: "Bienvenido",
      artist_about_heading: "Sobre el artista",
      artist_show_heading: "Detalles del show",
      artist_videos_heading: "Videos",
      artist_photos_heading: "Fotos",
      artist_rider_heading: "Technical rider",
      booking_shortcut: "Esta pagina aun no tiene contenido publico, asi que enviaremos al cliente directo a la reserva.",
      auth_success_verify: "Cuenta creada. Revisa tu correo para verificar tu acceso.",
      auth_success_reset: "Tu password fue actualizado.",
      auth_success_email: "Si el correo existe, te enviamos las instrucciones.",
      reset_title: "Restablecer password",
      reset_subtitle: "Confirma tu nueva password dos veces para actualizar el acceso del artista.",
      verify_title: "Verificar correo",
      verify_subtitle: "Estamos activando tu cuenta de artista.",
      page_empty_hint: "Si desactivas todas las secciones o no agregas contenido, la web enviara al cliente directo a la pagina de reserva.",
      booking_pick_single: "Selecciona una fecha en el calendario.",
      booking_pick_multiple: "Haz clic en todas las fechas que quieras enviar.",
      booking_pick_range_start: "Selecciona la fecha de inicio.",
      booking_pick_range_end: "Ahora selecciona la fecha de termino.",
      booking_clear_selection: "Limpiar seleccion",
      booking_selection_label: "Fechas seleccionadas"
      ,
      booking_missing_contact_name: "Completa tu nombre.",
      booking_missing_notification_method: "Elige al menos un metodo de aviso.",
      booking_missing_email_notification: "Ingresa un correo o desactiva los avisos por correo.",
      booking_invalid_email_notification: "Ingresa un correo valido en el campo Correo o desactiva los avisos por correo.",
      booking_missing_phone_notification: "Ingresa un telefono o desactiva los avisos por WhatsApp.",
      booking_available_dates_only: "Solo puedes seleccionar fechas marcadas como disponibles por el artista o el admin.",
      booking_no_available_dates: "Todavia no hay fechas disponibles publicadas para este artista.",
      booking_submit_success: "Tu solicitud fue enviada a Sophora. Te contactaremos por el metodo que seleccionaste.",
      booking_submit_error: "No pudimos enviar tu solicitud. Revisa los campos marcados e intentalo de nuevo."
    },
    en: {
      auth_title: "Artist access",
      auth_subtitle: "Manage your page, availability, contracts, and materials from one place.",
      login_tab: "Sign in",
      signup_tab: "Sign up",
      recovery_tab: "Recover access",
      login_identifier: "Username or email",
      login_password: "Password",
      login_submit: "Sign in",
      signup_username: "Username",
      signup_email: "Email",
      signup_email_confirm: "Confirm email",
      signup_password: "Create password",
      signup_password_confirm: "Confirm password",
      signup_submit: "Create account",
      forgot_email: "Your email",
      forgot_submit: "Send reminder",
      oauth_login: "Continue with",
      auth_google: "Google",
      auth_apple: "Apple",
      auth_link_note: "You can also link Google or Apple later from your dashboard.",
      auth_to_dashboard: "Go to dashboard",
      auth_to_admin: "Go to admin",
      logout: "Sign out",
      dashboard_title: "Artist dashboard",
      dashboard_admin_title: "Admin Dashboard",
      admin_artist_tabs_title: "Artists",
      admin_artist_tabs_hint: "Drag the tabs to reorder them. Use the + button to add another artist.",
      profile_section: "Public page",
      settings_section: "Settings",
      account_settings_section: "Account settings",
      availability_section: "Availability calendar",
      calendar_section: "Calendar",
      calendar_help: "Review availability and gigs in one place. Use Mark availability to edit free dates.",
      calendar_edit: "Mark availability",
      calendar_done_edit: "Done editing",
      new_event_section: "New Event",
      events_section: "Timeline and contracts",
      gig_timeline_section: "Gig timeline",
      save_profile: "Save page",
      publish_profile: "Publish changes",
      save_availability: "Save availability",
      selected_artist: "Selected artist",
      public_status: "Public status",
      page_mode: "Page mode",
      published: "Published",
      hidden: "Hidden",
      page_mode_page: "Artist page & booking page",
      page_mode_booking_only: "Booking page only",
      sort_order: "Order",
      artist_name: "Artist name",
      short_bio: "Short bio",
      about_you: "About you",
      show_details_label: "Show details",
      welcome_prefix: "Welcome prefix",
      public_url: "Public URL",
      public_url_hint: "You can type only the final segment or paste the full URL. Sophora will normalize it automatically.",
      card_image: "Card image",
      hero_image: "Hero image",
      audio_preview: "Audio",
      technical_rider: "Technical rider PDF",
      videos: "Videos",
      photos: "Photos",
      one_per_line: "One per line",
      upload_image: "Upload image",
      upload_video: "Upload video",
      upload_photos: "Upload photos",
      upload_audio: "Upload audio",
      upload_pdf: "Upload PDF",
      add_video_link: "Add link",
      add_photo_link: "Add link",
      remove_media: "Remove",
      show_item: "Show",
      media_source_placeholder: "Paste a link or upload a file",
      audio_media_hint: "Paste an external audio link or upload a file to host it here.",
      video_media_hint: "Each video can be an external link, like YouTube, or a file uploaded to the site.",
      photo_media_hint: "Upload photos directly or paste an external link if they are already hosted elsewhere.",
      video_media_empty: "No videos yet.",
      photo_media_empty: "No photos yet.",
      open_media_link: "Open link",
      section_about: "Show about section",
      section_videos: "Show videos",
      section_photos: "Show photos",
      section_show: "Show show details",
      section_rider: "Show technical rider",
      booking_single_date_label: "Date",
      availability_help: "Click the dates when the artist is free to perform. You can also mark everything from today forward as available or unavailable.",
      availability_all_future_available: "Mark all future dates available",
      availability_all_future_unavailable: "Mark all future dates unavailable",
      calendar_multiple_events: "gigs",
      timeline_add_event: "Add gig",
      timeline_no_events: "No gigs have been added yet.",
      view_contract: "View contract",
      artist_pdf: "Artist PDF",
      client_pdf: "Client PDF",
      calendar_no_gigs: "There are no gigs on this date.",
      calendar_event_available_confirm: "This date already has a scheduled gig. Are you sure it should still be available?",
      calendar_event_stays_unavailable: "This date already has a scheduled gig and stays unavailable.",
      previous_month: "Previous month",
      next_month: "Next month",
      available: "Available",
      unavailable: "Unavailable",
      upcoming_events: "Upcoming events",
      past_events: "Past events",
      no_events: "No events have been added yet.",
      event_title: "Title",
      venue: "Venue",
      start_date: "Start",
      end_date: "End",
      payment_status: "Payment",
      payment_pending: "Payment pending",
      client_paid: "Client paid",
      artist_paid: "Artist paid",
      client_payment_update: "Client payment updated",
      artist_payment_update: "Artist payment updated",
      artist_pay: "Artist pay",
      client_paid_notice: "The client has paid Sophora for this gig.",
      artist_paid_notice: "Sophora has paid the artist for this gig.",
      client_unpaid_notice: "Client payment is currently marked as unpaid.",
      artist_unpaid_notice: "Artist payment is currently marked as unpaid.",
      payment_waived: "No charge",
      client_toggle_label: "Client Paid",
      artist_toggle_label: "Artist Paid",
      mark_client_paid: "Mark Client Paid",
      mark_client_unpaid: "Mark Client Unpaid",
      mark_artist_paid: "Mark Artist Paid",
      mark_artist_unpaid: "Mark Artist Unpaid",
      status: "Status",
      payment_amount: "Amount",
      currency: "Currency",
      contract_pdf: "Contract PDF",
      notes: "Notes",
      create_event: "Create event",
      create_new_gig: "Create new gig",
      edit: "Edit",
      edit_gig: "Edit gig",
      update: "Save",
      delete: "Delete",
      delete_event_confirm: "Delete this gig?",
      sign_contract: "Sign contract",
      signature_needed: "Signature needed",
      signature_name: "Your full name",
      draw_signature: "Draw your signature",
      clear_signature: "Clear signature",
      preview_signature: "Preview",
      confirm_signature: "Confirm signature",
      review_signature_before_confirm: "Review the final PDF before confirming your signature.",
      signature_preview_ready: "Preview ready. Review the PDF and then confirm the signature.",
      signature_preview_unavailable: "Preview is only available for Sophora-generated contracts.",
      signature_required_draw: "You must type your name and draw your signature.",
      signature_preview_title: "Signed contract preview",
      open_preview_tab: "Open in new tab",
      signed_at: "Signed",
      admin_title: "Artist admin",
      admin_subtitle: "Create accounts, publish pages, and open any artist dashboard.",
      create_artist_title: "Create artist",
      add_artist_tab: "New artist",
      reorder_artist_tabs: "Reorder artists",
      current_username: "Current username",
      current_email: "Current email",
      artist_whatsapp: "Artist WhatsApp",
      email_status: "Email status",
      email_verified: "Verified",
      email_unverified: "Unverified",
      save_account_details: "Save login details",
      new_password: "New password",
      confirm_new_password: "Confirm new password",
      update_password: "Update password",
      account_email: "Account email",
      account_username: "Account username",
      temp_password: "Temporary password",
      create_artist: "Create artist",
      cancel: "Cancel",
      reset_to_current: "Reset to current settings",
      unsaved_changes: "Unsaved Changes",
      no_linked_account: "This artist does not have a linked account yet.",
      attach_account_title: "Create access for this artist",
      delete_artist: "Delete artist",
      open_dashboard: "Open dashboard",
      open_public_page: "Open public page",
      account_connected: "Account connected",
      account_missing: "No account yet",
      onboarding_title: "How your dashboard works",
      onboarding_body_1: "All public page content is optional. If you upload nothing, Sophora can send clients straight to booking.",
      onboarding_body_2: "Use the calendar for free dates and the timeline for contracts, payments, past shows, and upcoming events.",
      onboarding_body_3: "You can also upload photos, videos, audio, and your technical rider, or link Google and Apple for faster sign-in.",
      dismiss: "Understood",
      dont_show_again: "Don't show again",
      public_preview: "View public page",
      artist_updates_title: "Recent updates",
      artist_updates_hint: "New gigs, contracts, and PDFs shared by Sophora appear here.",
      new_gig_notice: "New gig shared",
      close_notice: "Close message",
      booking_requests_section: "Booking requests",
      booking_requests_hint: "New requests for the selected artist appear here.",
      booking_request_none: "There are no pending booking requests or signature notices for this artist.",
      booking_request_new: "New request",
      booking_request_forwarded: "Sent to artist",
      booking_request_converted: "Converted to gig",
      booking_request_archived: "Closed request",
      booking_request_dates: "Requested dates",
      booking_request_details: "Client details",
      booking_request_contact_artist_email: "Send by email",
      booking_request_contact_artist_whatsapp: "Send by WhatsApp",
      booking_request_use_for_event: "Use for new gig",
      booking_request_sent_email: "Message prepared for email.",
      booking_request_sent_whatsapp: "Message prepared for WhatsApp.",
      show_old_booking_requests: "Show old booking requests",
      no_old_booking_requests: "There are no old booking requests for this artist yet.",
      close_request: "Close request",
      signature_notice: "Signature received",
      signature_notice_hint: "The artist signed the document and the admin has not reviewed it yet.",
      event_request_source: "Selected request",
      require_signature: "Require signature",
      create_artist_pdf: "Create artist PDF",
      regenerate_artist_pdf: "Regenerate artist PDF with the new details",
      regenerate_artist_pdf_signed_note: "This will remove the current signed contract and replace it with a new contract for signature again.",
      replace_signed_contract_confirm: "This gig already has a signed contract. The old signed contract will be deleted and replaced with a new unsigned contract. Continue?",
      create_client_pdf: "Create client PDF",
      engagement_time: "Engagement time",
      engagement_start_time: "Start Time",
      engagement_end_time: "End Time",
      invalid_time_format: "Use hh:mm and choose AM or PM.",
      estimated_start_time: "Estimated start time",
      estimated_end_time: "Estimated end time",
      booking_location: "Location",
      suggested_budget: "Suggested budget",
      next_step: "Next",
      back: "Back",
      event_date_step_title: "Choose dates",
      event_details_step_title: "Gig details",
      booking_date_label: "Date options",
      booking_single: "Single date",
      booking_multiple: "Multiple dates",
      booking_range: "Date range",
      booking_multiple_dates_label: "Dates",
      booking_range_start_label: "Start date",
      booking_range_end_label: "End date",
      booking_client_name: "Name",
      booking_client_email: "Email",
      booking_client_phone: "Phone / WhatsApp",
      booking_notify_heading: "How should we notify you?",
      booking_notify_email: "Email",
      booking_notify_sms: "WhatsApp",
      booking_notify_hint: "Choose at least one notification method.",
      booking_notify_methods_label: "Notify by",
      request_picker_title: "Choose request",
      request_picker_hint: "Choose a request to prefill the new gig, or continue without one.",
      request_picker_skip: "Continue without request",
      no_whatsapp_available: "This artist does not have a WhatsApp number configured yet.",
      oauth_linked: "Linked",
      oauth_not_linked: "Not linked",
      link_provider: "Link",
      auth_required: "You need to sign in to continue.",
      created: "Created successfully.",
      saved: "Changes saved.",
      payment_tracker_updated: "Payment status updated.",
      deleted: "Deleted successfully.",
      loading: "Loading...",
      view_artist_page: "View artist",
      other_artists_label: "Artist List",
      book_artist: "Book now",
      welcome_artist: "Welcome",
      artist_about_heading: "About the artist",
      artist_show_heading: "Show details",
      artist_videos_heading: "Videos",
      artist_photos_heading: "Photos",
      artist_rider_heading: "Technical rider",
      booking_shortcut: "This page has no public content yet, so clients will be sent straight to booking.",
      auth_success_verify: "Account created. Check your email to verify access.",
      auth_success_reset: "Your password was updated.",
      auth_success_email: "If that email exists, the instructions were sent.",
      reset_title: "Reset password",
      reset_subtitle: "Confirm your new password twice to update the artist account.",
      verify_title: "Verify email",
      verify_subtitle: "We are activating your artist account.",
      page_empty_hint: "If every section is turned off or left empty, the site will send clients straight to the booking page.",
      booking_pick_single: "Choose one date from the calendar.",
      booking_pick_multiple: "Click every date you want to send.",
      booking_pick_range_start: "Choose the start date.",
      booking_pick_range_end: "Now choose the end date.",
      booking_clear_selection: "Clear selection",
      booking_selection_label: "Selected dates"
      ,
      booking_missing_contact_name: "Please complete your name.",
      booking_missing_notification_method: "Choose at least one notification method.",
      booking_missing_email_notification: "Please enter an email address or turn off email notifications.",
      booking_invalid_email_notification: "Please enter a valid email address in the Email field or turn off email notifications.",
      booking_missing_phone_notification: "Please enter a phone number or turn off WhatsApp notifications.",
      booking_available_dates_only: "You can only select dates marked as available by the artist or admin.",
      booking_no_available_dates: "There are no published available dates for this artist yet.",
      booking_submit_success: "Your request has been sent to Sophora. We will contact you using your selected method.",
      booking_submit_error: "We could not send your request. Please review the highlighted fields and try again."
    },
    zh: {
      welcome_artist: "欢迎",
      artist_pay: "艺人报酬"
    },
    hi: {
      welcome_artist: "स्वागत है",
      artist_pay: "कलाकार का भुगतान"
    },
    fr: {
      welcome_artist: "Bienvenue",
      artist_pay: "Paiement de l'artiste"
    },
    ar: {
      welcome_artist: "مرحبا",
      artist_pay: "أجر الفنان"
    },
    bn: {
      welcome_artist: "স্বাগতম",
      artist_pay: "শিল্পীর পারিশ্রমিক"
    },
    pt: {
      welcome_artist: "Bem-vindo",
      artist_pay: "Pagamento do artista"
    },
    ru: {
      welcome_artist: "Добро пожаловать",
      artist_pay: "Оплата артисту"
    },
    ur: {
      welcome_artist: "خوش آمدید",
      artist_pay: "فنکار کی ادائیگی"
    }
  };

  const state = {
    user: null,
    csrfToken: null
  };

  function getLanguage() {
    const stored = localStorage.getItem(STORAGE_LANG) || document.documentElement.lang || "es";
    const base = String(stored).toLowerCase().split("-")[0];
    return DICT[base] ? base : "es";
  }

  function t(key) {
    const lang = getLanguage();
    return DICT[lang]?.[key] || DICT.es[key] || key;
  }

  function applyTranslations(root = document) {
    root.querySelectorAll("[data-t]").forEach((element) => {
      const key = element.getAttribute("data-t");
      const attr = element.getAttribute("data-t-attr");
      const value = t(key);
      if (attr) {
        element.setAttribute(attr, value);
      } else {
        element.textContent = value;
      }
    });
  }

  async function api(path, options = {}) {
    const config = {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        ...options.headers
      },
      credentials: "same-origin"
    };

    if (options.body instanceof FormData) {
      config.body = options.body;
    } else if (options.body !== undefined) {
      config.body = JSON.stringify(options.body);
      config.headers["Content-Type"] = "application/json";
    }

    if (!options.skipCsrf && state.csrfToken && config.method !== "GET") {
      config.headers["x-csrf-token"] = state.csrfToken;
    }

    const response = await fetch(path, config);
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : { error: await response.text() };

    if (!response.ok) {
      const error = new Error(payload.error || "Request failed.");
      error.payload = payload;
      error.status = response.status;
      throw error;
    }

    return payload;
  }

  async function bootstrapAuth() {
    const payload = await api("/api/auth/me", { skipCsrf: true });
    state.user = payload.user;
    state.csrfToken = payload.csrfToken;
    return payload;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function translateContent(value) {
    if (!value || typeof value !== "object") return "";
    const lang = getLanguage();
    return value[lang] || value.es || value.en || Object.values(value).find(Boolean) || "";
  }

  function formatDate(value) {
    if (!value) return "";
    try {
      return new Intl.DateTimeFormat(getLanguage(), {
        dateStyle: "medium"
      }).format(new Date(`${value}T12:00:00`));
    } catch {
      return value;
    }
  }

  function formatMoney(amount, currency = "CLP") {
    try {
      return new Intl.NumberFormat(getLanguage(), {
        style: "currency",
        currency
      }).format(Number(amount || 0));
    } catch {
      return `${amount} ${currency}`;
    }
  }

  function linesToList(value) {
    return String(value || "")
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function renderVideoEmbed(url, title) {
    const safeTitle = escapeHtml(title || "Video");
    if ((String(url || "").startsWith("/uploads/")) || /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(String(url || ""))) {
      return `
        <div class="video-embed">
          <video controls preload="metadata" title="${safeTitle}">
            <source src="${escapeHtml(url)}" />
          </video>
        </div>
      `;
    }

    if (/youtu\.be|youtube\.com/i.test(url)) {
      const videoId =
        url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/)?.[1] || "";
      if (videoId) {
        return `
          <div class="video-embed">
            <iframe
              src="https://www.youtube.com/embed/${videoId}"
              title="${safeTitle}"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen>
            </iframe>
          </div>
        `;
      }
    }

    if (/tiktok\.com/i.test(url)) {
      const videoId = url.match(/video\/(\d+)/)?.[1];
      if (videoId) {
        return `
          <div class="video-embed">
            <iframe
              src="https://www.tiktok.com/player/v1/${videoId}"
              title="${safeTitle}"
              allowfullscreen>
            </iframe>
          </div>
        `;
      }
    }

    return `
      <a class="btn outline" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">
        ${safeTitle}
      </a>
    `;
  }

  function setStatus(element, message, tone = "info") {
    if (!element) return;
    element.textContent = message || "";
    element.className = `backend-status ${tone}${message ? " active" : ""}`;
  }

  function requireUser(options = {}) {
    if (!state.user) {
      window.location.href = "/auth.html";
      return false;
    }

    if (options.role && state.user.role !== options.role) {
      window.location.href = "/dashboard.html";
      return false;
    }

    return true;
  }

  function logout() {
    return api("/api/auth/logout", { method: "POST" }).then(() => {
      state.user = null;
      state.csrfToken = null;
      window.location.href = "/auth.html";
    });
  }

  window.addEventListener("sophora:language-change", () => {
    applyTranslations(document);
    window.dispatchEvent(new Event("sophora:backend-language-change"));
  });

  document.addEventListener("DOMContentLoaded", () => {
    applyTranslations(document);
  });

  window.SophoraBackend = {
    state,
    t,
    api,
    bootstrapAuth,
    applyTranslations,
    escapeHtml,
    translateContent,
    formatDate,
    formatMoney,
    linesToList,
    getQueryParam,
    renderVideoEmbed,
    setStatus,
    requireUser,
    logout,
    getLanguage
  };
})();
