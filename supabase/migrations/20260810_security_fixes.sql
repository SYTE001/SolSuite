-- Migration: SolSuite Security & Data Integrity Fixes

-- -----------------------------------------------------------------------------
-- FIX 1: Prevent users from updating restricted columns on profiles (RLS + Trigger)
-- -----------------------------------------------------------------------------

-- Ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to select their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update non-sensitive fields on their own profile
CREATE POLICY "Users can update own profile non-restricted fields" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Trigger function to enforce column-level immutability for non-service-role users
CREATE OR REPLACE FUNCTION prevent_profile_plan_tampering()
RETURNS TRIGGER AS $$
BEGIN
  -- If invoked by authenticated user (not service_role), block plan column modifications
  IF auth.role() = 'authenticated' THEN
    IF NEW.plan IS DISTINCT FROM OLD.plan THEN
      RAISE EXCEPTION 'Unauthorized: Users cannot modify their own plan column.';
    END IF;
    IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
      RAISE EXCEPTION 'Unauthorized: Users cannot modify subscription_status.';
    END IF;
    IF NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at THEN
      RAISE EXCEPTION 'Unauthorized: Users cannot modify plan_expires_at.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_profile_plan_columns ON public.profiles;
CREATE TRIGGER protect_profile_plan_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_profile_plan_tampering();


-- -----------------------------------------------------------------------------
-- FIX 4: Server-Side Free Plan Limit Triggers
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION check_user_plan_limits()
RETURNS TRIGGER AS $$
DECLARE
  v_plan TEXT;
  v_count INTEGER;
BEGIN
  -- Get user's plan from profiles table
  SELECT LOWER(COALESCE(plan, 'free')) INTO v_plan
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Enforce limits only if user is on the Free plan
  IF v_plan = 'free' OR v_plan IS NULL THEN
    IF TG_TABLE_NAME = 'clients' THEN
      SELECT COUNT(*) INTO v_count FROM public.clients WHERE user_id = NEW.user_id;
      IF v_count >= 3 THEN
        RAISE EXCEPTION 'Free plan limit exceeded: Maximum 3 clients allowed. Please upgrade to Starter or Pro.';
      END IF;
    ELSIF TG_TABLE_NAME = 'invoices' THEN
      SELECT COUNT(*) INTO v_count FROM public.invoices WHERE user_id = NEW.user_id;
      IF v_count >= 5 THEN
        RAISE EXCEPTION 'Free plan limit exceeded: Maximum 5 invoices allowed. Please upgrade to Starter or Pro.';
      END IF;
    ELSIF TG_TABLE_NAME = 'proposals' THEN
      SELECT COUNT(*) INTO v_count FROM public.proposals WHERE user_id = NEW.user_id;
      IF v_count >= 3 THEN
        RAISE EXCEPTION 'Free plan limit exceeded: Maximum 3 proposals allowed. Please upgrade to Starter or Pro.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_clients_limit ON public.clients;
CREATE TRIGGER enforce_clients_limit
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION check_user_plan_limits();

DROP TRIGGER IF EXISTS enforce_invoices_limit ON public.invoices;
CREATE TRIGGER enforce_invoices_limit
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION check_user_plan_limits();

DROP TRIGGER IF EXISTS enforce_proposals_limit ON public.proposals;
CREATE TRIGGER enforce_proposals_limit
  BEFORE INSERT ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION check_user_plan_limits();


-- -----------------------------------------------------------------------------
-- FIX 6: Unique Constraint on transactions.order_id
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_order_id_key'
  ) THEN
    ALTER TABLE public.transactions ADD CONSTRAINT transactions_order_id_key UNIQUE (order_id);
  END IF;
END $$;
