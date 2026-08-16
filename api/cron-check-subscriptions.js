import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Cron execution failed: SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY environment variables must be configured.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  try {
    // Auto downgrade user yang plan_expires_at sudah lewat dari hari ini
    const { data, error } = await supabase
      .from('profiles')
      .update({ plan: 'free', subscription_status: 'expired' })
      .lt('plan_expires_at', new Date().toISOString())
      .neq('plan', 'free');

    if (error) throw error;
    return res.status(200).json({ message: 'Cron check completed successfully', data });
  } catch (err) {
    console.error('Cron check error:', err);
    return res.status(500).json({ error: err.message });
  }
}
