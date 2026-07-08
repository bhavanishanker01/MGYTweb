
CREATE OR REPLACE FUNCTION public.approve_payment(_pid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _p RECORD;
  _t RECORD;
  _slot integer;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'not_authorized'; END IF;

  SELECT * INTO _p FROM public.payments WHERE id = _pid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment_not_found'; END IF;
  IF _p.status <> 'pending' THEN RAISE EXCEPTION 'already_processed'; END IF;

  SELECT * INTO _t FROM public.tournaments WHERE id = _p.tournament_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'tournament_not_found'; END IF;

  -- Enforce that the client-supplied amount matches the tournament's entry fee
  IF _p.amount IS DISTINCT FROM _t.entry_fee THEN
    RAISE EXCEPTION 'amount_mismatch';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tournament_registrations
    WHERE tournament_id = _p.tournament_id AND user_id = _p.user_id
  ) THEN
    IF _t.filled_slots >= _t.max_slots THEN RAISE EXCEPTION 'tournament_full'; END IF;
    _slot := _t.filled_slots + 1;
    INSERT INTO public.tournament_registrations
      (tournament_id, user_id, slot_number, paid_amount)
    VALUES (_p.tournament_id, _p.user_id, _slot, _t.entry_fee);
  END IF;

  UPDATE public.payments
     SET status = 'approved',
         processed_at = now(),
         processed_by = auth.uid(),
         rejection_reason = NULL
   WHERE id = _pid;

  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (
    _p.user_id,
    'Payment approved',
    'Your payment has been approved. Registration confirmed for ' || _t.title || '.',
    'success',
    '/tournaments/' || _t.id::text
  );
END;
$function$;
