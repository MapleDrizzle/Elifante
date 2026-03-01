/**
 * Elifante – database types (mirrors Supabase schema)
 * Use these in the app for type-safe API and forms.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other'

/** Smiley mood rating 1–5 */
export type MoodRating = 1 | 2 | 3 | 4 | 5

/** Food quality for mother's diet (color gradient) 1–5 */
export type FoodQuality = 1 | 2 | 3 | 4 | 5

// =============================================================================
// Table row types (match Supabase public tables)
// =============================================================================

export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Mom {
  id: string
  profile_id: string
  created_at: string
  updated_at: string
}

export interface Baby {
  id: string
  mom_id: string
  name: string
  birth_date: string // ISO date YYYY-MM-DD
  created_at: string
  updated_at: string
}

export interface Mood {
  id: string
  mom_id: string
  mood: MoodRating
  emotion?: string | null
  recorded_at: string
}

export interface ForumPost {
  id: string
  profile_id: string
  topic: string
  body: string
  created_at: string
}

export interface MotherDiet {
  id: string
  mom_id: string
  food: string
  meal: Meal | null
  food_quality: FoodQuality | null
  recorded_at: string
  date: string // ISO date
}

export interface BabyDiet {
  id: string
  baby_id: string
  food: string | null
  bottle: string | null
  recorded_at: string
  date: string
}

export interface Sleep {
  id: string
  mom_id: string | null
  baby_id: string | null
  start_time: string
  end_time: string
  duration_minutes: number
}

export interface Development {
  id: string
  baby_id: string
  weight_kg: number | null
  height_cm: number | null
  milestone: string | null
  recorded_at: string
}

// =============================================================================
// Insert types (for creating rows – omit id / defaults)
// =============================================================================

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'> & {
  created_at?: string
  updated_at?: string
}

export type MomInsert = Omit<Mom, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type BabyInsert = Omit<Baby, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type MoodInsert = Omit<Mood, 'id' | 'recorded_at'> & {
  id?: string
  recorded_at?: string
}

export type ForumPostInsert = Omit<ForumPost, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type MotherDietInsert = Omit<MotherDiet, 'id' | 'recorded_at' | 'date'> & {
  id?: string
  recorded_at?: string
  date?: string
}

export type BabyDietInsert = Omit<BabyDiet, 'id' | 'recorded_at' | 'date'> & {
  id?: string
  recorded_at?: string
  date?: string
}

export type SleepInsert = Omit<Sleep, 'id' | 'duration_minutes'> & {
  id?: string
  duration_minutes?: number
}

export type DevelopmentInsert = Omit<Development, 'id' | 'recorded_at'> & {
  id?: string
  recorded_at?: string
}
