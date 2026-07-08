ALTER TABLE public.deposit_requests
  ADD CONSTRAINT deposit_requests_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;