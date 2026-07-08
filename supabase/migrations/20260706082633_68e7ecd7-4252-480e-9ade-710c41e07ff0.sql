
CREATE OR REPLACE FUNCTION public.fanout_announcement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_active THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    SELECT p.id, NEW.title, NEW.body, 'info'::notif_type, '/notifications'
    FROM public.profiles p;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_tournament_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _title text; _body text; _type notif_type;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  IF NEW.status::text = 'live' THEN
    _title := '✅ Tournament approved';
    _body  := NEW.title || ' is now live. Get ready!';
    _type  := 'tournament'::notif_type;
  ELSIF NEW.status::text = 'cancelled' THEN
    _title := '❌ Tournament cancelled';
    _body  := NEW.title || ' has been cancelled. Entry fees are refunded.';
    _type  := 'tournament'::notif_type;
  ELSE
    RETURN NEW;
  END IF;
  INSERT INTO public.notifications (user_id, title, body, type, link)
  SELECT r.user_id, _title, _body, _type, '/tournaments/' || NEW.id::text
  FROM public.tournament_registrations r
  WHERE r.tournament_id = NEW.id;
  RETURN NEW;
END;
$$;
