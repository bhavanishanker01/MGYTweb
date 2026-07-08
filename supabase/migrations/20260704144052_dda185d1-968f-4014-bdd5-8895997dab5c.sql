
-- Public read for showcase buckets (bucket flag blocked, so grant via policy)
CREATE POLICY "public_view_showcase" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id IN ('avatars','tournament-banners','winner-images'));

-- Users manage their own avatars (path prefix = auth uid)
CREATE POLICY "users_upload_own_avatar" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users_update_own_avatar" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users_delete_own_avatar" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Staff manage banners and winner images
CREATE POLICY "staff_write_banners" ON storage.objects FOR ALL TO authenticated
USING (bucket_id IN ('tournament-banners','winner-images') AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id IN ('tournament-banners','winner-images') AND public.is_staff(auth.uid()));

-- Payment proofs: users upload own, users + staff read own/all
CREATE POLICY "users_upload_own_proof" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users_read_own_proof_or_staff" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'payment-proofs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff(auth.uid())));

-- Documents: staff only
CREATE POLICY "staff_docs" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'documents' AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id = 'documents' AND public.is_staff(auth.uid()));
