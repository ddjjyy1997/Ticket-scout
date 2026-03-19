// Canadian venues — Ticketmaster Discovery API venue IDs
export const VENUES = [
  // ── Toronto ──────────────────────────────────────────────
  { name: "Scotiabank Arena", slug: "scotiabank-arena", capacity: 19800, tmVenueId: "KovZpZAFFE1A", city: "Toronto" },
  { name: "Rogers Centre", slug: "rogers-centre", capacity: 49282, tmVenueId: "KovZpa3Bbe", city: "Toronto" },
  { name: "Rogers Stadium", slug: "rogers-stadium", capacity: 49282, tmVenueId: "KovZ917ARzt", city: "Toronto" },
  { name: "RBC Amphitheatre", slug: "budweiser-stage", capacity: 16000, tmVenueId: "KovZpZAEkkIA", city: "Toronto" },
  { name: "Massey Hall", slug: "massey-hall", capacity: 2765, tmVenueId: "KovZpZAFnlnA", city: "Toronto" },
  { name: "History", slug: "history-toronto", capacity: 2500, tmVenueId: "KovZ917AJ4f", city: "Toronto" },
  { name: "ECHO Beach", slug: "echo-beach", capacity: 4000, tmVenueId: "KovZpZAJ6EFA", city: "Toronto" },
  { name: "Danforth Music Hall", slug: "danforth-music-hall", capacity: 1500, tmVenueId: "KovZpa3yBe", city: "Toronto" },
  { name: "Coca-Cola Coliseum", slug: "coca-cola-coliseum", capacity: 8100, tmVenueId: "KovZpZAJt7FA", city: "Toronto" },

  // ── Vancouver ────────────────────────────────────────────
  { name: "Rogers Arena", slug: "rogers-arena", capacity: 18910, tmVenueId: "KovZpZAFFInA", city: "Vancouver" },
  { name: "BC Place", slug: "bc-place", capacity: 54500, tmVenueId: "KovZpZAJdn6A", city: "Vancouver" },
  { name: "PNE Amphitheatre", slug: "pne-amphitheatre", capacity: 10000, tmVenueId: "KovZpZAEeJAA", city: "Vancouver" },
  { name: "Commodore Ballroom", slug: "commodore-ballroom", capacity: 990, tmVenueId: "KovZpZAEkklA", city: "Vancouver" },
  { name: "Queen Elizabeth Theatre", slug: "queen-elizabeth-theatre", capacity: 2765, tmVenueId: "KovZpZAavEvA", city: "Vancouver" },
  { name: "Pacific Coliseum", slug: "pacific-coliseum", capacity: 16281, tmVenueId: "KovZpZAavJIA", city: "Vancouver" },

  // ── Montreal ─────────────────────────────────────────────
  { name: "Centre Bell", slug: "centre-bell", capacity: 21302, tmVenueId: "KovZpauRJe", city: "Montreal" },
  { name: "Place Bell", slug: "place-bell", capacity: 10062, tmVenueId: "KovZ917A227", city: "Montreal" },
  { name: "MTELUS", slug: "mtelus", capacity: 2300, tmVenueId: "KovZpZAFFEnA", city: "Montreal" },
  { name: "Theatre St-Denis", slug: "theatre-st-denis", capacity: 2218, tmVenueId: "KovZpa2Nxe", city: "Montreal" },
  { name: "L'Olympia", slug: "olympia-de-montreal", capacity: 1300, tmVenueId: "KovZpa3Dre", city: "Montreal" },

  // ── Calgary ──────────────────────────────────────────────
  { name: "Scotiabank Saddledome", slug: "scotiabank-saddledome", capacity: 19289, tmVenueId: "KovZpZAFFl7A", city: "Calgary" },
  { name: "Grey Eagle Event Centre", slug: "grey-eagle-event-centre", capacity: 2500, tmVenueId: "KovZpZAJAaAA", city: "Calgary" },
  { name: "MacEwan Hall", slug: "macewan-hall", capacity: 700, tmVenueId: "KovZpaKVpe", city: "Calgary" },
  { name: "The Palace Theatre", slug: "palace-theatre-calgary", capacity: 960, tmVenueId: "KovZpaKM1e", city: "Calgary" },

  // ── Edmonton ─────────────────────────────────────────────
  { name: "Rogers Place", slug: "rogers-place", capacity: 18347, tmVenueId: "KovZpZAIdaaA", city: "Edmonton" },
  { name: "Edmonton EXPO Centre", slug: "edmonton-expo-centre", capacity: 12000, tmVenueId: "KovZpa3HQe", city: "Edmonton" },

  // ── Ottawa ───────────────────────────────────────────────
  { name: "Canadian Tire Centre", slug: "canadian-tire-centre", capacity: 18652, tmVenueId: "KovZpZA7dnJA", city: "Ottawa" },
  { name: "TD Place Stadium", slug: "td-place-stadium", capacity: 24000, tmVenueId: "KovZpaFOFe", city: "Ottawa" },
  { name: "Bronson Centre", slug: "bronson-centre", capacity: 750, tmVenueId: "KovZpZAa7etA", city: "Ottawa" },

  // ── Winnipeg ─────────────────────────────────────────────
  { name: "Canada Life Centre", slug: "canada-life-centre", capacity: 15321, tmVenueId: "KovZpaK5me", city: "Winnipeg" },
  { name: "Burton Cummings Theatre", slug: "burton-cummings-theatre", capacity: 1579, tmVenueId: "KovZpaK1we", city: "Winnipeg" },

  // ── Hamilton ─────────────────────────────────────────────
  { name: "FirstOntario Concert Hall", slug: "firstontario-concert-hall", capacity: 2193, tmVenueId: "KovZpa3B7e", city: "Hamilton" },

  // ── Kitchener ────────────────────────────────────────────
  { name: "Centre In The Square", slug: "centre-in-the-square", capacity: 1920, tmVenueId: "KovZpauVje", city: "Kitchener" },

  // ── London ON ────────────────────────────────────────────
  { name: "London Music Hall", slug: "london-music-hall", capacity: 1100, tmVenueId: "KovZpZAFlavA", city: "London" },

  // ── Quebec City ──────────────────────────────────────────
  { name: "Centre Videotron", slug: "centre-videotron", capacity: 18259, tmVenueId: "KovZpZAEev1A", city: "Quebec City" },
  { name: "Theatre Capitole", slug: "theatre-capitole", capacity: 1200, tmVenueId: "KovZpa3Bxe", city: "Quebec City" },

  // ── Halifax ──────────────────────────────────────────────
  { name: "Scotiabank Centre", slug: "scotiabank-centre-halifax", capacity: 10595, tmVenueId: "KovZpZAJEtAA", city: "Halifax" },

  // ── Saskatoon ────────────────────────────────────────────
  { name: "SaskTel Centre", slug: "sasktel-centre", capacity: 15195, tmVenueId: "KovZpZAFFlEA", city: "Saskatoon" },

  // ── Regina ───────────────────────────────────────────────
  { name: "Brandt Centre", slug: "brandt-centre", capacity: 6150, tmVenueId: "KovZpZAJe7JA", city: "Regina" },

  // ── Victoria ─────────────────────────────────────────────
  { name: "Save-On-Foods Memorial Centre", slug: "save-on-foods-memorial-centre", capacity: 7006, tmVenueId: "KovZpZAaeAJA", city: "Victoria" },
  { name: "Royal Theatre", slug: "royal-theatre-victoria", capacity: 1416, tmVenueId: "KovZpZAk1tlA", city: "Victoria" },
] as const;

