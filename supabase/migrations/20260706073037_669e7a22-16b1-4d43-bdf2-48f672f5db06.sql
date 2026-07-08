
-- Allow users to delete their own notifications
DROP POLICY IF EXISTS notif_delete_own ON public.notifications;
CREATE POLICY notif_delete_own ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Announcements fanout trigger (function already exists)
DROP TRIGGER IF EXISTS trg_fanout_announcement ON public.announcements;
CREATE TRIGGER trg_fanout_announcement
AFTER INSERT ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.fanout_announcement();

-- Winners: notify the winning player
CREATE OR REPLACE FUNCTION public.notify_winner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _title text;
BEGIN
  SELECT title INTO _title FROM public.tournaments WHERE id = NEW.tournament_id;
  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (NEW.user_id,
          '🏆 You won!',
          'Congrats — position #' || NEW.position || ' in ' || COALESCE(_title,'a tournament') || '. Prize: ' || NEW.prize,
          'success',
          '/winners');
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.notify_winner() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notify_winner ON public.winners;
CREATE TRIGGER trg_notify_winner AFTER INSERT ON public.winners
FOR EACH ROW EXECUTE FUNCTION public.notify_winner();

-- Rooms: notify all registered players when Room ID or Password is published/updated
CREATE OR REPLACE FUNCTION public.notify_room_published()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _title text;
BEGIN
  IF NEW.room_id IS NULL AND NEW.room_password IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE'
     AND COALESCE(OLD.room_id,'') = COALESCE(NEW.room_id,'')
     AND COALESCE(OLD.room_password,'') = COALESCE(NEW.room_password,'') THEN
    RETURN NEW;
  END IF;
  SELECT title INTO _title FROM public.tournaments WHERE id = NEW.tournament_id;
  INSERT INTO public.notifications (user_id, title, body, type, link)
  SELECT r.user_id,
         '🎮 Room details published',
         'Room details are available for ' || COALESCE(_title,'your tournament') || '. Tap to view.',
         'tournament',
         '/tournaments/' || NEW.tournament_id::text
  FROM public.tournament_registrations r
  WHERE r.tournament_id = NEW.tournament_id;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.notify_room_published() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notify_room_published ON public.rooms;
CREATE TRIGGER trg_notify_room_published AFTER INSERT OR UPDATE ON public.rooms
FOR EACH ROW EXECUTE FUNCTION public.notify_room_published();

-- Tournaments: notify registered players when status changes to live or cancelled
CREATE OR REPLACE FUNCTION public.notify_tournament_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _title text; _body text; _type text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  IF NEW.status::text = 'live' THEN
    _title := '✅ Tournament approved';
    _body := NEW.title || ' is now live. Get ready!';
    _type := 'tournament';
  ELSIF NEW.status::text = 'cancelled' THEN
    _title := '❌ Tournament cancelled';
    _body := NEW.title || ' has been cancelled. Entry fees are refunded.';
    _type := 'tournament';
  ELSE
    RETURN NEW;
  END IF;
  INSERT INTO public.notifications (user_id, title, body, type, link)
  SELECT r.user_id, _title, _body, _type::notification_type, '/tournaments/' || NEW.id::text
  FROM public.tournament_registrations r
  WHERE r.tournament_id = NEW.id;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.notify_tournament_status() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notify_tournament_status ON public.tournaments;
CREATE TRIGGER trg_notify_tournament_status AFTER UPDATE ON public.tournaments
FOR EACH ROW EXECUTE FUNCTION public.notify_tournament_status();
