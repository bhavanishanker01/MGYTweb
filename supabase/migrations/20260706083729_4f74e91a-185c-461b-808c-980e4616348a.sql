
-- Atomic withdrawal RPCs

CREATE OR REPLACE FUNCTION public.request_withdrawal(
  _amount numeric,
  _upi_id text,
  _account_holder text,
  _notes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _bal numeric(12,2);
  _id  uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _amount IS NULL OR _amount < 50 THEN RAISE EXCEPTION 'min_withdrawal_50'; END IF;
  IF COALESCE(trim(_upi_id),'') = '' THEN RAISE EXCEPTION 'upi_required'; END IF;
  IF COALESCE(trim(_account_holder),'') = '' THEN RAISE EXCEPTION 'name_required'; END IF;

  SELECT balance INTO _bal FROM public.wallets WHERE user_id = _uid FOR UPDATE;
  IF _bal IS NULL THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  -- reserve against balance + any pending withdrawals
  IF (_bal - COALESCE((SELECT SUM(amount) FROM public.withdraw_requests
                        WHERE user_id = _uid AND status = 'pending'), 0)) < _amount THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  INSERT INTO public.withdraw_requests (user_id, amount, method, account_details, status)
  VALUES (_uid, _amount, 'UPI',
          jsonb_build_object('upi_id', trim(_upi_id),
                             'account_holder', trim(_account_holder),
                             'notes', COALESCE(trim(_notes),'')),
          'pending')
  RETURNING id INTO _id;

  RETURN _id;
END; $$;

CREATE OR REPLACE FUNCTION public.approve_withdrawal(_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _r RECORD; _bal numeric(12,2); _new numeric(12,2);
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'not_authorized'; END IF;
  SELECT * INTO _r FROM public.withdraw_requests WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF _r.status <> 'pending' THEN RAISE EXCEPTION 'already_processed'; END IF;

  SELECT balance INTO _bal FROM public.wallets WHERE user_id = _r.user_id FOR UPDATE;
  IF _bal IS NULL OR _bal < _r.amount THEN RAISE EXCEPTION 'insufficient_balance'; END IF;
  _new := _bal - _r.amount;
  UPDATE public.wallets SET balance = _new WHERE user_id = _r.user_id;

  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, status, reference, note)
  VALUES (_r.user_id, 'withdraw', -_r.amount, _new, 'completed', _r.id::text, 'Withdrawal approved');

  UPDATE public.withdraw_requests
     SET status = 'approved', processed_at = now(), processed_by = auth.uid()
   WHERE id = _id;

  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (_r.user_id, '✅ Withdrawal approved',
          '₹' || _r.amount::text || ' has been sent to your account.', 'wallet', '/wallet');
END; $$;

CREATE OR REPLACE FUNCTION public.reject_withdrawal(_id uuid, _reason text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _r RECORD;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'not_authorized'; END IF;
  SELECT * INTO _r FROM public.withdraw_requests WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF _r.status <> 'pending' THEN RAISE EXCEPTION 'already_processed'; END IF;

  UPDATE public.withdraw_requests
     SET status = 'rejected',
         processed_at = now(),
         processed_by = auth.uid(),
         admin_note = COALESCE(NULLIF(trim(_reason),''),'No reason provided')
   WHERE id = _id;

  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (_r.user_id, '❌ Withdrawal rejected',
          'Your withdrawal of ₹' || _r.amount::text || ' was rejected: ' ||
          COALESCE(NULLIF(trim(_reason),''),'No reason provided'), 'wallet', '/wallet');
END; $$;

-- Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.withdraw_requests;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