// Backwards compat alias
export const TORONTO_VENUES = VENUES.filter(v => v.city === "Toronto");

// Buy Score component weights (sum = 1.0)
// Heavily weighted toward artist caliber (resaleStrength + demandSignals = 0.7)
export const BUY_SCORE_WEIGHTS = {
  resaleStrength: 0.4,
  demandSignals: 0.3,
  supplyRisk: 0.1,
  onsaleTiming: 0.1,
  riskPenalty: 0.1,
} as const;

// Sell Score component weights (sum = 1.0)
export const SELL_SCORE_WEIGHTS = {
  netProfitStrength: 0.35,
  priceMomentum: 0.2,
  marketDepth: 0.2,
  timeDynamics: 0.15,
  riskPenalty: 0.1,
} as const;

// Genre demand tiers for buy score proxy
export const GENRE_DEMAND_TIERS: Record<string, number> = {
  "K-Pop": 25,
  "Pop": 25,
  "Hip-Hop/Rap": 15,
  "R&B": 15,
  "Rock": 15,
  "Country": 15,
  "Alternative": 10,
  "Latin": 10,
  "Electronic": 10,
};

// Fee model for profit estimation
export const FEE_MODEL = {
  usdToCadRate: 1.35,
  sgBuyerFeePct: 0.175,
  sellerFeePct: 0.15,
} as const;

