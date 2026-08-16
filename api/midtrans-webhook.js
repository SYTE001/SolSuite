import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Constant price table (Server-side single source of truth - FIX 2)
const PLAN_PRICES = {
  starter: 39000,
  pro: 79000,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const data = req.body || {};
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    
    if (!serverKey) {
      return res.status(500).json({ message: 'MIDTRANS_SERVER_KEY is not configured' });
    }

    const { 
      order_id, 
      status_code, 
      gross_amount, 
      signature_key, 
      transaction_status,
      fraud_status,
      custom_field1: userId, 
      custom_field2: planName 
    } = data;
    
    // 1. Validasi Keberadaan & Signature Key
    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return res.status(400).json({ message: 'Invalid payload: missing signature parameters' });
    }

    const hashData = order_id + status_code + gross_amount + serverKey;
    const expectedSignature = crypto.createHash('sha512').update(hashData).digest('hex');
    
    if (signature_key !== expectedSignature) {
      return res.status(401).json({ message: 'Invalid signature' });
    }
    
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Cek Idempotency: Apakah order sudah settlement?
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('status')
      .eq('order_id', order_id)
      .maybeSingle();

    if (existingTx && existingTx.status === 'settlement') {
      return res.status(200).json({ status: 'ok', message: 'Already processed' });
    }

    // Normalisasi status transaksi & penanganan fraud_status untuk kartu kredit (capture)
    let mappedStatus = 'pending';
    if (transaction_status === 'capture') {
      if (fraud_status === 'challenge') {
        mappedStatus = 'challenge';
      } else {
        mappedStatus = 'settlement';
      }
    } else if (transaction_status === 'settlement') {
      mappedStatus = 'settlement';
    } else if (['expire'].includes(transaction_status)) {
      mappedStatus = 'expired';
    } else if (['cancel', 'deny'].includes(transaction_status)) {
      mappedStatus = 'failed';
    }

    // 3. Update/Insert (Upsert) ke tabel transactions
    await supabase
      .from('transactions')
      .upsert({
        order_id: order_id,
        user_id: userId,
        plan_name: planName,
        amount: gross_amount,
        status: mappedStatus,
        updated_at: new Date().toISOString()
      }, { onConflict: 'order_id' });

    // 4. Jika sukses (settlement), lakukan re-validasi harga dan perbarui profil user (FIX 2, FIX 6, FIX 7)
    if (mappedStatus === 'settlement') {
      const normalizedPlan = (planName || '').toLowerCase().trim();
      const expectedPrice = PLAN_PRICES[normalizedPlan];

      // Re-validate price received from Midtrans against server-side price table (FIX 2)
      if (!expectedPrice || Number(gross_amount) !== expectedPrice) {
        console.warn(`[Suspicious Transaction] Order ID ${order_id}: Received gross_amount (${gross_amount}) does not match expected price (${expectedPrice}) for plan '${planName}'.`);
        return res.status(200).json({ status: 'ok', message: 'Suspicious transaction price mismatch ignored' });
      }

      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

      // Fetch current user's profile to extend from existing future expiry (FIX 7)
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('plan_expires_at')
        .eq('id', userId)
        .single();

      let baseTimestamp = Date.now();
      if (userProfile && userProfile.plan_expires_at) {
        const currentExpiryTime = new Date(userProfile.plan_expires_at).getTime();
        if (!isNaN(currentExpiryTime) && currentExpiryTime > Date.now()) {
          baseTimestamp = currentExpiryTime;
        }
      }

      const plan_expires_at = new Date(baseTimestamp + THIRTY_DAYS_MS).toISOString();
      
      const { error } = await supabase
        .from('profiles')
        .update({
          plan: normalizedPlan || 'free',
          subscription_status: 'active',
          plan_expires_at: plan_expires_at
        })
        .eq('id', userId);
        
      if (error) {
        console.error('Error updating Supabase profiles table:', error);
        throw error;
      }
    }
    
    // 5. Jika expire/cancel/deny, tabel profiles tidak diubah, transactions sudah diupdate.
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
