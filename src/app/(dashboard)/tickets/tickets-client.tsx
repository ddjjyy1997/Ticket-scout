"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  BarChart3,
  Calendar,
  MapPin,
  Ticket,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { AddTicketDialog } from "./add-ticket-dialog";

interface TicketRow {
  id: number;
  section: string | null;
  row: string | null;
  seat: string | null;
  quantity: number;
  purchasePrice: string;
  purchaseCurrency: string | null;
  purchaseDate: string | null;
  source: string | null;
  notes: string | null;
  eventId: number;
  eventName: string;
  eventSlug: string;
  eventDate: string;
  eventImageUrl: string | null;
  eventStatus: string;
  venueName: string | null;
  sellRecommendation: string | null;
  marketPhase: string | null;
  profitEstimatePct: string | null;
  lowestResale: string | null;
  medianResale: string | null;
  listingCount: number | null;
}

const recColors: Record<string, string> = {
  "Sell Now": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Lean Sell": "bg-blue-50 text-blue-700 border-blue-200",
  Hold: "bg-amber-50 text-amber-700 border-amber-200",
  Monitor: "bg-purple-50 text-purple-700 border-purple-200",
  Exit: "bg-red-50 text-red-700 border-red-200",
};

export function TicketsClient() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    const res = await fetch("/api/tickets");
    if (res.ok) {
      setTickets(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function deleteTicket(id: number) {
    await fetch(`/api/tickets/${id}`, { method: "DELETE" });
    setTickets((prev) => prev.filter((t) => t.id !== id));
  }

  // Portfolio summary
  const totalInvested = tickets.reduce(
    (sum, t) => sum + parseFloat(t.purchasePrice) * t.quantity,
    0
  );
  const FEE_RATE = 0.85; // 15% seller fee
  const USD_CAD = 1.35;
  const totalMarketValue = tickets.reduce((sum, t) => {
    if (!t.medianResale) return sum;
    const resaleCAD = parseFloat(t.medianResale) * USD_CAD * FEE_RATE;
    return sum + resaleCAD * t.quantity;
  }, 0);
  const ticketsWithResale = tickets.filter((t) => t.medianResale);
  const investedWithResale = ticketsWithResale.reduce(
    (sum, t) => sum + parseFloat(t.purchasePrice) * t.quantity,
    0
  );
  const pnl = totalMarketValue - investedWithResale;
  const pnlPct = investedWithResale > 0 ? (pnl / investedWithResale) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Tickets</h1>
          <p className="text-muted-foreground">
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Ticket
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" />
              Total Invested
            </div>
            <p className="mt-1 text-2xl font-bold">
              ${totalInvested.toFixed(0)} CAD
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              Market Value
            </div>
            <p className="mt-1 text-2xl font-bold">
              {ticketsWithResale.length > 0
                ? `$${totalMarketValue.toFixed(0)} CAD`
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {ticketsWithResale.length} of {tickets.length} with resale data
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {pnl >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              Estimated P&L
            </div>
            <p
              className={`mt-1 text-2xl font-bold ${
                pnl >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {ticketsWithResale.length > 0
                ? `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(0)}`
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Return %
            </div>
            <p
              className={`mt-1 text-2xl font-bold ${
                pnlPct >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {ticketsWithResale.length > 0
                ? `${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(1)}%`
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground">Loading...</div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Ticket className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No tickets tracked yet. Add your first ticket to start monitoring.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => {
            const cost = parseFloat(t.purchasePrice) * t.quantity;
            const hasResale = !!t.medianResale;
            const resaleCAD = hasResale
              ? parseFloat(t.medianResale!) * USD_CAD * FEE_RATE
              : null;
            const ticketPnl = resaleCAD
              ? (resaleCAD - parseFloat(t.purchasePrice)) * t.quantity
              : null;

            return (
              <Card key={t.id} className="transition-colors hover:bg-muted/30">
                <CardContent className="flex items-center gap-4 py-3">
                  {/* Image */}
                  {t.eventImageUrl ? (
                    <Link href={`/events/${t.eventSlug}`} className="hidden sm:block">
                      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md">
                        <img
                          src={t.eventImageUrl}
                          alt={t.eventName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </Link>
                  ) : (
                    <div className="hidden h-16 w-24 shrink-0 items-center justify-center rounded-md bg-muted sm:flex">
                      <Ticket className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <Link
                      href={`/events/${t.eventSlug}`}
                      className="font-semibold leading-tight hover:underline"
                    >
                      {t.eventName}
                    </Link>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(t.eventDate), "MMM d, yyyy")}
                      </span>
                      {t.venueName && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {t.venueName}
                        </span>
                      )}
                      {t.section && (
                        <span>
                          Sec {t.section}
                          {t.row ? `, Row ${t.row}` : ""}
                        </span>
                      )}
                      <span>
                        {t.quantity}x @ ${parseFloat(t.purchasePrice).toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* P&L + Recommendation */}
                  <div className="hidden shrink-0 text-right sm:block">
                    {hasResale ? (
                      <>
                        <p
                          className={`text-sm font-medium ${
                            ticketPnl! >= 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {ticketPnl! >= 0 ? "+" : ""}${ticketPnl!.toFixed(0)} CAD
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Market: ${(resaleCAD! * t.quantity).toFixed(0)} CAD
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Cost: ${cost.toFixed(0)}
                      </p>
                    )}
                    {t.sellRecommendation && (
                      <Badge
                        className={`mt-1 text-xs ${
                          recColors[t.sellRecommendation] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {t.sellRecommendation}
                      </Badge>
                    )}
                  </div>

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-red-600"
                    onClick={() => deleteTicket(t.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AddTicketDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        onAdded={load}
      />
    </div>
  );
}
