CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"password_hash" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"city" text DEFAULT 'Toronto' NOT NULL,
	"province" text DEFAULT 'ON',
	"country" text DEFAULT 'CA',
	"capacity" integer,
	"tm_venue_id" text,
	"sg_venue_id" integer,
	"latitude" numeric,
	"longitude" numeric,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "venues_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"normalized_name" text NOT NULL,
	"tm_attraction_id" text,
	"sg_performer_id" integer,
	"genre" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "artists_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "event_artists" (
	"event_id" integer NOT NULL,
	"artist_id" integer NOT NULL,
	"is_primary" boolean DEFAULT true,
	CONSTRAINT "event_artists_event_id_artist_id_pk" PRIMARY KEY("event_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "event_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"source" text NOT NULL,
	"source_event_id" text NOT NULL,
	"source_url" text,
	"raw_data" jsonb,
	"match_confidence" numeric,
	"last_synced_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_sources_source_event_id_unique" UNIQUE("source","source_event_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"venue_id" integer,
	"event_date" timestamp NOT NULL,
	"event_end_date" timestamp,
	"genre" text,
	"sub_genre" text,
	"segment" text,
	"image_url" text,
	"status" text DEFAULT 'announced' NOT NULL,
	"price_min" numeric,
	"price_max" numeric,
	"currency" text DEFAULT 'CAD',
	"ticket_limit" integer,
	"is_sold_out" boolean DEFAULT false,
	"last_scanned_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "onsale_windows" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"window_type" text NOT NULL,
	"window_name" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"access_code" text,
	"signup_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resale_listings_summary" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"source" text NOT NULL,
	"snapshot_date" timestamp DEFAULT now() NOT NULL,
	"listing_count" integer,
	"lowest_price" numeric,
	"highest_price" numeric,
	"average_price" numeric,
	"median_price" numeric,
	"currency" text DEFAULT 'CAD',
	"sg_score" numeric,
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"buy_score" numeric,
	"buy_confidence" numeric DEFAULT '0' NOT NULL,
	"buy_inputs" jsonb DEFAULT '{}' NOT NULL,
	"buy_recommendation" text,
	"expected_roi_band" text,
	"sell_score" numeric,
	"sell_confidence" numeric DEFAULT '0' NOT NULL,
	"sell_inputs" jsonb DEFAULT '{}' NOT NULL,
	"sell_recommendation" text,
	"market_phase" text,
	"profit_estimate_pct" numeric,
	"profit_estimate_amt" numeric,
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_scores_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "watchlist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"watchlist_id" integer NOT NULL,
	"item_type" text NOT NULL,
	"event_id" integer,
	"artist_id" integer,
	"venue_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "watchlist_items_event_unique" UNIQUE("watchlist_id","item_type","event_id"),
	CONSTRAINT "watchlist_items_artist_unique" UNIQUE("watchlist_id","item_type","artist_id"),
	CONSTRAINT "watchlist_items_venue_unique" UNIQUE("watchlist_id","item_type","venue_id")
);
--> statement-breakpoint
CREATE TABLE "watchlists" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT 'Default' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"event_id" integer,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"channel" text DEFAULT 'in_app' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"notify_onsale" boolean DEFAULT true NOT NULL,
	"notify_price_drop" boolean DEFAULT true NOT NULL,
	"notify_new_events" boolean DEFAULT true NOT NULL,
	"price_drop_threshold" integer DEFAULT 15,
	"timezone" text DEFAULT 'America/Toronto',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "scan_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"scan_run_id" integer NOT NULL,
	"level" text NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_type" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"triggered_by" text DEFAULT 'cron' NOT NULL,
	"events_found" integer DEFAULT 0 NOT NULL,
	"events_created" integer DEFAULT 0 NOT NULL,
	"events_updated" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer,
	"metadata" jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "api_usage_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"endpoint" text NOT NULL,
	"method" text DEFAULT 'GET' NOT NULL,
	"status_code" integer,
	"response_time_ms" integer,
	"call_date" date DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"notify_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_views_user_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"stripe_subscription_id" text,
	"stripe_price_id" text,
	"plan" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'trialing' NOT NULL,
	"trial_ends_at" timestamp,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "presale_code_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"vote" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "presale_code_votes_user_code_unique" UNIQUE("code_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "presale_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"onsale_window_id" integer,
	"code" text NOT NULL,
	"source" text DEFAULT 'user' NOT NULL,
	"submitted_by" text,
	"confirmed_working" integer DEFAULT 0 NOT NULL,
	"confirmed_not_working" integer DEFAULT 0 NOT NULL,
	"confidence" numeric DEFAULT '0',
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "presale_codes_event_code_unique" UNIQUE("event_id","code")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_artists" ADD CONSTRAINT "event_artists_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_artists" ADD CONSTRAINT "event_artists_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sources" ADD CONSTRAINT "event_sources_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onsale_windows" ADD CONSTRAINT "onsale_windows_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resale_listings_summary" ADD CONSTRAINT "resale_listings_summary_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_scores" ADD CONSTRAINT "event_scores_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_watchlist_id_watchlists_id_fk" FOREIGN KEY ("watchlist_id") REFERENCES "public"."watchlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_logs" ADD CONSTRAINT "scan_logs_scan_run_id_scan_runs_id_fk" FOREIGN KEY ("scan_run_id") REFERENCES "public"."scan_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presale_code_votes" ADD CONSTRAINT "presale_code_votes_code_id_presale_codes_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."presale_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presale_code_votes" ADD CONSTRAINT "presale_code_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presale_codes" ADD CONSTRAINT "presale_codes_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presale_codes" ADD CONSTRAINT "presale_codes_onsale_window_id_onsale_windows_id_fk" FOREIGN KEY ("onsale_window_id") REFERENCES "public"."onsale_windows"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presale_codes" ADD CONSTRAINT "presale_codes_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "venues_tm_venue_id_idx" ON "venues" USING btree ("tm_venue_id");--> statement-breakpoint
CREATE INDEX "venues_sg_venue_id_idx" ON "venues" USING btree ("sg_venue_id");--> statement-breakpoint
CREATE INDEX "venues_slug_idx" ON "venues" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "artists_normalized_name_idx" ON "artists" USING btree ("normalized_name");--> statement-breakpoint
CREATE INDEX "artists_tm_attraction_id_idx" ON "artists" USING btree ("tm_attraction_id");--> statement-breakpoint
CREATE INDEX "event_sources_event_id_idx" ON "event_sources" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "events_event_date_idx" ON "events" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "events_venue_id_idx" ON "events" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "onsale_windows_event_id_idx" ON "onsale_windows" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "onsale_windows_start_date_idx" ON "onsale_windows" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "resale_event_snapshot_idx" ON "resale_listings_summary" USING btree ("event_id","snapshot_date");--> statement-breakpoint
CREATE INDEX "resale_event_source_idx" ON "resale_listings_summary" USING btree ("event_id","source");--> statement-breakpoint
CREATE INDEX "watchlists_user_id_idx" ON "watchlists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "scan_logs_scan_run_id_idx" ON "scan_logs" USING btree ("scan_run_id");--> statement-breakpoint
CREATE INDEX "scan_runs_started_at_idx" ON "scan_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "scan_runs_status_idx" ON "scan_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "api_usage_source_date_idx" ON "api_usage_logs" USING btree ("source","call_date");--> statement-breakpoint
CREATE INDEX "api_usage_date_idx" ON "api_usage_logs" USING btree ("call_date");--> statement-breakpoint
CREATE INDEX "saved_views_user_id_idx" ON "saved_views" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_stripe_customer_id_idx" ON "subscriptions" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "subscriptions_stripe_subscription_id_idx" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "presale_code_votes_code_id_idx" ON "presale_code_votes" USING btree ("code_id");--> statement-breakpoint
CREATE INDEX "presale_codes_event_id_idx" ON "presale_codes" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "presale_codes_onsale_window_id_idx" ON "presale_codes" USING btree ("onsale_window_id");--> statement-breakpoint
CREATE INDEX "presale_codes_status_idx" ON "presale_codes" USING btree ("status");