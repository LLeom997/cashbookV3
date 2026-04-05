import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vvvfsjcjvkgpfrcrzgal.supabase.co';
const supabaseKey = 'sb_publishable_eNZs2zwmTGLiNexk2y-43A_RsHtdu1l'

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});