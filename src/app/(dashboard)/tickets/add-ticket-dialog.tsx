"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2 } from "lucide-react";

interface AddTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

interface EventResult {
  id: number;
  name: string;
  eventDate: string;
  venueName: string | null;
}

export function AddTicketDialog({
  open,
  onOpenChange,
  onAdded,
}: AddTicketDialogProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<EventResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventResult | null>(null);
  const [saving, setSaving] = useState(false);

  const [section, setSection] = useState("");
  const [row, setRow] = useState("");
  const [seat, setSeat] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");

  async function searchEvents() {
    if (search.length < 2) return;
    setSearching(true);
    try {
      const res = await fetch(
        `/api/events?search=${encodeURIComponent(search)}&limit=8&futureOnly=true`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(
          (data.events ?? data).map((e: Record<string, unknown>) => ({
            id: e.id,
            name: e.name ?? e.eventName,
            eventDate: e.eventDate,
            venueName: (e.venue as { name?: string })?.name ?? e.venueName ?? null,
          }))
        );
      }
    } finally {
      setSearching(false);
    }
  }

  async function save() {
    if (!selectedEvent || !price) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          section: section || undefined,
          row: row || undefined,
          seat: seat || undefined,
          quantity: parseInt(quantity) || 1,
          purchasePrice: parseFloat(price),
          notes: notes || undefined,
        }),
      });
      if (res.ok) {
        onAdded();
        onOpenChange(false);
        reset();
      }
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setSearch("");
    setResults([]);
    setSelectedEvent(null);
    setSection("");
    setRow("");
    setSeat("");
    setQuantity("1");
    setPrice("");
    setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Ticket</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Event Search */}
          {!selectedEvent ? (
            <div className="space-y-2">
              <Label>Search Event</Label>
              <div className="flex gap-2">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for an event..."
                  onKeyDown={(e) => e.key === "Enter" && searchEvents()}
                />
                <Button
                  variant="outline"
                  onClick={searchEvents}
                  disabled={searching}
                >
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {results.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-md border border-border">
                  {results.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setSelectedEvent(e)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{e.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.eventDate
                            ? new Date(e.eventDate).toLocaleDateString()
                            : ""}
                          {e.venueName ? ` — ${e.venueName}` : ""}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
              <p className="font-medium">{selectedEvent.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedEvent.eventDate
                  ? new Date(selectedEvent.eventDate).toLocaleDateString()
                  : ""}
                {selectedEvent.venueName
                  ? ` — ${selectedEvent.venueName}`
                  : ""}
              </p>
              <button
                onClick={() => setSelectedEvent(null)}
                className="mt-1 text-xs text-primary hover:underline"
              >
                Change event
              </button>
            </div>
          )}

          {/* Ticket Details */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Section</Label>
              <Input
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. 108"
              />
            </div>
            <div>
              <Label>Row</Label>
              <Input
                value={row}
                onChange={(e) => setRow(e.target.value)}
                placeholder="e.g. A"
              />
            </div>
            <div>
              <Label>Seat</Label>
              <Input
                value={seat}
                onChange={(e) => setSeat(e.target.value)}
                placeholder="e.g. 12"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div>
              <Label>Price per ticket (CAD)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 125.00"
              />
            </div>
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Got via Amex presale"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={!selectedEvent || !price || saving}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Add Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
