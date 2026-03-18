"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Plus,
  X,
  Search,
  Music,
  MapPin,
  Trash2,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface WatchlistItem {
  id: number;
  itemType: string;
  createdAt: string;
  artist: { id: number; name: string; genre: string | null; imageUrl: string | null } | null;
  venue: { id: number; name: string; city: string | null; capacity: number | null } | null;
  event: { id: number; name: string; slug: string; eventDate: string } | null;
}

interface SearchResult {
  artists: { id: number; name: string; genre: string | null; imageUrl: string | null }[];
  venues: { id: number; name: string; city: string | null; capacity: number | null }[];
}

export function WatchlistClient({ initialItems }: { initialItems: WatchlistItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch {
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSearchQuery(val);
      // Debounce with timeout
      const timer = setTimeout(() => doSearch(val), 300);
      return () => clearTimeout(timer);
    },
    [doSearch]
  );

  async function addItem(type: "artist" | "venue", id: number) {
    const key = `${type}-${id}`;
    setAdding(key);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: type,
          artistId: type === "artist" ? id : undefined,
          venueId: type === "venue" ? id : undefined,
        }),
      });
      if (res.ok) {
        setShowAdd(false);
        setSearchQuery("");
        setSearchResults(null);
        router.refresh();
        // Optimistic: just refresh from server
        const listRes = await fetch("/api/watchlist");
        const data = await listRes.json();
        setItems(
          data.items.map((item: Record<string, unknown>) => ({
            id: item.id,
            itemType: item.itemType,
            createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date(item.createdAt as number).toISOString(),
            artist: item.artist ?? null,
            venue: item.venue ?? null,
            event: item.event ?? null,
          }))
        );
      }
    } finally {
      setAdding(null);
    }
  }

  async function removeItem(itemId: number) {
    setRemoving(itemId);
    try {
      const res = await fetch(`/api/watchlist/${itemId}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      }
    } finally {
      setRemoving(null);
    }
  }

  const artistItems = items.filter((i) => i.itemType === "artist");
  const venueItems = items.filter((i) => i.itemType === "venue");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Watchlist</h1>
          <p className="text-muted-foreground">
            Get notified when watched artists or venues have new events
          </p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showAdd ? "Cancel" : "Add"}
        </Button>
      </div>

      {/* Add panel */}
      {showAdd && (
        <Card>
          <CardContent className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search artists or venues..."
                value={searchQuery}
                onChange={handleSearchInput}
                autoFocus
                className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {searching && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {searchResults && !searching && (
              <div className="mt-3 space-y-4">
                {searchResults.artists.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Artists
                    </p>
                    <div className="space-y-1">
                      {searchResults.artists.map((a) => {
                        const alreadyAdded = items.some(
                          (i) => i.itemType === "artist" && i.artist?.id === a.id
                        );
                        return (
                          <div
                            key={a.id}
                            className="flex items-center justify-between rounded-lg border p-2"
                          >
                            <div className="flex items-center gap-3">
                              {a.imageUrl ? (
                                <img
                                  src={a.imageUrl}
                                  alt={a.name}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                  <Music className="h-3 w-3 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium">{a.name}</p>
                                {a.genre && (
                                  <p className="text-xs text-muted-foreground">{a.genre}</p>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant={alreadyAdded ? "outline" : "default"}
                              disabled={alreadyAdded || adding === `artist-${a.id}`}
                              onClick={() => addItem("artist", a.id)}
                            >
                              {adding === `artist-${a.id}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : alreadyAdded ? (
                                "Added"
                              ) : (
                                <Plus className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {searchResults.venues.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Venues
                    </p>
                    <div className="space-y-1">
                      {searchResults.venues.map((v) => {
                        const alreadyAdded = items.some(
                          (i) => i.itemType === "venue" && i.venue?.id === v.id
                        );
                        return (
                          <div
                            key={v.id}
                            className="flex items-center justify-between rounded-lg border p-2"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{v.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {v.city}
                                  {v.capacity && ` · ${v.capacity.toLocaleString()} capacity`}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant={alreadyAdded ? "outline" : "default"}
                              disabled={alreadyAdded || adding === `venue-${v.id}`}
                              onClick={() => addItem("venue", v.id)}
                            >
                              {adding === `venue-${v.id}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : alreadyAdded ? (
                                "Added"
                              ) : (
                                <Plus className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {searchResults.artists.length === 0 &&
                  searchResults.venues.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No results found for "{searchQuery}"
                    </p>
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Watched Artists */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-4 w-4 text-purple-600" />
            Artists ({artistItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {artistItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No artists watched yet. Add artists to get notified about new events.
            </p>
          ) : (
            <div className="space-y-2">
              {artistItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {item.artist?.imageUrl ? (
                      <img
                        src={item.artist.imageUrl}
                        alt={item.artist.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Music className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{item.artist?.name}</p>
                      {item.artist?.genre && (
                        <Badge variant="outline" className="mt-0.5 text-xs">
                          {item.artist.genre}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-red-600"
                    disabled={removing === item.id}
                    onClick={() => removeItem(item.id)}
                  >
                    {removing === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Watched Venues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-cyan-600" />
            Venues ({venueItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {venueItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No venues watched yet. Add venues to get notified about events at those locations.
            </p>
          ) : (
            <div className="space-y-2">
              {venueItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{item.venue?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.venue?.city}
                        {item.venue?.capacity &&
                          ` · ${item.venue.capacity.toLocaleString()} capacity`}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-red-600"
                    disabled={removing === item.id}
                    onClick={() => removeItem(item.id)}
                  >
                    {removing === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
