"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Search, X, Bookmark, Bell, BellOff, Trash2 } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";

interface SavedView {
  id: number;
  name: string;
  filters: Record<string, unknown>;
  notifyEnabled: boolean;
}

interface FilterProps {
  venues: { id: number; name: string }[];
  genres: string[];
  segments: string[];
  statuses: { status: string; count: number }[];
  currentVenues?: number[];
  currentStatuses?: string[];
  currentGenres?: string[];
  currentSegment?: string;
  currentSort?: string;
  currentSearch?: string;
  currentMinScore?: number;
}

/** Parse a comma-separated param into an array */
function parseMulti(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(",").filter(Boolean);
}

export function EventFilters({
  venues,
  genres,
  segments,
  statuses,
  currentVenues,
  currentStatuses,
  currentGenres,
  currentSegment,
  currentSort,
  currentSearch,
  currentMinScore,
}: FilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(currentSearch ?? "");

  // Slider local state — decoupled from URL to allow smooth dragging
  const [sliderValue, setSliderValue] = useState(currentMinScore ?? 0);
  const [scoreInput, setScoreInput] = useState(String(currentMinScore ?? 0));

  // Saved views state
  const [views, setViews] = useState<SavedView[]>([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [viewName, setViewName] = useState("");
  const [showManage, setShowManage] = useState(false);
  const manageRef = useRef<HTMLDivElement>(null);

  // Sync slider when currentMinScore changes (e.g. loading a saved view)
  useEffect(() => {
    setSliderValue(currentMinScore ?? 0);
    setScoreInput(String(currentMinScore ?? 0));
  }, [currentMinScore]);

  // Fetch saved views on mount
  useEffect(() => {
    fetch("/api/saved-views")
      .then((r) => r.json())
      .then((d) => setViews(d.views ?? []))
      .catch(() => {});
  }, []);

  // Close manage popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (manageRef.current && !manageRef.current.contains(e.target as Node)) {
        setShowManage(false);
      }
    }
    if (showManage) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showManage]);

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      const qs = params.toString();
      startTransition(() => {
        router.push(`/events${qs ? `?${qs}` : ""}`);
      });
    },
    [router, searchParams]
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      updateFilter("search", searchValue || undefined);
    },
    [searchValue, updateFilter]
  );

  const clearAll = useCallback(() => {
    setSearchValue("");
    setSliderValue(0);
    setScoreInput("0");
    startTransition(() => {
      router.push("/events");
    });
  }, [router]);

  const commitScore = useCallback(
    (val: number) => {
      const clamped = Math.max(0, Math.min(100, val));
      setSliderValue(clamped);
      setScoreInput(String(clamped));
      updateFilter("minScore", clamped > 0 ? String(clamped) : undefined);
    },
    [updateFilter]
  );

  // Multi-select handlers — store as comma-separated values in URL
  const handleVenuesChange = useCallback(
    (selected: string[]) => {
      updateFilter("venue", selected.length > 0 ? selected.join(",") : undefined);
    },
    [updateFilter]
  );

  const handleGenresChange = useCallback(
    (selected: string[]) => {
      updateFilter("genre", selected.length > 0 ? selected.join(",") : undefined);
    },
    [updateFilter]
  );

  const handleStatusesChange = useCallback(
    (selected: string[]) => {
      updateFilter("status", selected.length > 0 ? selected.join(",") : undefined);
    },
    [updateFilter]
  );

  // Build current filters object for saving
  const getCurrentFilters = useCallback(() => {
    const f: Record<string, unknown> = {};
    if (currentVenues?.length) f.venue = currentVenues.join(",");
    if (currentGenres?.length) f.genre = currentGenres.join(",");
    if (currentSegment && currentSegment !== "Music") f.segment = currentSegment;
    if (currentStatuses?.length) f.status = currentStatuses.join(",");
    if (currentMinScore) f.minScore = currentMinScore;
    if (currentSort && currentSort !== "date_asc") f.sort = currentSort;
    if (currentSearch) f.search = currentSearch;
    return f;
  }, [currentVenues, currentGenres, currentSegment, currentStatuses, currentMinScore, currentSort, currentSearch]);

  // Load a saved view
  const loadView = useCallback(
    (view: SavedView) => {
      const params = new URLSearchParams();
      const f = view.filters;
      if (f.venue) params.set("venue", String(f.venue));
      if (f.genre) params.set("genre", String(f.genre));
      if (f.segment) params.set("segment", String(f.segment));
      if (f.status) params.set("status", String(f.status));
      if (f.minScore) params.set("minScore", String(f.minScore));
      if (f.sort) params.set("sort", String(f.sort));
      if (f.search) params.set("search", String(f.search));
      const qs = params.toString();
      setSearchValue(String(f.search ?? ""));
      setSliderValue(Number(f.minScore ?? 0));
      setScoreInput(String(f.minScore ?? 0));
      startTransition(() => {
        router.push(`/events${qs ? `?${qs}` : ""}`);
      });
    },
    [router]
  );

  // Save current filters as a view
  const saveView = useCallback(async () => {
    if (!viewName.trim()) return;
    try {
      const res = await fetch("/api/saved-views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: viewName.trim(), filters: getCurrentFilters(), notifyEnabled: true }),
      });
      if (res.ok) {
        const { view } = await res.json();
        setViews((prev) => [view, ...prev]);
        setViewName("");
        setShowSaveForm(false);
      }
    } catch {}
  }, [viewName, getCurrentFilters]);

  // Toggle notifications for a view
  const toggleNotify = useCallback(async (view: SavedView) => {
    try {
      const res = await fetch(`/api/saved-views/${view.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifyEnabled: !view.notifyEnabled }),
      });
      if (res.ok) {
        setViews((prev) =>
          prev.map((v) =>
            v.id === view.id ? { ...v, notifyEnabled: !v.notifyEnabled } : v
          )
        );
      }
    } catch {}
  }, []);

  // Delete a view
  const deleteView = useCallback(async (viewId: number) => {
    try {
      const res = await fetch(`/api/saved-views/${viewId}`, { method: "DELETE" });
      if (res.ok) {
        setViews((prev) => prev.filter((v) => v.id !== viewId));
      }
    } catch {}
  }, []);

  const hasFilters =
    (currentVenues?.length ?? 0) > 0 ||
    (currentStatuses?.length ?? 0) > 0 ||
    (currentGenres?.length ?? 0) > 0 ||
    currentSegment ||
    currentSearch ||
    currentMinScore;

  return (
    <div className="space-y-3">
      {/* Search bar + saved views */}
      <div className="flex flex-wrap gap-2">
        <form onSubmit={handleSearch} className="flex min-w-0 flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Search
          </button>
        </form>

        {/* Saved views dropdown */}
        {views.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              const view = views.find((v) => v.id === parseInt(e.target.value));
              if (view) loadView(view);
            }}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-primary"
          >
            <option value="">Saved Views</option>
            {views.map((v) => (
              <option key={v.id} value={v.id}>
                {v.notifyEnabled ? "🔔 " : ""}{v.name}
              </option>
            ))}
          </select>
        )}

        {/* Save & Watch button */}
        <div className="relative">
          {hasFilters && (
            <button
              onClick={() => setShowSaveForm(!showSaveForm)}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-green-600 px-4 text-sm font-medium text-white hover:bg-green-700"
            >
              <Bell className="h-4 w-4" />
              Save &amp; Watch
            </button>
          )}

          {/* Save form popover */}
          {showSaveForm && (
            <div className="absolute right-0 top-10 z-50 w-72 rounded-md border border-border bg-background p-4 shadow-lg">
              <p className="mb-1 text-sm font-medium">Save &amp; Watch This Filter</p>
              <p className="mb-3 text-xs text-muted-foreground">
                You&apos;ll get notified when new events match these filters.
              </p>
              <input
                type="text"
                placeholder="Filter name..."
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveView()}
                className="mb-3 h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                autoFocus
              />
              <button
                onClick={saveView}
                className="h-9 w-full rounded-md bg-green-600 text-sm font-medium text-white hover:bg-green-700"
              >
                Save &amp; Enable Notifications
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <MultiSelect
          options={venues.map((v) => ({ value: String(v.id), label: v.name }))}
          selected={(currentVenues ?? []).map(String)}
          onChange={handleVenuesChange}
          placeholder="All Venues"
        />

        <MultiSelect
          options={genres.map((g) => ({ value: g, label: g }))}
          selected={currentGenres ?? []}
          onChange={handleGenresChange}
          placeholder="All Genres"
        />

        <select
          value={currentSegment ?? "all"}
          onChange={(e) => updateFilter("segment", e.target.value === "all" ? undefined : e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-primary"
        >
          <option value="all">All Types</option>
          <option value="Music">Music</option>
          <option value="Sports">Sports</option>
        </select>

        <MultiSelect
          options={statuses.map((s) => ({
            value: s.status,
            label: s.status,
            count: s.count,
          }))}
          selected={currentStatuses ?? []}
          onChange={handleStatusesChange}
          placeholder="All Statuses"
        />

        {/* Score slider + text input */}
        <div className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2">
          <label className="whitespace-nowrap text-xs text-muted-foreground">
            Score
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={sliderValue}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setSliderValue(val);
              setScoreInput(String(val));
            }}
            onMouseUp={() => commitScore(sliderValue)}
            onTouchEnd={() => commitScore(sliderValue)}
            className="h-1.5 w-24 cursor-pointer accent-primary"
          />
          <input
            type="number"
            min={0}
            max={100}
            step={5}
            value={scoreInput}
            onChange={(e) => setScoreInput(e.target.value)}
            onBlur={() => commitScore(parseInt(scoreInput) || 0)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitScore(parseInt(scoreInput) || 0);
            }}
            className="h-6 w-10 rounded border border-border bg-background px-1 text-center text-xs outline-none focus:border-primary"
          />
          <span className="text-xs text-muted-foreground">+</span>
        </div>

        <select
          value={currentSort ?? "date_asc"}
          onChange={(e) => updateFilter("sort", e.target.value === "date_asc" ? undefined : e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-primary"
        >
          <option value="date_asc">Date (soonest)</option>
          <option value="date_desc">Date (furthest)</option>
          <option value="newest">Recently added</option>
          <option value="name">Name A-Z</option>
        </select>

        {hasFilters && (
          <button
            onClick={clearAll}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs text-muted-foreground hover:bg-muted"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}

        {isPending && (
          <span className="flex h-8 items-center text-xs text-muted-foreground">
            Loading...
          </span>
        )}
      </div>
    </div>
  );
}
