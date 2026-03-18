import {
  BUY_SCORE_WEIGHTS,
  SELL_SCORE_WEIGHTS,
  GENRE_DEMAND_TIERS,
  FEE_MODEL,
  MATCH_CONFIDENCE_THRESHOLD,
} from "@/lib/constants";

// ─── Types ───────────────────────────────────────────────────────────

export type BuyRecommendation =
  | "Strong Buy"
  | "Buy"
  | "Speculative"
  | "Pass"
  | "Avoid";

export type SellRecommendation =
  | "Sell Now"
  | "Lean Sell"
  | "Hold"
  | "Monitor"
  | "Exit";

export type MarketPhase =
  | "pre_market"
  | "early_spike"
  | "healthy_climb"
  | "peak_zone"
  | "softening"
  | "late_risk"
  | "dead_market";

export type RoiBand = "low" | "medium" | "high";

export interface BuyScoreInput {
  eventDate: Date;
  status: string;
  genre: string | null;
  venueCapacity: number | null;
  artistCount: number;
  onsaleWindows: { windowType: string; startDate: Date }[];
  createdAt: Date;
  sgPerformerScore: number | null; // 0-100
  sgEventScore: number | null; // 0-100
  matchConfidence: number | null; // 0-1
  sameArtistSameVenueCount: number;
}

export interface BuyScoreResult {
  buyScore: number;
  buyConfidence: number;
  recommendation: BuyRecommendation;
  expectedRoiBand: RoiBand;
  components: {
    resaleStrength: number;
    demandSignals: number;
    supplyRisk: number;
    onsaleTiming: number;
    riskPenalty: number;
  };
}

export interface SellScoreInput {
  faceValueMin: number | null; // CAD
  faceValueMax: number | null; // CAD
  lowestResalePrice: number | null; // USD
  medianResalePrice: number | null; // USD
  averageResalePrice: number | null; // USD
  highestResalePrice: number | null; // USD
  listingCount: number | null;
  sgEventScore: number | null; // 0-100
  previousSnapshots: {
    snapshotDate: Date;
    lowestPrice: number | null;
    medianPrice: number | null;
    listingCount: number | null;
  }[];
  eventDate: Date;
  status: string;
  onsaleWindows: { windowType: string; startDate: Date }[];
  matchConfidence: number | null; // 0-1
}

