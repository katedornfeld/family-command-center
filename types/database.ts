// Hand-written types matching supabase/migrations/*.sql.
//
// Once the Supabase CLI is set up, these can be replaced with generated
// types (`supabase gen types typescript`) — the shape is intentionally
// compatible with that output.
//
// IMPORTANT: the table Row/Insert/Update shapes below must be declared with
// `type`, not `interface`. @supabase/supabase-js's generic inference for
// .insert()/.update() silently collapses to `never` when a named interface
// is used there (confirmed empirically against supabase-js 2.112.1) — the
// outer `Database` wrapper is fine as an interface, only the leaf table
// shapes are affected.

export type EventType = "appointment" | "activity" | "birthday" | "work" | "school";
export type MealSource = "claude" | "manual";
export type MealStatus = "suggested" | "approved" | "edited" | "rejected";

export type FamilyMember = {
  id: string;
  name: string;
  role: string | null;
  birth_date: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
};

export type EventRow = {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  family_member_id: string | null;
  event_type: EventType;
  notes: string | null;
  is_recurring: boolean;
  is_cancelled: boolean;
  created_at: string;
  updated_at: string;
};

export type WeatherForecast = {
  id: string;
  forecast_date: string;
  high_temp: number | null;
  low_temp: number | null;
  condition: string | null;
  last_updated: string;
  created_at: string;
};

export type MealPlan = {
  id: string;
  plan_date: string;
  meal_name: string;
  description: string | null;
  prep_note: string | null;
  reason: string | null;
  source: MealSource;
  status: MealStatus;
  created_at: string;
  updated_at: string;
};

export type GroceryItem = {
  id: string;
  item_name: string;
  category: string | null;
  quantity: string | null;
  purchased: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      family_members: {
        Row: FamilyMember;
        Insert: Partial<FamilyMember> & { name: string };
        Update: Partial<FamilyMember>;
        Relationships: [];
      };
      events: {
        Row: EventRow;
        Insert: Partial<EventRow> & { title: string; event_date: string };
        Update: Partial<EventRow>;
        Relationships: [];
      };
      weather_forecasts: {
        Row: WeatherForecast;
        Insert: Partial<WeatherForecast> & { forecast_date: string };
        Update: Partial<WeatherForecast>;
        Relationships: [];
      };
      meal_plans: {
        Row: MealPlan;
        Insert: Partial<MealPlan> & { plan_date: string; meal_name: string };
        Update: Partial<MealPlan>;
        Relationships: [];
      };
      grocery_items: {
        Row: GroceryItem;
        Insert: Partial<GroceryItem> & { item_name: string };
        Update: Partial<GroceryItem>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
