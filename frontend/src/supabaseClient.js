import { createClient } from '@supabase/supabase-js';

// !!! IMPORTANT: Replace these placeholder values with your actual Supabase credentials !!!
// You can find these in your Supabase project settings.
const supabaseUrl = 'https://bvhlesojdtocbrdrrxlb.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2aGxlc29qZHRvY2JyZHJyeGxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzg4MzgsImV4cCI6MjA3NDkxNDgzOH0.WGIaIwKT9tx_uFg-isKFGyUA239Whp1v92qPPn2jWas';

// Create a single Supabase client for use in your components
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
