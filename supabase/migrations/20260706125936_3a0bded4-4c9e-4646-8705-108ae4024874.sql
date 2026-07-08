
-- Prevent duplicate winners for the same tournament + position
CREATE UNIQUE INDEX IF NOT EXISTS winners_tid_position_uidx
  ON public.winners (tournament_id, position);

CREATE OR REPLACE FUNCTION public.distribute_prize(
  _tid uuid,
  _uid uuid,
  _position int,
  _amount numeric
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin uuid := auth.uid();
  _t RECORD;
  _bal numeric(12,2);
  _new numeric(12,2);
  _winner_id uuid;
  _pos_label text;
BEGIN
  IF NOT public.is_staff(_admin) THEN RAISE EXCEPTION 'not_authorized'; END IF;
  IF _position IS NULL OR _position < 1 THEN RAISE EXCEPTION 'invalid_position'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  SELECT * INTO _t FROM public.tournaments WHERE id = _tid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'tournament_not_found'; END IF;

  -- Player must be a registered participant
  IF NOT EXISTS (
    SELECT 1 FROM public.tournament_registrations
    WHERE tournament_id = _tid AND user_id = _uid
  ) THEN
    RAISE EXCEPTION 'player_not_registered';
  END IF;

  -- Duplicate protection: same tournament + position
  IF EXISTS (SELECT 1 FROM public.winners WHERE tournament_id = _tid AND position = _position) THEN
    RAISE EXCEPTION 'prize_already_distributed';
  END IF;
  -- Duplicate protection: same tournament + user
  IF EXISTS (SELECT 1 FROM public.winners WHERE tournament_id = _tid AND user_id = _uid) THEN
    RAISE EXCEPTION 'prize_already_distributed';
  END IF;

  -- Credit wallet
  SELECT balance INTO _bal FROM public.wallets WHERE user_id = _uid FOR UPDATE;
  IF _bal IS NULL THEN
    INSERT INTO public.wallets (user_id, balance) VALUES (_uid, 0);
    _bal := 0;
  END IF;
  _new := _bal + _amount;
  UPDATE public.wallets SET balance = _new WHERE user_id = _uid;

  -- Ledger entry
  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, status, reference, note)
  VALUES (_uid, 'prize', _amount, _new, 'completed', _tid::text,
          'Tournament Prize: ' || _t.title || ' — Position #' || _position);

  -- Record winner (notify_winner trigger sends "🏆 You won" notification)
  INSERT INTO public.winners (tournament_id, user_id, position, prize, featured)
  VALUES (_tid, _uid, _position, _amount, true)
  RETURNING id INTO _winner_id;

  -- Extra congratulations notification with position label
  _pos_label := CASE _position
    WHEN 1 THEN 'First Place 🥇'
    WHEN 2 THEN 'Second Place 🥈'
    WHEN 3 THEN 'Third Place 🥉'
    ELSE 'Position #' || _position END;

  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (_uid, '🏆 Prize credited',
          'Congratulations! You received ₹' || _amount::text ||
          ' for securing ' || _pos_label || ' in ' || _t.title || '.',
          'success', '/wallet');

  -- Audit log
  INSERT INTO public.activity_logs (user_id, action, entity, entity_id, metadata)
  VALUES (_admin, 'distribute_prize', 'tournament', _tid::text,
          jsonb_build_object(
            'winner_user_id', _uid,
            'position', _position,
            'amount', _amount,
            'tournament_title', _t.title,
            'credited_by', _admin,
            'at', now()
          ));

  RETURN _winner_id;
END;
$$;
