"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  ShoppingCart,
  DollarSign,
  Gauge,
  Activity,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────

interface BuyData {
  buyScore: number;
  buyConfidence: number;
  recommendation: string;
  expectedRoiBand: string;
  components?: Record<string, number>;
}

interface SellData {
  sellScore: number;
  sellConfidence: number;
  recommendation: string;
  marketPhase: string;
  profitEstimatePct: number | null;
  profitEstimateAmt: number | null;
  components?: Record<string, number>;
}

interface ResaleData {
  listingCount: number | null;
  lowestPrice: string | null;
  medianPrice: string | null;
  highestPrice: string | null;
  sgScore: string | null;
  sgUrl?: string | null;
}

interface AnalyzePanelProps {
  eventId: number;
  initialBuy: BuyData | null;
  initialSell: SellData | null;
  initialResale: ResaleData | null;
}

// ─── Score Helpers ───────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 75) return "text-emerald-600";
  if (score >= 55) return "text-blue-600";
  if (score >= 35) return "text-amber-600";
  return "text-red-600";
}

function getScoreBgColor(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 55) return "bg-blue-500";
  if (score >= 35) return "bg-amber-500";
  return "bg-red-500";
}

const BUY_REC_COLORS: Record<string, string> = {
  "Strong Buy": "bg-emerald-50 text-emerald-700 border-emerald-200",
  Buy: "bg-blue-50 text-blue-700 border-blue-200",
  Speculative: "bg-amber-50 text-amber-700 border-amber-200",
  Pass: "bg-orange-50 text-orange-700 border-orange-200",
  Avoid: "bg-red-50 text-red-700 border-red-200",
};

const SELL_REC_COLORS: Record<string, string> = {
  "Sell Now": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Lean Sell": "bg-blue-50 text-blue-700 border-blue-200",
  Hold: "bg-amber-50 text-amber-700 border-amber-200",
  Monitor: "bg-orange-50 text-orange-700 border-orange-200",
  Exit: "bg-red-50 text-red-700 border-red-200",
};

