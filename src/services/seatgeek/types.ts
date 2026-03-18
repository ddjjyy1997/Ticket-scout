export interface SGEvent {
  id: number;
  title: string;
  short_title: string;
  datetime_utc: string;
  datetime_local: string;
  venue: SGVenue;
  performers: SGPerformer[];
  stats: SGStats;
  url: string;
  score: number;
  type: string;
}

export interface SGVenue {
  id: number;
  name: string;
  city: string;
  state: string;
  country: string;
  capacity: number;
  slug: string;
}

export interface SGPerformer {
  id: number;
  name: string;
  short_name: string;
  slug: string;
  type: string;
  score: number;
  image: string | null;
}

export interface SGStats {
  listing_count: number | null;
  average_price: number | null;
  lowest_price: number | null;
  highest_price: number | null;
  median_price: number | null;
  lowest_sg_base_price: number | null;
  lowest_price_good_deals: number | null;
  dq_bucket_counts: number[] | null;
}

export interface SGSearchResponse {
  events: SGEvent[];
  meta: {
    total: number;
    took: number;
    page: number;
    per_page: number;
  };
}
