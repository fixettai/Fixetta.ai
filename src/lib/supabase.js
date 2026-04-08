import { createClient } from '@supabase/supabase-js'

// Use the environment variables we set up
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL 
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create a single instance of the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)