const PHASE_LABELS: Record<string, { label: string; color: string }> = {
  pre_market: { label: "Pre-Market", color: "bg-muted text-muted-foreground" },
  early_spike: {
    label: "Early Spike",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  healthy_climb: {
    label: "Healthy Climb",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  peak_zone: {
    label: "Peak Zone",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  softening: {
    label: "Softening",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  late_risk: {
    label: "Late Risk",
    color: "bg-orange-50 text-orange-700 border-orange-200",
  },
  dead_market: {
    label: "Dead Market",
    color: "bg-red-50 text-red-700 border-red-200",
  },
};

const ROI_COLORS: Record<string, string> = {
  high: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  low: "bg-muted text-muted-foreground",
};

const COMPONENT_LABELS: Record<string, string> = {
  resaleStrength: "Resale Strength",
  demandSignals: "Demand Signals",
  supplyRisk: "Supply Risk",
  onsaleTiming: "Onsale Timing",
  riskPenalty: "Risk",
  netProfitStrength: "Net Profit",
  priceMomentum: "Price Momentum",
  marketDepth: "Market Depth",
  timeDynamics: "Time Dynamics",
};

// ─── Sub-Components ──────────────────────────────────────────────────

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-medium ${getScoreColor(score)}`}>{score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${getScoreBgColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function ConfidenceMeter({ confidence }: { confidence: number }) {
  return (
    <div className="flex items-center gap-2">
      <Gauge className="h-3 w-3 text-muted-foreground" />
      <div className="flex-1">
        <div className="h-1 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary/60"
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{confidence}%</span>
    </div>
  );
}

function ComponentBars({
  components,
}: {
  components: Record<string, number> | undefined;
}) {
  if (!components) return null;
  return (
    <div className="space-y-1.5 pt-2">
      {Object.entries(components).map(([key, value]) => (
        <ScoreBar
          key={key}
          label={COMPONENT_LABELS[key] ?? key}
          score={Math.round(value)}
        />
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export function AnalyzePanel({
  eventId,
  initialBuy,
  initialSell,
  initialResale,
}: AnalyzePanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [buy, setBuy] = useState<BuyData | null>(initialBuy);
  const [sell, setSell] = useState<SellData | null>(initialSell);
  const [resale, setResale] = useState<ResaleData | null>(initialResale);
  const [error, setError] = useState<string | null>(null);
  const [matched, setMatched] = useState<boolean | null>(null);
  const [sgUrl, setSgUrl] = useState<string | null>(
    initialResale?.sgUrl ?? null
  );

  async function analyze() {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/analyze`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Analysis failed");
        return;
      }

      setMatched(data.matched);
      setSgUrl(data.sgUrl);

      if (data.buy) setBuy(data.buy);
      setSell(data.sell ?? null);

      if (data.resale) {
        setResale({
          listingCount: data.resale.listingCount,
          lowestPrice: data.resale.lowestPrice,
          medianPrice: data.resale.medianPrice,
          highestPrice: data.resale.highestPrice,
          sgScore: data.resale.sgScore,
          sgUrl: data.sgUrl,
        });
      }
    } catch {
      setError("Failed to analyze event");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Buy Score Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4 text-blue-600" />
            Buy Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          {buy ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-3xl font-bold ${getScoreColor(buy.buyScore)}`}
                  >
                    {buy.buyScore}
                  </span>
                  <div className="space-y-1">
                    <Badge
                      className={
                        BUY_REC_COLORS[buy.recommendation] ??
                        "bg-muted text-muted-foreground"
                      }
                    >
                      {buy.recommendation}
                    </Badge>
                    {buy.expectedRoiBand && (
                      <Badge
                        className={`text-[10px] ${ROI_COLORS[buy.expectedRoiBand] ?? ""}`}
                      >
                        ROI: {buy.expectedRoiBand}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <ConfidenceMeter confidence={buy.buyConfidence} />
              <ComponentBars components={buy.components} />
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Click Analyze to calculate buy score
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sell Score Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            Sell Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sell ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-3xl font-bold ${getScoreColor(sell.sellScore)}`}
                  >
                    {sell.sellScore}
                  </span>
                  <div className="space-y-1">
                    <Badge
                      className={
                        SELL_REC_COLORS[sell.recommendation] ??
                        "bg-muted text-muted-foreground"
                      }
                    >
                      {sell.recommendation}
                    </Badge>
                    {sell.marketPhase && PHASE_LABELS[sell.marketPhase] && (
                      <Badge
                        className={`text-[10px] ${PHASE_LABELS[sell.marketPhase].color}`}
                      >
                        {PHASE_LABELS[sell.marketPhase].label}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Profit Estimate */}
              {(sell.profitEstimatePct !== null ||
                sell.profitEstimateAmt !== null) && (
                <div className="rounded-lg border p-2.5">
                  <p className="text-xs text-muted-foreground">
                    Est. Profit (per ticket)
                  </p>
                  <div className="flex items-center gap-2">
                    {sell.profitEstimateAmt !== null && (
                      <span
                        className={`text-lg font-bold ${sell.profitEstimateAmt >= 0 ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {sell.profitEstimateAmt >= 0 ? "+" : "-"}$
                        {Math.abs(sell.profitEstimateAmt).toFixed(0)}
                      </span>
                    )}
                    {sell.profitEstimatePct !== null && (
                      <span
                        className={`flex items-center text-sm ${sell.profitEstimatePct >= 0 ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {sell.profitEstimatePct >= 0 ? (
                          <TrendingUp className="mr-0.5 h-3 w-3" />
                        ) : (
                          <TrendingDown className="mr-0.5 h-3 w-3" />
                        )}
                        {sell.profitEstimatePct >= 0 ? "+" : ""}
                        {sell.profitEstimatePct.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              )}

              <ConfidenceMeter confidence={sell.sellConfidence} />
              <ComponentBars components={sell.components} />
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {matched === false
                ? "No SeatGeek match — sell score unavailable"
                : buy
                  ? "Pre-Market — resale data will be available after general onsale"
                  : "Click Analyze to fetch resale data"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Resale Market Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-purple-600" />
            Resale Market
          </CardTitle>
        </CardHeader>
        <CardContent>
          {resale ? (
            <div className="space-y-2 text-sm">
              {resale.listingCount !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Listings</span>
                  <span className="font-medium">{resale.listingCount}</span>
                </div>
              )}
              {resale.lowestPrice && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lowest</span>
                  <span className="font-medium text-emerald-600">
                    ${parseFloat(resale.lowestPrice).toFixed(0)} USD
                  </span>
                </div>
              )}
              {resale.medianPrice && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Median</span>
                  <span className="font-medium">
                    ${parseFloat(resale.medianPrice).toFixed(0)} USD
                  </span>
                </div>
              )}
              {resale.highestPrice && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Highest</span>
                  <span className="font-medium text-red-600">
                    ${parseFloat(resale.highestPrice).toFixed(0)} USD
                  </span>
                </div>
              )}
              {sgUrl && (
                <a
                  href={sgUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  View on SeatGeek <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {matched === false
                ? "No SeatGeek match found."
                : "Click Analyze to fetch resale data."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Analyze button */}
      <Button onClick={analyze} disabled={analyzing} className="w-full">
        {analyzing ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Activity className="mr-2 h-4 w-4" />
            {buy ? "Re-Analyze" : "Analyze Event"}
          </>
        )}
      </Button>
      {error && <p className="text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
