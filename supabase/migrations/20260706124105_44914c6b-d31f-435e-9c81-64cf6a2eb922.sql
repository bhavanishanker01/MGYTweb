ALTER TABLE public.withdraw_requests
  ADD CONSTRAINT withdraw_requests_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;