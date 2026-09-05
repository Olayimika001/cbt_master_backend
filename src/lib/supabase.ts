import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

export const supabase = createClient(
  config.supabase.url || 'http://localhost:54321',
  config.supabase.anonKey || 'placeholder-anon-key'
);
