/**
 * src/lib/supabase/types.ts — hand-written Supabase `Database` types.
 *
 * Mirrors `supabase/schema.sql` exactly. If you change the schema, update this
 * file in the same commit (or regenerate with `supabase gen types typescript`).
 *
 * Generated-style shape expected by @supabase/supabase-js v2:
 *   Database.public.Tables[name] = { Row, Insert, Update, Relationships }
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/* -------------------------------------------------------------------------- */
/* Enums (mirrors schema.sql DO blocks)                                        */
/* -------------------------------------------------------------------------- */

export type ProductStatus = "draft" | "active" | "archived";
export type MetalKind = "gold" | "silver" | "fashion" | "gemstone";
export type MetalPurity = "24K" | "22K" | "20K" | "18K" | "14K" | "925" | "other";
export type AvailabilityState = "on_enquiry" | "in_stock" | "sold_out";
export type RateMetal = "gold" | "silver";
export type RateUnit = "INR_PER_10_GRAM" | "INR_PER_KG";
export type EnquiryKind = "product" | "general";
export type EnquiryStatus = "new" | "in_progress" | "resolved" | "closed";
export type ReviewStatus = "pending" | "approved" | "rejected";
export type JobStatus = "success" | "error" | "skipped";
export type AdminRole = "owner" | "staff";

/* Added by the Stage 2.1 migration — see supabase/migrations/. */
export type JewelryType =
  | "rings"
  | "necklaces"
  | "earrings"
  | "bangles"
  | "bracelets"
  | "chains"
  | "pendants"
  | "mangalsutra"
  | "necklace-sets"
  | "anklets"
  | "coins-bars"
  | "idols"
  | "gemstones";
export type JewelryGender = "women" | "men" | "kids" | "unisex";
export type JewelryOccasion = "bridal" | "daily" | "festive" | "gifting";
export type MarketSession = "AM" | "PM";

/* -------------------------------------------------------------------------- */
/* Table row helpers                                                           */
/* -------------------------------------------------------------------------- */

type Timestamps = { created_at: string; updated_at: string };

export type AdminUsersRow = {
  user_id: string;
  email: string;
  role: AdminRole;
  created_at: string;
};

export type CategoriesRow = {
  id: string;
  slug: string;
  name_en: string;
  name_hi: string;
  description_en: string | null;
  description_hi: string | null;
  sort_order: number;
  is_active: boolean;
} & Timestamps;

export type ProductsRow = {
  id: string;
  code: string;
  slug: string;
  category_id: string;
  name_en: string;
  name_hi: string;
  description_en: string | null;
  description_hi: string | null;
  metal: MetalKind | null;
  purity: MetalPurity | null;
  gemstone: string | null;
  weight_grams: number | null;
  price_inr: number | null;
  is_price_on_request: boolean;
  availability: AvailabilityState;
  status: ProductStatus;
  is_featured: boolean;
  sort_order: number;
  /* Stage 2.1 filter columns. */
  jewelry_type: JewelryType | null;
  gender: JewelryGender;
  occasion: JewelryOccasion;
  stone_detail: string | null;
} & Timestamps;

export type ProductImagesRow = {
  id: string;
  product_id: string;
  url: string;
  alt_en: string;
  alt_hi: string;
  position: number;
  is_primary: boolean;
  created_at: string;
};

export type MetalRatesRow = {
  id: string;
  metal: RateMetal;
  purity: string;
  unit: RateUnit;
  rate: number;
  source: string;
  observed_at: string;
  fetched_at: string;
  created_at: string;
  /* Stage 2.1 provenance columns. NULL = the source did not state it. */
  /** How the value arrived: 'manual' (typed in /admin) or 'external' (a feed). */
  provider: string;
  market_session: MarketSession | null;
  gst_included: boolean | null;
  making_charges_included: boolean | null;
  /* Stage 12 column (migrations/2026-10-17_…metalsdev_daily_rates): how the
     number was produced. A converted spot value is never labelled a benchmark. */
  rate_type: RateType;
  /* Stage 11 governance columns (migrations/2026-10-15_…rate_provider_governance).
     Only 'auto' and 'approved' rows are visible to the public site. */
  approval_status: RateApprovalStatus;
  /** Why a value was held for approval, in words the shopkeeper can read. */
  approval_reason: string | null;
  /** Change against the last published value for the series, in percent. */
  delta_pct: number | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export type RateApprovalStatus = "auto" | "pending" | "approved" | "rejected";

export type RateType = "benchmark" | "spot_converted" | "manual";

export type RateApiUsageRow = {
  id: string;
  /** Provider id as stored on metal_rates.provider (e.g. 'metalsdev'). */
  provider: string;
  /** Calendar month in the showroom's time zone: 'YYYY-MM'. */
  month: string;
  calls: number;
  monthly_limit: number | null;
  last_call_at: string | null;
  created_at: string;
};

export type PricingRulesRow = {
  id: string;
  rule_key: string;
  label_en: string;
  label_hi: string | null;
  value: number;
  unit: string;
  is_active: boolean;
  is_public: boolean;
  notes: string | null;
} & Timestamps;

export type EnquiriesRow = {
  id: string;
  kind: EnquiryKind;
  product_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  status: EnquiryStatus;
} & Timestamps;

export type SchemeEnquiriesRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  monthly_amount: number | null;
  message: string | null;
  status: EnquiryStatus;
} & Timestamps;

