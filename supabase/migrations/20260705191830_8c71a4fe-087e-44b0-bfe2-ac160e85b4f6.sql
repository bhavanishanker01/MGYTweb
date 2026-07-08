DROP POLICY IF EXISTS settings_public_read ON public.settings;

CREATE POLICY settings_public_read_nonsensitive ON public.settings
  FOR SELECT
  TO anon, authenticated
  USING (key IN ('site', 'social'));

CREATE POLICY settings_auth_read_payment ON public.settings
  FOR SELECT
  TO authenticated
  USING (key = 'payment');