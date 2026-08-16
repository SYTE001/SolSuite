import { createClient } from '@supabase/supabase-js';

// Constant price table (Server-side single source of truth - FIX 2)
const PLAN_PRICES = {
  starter: 39000,
  pro: 79000,
};

/**
 * Note for Vercel deployment:
 * MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY (or VITE_MIDTRANS_CLIENT_KEY),
 * and MIDTRANS_IS_PRODUCTION must be set in Vercel project settings.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { orderId, planName, userId, customerEmail } = req.body || {};

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

    // 2. Price validation (FIX 2): Compute gross_amount server-side & discard req.body.amount
    if (!planName || typeof planName !== 'string') {
      return res.status(400).json({ message: 'Invalid planName' });
    }

    const normalizedPlan = planName.toLowerCase().trim();
    const grossAmount = PLAN_PRICES[normalizedPlan];

    if (!grossAmount) {
      return res.status(400).json({ message: 'Invalid or unsupported plan selected' });
    }

    // 3. Midtrans Environment setup (FIX 3)
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return res.status(500).json({ message: 'MIDTRANS_SERVER_KEY belum diset di Vercel Environment Variables' });
    }

    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true' || process.env.MIDTRANS_IS_PRODUCTION === true;
    const midtransEndpoint = isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const authString = Buffer.from(`${serverKey.trim()}:`).toString('base64');

    const parameter = {
      transaction_details: {
        order_id: orderId || `SOL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        gross_amount: grossAmount,
      },
      item_details: [
        {
          id: normalizedPlan,
          price: grossAmount,
          quantity: 1,
          name: `SolSuite ${planName} Plan`,
        },
      ],
      customer_details: {
        email: customerEmail || user.email || 'user@kayana.web.id',
      },
      custom_field1: userId,
      custom_field2: normalizedPlan,
    };

    const response = await fetch(midtransEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${authString}`,
      },
      body: JSON.stringify(parameter),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Midtrans API Error:', data);
      return res.status(response.status).json({
        message: data.error_messages ? data.error_messages.join(', ') : 'Gagal ke Midtrans',
        details: data,
      });
    }

    return res.status(200).json({
      token: data.token,
      redirect_url: data.redirect_url,
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
}
