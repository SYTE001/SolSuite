import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.body || {};

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // 1. Auth check (FIX 9): Extract & verify Supabase Bearer token
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: Missing Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ message: 'Supabase configuration missing' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user || user.id !== userId) {
      return res.status(401).json({ message: 'Unauthorized: User authentication failed or user ID mismatch' });
    }

    // 2. Update profiles table using SUPABASE_SERVICE_ROLE_KEY to bypass prevent_profile_plan_tampering trigger
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceKey) {
      return res.status(500).json({ message: 'SUPABASE_SERVICE_ROLE_KEY environment variable is not configured' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        plan: 'free',
        subscription_status: 'inactive',
        plan_expires_at: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error downgrading plan:', updateError);
      return res.status(500).json({ message: updateError.message || 'Gagal mengubah plan' });
    }

    return res.status(200).json({ message: 'Berhasil downgrade ke paket Free' });
  } catch (error) {
    console.error('Server error in downgrade-plan:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
}
