// Toronto venues — Ticketmaster Discovery API IDs will be populated during seed
export const TORONTO_VENUES = [
  {
    name: "Scotiabank Arena",
    slug: "scotiabank-arena",
    capacity: 19800,
    tmVenueId: "KovZpZAFFE1A",
  },
  {
    name: "Rogers Centre",
    slug: "rogers-centre",
    capacity: 49282,
    tmVenueId: "KovZpa3Bbe",
  },
  {
    name: "Rogers Stadium",
    slug: "rogers-stadium",
    capacity: 49282,
    tmVenueId: "KovZ917ARzt",
  },
  {
    name: "RBC Amphitheatre",
    slug: "budweiser-stage",
    capacity: 16000,
    tmVenueId: "KovZpZAEkkIA", // Formerly Budweiser Stage
  },
  {
    name: "Massey Hall",
    slug: "massey-hall",
    capacity: 2765,
    tmVenueId: "KovZpZAFnlnA",
  },
  {
    name: "History",
    slug: "history-toronto",
    capacity: 2500,
    tmVenueId: "KovZ917AJ4f",
  },
  {
    name: "ECHO Beach",
    slug: "echo-beach",
    capacity: 4000,
    tmVenueId: "KovZpZAJ6EFA", // Now RBC Echo Beach
  },
  {
    name: "Danforth Music Hall",
    slug: "danforth-music-hall",
    capacity: 1500,
    tmVenueId: "KovZpa3yBe",
  },
  {
    name: "Coca-Cola Coliseum",
    slug: "coca-cola-coliseum",
    capacity: 8100,
    tmVenueId: "KovZpZAJt7FA",
  },
  {
    name: "Downsview Park",
    slug: "downsview-park",
    capacity: 40000,
    tmVenueId: null,
  },
  {
    name: "Queen Elizabeth Theatre",
    slug: "queen-elizabeth-theatre-toronto",
    capacity: 1200,
    tmVenueId: null,
  },
] as const;

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
  allowedSegments: ["Music", "Sports"],
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
