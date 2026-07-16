import { createClient } from '@supabase/supabase-js';
import { cookieStorage } from '../utils/cookieStorage';

const metaEnv = (import.meta as any).env || {};

const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabaseKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: cookieStorage,
  },
});
