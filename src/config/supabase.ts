import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Service-role client: full DB/auth access, backend-only, never expose this key to Flutter.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
