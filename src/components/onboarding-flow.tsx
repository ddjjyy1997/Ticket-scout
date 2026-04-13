"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Music, Search, Check, Loader2, ChevronRight } from "lucide-react";

const CITIES = [
  "Toronto",
  "Vancouver",
  "Montreal",
  "Calgary",
  "Edmonton",
  "Ottawa",
  "Winnipeg",
  "Hamilton",
  "Halifax",
  "London",
  "Kitchener",
  "Quebec City",
  "Saskatoon",
  "Regina",
  "Victoria",
];

interface PopularArtist {
  id: number;
  name: string;
  genre: string | null;
  imageUrl: string | null;
  eventCount: number;
}

export function OnboardingFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const isWelcome = params.get("welcome") === "true";

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [popularArtists, setPopularArtists] = useState<PopularArtist[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PopularArtist[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingArtists, setLoadingArtists] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isWelcome) {
      setOpen(true);
    }
  }, [isWelcome]);

  const handleClose = useCallback(() => {
    setOpen(false);
    router.replace("/dashboard");
  }, [router]);

  const handleCitySelect = async (city: string) => {
    setSelectedCity(city);

    // Save city preference
    fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notifyCity: city }),
    });

    // Load popular artists for this city
    setLoadingArtists(true);
    try {
      const res = await fetch(`/api/onboarding/popular?city=${encodeURIComponent(city)}`);
      const data = await res.json();
      setPopularArtists(data.artists || []);
    } catch {
      setPopularArtists([]);
    }
    setLoadingArtists(false);
    setStep(1);
  };

  const handleSkipCity = () => {
    // Load popular artists without city filter
    setLoadingArtists(true);
    fetch("/api/onboarding/popular")
      .then((res) => res.json())
      .then((data) => setPopularArtists(data.artists || []))
      .catch(() => setPopularArtists([]))
      .finally(() => setLoadingArtists(false));
    setStep(1);
  };

  const toggleArtist = (id: number) => {
    setSelectedArtists((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=artist`);
        const data = await res.json();
        setSearchResults(
          (data.artists || []).map((a: { id: number; name: string; genre: string | null; imageUrl: string | null }) => ({
            ...a,
            eventCount: 0,
          }))
        );
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleDone = async () => {
    setSaving(true);

    // Add all selected artists to watchlist
    const promises = Array.from(selectedArtists).map((artistId) =>
      fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType: "artist", artistId }),
      }).catch(() => {})
    );

    // Auto-create a saved view for the city if one was selected
    if (selectedCity) {
      promises.push(
        fetch("/api/saved-views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${selectedCity} Events`,
            filters: { city: selectedCity },
            notifyEnabled: true,
          }),
        }).catch(() => {})
      );
    }

    await Promise.all(promises);
    setSaving(false);
    handleClose();
  };

  if (!isWelcome) return null;

  const displayedArtists = searchQuery.length >= 2 ? searchResults : popularArtists;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg max-h-[85vh] overflow-y-auto"
      >
        {step === 0 ? (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Step 1 of 2</span>
              </div>
              <DialogTitle className="text-center text-xl">
                Welcome to TicketScout!
              </DialogTitle>
              <DialogDescription className="text-center">
                Get presale codes and alerts before tickets go on sale.
                Pick your city to see events near you.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => handleCitySelect(city)}
                  className="flex items-center justify-between gap-1 rounded-lg border border-border bg-card px-3 py-3 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-[0.98]"
                >
                  {city}
                  <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                </button>
              ))}
            </div>

            <button
              onClick={handleSkipCity}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground text-center"
            >
              Skip for now
            </button>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Music className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Step 2 of 2</span>
              </div>
              <DialogTitle className="text-center text-xl">
                Follow your favorite artists
              </DialogTitle>
              <DialogDescription className="text-center">
                {selectedCity
                  ? `Popular artists with upcoming shows in ${selectedCity}. Select any to get notified.`
                  : "Select artists to get notified about presale codes and new shows."}
              </DialogDescription>
            </DialogHeader>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for an artist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="min-h-[200px]">
              {loadingArtists || searching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : displayedArtists.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {searchQuery.length >= 2
                    ? "No artists found. Try a different search."
                    : "No popular artists found. Try searching above."}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {displayedArtists.map((artist) => {
                    const isSelected = selectedArtists.has(artist.id);
                    return (
                      <button
                        key={artist.id}
                        onClick={() => toggleArtist(artist.id)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors active:scale-[0.98] ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card hover:bg-muted"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{artist.name}</p>
                          {artist.genre && (
                            <p className="text-xs text-muted-foreground truncate">
                              {artist.genre}
                            </p>
                          )}
                          {artist.eventCount > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {artist.eventCount} upcoming
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 shrink-0 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t">
              <button
                onClick={handleClose}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Skip
              </button>
              <Button
                onClick={handleDone}
                disabled={saving}
                size="sm"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                {selectedArtists.size > 0
                  ? `Follow ${selectedArtists.size} artist${selectedArtists.size > 1 ? "s" : ""}`
                  : "Done"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
