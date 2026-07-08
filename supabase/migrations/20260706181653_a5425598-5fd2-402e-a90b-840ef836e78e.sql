
-- 1. Denormalized columns on winners
ALTER TABLE public.winners
  ADD COLUMN IF NOT EXISTS player_name text,
  ADD COLUMN IF NOT EXISTS ff_uid text,
  ADD COLUMN IF NOT EXISTS tournament_title text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz NOT NULL DEFAULT now();

-- 2. Trigger to auto-fill denormalized fields on insert/update
CREATE OR REPLACE FUNCTION public.fill_winner_details()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _p RECORD; _t RECORD; _ff text;
BEGIN
  SELECT full_name, game_name, uid, avatar_url INTO _p
    FROM public.profiles WHERE id = NEW.user_id;
  SELECT title INTO _t FROM public.tournaments WHERE id = NEW.tournament_id;

  -- Latest FF UID that the player registered with for this tournament
  SELECT ff_uid INTO _ff
    FROM public.tournament_registrations
   WHERE tournament_id = NEW.tournament_id AND user_id = NEW.user_id
   ORDER BY created_at DESC LIMIT 1;

  NEW.player_name := COALESCE(NULLIF(trim(NEW.player_name),''),
                              NULLIF(_p.game_name,''),
                              NULLIF(_p.full_name,''),
                              'Player');
  NEW.ff_uid := COALESCE(NULLIF(trim(NEW.ff_uid),''), _ff, _p.uid);
  NEW.tournament_title := COALESCE(NULLIF(trim(NEW.tournament_title),''), _t.title);
  NEW.avatar_url := COALESCE(NEW.avatar_url, _p.avatar_url);
  IF NEW.published_at IS NULL THEN NEW.published_at := now(); END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fill_winner_details ON public.winners;
CREATE TRIGGER trg_fill_winner_details
  BEFORE INSERT OR UPDATE ON public.winners
  FOR EACH ROW EXECUTE FUNCTION public.fill_winner_details();

-- 3. Backfill existing rows
UPDATE public.winners w
   SET player_name = COALESCE(NULLIF(trim(w.player_name),''),
                              NULLIF(p.game_name,''), NULLIF(p.full_name,''), 'Player'),
       ff_uid = COALESCE(NULLIF(trim(w.ff_uid),''),
                         (SELECT ff_uid FROM public.tournament_registrations tr
                           WHERE tr.tournament_id = w.tournament_id AND tr.user_id = w.user_id
                           ORDER BY created_at DESC LIMIT 1),
                         p.uid),
       tournament_title = COALESCE(NULLIF(trim(w.tournament_title),''), t.title),
       avatar_url = COALESCE(w.avatar_url, p.avatar_url),
       published_at = COALESCE(w.published_at, w.created_at)
  FROM public.profiles p, public.tournaments t
 WHERE p.id = w.user_id AND t.id = w.tournament_id;

-- 4. Public read policy so anonymous visitors see winners (denormalized data only)
GRANT SELECT ON public.winners TO anon;
DROP POLICY IF EXISTS win_public_read ON public.winners;
CREATE POLICY win_public_read ON public.winners
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS win_auth_read ON public.winners;

-- 5. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.winners;