export type AnnouncementsRow = {
  id: string;
  message_en: string;
  message_hi: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  sort_order: number;
} & Timestamps;

export type FaqsRow = {
  id: string;
  question_en: string;
  question_hi: string;
  answer_en: string;
  answer_hi: string;
  category: string | null;
  sort_order: number;
  is_active: boolean;
} & Timestamps;

export type ReviewsRow = {
  id: string;
  product_id: string | null;
  author_name: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  source: string | null;
} & Timestamps;

export type SiteSettingsRow = {
  key: string;
  value: Json;
  description: string | null;
  is_public: boolean;
  updated_at: string;
};

export type RateJobLogsRow = {
  id: string;
  job: string;
  status: JobStatus;
  message: string | null;
  rows_affected: number | null;
  duration_ms: number | null;
  created_at: string;
};

/* -------------------------------------------------------------------------- */
/* Insert / Update variants (generated columns become optional)                */
/* -------------------------------------------------------------------------- */

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type CategoriesInsert = Optional<CategoriesRow, "id" | "sort_order" | "is_active" | "created_at" | "updated_at">;
export type CategoriesUpdate = Partial<CategoriesInsert>;

export type ProductsInsert = Optional<
  ProductsRow,
  "id" | "description_en" | "description_hi" | "metal" | "purity" | "gemstone" |
  "weight_grams" | "price_inr" | "is_price_on_request" | "availability" | "status" |
  "is_featured" | "sort_order" | "jewelry_type" | "gender" | "occasion" | "stone_detail" |
  "created_at" | "updated_at"
>;
export type ProductsUpdate = Partial<ProductsInsert>;

export type ProductImagesInsert = Optional<ProductImagesRow, "id" | "alt_en" | "alt_hi" | "position" | "is_primary" | "created_at">;
export type ProductImagesUpdate = Partial<ProductImagesInsert>;

export type MetalRatesInsert = Optional<
  MetalRatesRow,
  | "id"
  | "fetched_at"
  | "created_at"
  | "provider"
  | "market_session"
  | "gst_included"
  | "making_charges_included"
  | "approval_status"
  | "approval_reason"
  | "delta_pct"
  | "reviewed_at"
  | "reviewed_by"
  | "rate_type"
>;
export type MetalRatesUpdate = Partial<MetalRatesInsert>;

export type RateApiUsageInsert = Optional<RateApiUsageRow, "id" | "calls" | "monthly_limit" | "last_call_at" | "created_at">;
export type RateApiUsageUpdate = Partial<RateApiUsageInsert>;

export type PricingRulesInsert = Optional<PricingRulesRow, "id" | "label_hi" | "is_active" | "is_public" | "notes" | "created_at" | "updated_at">;
export type PricingRulesUpdate = Partial<PricingRulesInsert>;

export type EnquiriesInsert = Optional<EnquiriesRow, "id" | "kind" | "product_id" | "email" | "status" | "created_at" | "updated_at">;
export type EnquiriesUpdate = Partial<EnquiriesInsert>;

export type SchemeEnquiriesInsert = Optional<SchemeEnquiriesRow, "id" | "email" | "monthly_amount" | "message" | "status" | "created_at" | "updated_at">;
export type SchemeEnquiriesUpdate = Partial<SchemeEnquiriesInsert>;

export type AnnouncementsInsert = Optional<AnnouncementsRow, "id" | "is_active" | "starts_at" | "ends_at" | "sort_order" | "created_at" | "updated_at">;
export type AnnouncementsUpdate = Partial<AnnouncementsInsert>;