export interface SellScoreResult {
  sellScore: number;
  sellConfidence: number;
  recommendation: SellRecommendation;
  marketPhase: MarketPhase;
  profitEstimatePct: number | null;
  profitEstimateAmt: number | null; // CAD
  components: {
    netProfitStrength: number;
    priceMomentum: number;
    marketDepth: number;
    timeDynamics: number;
    riskPenalty: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

// ─── BUY SCORE ───────────────────────────────────────────────────────

function calcResaleStrength(input: BuyScoreInput): number {
  // Compute venue-capacity-based score (always available as a floor)
  let venueScore = 5;
  if (input.venueCapacity !== null) {
    if (input.venueCapacity >= 40000) venueScore = 85;       // Stadium (Bruno Mars, Zach Bryan)
    else if (input.venueCapacity >= 15000) venueScore = 75;   // Arena / amphitheatre
    else if (input.venueCapacity >= 8000) venueScore = 50;    // Large venue (Coca-Cola Coliseum)
    else if (input.venueCapacity >= 4000) venueScore = 35;    // Mid-large (Echo Beach)
    else if (input.venueCapacity >= 2000) venueScore = 15;    // Mid (Massey Hall, History, Danforth)
    else venueScore = 10;                                      // Small club
  }

  // Multi-night run = massive demand signal
  if (input.sameArtistSameVenueCount >= 4) venueScore += 10;
  else if (input.sameArtistSameVenueCount >= 2) venueScore += 7;
  else if (input.sameArtistSameVenueCount >= 1) venueScore += 4;

  // Genre boost (small)
  const genreBoost = input.genre ? (GENRE_DEMAND_TIERS[input.genre] ?? 0) : 0;
  venueScore += genreBoost * 0.3;

  // Compute SG-based score if data exists
  let sgScore = 0;
  if (input.sgPerformerScore !== null) {
    // Performer score is the primary driver (0-70 range)
    if (input.sgPerformerScore >= 90) sgScore = 70;       // A-list (household names)
    else if (input.sgPerformerScore >= 75) sgScore = 50;   // B-list (well-known)
    else if (input.sgPerformerScore >= 60) sgScore = 30;   // C-list (niche)
    else sgScore = 10;                                      // Unknown

    // SG event score as secondary signal (0-30 range)
    if (input.sgEventScore !== null) {
      sgScore += (input.sgEventScore / 100) * 30;
    }
  }

  // Use the BEST of both signals — a weak SG match should never
  // produce a worse score than venue capacity alone would give
  return clamp(Math.max(venueScore, sgScore));
}

function calcDemandSignals(input: BuyScoreInput): number {
  let score = 20; // Lower base — demand must be earned

  // Genre boost
  const genreBoost = input.genre ? (GENRE_DEMAND_TIERS[input.genre] ?? 0) : 0;
  score += genreBoost;

  // Venue size — bigger venue = bigger artist = more demand
  if (input.venueCapacity !== null) {
    if (input.venueCapacity >= 40000) score += 25;
    else if (input.venueCapacity >= 15000) score += 20;
    else if (input.venueCapacity >= 8000) score += 12;
    else if (input.venueCapacity >= 4000) score += 8;
    else if (input.venueCapacity >= 2000) score += 3;
  }

  // Artist count — solo headliner = best resale clarity
  if (input.artistCount === 1) score += 10;
  else if (input.artistCount <= 2) score += 5;
  else if (input.artistCount > 5) score += 10; // festival

  // Newly announced boost
  const hoursSinceCreated =
    (Date.now() - input.createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceCreated < 48) score += 10;
  else if (hoursSinceCreated < 168) score += 5;

  return clamp(score);
}

function calcSupplyRisk(input: BuyScoreInput): number {
  // Inverted: higher = less supply risk = better
  // Softened penalties — big venue + multi-night shouldn't destroy score
  // because those are often the best artists
  let score = 70;

  // Large venues = more tickets, mild penalty
  if (input.venueCapacity !== null) {
    if (input.venueCapacity >= 40000) score -= 10;
    else if (input.venueCapacity >= 20000) score -= 7;
    else if (input.venueCapacity >= 10000) score -= 4;
  }

  // Multi-night: mild dilution
  if (input.sameArtistSameVenueCount > 3) score -= 10;
  else if (input.sameArtistSameVenueCount > 1) score -= 5;
  else if (input.sameArtistSameVenueCount === 1) score -= 2;

  return clamp(score);
}

function calcOnsaleTiming(input: BuyScoreInput): number {
  const now = new Date();
  const futureWindows = input.onsaleWindows
    .filter((w) => w.startDate > now)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  let score: number;

  if (futureWindows.length > 0) {
    const daysUntil = daysBetween(now, futureWindows[0].startDate);

    if (daysUntil <= 1) score = 95;
    else if (daysUntil <= 3) score = 85;
    else if (daysUntil <= 7) score = 70;
    else if (daysUntil <= 14) score = 55;
    else score = 35;

    // Presale availability boost
    const hasPresale = futureWindows.some((w) => w.windowType === "presale");
    if (hasPresale) score += 10;
  } else {
    // Already on sale or no info
    const pastWindows = input.onsaleWindows.filter((w) => w.startDate <= now);
    if (pastWindows.length > 0) score = 40;
    else score = 25;
  }

  return clamp(score);
}

function calcBuyRiskPenalty(input: BuyScoreInput): number {
  // Inverted: higher = less risk = better
  let score = 80;

  if (input.status === "cancelled") return 0;
  if (input.status === "postponed") return 20;
  if (input.status === "rescheduled") score = 40;

  // Data quality
  if (
    input.matchConfidence !== null &&
    input.matchConfidence < 0.8
  )
    score -= 15;
  if (input.genre === null) score -= 10;
  if (input.venueCapacity === null) score -= 10;

  return clamp(score);
}

function calcBuyConfidence(input: BuyScoreInput): number {
  let confidence = 50;
  if (input.sgPerformerScore !== null) confidence += 20;
  if (input.sgEventScore !== null) confidence += 10;
  if (input.venueCapacity !== null) confidence += 5;
  if (input.genre !== null) confidence += 5;
  if (input.onsaleWindows.length > 0) confidence += 5;
  if (input.matchConfidence !== null && input.matchConfidence >= 0.8)
    confidence += 5;
  return clamp(confidence);
}

function getBuyRecommendation(
  score: number,
  confidence: number
): BuyRecommendation {
  if (score >= 75 && confidence >= 60) return "Strong Buy";
  if (score >= 60) return "Buy";
  if (score >= 45) return "Speculative";
  if (score >= 25) return "Pass";
  return "Avoid";
}

function getRoiBand(score: number, confidence: number): RoiBand {
  if (score >= 75 && confidence >= 60) return "high";
  if (score >= 55 && confidence >= 40) return "medium";
  return "low";
}

export function computeBuyScore(input: BuyScoreInput): BuyScoreResult {
  const now = new Date();

  // Past event = 0
  if (input.eventDate < now) {
    return {
      buyScore: 0,
      buyConfidence: 100,
      recommendation: "Avoid",
      expectedRoiBand: "low",
      components: {
        resaleStrength: 0,
        demandSignals: 0,
        supplyRisk: 0,
        onsaleTiming: 0,
        riskPenalty: 0,
      },
    };
  }

  const components = {
    resaleStrength: calcResaleStrength(input),
    demandSignals: calcDemandSignals(input),
    supplyRisk: calcSupplyRisk(input),
    onsaleTiming: calcOnsaleTiming(input),
    riskPenalty: calcBuyRiskPenalty(input),
  };

  const W = BUY_SCORE_WEIGHTS;
  let raw =
    components.resaleStrength * W.resaleStrength +
    components.demandSignals * W.demandSignals +
    components.supplyRisk * W.supplyRisk +
    components.onsaleTiming * W.onsaleTiming +
    components.riskPenalty * W.riskPenalty;

  // Hard gates
  let buyScore: number;
  if (input.status === "cancelled") {
    buyScore = 5;
  } else if (input.status === "postponed") {
    buyScore = Math.min(raw, 25);
  } else if (
    input.matchConfidence !== null &&
    input.matchConfidence < MATCH_CONFIDENCE_THRESHOLD
  ) {
    buyScore = Math.min(raw, 50);
  } else {
    buyScore = raw;
  }

  buyScore = clamp(buyScore);
  const buyConfidence = calcBuyConfidence(input);

  return {
    buyScore,
    buyConfidence,
    recommendation: getBuyRecommendation(buyScore, buyConfidence),
    expectedRoiBand: getRoiBand(buyScore, buyConfidence),
    components,
  };
}

// ─── SELL SCORE ──────────────────────────────────────────────────────

function estimateProfit(
  faceValueMin: number | null,
  lowestResalePriceUsd: number | null
): { pct: number | null; amt: number | null } {
  if (faceValueMin === null || lowestResalePriceUsd === null) {
    return { pct: null, amt: null };
  }

  const resaleCAD = lowestResalePriceUsd * FEE_MODEL.usdToCadRate;
  const sellerNet = resaleCAD * (1 - FEE_MODEL.sellerFeePct);
  const profitAmt = sellerNet - faceValueMin;
  const profitPct = (profitAmt / faceValueMin) * 100;

  return {
    pct: Math.round(profitPct * 10) / 10,
    amt: Math.round(profitAmt * 100) / 100,
  };
}

function calcNetProfitStrength(profitPct: number | null): number {
  if (profitPct === null) return 30; // neutral when no data

  if (profitPct >= 100) return 95;
  if (profitPct >= 60) return 85;
  if (profitPct >= 30) return 70;
  if (profitPct >= 10) return 55;
  if (profitPct >= 0) return 40;
  if (profitPct >= -10) return 25;
  if (profitPct >= -25) return 15;
  return 5;
}

function calcPriceMomentum(
  currentLowest: number | null,
  previousSnapshots: SellScoreInput["previousSnapshots"]
): number {
  if (
    previousSnapshots.length === 0 ||
    currentLowest === null
  )
    return 50; // neutral

  // Compare to most recent previous snapshot
  const prev = previousSnapshots[previousSnapshots.length - 1];
  if (prev.lowestPrice === null) return 50;

  const changePct =
    ((currentLowest - prev.lowestPrice) / prev.lowestPrice) * 100;

  let score: number;
  if (changePct >= 20) score = 90;
  else if (changePct >= 10) score = 75;
  else if (changePct >= 0) score = 60;
  else if (changePct >= -10) score = 40;
  else if (changePct >= -20) score = 25;
  else score = 10;

  // Trend acceleration with 3+ snapshots
  if (previousSnapshots.length >= 2) {
    const older = previousSnapshots[previousSnapshots.length - 2];
    if (older.lowestPrice !== null && prev.lowestPrice !== null) {
      const olderChange =
        ((prev.lowestPrice - older.lowestPrice) / older.lowestPrice) * 100;
      // Sustained climb
      if (olderChange > 0 && changePct > 0) score += 5;
      // Sustained fall
      if (olderChange < 0 && changePct < 0) score -= 5;
    }
  }

  return clamp(score);
}

function calcMarketDepth(input: SellScoreInput): number {
  let score = 50;

  if (input.listingCount === null) return 50;

  // Listing count — fewer listings = seller's market
  if (input.listingCount < 5) score = 80;
  else if (input.listingCount < 20) score = 70;
  else if (input.listingCount < 50) score = 60;
  else if (input.listingCount < 100) score = 50;
  else if (input.listingCount < 200) score = 40;
  else if (input.listingCount < 500) score = 30;
  else score = 15;

  // Spread analysis
  if (
    input.medianResalePrice !== null &&
    input.lowestResalePrice !== null &&
    input.lowestResalePrice > 0
  ) {
    const spreadPct =
      ((input.medianResalePrice - input.lowestResalePrice) /
        input.lowestResalePrice) *
      100;
    if (spreadPct > 50) score += 10; // wide spread = room to price
    else if (spreadPct < 10) score -= 5; // tight = race to bottom
  }

  return clamp(score);
}

function calcTimeDynamics(input: SellScoreInput): number {
  const now = new Date();
  const daysUntilEvent = daysBetween(now, input.eventDate);

  // Find general onsale date
  const generalOnsale = input.onsaleWindows.find(
    (w) => w.windowType === "general"
  );
  const daysSinceOnsale = generalOnsale
    ? daysBetween(generalOnsale.startDate, now)
    : null;

  let score: number;

  if (daysUntilEvent < 1) score = 20;
  else if (daysUntilEvent < 3) score = 35;
  else if (daysUntilEvent < 7) score = 50;
  else if (daysUntilEvent < 14) score = 65;
  else if (daysUntilEvent < 30) score = 75;
  else if (daysUntilEvent < 60) score = 70;
  else if (daysUntilEvent < 90) score = 55;
  else score = 40;

  // Post-onsale spike bonus
  if (daysSinceOnsale !== null) {
    if (daysSinceOnsale >= 1 && daysSinceOnsale <= 7)
      score = Math.max(score, 80);
    if (daysSinceOnsale > 7 && daysSinceOnsale <= 14)
      score = Math.max(score, 70);
  }

  return clamp(score);
}

function calcSellRiskPenalty(
  input: SellScoreInput,
  profitPct: number | null,
  momentumScore: number
): number {
  let score = 80;

  if (input.status === "cancelled") return 0;
  if (input.status === "postponed") return 15;
  if (input.status === "rescheduled") score = 40;

  // Negative profit
  if (profitPct !== null && profitPct < 0) score -= 20;
  if (profitPct !== null && profitPct < -20) score -= 20;

  // Match confidence
  if (input.matchConfidence !== null && input.matchConfidence < 0.8)
    score -= 20;

  // Falling prices
  if (momentumScore < 30) score -= 10;

  return clamp(score);
}

function calcSellConfidence(input: SellScoreInput): number {
  let confidence = 20;
  if (input.lowestResalePrice !== null) confidence += 15;
  if (input.medianResalePrice !== null) confidence += 5;
  if (input.faceValueMin !== null) confidence += 10;
  if (input.listingCount !== null && input.listingCount > 0) confidence += 10;
  if (input.previousSnapshots.length >= 1) confidence += 15;
  if (input.previousSnapshots.length >= 3) confidence += 10;
  if (input.matchConfidence !== null && input.matchConfidence >= 0.85)
    confidence += 5;

  // Cap confidence if we have barely any market data
  if (input.listingCount === null && input.previousSnapshots.length === 0) {
    confidence = Math.min(confidence, 40);
  }

  return clamp(confidence);
}

function getSellRecommendation(
  score: number,
  confidence: number
): SellRecommendation {
  if (score >= 80 && confidence >= 50) return "Sell Now";
  if (score >= 65) return "Lean Sell";
  if (score >= 45) return "Hold";
  if (score >= 25) return "Monitor";
  return "Exit";
}

export function classifyMarketPhase(input: {
  eventDate: Date;
  onsaleWindows: { windowType: string; startDate: Date }[];
  listingCount: number | null;
  previousSnapshots: {
    snapshotDate: Date;
    listingCount: number | null;
  }[];
}): MarketPhase {
  const now = new Date();
  const daysUntilEvent = daysBetween(now, input.eventDate);
  const generalOnsale = input.onsaleWindows.find(
    (w) => w.windowType === "general"
  );
  const daysSinceOnsale = generalOnsale
    ? daysBetween(generalOnsale.startDate, now)
    : null;

  // Pre-market
  if (generalOnsale && now < generalOnsale.startDate) return "pre_market";

  // Dead market
  if (daysUntilEvent < 1) return "dead_market";

  // Late risk
  if (daysUntilEvent < 3) return "late_risk";

  // Early spike (first week after onsale)
  if (daysSinceOnsale !== null && daysSinceOnsale <= 7) return "early_spike";

  // Snapshot-based trend detection
  if (input.previousSnapshots.length >= 1 && input.listingCount !== null) {
    const prev =
      input.previousSnapshots[input.previousSnapshots.length - 1];
    if (prev.listingCount !== null && prev.listingCount > 0) {
      const countChange = input.listingCount - prev.listingCount;
      // Listings increasing >30% = softening
      if (countChange > prev.listingCount * 0.3) return "softening";
      // Listings decreasing with time to go = healthy climb
      if (countChange < 0 && daysUntilEvent > 14) return "healthy_climb";
    }
  }

  // Time-based defaults
  if (daysSinceOnsale !== null && daysSinceOnsale <= 21)
    return "healthy_climb";
  if (daysUntilEvent >= 14 && daysUntilEvent <= 45) return "peak_zone";
  if (daysUntilEvent < 14) return "softening";

  return "healthy_climb";
}

export function computeSellScore(
  input: SellScoreInput
): SellScoreResult | null {
  // No SeatGeek data = no sell score
  if (input.lowestResalePrice === null && input.listingCount === null) {
    return null;
  }

  // Pre-market = no meaningful sell score yet
  // Check if general onsale hasn't happened — resale data is noise at this stage
  const now = new Date();
  const generalOnsale = input.onsaleWindows.find(
    (w) => w.windowType === "general"
  );
  if (generalOnsale && generalOnsale.startDate > now) {
    // Still in pre-market — don't show a misleading sell score
    return null;
  }

  // Also return null if we have zero listings (event matched but no market yet)
  if (input.listingCount !== null && input.listingCount === 0 && input.lowestResalePrice === null) {
    return null;
  }

  const profit = estimateProfit(input.faceValueMin, input.lowestResalePrice);

  const momentumScore = calcPriceMomentum(
    input.lowestResalePrice,
    input.previousSnapshots
  );

  const components = {
    netProfitStrength: calcNetProfitStrength(profit.pct),
    priceMomentum: momentumScore,
    marketDepth: calcMarketDepth(input),
    timeDynamics: calcTimeDynamics(input),
    riskPenalty: calcSellRiskPenalty(input, profit.pct, momentumScore),
  };

  const W = SELL_SCORE_WEIGHTS;
  let raw =
    components.netProfitStrength * W.netProfitStrength +
    components.priceMomentum * W.priceMomentum +
    components.marketDepth * W.marketDepth +
    components.timeDynamics * W.timeDynamics +
    components.riskPenalty * W.riskPenalty;

  // Hard gates
  let sellScore: number;
  if (input.status === "cancelled") {
    sellScore = 5;
  } else if (input.status === "postponed") {
    sellScore = Math.min(raw, 20);
  } else if (profit.pct !== null && profit.pct < -30) {
    sellScore = Math.min(raw, 25);
  } else if (
    input.matchConfidence !== null &&
    input.matchConfidence < MATCH_CONFIDENCE_THRESHOLD
  ) {
    sellScore = Math.min(raw, 45);
  } else {
    sellScore = raw;
  }

  sellScore = clamp(sellScore);
  const sellConfidence = calcSellConfidence(input);

  const marketPhase = classifyMarketPhase({
    eventDate: input.eventDate,
    onsaleWindows: input.onsaleWindows,
    listingCount: input.listingCount,
    previousSnapshots: input.previousSnapshots,
  });

  return {
    sellScore,
    sellConfidence,
    recommendation: getSellRecommendation(sellScore, sellConfidence),
    marketPhase,
    profitEstimatePct: profit.pct,
    profitEstimateAmt: profit.amt,
    components,
  };
}
