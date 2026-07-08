
-- Fix SECURITY DEFINER views: switch to security_invoker so RLS runs as the querying user
ALTER VIEW public.public_profiles SET (security_invoker = true);
ALTER VIEW public.leaderboard SET (security_invoker = true);

-- Revoke EXECUTE from anon/public on SECURITY DEFINER RPCs that must require sign-in.
-- These functions internally require auth.uid(), but should not be callable by anon at all.
REVOKE EXECUTE ON FUNCTION public.approve_withdrawal(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_withdrawal(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.publish_tournament_results(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_withdrawal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_withdrawal(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_tournament_results(uuid, jsonb) TO authenticated;

-- Restrict payment-config storage bucket reads to authenticated users only.
DROP POLICY IF EXISTS "pc_public_read" ON storage.objects;
CREATE POLICY "pc_authenticated_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'payment-config');
