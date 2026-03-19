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

  // ═══════════════════════════════════════════════════════════
  // US Venues
  // ═══════════════════════════════════════════════════════════

  // ── New York / NJ ──────────────────────────────────────────
  { name: "Madison Square Garden", slug: "madison-square-garden", capacity: 20789, tmVenueId: "KovZpZA7AAEA", city: "New York" },
  { name: "Barclays Center", slug: "barclays-center", capacity: 19000, tmVenueId: "KovZ917AtP3", city: "Brooklyn" },
  { name: "MetLife Stadium", slug: "metlife-stadium", capacity: 82500, tmVenueId: "KovZpakS7e", city: "East Rutherford" },
  { name: "UBS Arena", slug: "ubs-arena", capacity: 17255, tmVenueId: "KovZ917AkU0", city: "Elmont" },

  // ── Los Angeles ────────────────────────────────────────────
  { name: "Kia Forum", slug: "kia-forum", capacity: 17505, tmVenueId: "KovZpZAEkn6A", city: "Inglewood" },
  { name: "Crypto.com Arena", slug: "crypto-com-arena", capacity: 20000, tmVenueId: "KovZpZAFnEeA", city: "Los Angeles" },
  { name: "SoFi Stadium", slug: "sofi-stadium", capacity: 70240, tmVenueId: "KovZ917AOJ0", city: "Inglewood" },
  { name: "Hollywood Bowl", slug: "hollywood-bowl", capacity: 17500, tmVenueId: "KovZpa3h7e", city: "Los Angeles" },
  { name: "BMO Stadium", slug: "bmo-stadium", capacity: 22000, tmVenueId: "KovZ917Akdz", city: "Los Angeles" },

  // ── Chicago ────────────────────────────────────────────────
  { name: "United Center", slug: "united-center", capacity: 20917, tmVenueId: "KovZpa2M7e", city: "Chicago" },
  { name: "Wrigley Field", slug: "wrigley-field", capacity: 41649, tmVenueId: "KovZpZAJtJJA", city: "Chicago" },
  { name: "Soldier Field", slug: "soldier-field", capacity: 61500, tmVenueId: "KovZpZAJe6lA", city: "Chicago" },

  // ── Miami / South Florida ──────────────────────────────────
  { name: "Kaseya Center", slug: "kaseya-center", capacity: 19600, tmVenueId: "KovZpZAJtFaA", city: "Miami" },
  { name: "Hard Rock Stadium", slug: "hard-rock-stadium", capacity: 65326, tmVenueId: "KovZpZAFnFaA", city: "Miami Gardens" },

  // ── Dallas / Fort Worth ────────────────────────────────────
  { name: "American Airlines Center", slug: "american-airlines-center", capacity: 19200, tmVenueId: "KovZpZAJ67eA", city: "Dallas" },
  { name: "AT&T Stadium", slug: "att-stadium", capacity: 80000, tmVenueId: "KovZpa3GJe", city: "Arlington" },
  { name: "Dickies Arena", slug: "dickies-arena", capacity: 14000, tmVenueId: "KovZ917AOAw", city: "Fort Worth" },

  // ── Houston ────────────────────────────────────────────────
  { name: "Toyota Center", slug: "toyota-center", capacity: 18104, tmVenueId: "KovZpZAFnFEA", city: "Houston" },
  { name: "NRG Stadium", slug: "nrg-stadium", capacity: 72220, tmVenueId: "KovZpZAEdFeA", city: "Houston" },
  { name: "Minute Maid Park", slug: "minute-maid-park", capacity: 41168, tmVenueId: "KovZpZAJta7A", city: "Houston" },

  // ── Atlanta ────────────────────────────────────────────────
  { name: "State Farm Arena", slug: "state-farm-arena", capacity: 21000, tmVenueId: "KovZpa2Xke", city: "Atlanta" },
  { name: "Mercedes-Benz Stadium", slug: "mercedes-benz-stadium", capacity: 71000, tmVenueId: "KovZpZAJEFIA", city: "Atlanta" },

  // ── Phoenix ────────────────────────────────────────────────
  { name: "Mortgage Matchup Center", slug: "mortgage-matchup-center", capacity: 18422, tmVenueId: "KovZpZAE617A", city: "Phoenix" },
  { name: "State Farm Stadium", slug: "state-farm-stadium", capacity: 63400, tmVenueId: "KovZpZAFaeIA", city: "Glendale" },
  { name: "Desert Diamond Arena", slug: "desert-diamond-arena", capacity: 17125, tmVenueId: "KovZpZAJEFAA", city: "Glendale" },

  // ── Philadelphia ───────────────────────────────────────────
  { name: "Xfinity Mobile Arena", slug: "xfinity-mobile-arena", capacity: 20478, tmVenueId: "KovZ917AiMF", city: "Philadelphia" },
  { name: "Lincoln Financial Field", slug: "lincoln-financial-field", capacity: 69176, tmVenueId: "KovZpZAFnFnA", city: "Philadelphia" },
  { name: "Citizens Bank Park", slug: "citizens-bank-park", capacity: 43651, tmVenueId: "KovZpZAEkveA", city: "Philadelphia" },

  // ── Washington DC ──────────────────────────────────────────
  { name: "Capital One Arena", slug: "capital-one-arena", capacity: 20356, tmVenueId: "KovZpaKuJe", city: "Washington" },
  { name: "Nationals Park", slug: "nationals-park", capacity: 41313, tmVenueId: "KovZpZAJtF7A", city: "Washington" },

  // ── Boston ─────────────────────────────────────────────────
  { name: "TD Garden", slug: "td-garden", capacity: 19580, tmVenueId: "KovZpa2gne", city: "Boston" },
  { name: "Fenway Park", slug: "fenway-park", capacity: 37755, tmVenueId: "KovZpZAJtJnA", city: "Boston" },

  // ── San Francisco / Bay Area ───────────────────────────────
  { name: "Chase Center", slug: "chase-center", capacity: 18064, tmVenueId: "KovZ917Ah1H", city: "San Francisco" },
  { name: "Oracle Park", slug: "oracle-park", capacity: 41915, tmVenueId: "KovZpZAJtJFA", city: "San Francisco" },
  { name: "SAP Center", slug: "sap-center", capacity: 17496, tmVenueId: "KovZpZAFnFIA", city: "San Jose" },

  // ── Denver ─────────────────────────────────────────────────
  { name: "Ball Arena", slug: "ball-arena", capacity: 20000, tmVenueId: "KovZpZAFaJeA", city: "Denver" },
  { name: "Empower Field at Mile High", slug: "empower-field-at-mile-high", capacity: 76125, tmVenueId: "KovZpZAJdnAA", city: "Denver" },

  // ── Nashville ──────────────────────────────────────────────
  { name: "Bridgestone Arena", slug: "bridgestone-arena", capacity: 20000, tmVenueId: "KovZpZA6taAA", city: "Nashville" },
  { name: "Nissan Stadium", slug: "nissan-stadium", capacity: 69143, tmVenueId: "KovZpZAJdn7A", city: "Nashville" },

  // ── Detroit ────────────────────────────────────────────────
  { name: "Little Caesars Arena", slug: "little-caesars-arena", capacity: 20332, tmVenueId: "KovZ917A25V", city: "Detroit" },
  { name: "Ford Field", slug: "ford-field", capacity: 65000, tmVenueId: "KovZpZAJtnlA", city: "Detroit" },

  // ── Minneapolis ────────────────────────────────────────────
  { name: "Target Center", slug: "target-center", capacity: 18798, tmVenueId: "KovZpZAFnEIA", city: "Minneapolis" },
  { name: "US Bank Stadium", slug: "us-bank-stadium", capacity: 73000, tmVenueId: "KovZpZAJEFnA", city: "Minneapolis" },

  // ── Seattle ────────────────────────────────────────────────
  { name: "Climate Pledge Arena", slug: "climate-pledge-arena", capacity: 17100, tmVenueId: "KovZ917AkJl", city: "Seattle" },
  { name: "Lumen Field", slug: "lumen-field", capacity: 72000, tmVenueId: "KovZpZAJdn1A", city: "Seattle" },

  // ── Las Vegas ──────────────────────────────────────────────
  { name: "Sphere", slug: "sphere-las-vegas", capacity: 18600, tmVenueId: "KovZ917Atbr", city: "Las Vegas" },
  { name: "Allegiant Stadium", slug: "allegiant-stadium", capacity: 65000, tmVenueId: "KovZ917Ax7n", city: "Las Vegas" },
  { name: "T-Mobile Arena", slug: "t-mobile-arena", capacity: 20000, tmVenueId: "KovZpZAJtJlA", city: "Las Vegas" },

  // ── Tampa ──────────────────────────────────────────────────
  { name: "Benchmark International Arena", slug: "benchmark-international-arena", capacity: 20500, tmVenueId: "KovZpZA6k7IA", city: "Tampa" },
  { name: "Raymond James Stadium", slug: "raymond-james-stadium", capacity: 65890, tmVenueId: "KovZpZAJdnlA", city: "Tampa" },

  // ── Orlando ────────────────────────────────────────────────
  { name: "Kia Center", slug: "kia-center", capacity: 20000, tmVenueId: "KovZpZAEvEEA", city: "Orlando" },

  // ── San Diego ──────────────────────────────────────────────
  { name: "Pechanga Arena", slug: "pechanga-arena", capacity: 14500, tmVenueId: "KovZpZAFnEnA", city: "San Diego" },
  { name: "Petco Park", slug: "petco-park", capacity: 42445, tmVenueId: "KovZpZAJt7lA", city: "San Diego" },

  // ── Charlotte ──────────────────────────────────────────────
  { name: "Spectrum Center", slug: "spectrum-center", capacity: 19077, tmVenueId: "KovZpZA6AEIA", city: "Charlotte" },
  { name: "Bank of America Stadium", slug: "bank-of-america-stadium", capacity: 75523, tmVenueId: "KovZpa3hje", city: "Charlotte" },

  // ── Pittsburgh ─────────────────────────────────────────────
  { name: "PPG Paints Arena", slug: "ppg-paints-arena", capacity: 19758, tmVenueId: "KovZpZAEdF6A", city: "Pittsburgh" },

  // ── Portland ───────────────────────────────────────────────
  { name: "Moda Center", slug: "moda-center", capacity: 19441, tmVenueId: "KovZpZAEkveA", city: "Portland" },

  // ── St. Louis ──────────────────────────────────────────────
  { name: "Enterprise Center", slug: "enterprise-center", capacity: 19150, tmVenueId: "KovZpZAEkvAA", city: "St. Louis" },

  // ── New Orleans ────────────────────────────────────────────
  { name: "Smoothie King Center", slug: "smoothie-king-center", capacity: 16867, tmVenueId: "KovZpZAJtn7A", city: "New Orleans" },
  { name: "Caesars Superdome", slug: "caesars-superdome", capacity: 73208, tmVenueId: "KovZpZAJtFEA", city: "New Orleans" },

  // ── Austin ─────────────────────────────────────────────────
  { name: "Moody Center", slug: "moody-center", capacity: 15000, tmVenueId: "KovZ917AkdF", city: "Austin" },

  // ── Raleigh ────────────────────────────────────────────────
  { name: "PNC Arena", slug: "pnc-arena", capacity: 19722, tmVenueId: "KovZpZAJdnEA", city: "Raleigh" },

  // ── Indianapolis ───────────────────────────────────────────
  { name: "Gainbridge Fieldhouse", slug: "gainbridge-fieldhouse", capacity: 18165, tmVenueId: "KovZpZAFnEeA", city: "Indianapolis" },

  // ── Milwaukee ──────────────────────────────────────────────
  { name: "Fiserv Forum", slug: "fiserv-forum", capacity: 17341, tmVenueId: "KovZ917Aa40", city: "Milwaukee" },
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
    /voucher\s+pack/i,
    /premium\s+account/i,
    /payment\s+plan/i,
    /convenience\s+fee/i,
    /^CRED[A-Z]{2}\d{2}$/,
    /^NSF[A-Z]{2}\d{2}$/,
    /^PPLN[A-Z]{2}\d{2}$/,
    /^PS[A-Z]{2}\d{2}/,
    /^SUITELIC$/i,
    /membership\s+fee/i,
    /insurance\s+fee/i,
    /food\s+&?\s*beverage/i,
    /tax\s+on/i,
    /admin\s+fee/i,
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
