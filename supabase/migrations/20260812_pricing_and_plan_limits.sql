-- Align authoritative database limits with the Free, Starter, and Pro tiers.
CREATE OR REPLACE FUNCTION check_user_plan_limits()
RETURNS TRIGGER AS $$
DECLARE
  v_plan TEXT;
  v_count INTEGER;
  v_limit INTEGER;
BEGIN
  SELECT LOWER(COALESCE(plan, 'free')) INTO v_plan
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Pro is intentionally unlimited. Unknown and legacy plan values are restricted
  -- as Free rather than accidentally receiving premium access.
  IF v_plan = 'pro' THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'clients' THEN
    v_limit := CASE WHEN v_plan = 'starter' THEN 15 ELSE 3 END;
    SELECT COUNT(*) INTO v_count FROM public.clients WHERE user_id = NEW.user_id;
  ELSIF TG_TABLE_NAME = 'invoices' THEN
    v_limit := CASE WHEN v_plan = 'starter' THEN 30 ELSE 5 END;
    SELECT COUNT(*) INTO v_count
    FROM public.invoices
    WHERE user_id = NEW.user_id
      AND created_at >= date_trunc('month', CURRENT_TIMESTAMP);
  ELSIF TG_TABLE_NAME = 'proposals' THEN
    v_limit := CASE WHEN v_plan = 'starter' THEN 20 ELSE 3 END;
    SELECT COUNT(*) INTO v_count
    FROM public.proposals
    WHERE user_id = NEW.user_id
      AND created_at >= date_trunc('month', CURRENT_TIMESTAMP);
  ELSE
    RETURN NEW;
  END IF;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION '% plan limit exceeded: Maximum % % allowed.',
      CASE WHEN v_plan = 'starter' THEN 'Starter' ELSE 'Free' END,
      v_limit,
      CASE TG_TABLE_NAME
        WHEN 'clients' THEN 'clients'
        WHEN 'invoices' THEN 'invoices per month'
        ELSE 'proposals per month'
      END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
