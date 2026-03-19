"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";

interface FilterProps {
  venues: { id: number; name: string }[];
  genres: string[];
  segments: string[];
  cities: string[];
  currentVenues?: number[];
  currentGenres?: string[];
  currentSegment?: string;
  currentCity?: string;
  currentType?: string;
  currentSearch?: string;
  currentSort?: string;
  currentMinScore?: number;
}

export function PresaleFilters({
  venues,
  genres,
  segments,
  cities,
  currentVenues,
  currentGenres,
  currentSegment,
  currentCity,
  currentType,
  currentSearch,
  currentSort,
  currentMinScore,
}: FilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(currentSearch ?? "");

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
        router.push(`/presales${qs ? `?${qs}` : ""}`);
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
    startTransition(() => {
      router.push("/presales");
    });
  }, [router]);

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

  const hasFilters =
    (currentVenues?.length ?? 0) > 0 ||
    (currentGenres?.length ?? 0) > 0 ||
    currentSegment ||
    currentCity ||
    currentMinScore ||
    (currentType && currentType !== "all") ||
    currentSearch;

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex gap-2">
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

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={currentType ?? "all"}
          onChange={(e) => updateFilter("type", e.target.value === "all" ? undefined : e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-primary"
        >
          <option value="all">All Onsales</option>
          <option value="presale">Presales Only</option>
          <option value="general">General Onsale Only</option>
        </select>

        {cities.length > 1 && (
          <select
            value={currentCity ?? ""}
            onChange={(e) => updateFilter("city", e.target.value || undefined)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-primary"
          >
            <option value="">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

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

        {segments.length > 0 && (
          <select
            value={currentSegment ?? "Music"}
            onChange={(e) => updateFilter("segment", e.target.value === "Music" ? undefined : e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-primary"
          >
            <option value="Music">Music</option>
            {segments.includes("Sports") && <option value="Sports">Sports</option>}
            <option value="all">All Types</option>
          </select>
        )}

        <select
          value={currentMinScore ?? ""}
          onChange={(e) => updateFilter("minScore", e.target.value || undefined)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-primary"
        >
          <option value="">Any Score</option>
          <option value="30">Score 30+</option>
          <option value="50">Score 50+</option>
          <option value="70">Score 70+</option>
        </select>

        <select
          value={currentSort ?? "date_asc"}
          onChange={(e) => updateFilter("sort", e.target.value === "date_asc" ? undefined : e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-primary"
        >
          <option value="date_asc">Presale (soonest)</option>
          <option value="date_desc">Presale (furthest)</option>
          <option value="event_asc">Event date (soonest)</option>
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
