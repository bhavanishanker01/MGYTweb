
CREATE OR REPLACE FUNCTION public.cancel_and_refund_tournament(_tid uuid, _delete boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _t RECORD;
  _r RECORD;
  _bal numeric(12,2);
  _new numeric(12,2);
  _count int := 0;
  _total numeric(12,2) := 0;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'not_authorized'; END IF;

  SELECT * INTO _t FROM public.tournaments WHERE id = _tid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'tournament_not_found'; END IF;

  FOR _r IN
    SELECT user_id, paid_amount
    FROM public.tournament_registrations
    WHERE tournament_id = _tid
  LOOP
    -- Skip if refund already processed for this user + tournament
    IF EXISTS (
      SELECT 1 FROM public.wallet_transactions
      WHERE user_id = _r.user_id
        AND type = 'refund'
        AND reference = _tid::text
    ) THEN
      CONTINUE;
    END IF;

    IF COALESCE(_r.paid_amount, 0) <= 0 THEN
      CONTINUE;
    END IF;

    SELECT balance INTO _bal FROM public.wallets WHERE user_id = _r.user_id FOR UPDATE;
    IF _bal IS NULL THEN
      INSERT INTO public.wallets (user_id, balance) VALUES (_r.user_id, 0);
      _bal := 0;
    END IF;
    _new := _bal + _r.paid_amount;
    UPDATE public.wallets SET balance = _new WHERE user_id = _r.user_id;

    INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, status, reference, note)
    VALUES (_r.user_id, 'refund', _r.paid_amount, _new, 'completed', _tid::text,
            'Refund: ' || _t.title || ' — Tournament cancelled by admin');

    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (_r.user_id, 'Tournament cancelled',
            'Your tournament has been cancelled. ₹' || _r.paid_amount::text || ' has been refunded to your wallet.',
            'wallet', '/wallet');

    _count := _count + 1;
    _total := _total + _r.paid_amount;
  END LOOP;

  IF _delete THEN
    DELETE FROM public.tournaments WHERE id = _tid;
  ELSE
    UPDATE public.tournaments SET status = 'cancelled', updated_at = now() WHERE id = _tid;
  END IF;

  RETURN jsonb_build_object('refunded_count', _count, 'total_refunded', _total);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_and_refund_tournament(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_and_refund_tournament(uuid, boolean) TO authenticated;
