
CREATE OR REPLACE FUNCTION public.fanout_announcement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    SELECT p.id, NEW.title, NEW.body, 'announcement', '/notifications'
    FROM public.profiles p;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fanout_announcement ON public.announcements;
CREATE TRIGGER trg_fanout_announcement
AFTER INSERT ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.fanout_announcement();
