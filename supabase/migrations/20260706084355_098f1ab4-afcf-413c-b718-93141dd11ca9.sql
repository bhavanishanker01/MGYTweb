
CREATE OR REPLACE FUNCTION public.get_room_meta(_tid uuid)
RETURNS TABLE(reveal_at timestamptz, published boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT r.reveal_at, true AS published
  FROM public.rooms r
  WHERE r.tournament_id = _tid
    AND (
      public.is_staff(auth.uid())
      OR EXISTS (SELECT 1 FROM public.tournament_registrations tr
                 WHERE tr.tournament_id = _tid AND tr.user_id = auth.uid())
    )
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_room_meta(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_room_meta(uuid) TO authenticated;

-- Improve publish notification body to mention reveal time
CREATE OR REPLACE FUNCTION public.notify_room_published()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _title text; _when text;
BEGIN
  IF NEW.room_id IS NULL AND NEW.room_password IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE'
     AND COALESCE(OLD.room_id,'') = COALESCE(NEW.room_id,'')
     AND COALESCE(OLD.room_password,'') = COALESCE(NEW.room_password,'')
     AND OLD.reveal_at = NEW.reveal_at THEN
    RETURN NEW;
  END IF;
  SELECT title INTO _title FROM public.tournaments WHERE id = NEW.tournament_id;
  _when := to_char(NEW.reveal_at AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM');
  INSERT INTO public.notifications (user_id, title, body, type, link)
  SELECT r.user_id,
         CASE WHEN NEW.reveal_at <= now()
              THEN '🎮 Room details available'
              ELSE '🎮 Room scheduled' END,
         CASE WHEN NEW.reveal_at <= now()
              THEN 'Room details are now available for ' || COALESCE(_title,'your tournament') || '. Tap to view.'
              ELSE 'Room details for ' || COALESCE(_title,'your tournament') || ' unlock at ' || _when || ' IST.' END,
         'tournament',
         '/tournaments/' || NEW.tournament_id::text
  FROM public.tournament_registrations r
  WHERE r.tournament_id = NEW.tournament_id;
  RETURN NEW;
END; $$;
