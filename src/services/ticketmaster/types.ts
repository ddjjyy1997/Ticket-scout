// Ticketmaster Discovery API v2 types (subset we use)

export interface TMSearchResponse {
  _embedded?: {
    events: TMEvent[];
  };
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface TMEvent {
  id: string;
  name: string;
  type: string;
  url?: string;
  locale?: string;
  images?: TMImage[];
  dates: {
    start: {
      localDate?: string;
      localTime?: string;
      dateTime?: string;
      dateTBD?: boolean;
      dateTBA?: boolean;
      timeTBA?: boolean;
    };
    end?: {
      dateTime?: string;
    };
    status: {
      code: string; // 'onsale' | 'offsale' | 'cancelled' | 'postponed' | 'rescheduled'
    };
  };
  sales?: {
    public?: TMSaleWindow;
    presales?: TMSaleWindow[];
  };
  classifications?: TMClassification[];
  priceRanges?: TMPriceRange[];
  _embedded?: {
    venues?: TMVenue[];
    attractions?: TMAttraction[];
  };
}

export interface TMSaleWindow {
  name?: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  startTBD?: boolean;
  startTBA?: boolean;
}

export interface TMClassification {
  primary?: boolean;
  segment?: { id: string; name: string };
  genre?: { id: string; name: string };
  subGenre?: { id: string; name: string };
}

export interface TMPriceRange {
  type: string;
  currency: string;
  min: number;
  max: number;
}

export interface TMImage {
  ratio?: string;
  url: string;
  width: number;
  height: number;
}

export interface TMVenue {
  id: string;
  name: string;
  city?: { name: string };
  state?: { stateCode: string };
  country?: { countryCode: string };
  location?: { longitude: string; latitude: string };
}

export interface TMAttraction {
  id: string;
  name: string;
  classifications?: TMClassification[];
  images?: TMImage[];
}
