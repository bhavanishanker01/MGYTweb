-- 1. Grant execute on is_staff function to anonymous users so that public announcements read works without error
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO anon, authenticated;

-- 2. Insert missing payment settings
INSERT INTO public.settings (key, value) VALUES
  ('payment', '{"upi_id":"mamuhub@upi","min_deposit":50,"min_withdraw":100}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
