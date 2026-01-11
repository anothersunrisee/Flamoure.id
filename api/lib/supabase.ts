import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Use service role key for backend to bypass RLS if needed, or anon key for client side
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
