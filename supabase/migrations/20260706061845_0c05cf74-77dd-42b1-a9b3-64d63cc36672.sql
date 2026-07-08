CREATE POLICY "Staff can insert rooms" ON public.rooms
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update rooms" ON public.rooms
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete rooms" ON public.rooms
  FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));