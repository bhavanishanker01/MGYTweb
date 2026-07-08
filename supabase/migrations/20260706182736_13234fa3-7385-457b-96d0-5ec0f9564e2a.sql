
CREATE OR REPLACE FUNCTION public.register_for_tournament(_tour_id uuid, _team_name text DEFAULT NULL::text, _players jsonb DEFAULT '[]'::jsonb, _ff_uid text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid UUID := auth.uid();
  _t RECORD;
  _wallet RECORD;
  _reg_id UUID;
  _new_bal NUMERIC(12,2);
  _slot INTEGER;
  _uid_clean text := NULLIF(trim(COALESCE(_ff_uid,'')), '');
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _uid_clean IS NULL THEN RAISE EXCEPTION 'ff_uid_required'; END IF;
  IF _uid_clean !~ '^[0-9]{8,12}$' THEN RAISE EXCEPTION 'ff_uid_invalid'; END IF;

  SELECT * INTO _t FROM public.tournaments WHERE id = _tour_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'tournament_not_found'; END IF;
  IF _t.status <> 'upcoming' THEN RAISE EXCEPTION 'registration_closed'; END IF;
  IF NOT COALESCE(_t.registration_open, true) THEN RAISE EXCEPTION 'registration_closed'; END IF;
  IF _t.filled_slots >= _t.max_slots THEN RAISE EXCEPTION 'tournament_full'; END IF;
  IF EXISTS (SELECT 1 FROM public.tournament_registrations WHERE tournament_id = _tour_id AND user_id = _uid) THEN
    RAISE EXCEPTION 'already_registered';
  END IF;

  SELECT * INTO _wallet FROM public.wallets WHERE user_id = _uid FOR UPDATE;
  IF _wallet.balance < _t.entry_fee THEN RAISE EXCEPTION 'insufficient_balance'; END IF;

  _new_bal := _wallet.balance - _t.entry_fee;
  UPDATE public.wallets SET balance = _new_bal WHERE user_id = _uid;

  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, status, reference, note)
  VALUES (_uid, 'entry_fee', -_t.entry_fee, _new_bal, 'completed', _tour_id::text, 'Tournament entry: ' || _t.title);

  _slot := _t.filled_slots + 1;
  INSERT INTO public.tournament_registrations (tournament_id, user_id, team_name, players, slot_number, paid_amount, ff_uid)
  VALUES (_tour_id, _uid, _team_name, _players, _slot, _t.entry_fee, _uid_clean)
  RETURNING id INTO _reg_id;

  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (_uid, 'Registered!', 'You are in for ' || _t.title, 'tournament', '/tournaments/' || _t.id::text);

  RETURN _reg_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_update_reg_ff_uid(_reg_id uuid, _ff_uid text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _clean text := NULLIF(trim(COALESCE(_ff_uid,'')), '');
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'not_authorized'; END IF;
  IF _clean IS NULL THEN RAISE EXCEPTION 'ff_uid_required'; END IF;
  IF _clean !~ '^[0-9]{8,12}$' THEN RAISE EXCEPTION 'ff_uid_invalid'; END IF;
  UPDATE public.tournament_registrations
     SET ff_uid = _clean
   WHERE id = _reg_id;
END;
$function$;