// Cache TTLs (in milliseconds)
export const CACHE_TTL = {
  resalePricing: 60 * 60 * 1000, // 1 hour
  eventMatchResult: 7 * 24 * 60 * 60 * 1000, // 7 days
  eventBaseData: 30 * 60 * 1000, // 30 minutes
} as const;

// Data retention (in days)
export const RETENTION_DAYS = {
  resaleSnapshots: 90,
  scanLogs: 30,
  readNotifications: 60,
  apiUsageLogs: 90,
} as const;

// Ticketmaster API
export const TM_API_BASE = "https://app.ticketmaster.com/discovery/v2";
export const TM_RATE_LIMIT = {
  requestsPerSecond: 2,
  dailyLimit: 5000,
  warnThreshold: 0.8, // warn at 80% of daily limit
} as const;

// SeatGeek API
export const SG_API_BASE = "https://api.seatgeek.com/2";

// Scanner event filtering
export const SCAN_FILTER = {
  // Only ingest events in these TM segments (null segment = allow through)
  allowedSegments: ["Music", "Sports", "Comedy"],
  // Skip events whose names match these patterns
  nameBlacklist: [
    /guided\s+tour/i,
    /meeting\s+space/i,
    /corporate/i,
    /suite\s+rental/i,
    /premium\s+experience/i,
    /private\s+event/i,
    /party\s+deck/i,
    /hospitality/i,
    /parking/i,
    /fan\s+access/i,
    /post\s+game\s+pass/i,
    /vip\s+locker\s+room/i,
    /executive\s+suite/i,
    /dry\s+run/i,
    /staff\s+opening/i,
    /welcome\s+dome/i,
    /deposit/i,
    /license\s+event/i,
    /club\s+fee/i,
    /non.?renewal/i,
    /school\s+day/i,
    /upgrade\s+license/i,
    /flex\s+pack/i,
    /partial\s+pack/i,
    /season\s+ticket\s+deposit/i,
    /group\s+deposit/i,
    /social\s+pass/i,
    /fan\s+experience/i,
    /gift\s+card/i,
    /suite\s+host/i,
    /ticket\s+bank/i,
    /event\s+hold/i,
    /holiday\s+sweater/i,
    /guaranteed\s+giveaway/i,
    /signature\s+club/i,
    /mnp\s+pass/i,
    /anthem\s+buddies/i,
    /hi-five\s+tunnel/i,
    /pre-game\s+court/i,
    /third\s+share/i,
    /half\s+share/i,
    /quarter\s+share/i,
    /full\s+share/i,
  ],
} as const;

// Matching thresholds
export const MATCH_CONFIDENCE_THRESHOLD = 0.7;

// Scan configuration
export const SCAN_CONFIG = {
  venuesPerChunk: 3,
  eventsPerVenuePage: 50,
  maxPagesPerVenue: 15, // Increased from 5 — large venues like Rogers Centre have 600+ events
} as const;
