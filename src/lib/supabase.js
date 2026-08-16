import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Browser vanilla tidak memiliki variabel `process.env`.
// Anon Key aman diletakkan di client-side.
const supabaseUrl = 'https://jxuehjrquddnaatrjeax.supabase.co';
const supabaseAnonKey = 'sb_publishable_CsfUKrWEfNjCtmLvz-pV6A_GN_6dMqX';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);