
-- 1. Fix set_updated_at search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- 2. Lock down function EXECUTE privileges
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bump_filled_slots() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.register_for_tournament(uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_for_tournament(uuid, text, jsonb) TO authenticated;

-- 3. Ensure leaderboard view runs as invoker (already set, reaffirm)
ALTER VIEW public.leaderboard SET (security_invoker = true);

-- 4. Profiles: own row + staff only
DROP POLICY IF EXISTS profiles_select_all_auth ON public.profiles;
CREATE POLICY profiles_select_own_or_staff ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_staff(auth.uid()));

-- 5. Restrict public-read tables to authenticated only
DROP POLICY IF EXISTS mr_public_read ON public.match_results;
CREATE POLICY mr_auth_read ON public.match_results
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS tour_public_read ON public.tournaments;
CREATE POLICY tour_auth_read ON public.tournaments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS win_public_read ON public.winners;
CREATE POLICY win_auth_read ON public.winners
  FOR SELECT TO authenticated USING (true);
