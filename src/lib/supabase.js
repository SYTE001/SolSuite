import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jxuehjrquddnaatrjeax.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_CsfUKrWEfNjCtmLvz-pV6A_GN_6dMqX';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);