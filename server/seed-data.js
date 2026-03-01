export const SEED_ARTISTS = [
  {
    slug: "gusto-completo",
    displayName: { es: "Gusto Completo", en: "Gusto Completo" },
    shortBio: {
      es: "Ensamble latino de alta energia para festivales, eventos corporativos y celebraciones privadas.",
      en: "High-energy Latin ensemble for festivals, corporate events, and private celebrations."
    },
    about: {
      es: "Una propuesta vibrante pensada para mantener la pista activa con repertorio latino, cumbia y clasicos bailables.",
      en: "A vibrant live act built to keep dance floors moving with Latin repertoire, cumbia, and celebratory classics."
    },
    showDetails: {
      es: "Formato flexible para matrimonios, eventos corporativos y fiestas privadas. Puede adaptarse en duracion y puesta en escena.",
      en: "Flexible format for weddings, corporate events, and private celebrations, adaptable in running time and stage setup."
    },
    welcomePrefix: { es: "Bienvenido", en: "Welcome" },
    cardImageUrl: "/assets/artist-placeholder.svg",
    cardAudioUrl: "/assets/audio-placeholder.wav",
    heroImageUrl: null,
    technicalRiderPath: null,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=AtsafbG_mDw",
        title: { es: "Video destacado", en: "Featured video" }
      }
    ],
    photos: [],
    pageSections: {
      about: true,
      videos: true,
      photos: false,
      showDetails: true,
      technicalRider: false
    },
    pageMode: "page",
    sortOrder: 10
  },
  {
    slug: "carmeners",
    displayName: { es: "Carmeners", en: "Carmeners" },
    shortBio: {
      es: "Grupo vocal elegante que mezcla jazz, soul y pop moderno para venues premium.",
      en: "Elegant vocal group blending jazz, soul, and modern pop for upscale venues."
    },
    about: {
      es: "Carmeners presenta armonias refinadas y una propuesta visual pensada para hoteles, marcas y escenarios boutique.",
      en: "Carmeners brings refined harmonies and a polished visual setup designed for hotels, brands, and boutique stages."
    },
    showDetails: {
      es: "Ideal para cocteles, cenas, lanzamientos y formatos lounge. Repertorio adaptable segun el tipo de audiencia.",
      en: "Ideal for cocktail hours, dinners, launches, and lounge settings with a repertoire that adapts to the audience."
    },
    welcomePrefix: { es: "Bienvenido", en: "Welcome" },
    cardImageUrl: "/artists/carmeners/assets/the-carmeners-jpg.webp",
    cardAudioUrl: "/artists/carmeners/assets/the-carmeners-audio.mp3",
    heroImageUrl: "/artists/carmeners/assets/the-carmeners-logo.jpeg",
    technicalRiderPath: null,
    videos: [
      {
        url: "https://www.tiktok.com/@thecarmeners/video/7352647584634260742",
        title: { es: "Presentacion TikTok", en: "TikTok feature" }
      }
    ],
    photos: [
      {
        url: "/artists/carmeners/assets/the-carmeners-jpg.webp",
        alt: { es: "Foto de Carmeners", en: "Carmeners photo" }
      }
    ],
    pageSections: {
      about: true,
      videos: true,
      photos: true,
      showDetails: true,
      technicalRider: false
    },
    pageMode: "page",
    sortOrder: 20
  },
  {
    slug: "alexander-roberts",
    displayName: { es: "Alexander Roberts", en: "Alexander Roberts" },
    shortBio: {
      es: "Solista con set acustico calido, ideal para lounges, cocteles y escenarios pequenos.",
      en: "Solo performer with a warm acoustic set, perfect for lounges, cocktails, and small stages."
    },
    about: {
      es: "Alexander mezcla repertorio internacional con una puesta en escena cercana, ideal para eventos donde importa la atmosfera.",
      en: "Alexander blends international repertoire with an intimate stage presence suited to events where atmosphere matters."
    },
    showDetails: {
      es: "Disponible en formato solo con guitarra y voz, ideal para recepciones, cenas y eventos privados.",
      en: "Available in solo guitar-and-vocal format, ideal for receptions, dinners, and private events."
    },
    welcomePrefix: { es: "Bienvenido", en: "Welcome" },
    cardImageUrl: "/artists/alexander-roberts/assets/alexander-roberts-casual-headshot.jpg",
    cardAudioUrl: "/assets/audio-placeholder.wav",
    heroImageUrl: "/artists/alexander-roberts/assets/alexander-roberts-casual-headshot.jpg",
    technicalRiderPath: null,
    videos: [],
    photos: [
      {
        url: "/artists/alexander-roberts/assets/alexander-roberts-casual-headshot.jpg",
        alt: { es: "Alexander Roberts", en: "Alexander Roberts" }
      }
    ],
    pageSections: {
      about: true,
      videos: false,
      photos: true,
      showDetails: true,
      technicalRider: false
    },
    pageMode: "page",
    sortOrder: 30
  }
];

export const SEED_AVAILABILITY = {
  "gusto-completo": ["2026-03-15", "2026-03-22", "2026-04-12"],
  "carmeners": ["2026-03-18", "2026-03-27", "2026-04-08"],
  "alexander-roberts": ["2026-03-07", "2026-03-14", "2026-03-21", "2026-04-04"]
};

export const SEED_EVENTS = [
  {
    artistSlug: "gusto-completo",
    title: "Festival de Verano",
    venue: "Valparaiso",
    startDate: "2026-01-18",
    endDate: "2026-01-18",
    status: "completed",
    paymentStatus: "paid",
    paymentAmount: 900000,
    currency: "CLP",
    notes: "Evento completado y liquidado."
  },
  {
    artistSlug: "carmeners",
    title: "Lanzamiento de Marca",
    venue: "Santiago",
    startDate: "2026-03-20",
    endDate: "2026-03-20",
    status: "upcoming",
    paymentStatus: "pending",
    paymentAmount: 650000,
    currency: "CLP",
    notes: "Se espera confirmacion final del contrato."
  },
  {
    artistSlug: "alexander-roberts",
    title: "Cocktail Privado",
    venue: "Vitacura",
    startDate: "2026-03-12",
    endDate: "2026-03-12",
    status: "upcoming",
    paymentStatus: "partial",
    paymentAmount: 450000,
    currency: "CLP",
    notes: "Abono recibido. Falta firma del contrato."
  }
];
