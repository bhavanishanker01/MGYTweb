
-- Scope match_results reads to owner or staff
DROP POLICY IF EXISTS mr_auth_read ON public.match_results;
CREATE POLICY mr_own_or_staff_read ON public.match_results
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- Revoke anon EXECUTE on trigger function (not meant to be called via API)
REVOKE EXECUTE ON FUNCTION public.fill_winner_details() FROM PUBLIC, anon, authenticated;
