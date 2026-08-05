// Hand-written types matching supabase/migrations/*.sql.
//
// Once the Supabase CLI is set up, these can be replaced with generated
// types (`supabase gen types typescript`) — the shape is intentionally
// compatible with that output.

export type EventType = "appointment" | "activity" | "birthday" | "work" | "school";
export type MealSource = "claude" | "manual";
export type MealStatus = "suggested" | "approved" | "edited" | "rejected";

export interface FamilyMember {
  id: string;
  name: string;
  role: string | null;
  birth_date: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
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
}

export interface WeatherForecast {
  id: string;
  forecast_date: string;
  high_temp: number | null;
  low_temp: number | null;
  condition: string | null;
  last_updated: string;
  created_at: string;
}

export interface MealPlan {
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
}

export interface GroceryItem {
  id: string;
  item_name: string;
  category: string | null;
  quantity: string | null;
  purchased: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      family_members: {
        Row: FamilyMember;
        Insert: Partial<FamilyMember> & { name: string };
        Update: Partial<FamilyMember>;
      };
      events: {
        Row: EventRow;
        Insert: Partial<EventRow> & { title: string; event_date: string };
        Update: Partial<EventRow>;
      };
      weather_forecasts: {
        Row: WeatherForecast;
        Insert: Partial<WeatherForecast> & { forecast_date: string };
        Update: Partial<WeatherForecast>;
      };
      meal_plans: {
        Row: MealPlan;
        Insert: Partial<MealPlan> & { plan_date: string; meal_name: string };
        Update: Partial<MealPlan>;
      };
      grocery_items: {
        Row: GroceryItem;
        Insert: Partial<GroceryItem> & { item_name: string };
        Update: Partial<GroceryItem>;
      };
    };
  };
}
