
-- Ensure one result row per (tournament, user) so upserts work
CREATE UNIQUE INDEX IF NOT EXISTS match_results_tour_user_uk
  ON public.match_results (tournament_id, user_id);

CREATE OR REPLACE FUNCTION public.publish_tournament_results(_tid uuid, _rows jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _t RECORD;
  _r jsonb;
  _uid uuid;
  _position int;
  _kills int;
  _points int;
  _prize numeric(12,2);
  _mvp boolean;
  _bal numeric(12,2);
  _title text;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'not_authorized'; END IF;

  SELECT * INTO _t FROM public.tournaments WHERE id = _tid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'tournament_not_found'; END IF;
  _title := _t.title;

  IF jsonb_typeof(_rows) <> 'array' THEN RAISE EXCEPTION 'rows_must_be_array'; END IF;

  FOR _r IN SELECT * FROM jsonb_array_elements(_rows) LOOP
    _uid      := (_r->>'user_id')::uuid;
    _position := NULLIF(_r->>'position','')::int;
    _kills    := COALESCE(NULLIF(_r->>'kills','')::int, 0);
    _points   := COALESCE(NULLIF(_r->>'points','')::int, 0);
    _prize    := COALESCE(NULLIF(_r->>'prize','')::numeric, 0);
    _mvp      := COALESCE((_r->>'mvp')::boolean, false);

    IF _uid IS NULL THEN CONTINUE; END IF;

    -- Only publish for actually registered users
    IF NOT EXISTS (SELECT 1 FROM public.tournament_registrations
                   WHERE tournament_id = _tid AND user_id = _uid) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.match_results (tournament_id, user_id, position, kills, points, prize, mvp)
    VALUES (_tid, _uid, _position, _kills, _points, _prize, _mvp)
    ON CONFLICT (tournament_id, user_id) DO UPDATE
      SET position = EXCLUDED.position,
          kills    = EXCLUDED.kills,
          points   = EXCLUDED.points,
          prize    = EXCLUDED.prize,
          mvp      = EXCLUDED.mvp;

    -- Credit prize to wallet (if any)
    IF _prize > 0 THEN
      SELECT balance INTO _bal FROM public.wallets WHERE user_id = _uid FOR UPDATE;
      IF _bal IS NULL THEN
        INSERT INTO public.wallets (user_id, balance) VALUES (_uid, 0);
        _bal := 0;
      END IF;
      _bal := _bal + _prize;
      UPDATE public.wallets SET balance = _bal WHERE user_id = _uid;
      INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, status, reference, note)
      VALUES (_uid, 'prize', _prize, _bal, 'completed', _tid::text, 'Prize: ' || _title);
    END IF;

    -- Add to Winners page for podium placements
    IF _position IS NOT NULL AND _position BETWEEN 1 AND 3 THEN
      IF EXISTS (SELECT 1 FROM public.winners WHERE tournament_id = _tid AND user_id = _uid) THEN
        UPDATE public.winners SET position = _position, prize = _prize
         WHERE tournament_id = _tid AND user_id = _uid;
      ELSE
        INSERT INTO public.winners (tournament_id, user_id, position, prize, featured)
        VALUES (_tid, _uid, _position, _prize, true);
      END IF;
    END IF;

    -- Notify participant
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      _uid,
      '🏆 Results published',
      'Final results for ' || _title || ' are out'
        || CASE WHEN _position IS NOT NULL THEN ' — you placed #' || _position ELSE '' END
        || CASE WHEN _prize > 0 THEN '. Prize: ₹' || _prize::text || ' credited.' ELSE '.' END,
      'success',
      '/history'
    );
  END LOOP;

  UPDATE public.tournaments SET status = 'completed', updated_at = now() WHERE id = _tid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_tournament_results(uuid, jsonb) TO authenticated;
