
-- Leaderboard: was returning nothing because the view honored per-user RLS
-- and had no grants. Switch to security_definer semantics and grant read.
ALTER VIEW public.leaderboard SET (security_invoker = false);
GRANT SELECT ON public.leaderboard TO anon, authenticated;

-- Public profile view (safe columns only). Used by Winners, and any page
-- that shows other players. Excludes email, phone, status.
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT id, uid, full_name, game_name, avatar_url
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;
