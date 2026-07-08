
-- Realtime for deposits
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.deposit_requests; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
ALTER TABLE public.deposit_requests REPLICA IDENTITY FULL;

-- Atomic approve
CREATE OR REPLACE FUNCTION public.approve_deposit(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE _r RECORD; _bal numeric(12,2); _new numeric(12,2);
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'not_authorized'; END IF;

  SELECT * INTO _r FROM public.deposit_requests WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF _r.status <> 'pending' THEN RAISE EXCEPTION 'already_processed'; END IF;

  SELECT balance INTO _bal FROM public.wallets WHERE user_id = _r.user_id FOR UPDATE;
  IF _bal IS NULL THEN
    INSERT INTO public.wallets (user_id, balance) VALUES (_r.user_id, 0);
    _bal := 0;
  END IF;
  _new := _bal + _r.amount;
  UPDATE public.wallets SET balance = _new WHERE user_id = _r.user_id;

  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, status, reference, note)
  VALUES (_r.user_id, 'deposit', _r.amount, _new, 'completed', _r.id::text, 'Deposit approved');

  UPDATE public.deposit_requests
     SET status = 'approved', processed_at = now(), processed_by = auth.uid(), admin_note = NULL
   WHERE id = _id;

  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (_r.user_id, '✅ Deposit approved',
          '₹' || _r.amount::text || ' has been added to your wallet.', 'wallet', '/wallet');
END; $fn$;

REVOKE ALL ON FUNCTION public.approve_deposit(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_deposit(uuid) TO authenticated;

-- Atomic reject
CREATE OR REPLACE FUNCTION public.reject_deposit(_id uuid, _reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE _r RECORD;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'not_authorized'; END IF;

  SELECT * INTO _r FROM public.deposit_requests WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF _r.status <> 'pending' THEN RAISE EXCEPTION 'already_processed'; END IF;

  UPDATE public.deposit_requests
     SET status = 'rejected', processed_at = now(), processed_by = auth.uid(),
         admin_note = COALESCE(NULLIF(trim(_reason),''), 'No reason provided')
   WHERE id = _id;

  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (_r.user_id, '❌ Deposit rejected',
          'Your deposit of ₹' || _r.amount::text || ' was rejected: ' ||
          COALESCE(NULLIF(trim(_reason),''),'No reason provided'), 'wallet', '/wallet');
END; $fn$;

REVOKE ALL ON FUNCTION public.reject_deposit(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_deposit(uuid, text) TO authenticated;