export type FaqsInsert = Optional<FaqsRow, "id" | "category" | "sort_order" | "is_active" | "created_at" | "updated_at">;
export type FaqsUpdate = Partial<FaqsInsert>;

export type ReviewsInsert = Optional<ReviewsRow, "id" | "product_id" | "comment" | "status" | "source" | "created_at" | "updated_at">;
export type ReviewsUpdate = Partial<ReviewsInsert>;

export type SiteSettingsInsert = Optional<SiteSettingsRow, "description" | "is_public" | "updated_at">;
export type SiteSettingsUpdate = Partial<SiteSettingsInsert>;

export type RateJobLogsInsert = Optional<RateJobLogsRow, "id" | "message" | "rows_affected" | "duration_ms" | "created_at">;
export type RateJobLogsUpdate = Partial<RateJobLogsInsert>;

/* -------------------------------------------------------------------------- */
/* Relationships (mirrors the FKs in schema.sql)                               */
/* -------------------------------------------------------------------------- */

type Rel<Fk extends string, Cols extends readonly string[], Ref extends string> = {
  foreignKeyName: Fk;
  columns: Cols;
  referencedRelation: Ref;
  referencedColumns: ["id"];
};

/* -------------------------------------------------------------------------- */
/* Database                                                                    */
/* -------------------------------------------------------------------------- */

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: AdminUsersRow;
        Insert: Optional<AdminUsersRow, "role" | "created_at">;
        Update: Partial<AdminUsersRow>;
        Relationships: [];
      };
      categories: {
        Row: CategoriesRow;
        Insert: CategoriesInsert;
        Update: CategoriesUpdate;
        Relationships: [];
      };
      products: {
        Row: ProductsRow;
        Insert: ProductsInsert;
        Update: ProductsUpdate;
        Relationships: [Rel<"products_category_id_fkey", ["category_id"], "categories">];
      };
      product_images: {
        Row: ProductImagesRow;
        Insert: ProductImagesInsert;
        Update: ProductImagesUpdate;
        Relationships: [Rel<"product_images_product_id_fkey", ["product_id"], "products">];
      };
      metal_rates: {
        Row: MetalRatesRow;
        Insert: MetalRatesInsert;
        Update: MetalRatesUpdate;
        Relationships: [];
      };
      pricing_rules: {
        Row: PricingRulesRow;
        Insert: PricingRulesInsert;
        Update: PricingRulesUpdate;
        Relationships: [];
      };
      enquiries: {
        Row: EnquiriesRow;
        Insert: EnquiriesInsert;
        Update: EnquiriesUpdate;
        Relationships: [Rel<"enquiries_product_id_fkey", ["product_id"], "products">];
      };
      scheme_enquiries: {
        Row: SchemeEnquiriesRow;
        Insert: SchemeEnquiriesInsert;
        Update: SchemeEnquiriesUpdate;
        Relationships: [];
      };
      announcements: {
        Row: AnnouncementsRow;
        Insert: AnnouncementsInsert;
        Update: AnnouncementsUpdate;
        Relationships: [];
      };
      faqs: {
        Row: FaqsRow;
        Insert: FaqsInsert;
        Update: FaqsUpdate;
        Relationships: [];
      };
      reviews: {
        Row: ReviewsRow;
        Insert: ReviewsInsert;
        Update: ReviewsUpdate;
        Relationships: [Rel<"reviews_product_id_fkey", ["product_id"], "products">];
      };
      site_settings: {
        Row: SiteSettingsRow;
        Insert: SiteSettingsInsert;
        Update: SiteSettingsUpdate;
        Relationships: [];
      };
      rate_job_logs: {
        Row: RateJobLogsRow;
        Insert: RateJobLogsInsert;
        Update: RateJobLogsUpdate;
        Relationships: [];
      };
      rate_api_usage: {
        Row: RateApiUsageRow;
        Insert: RateApiUsageInsert;
        Update: RateApiUsageUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      product_status: ProductStatus;
      metal_kind: MetalKind;
      metal_purity: MetalPurity;
      availability_state: AvailabilityState;
      rate_metal: RateMetal;
      rate_unit: RateUnit;
      enquiry_kind: EnquiryKind;
      enquiry_status: EnquiryStatus;
      review_status: ReviewStatus;
      job_status: JobStatus;
      admin_role: AdminRole;
    };
    CompositeTypes: Record<string, never>;
  };
};

/** Convenience: a row of a given table. */
export type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
