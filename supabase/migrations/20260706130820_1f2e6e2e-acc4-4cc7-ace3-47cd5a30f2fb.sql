
-- 1) Notifications: drop null-owner read exposure
DROP POLICY IF EXISTS notif_select_own ON public.notifications;
CREATE POLICY notif_select_own ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2) distribute_prize: remove anon EXECUTE
REVOKE EXECUTE ON FUNCTION public.distribute_prize(uuid, uuid, int, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.distribute_prize(uuid, uuid, int, numeric) TO authenticated;
