-- 1. payment_status enum
DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. payments table
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  screenshot_url text NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  processed_at timestamptz,
  processed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_user   ON public.payments(user_id);
CREATE INDEX idx_payments_tour   ON public.payments(tournament_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- 3. GRANTs (users own their rows; staff-only writes via RPC; no anon)
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

-- 4. RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own_or_staff" ON public.payments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE POLICY "payments_insert_own_pending" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- No UPDATE/DELETE policy — mutations flow through the RPCs below.

-- updated_at trigger
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Approve payment (staff only)
CREATE OR REPLACE FUNCTION public.approve_payment(_pid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _p RECORD;
  _t RECORD;
  _slot integer;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'not_authorized'; END IF;

  SELECT * INTO _p FROM public.payments WHERE id = _pid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment_not_found'; END IF;
  IF _p.status <> 'pending' THEN RAISE EXCEPTION 'already_processed'; END IF;

  SELECT * INTO _t FROM public.tournaments WHERE id = _p.tournament_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'tournament_not_found'; END IF;

  -- Register only if not already registered
  IF NOT EXISTS (
    SELECT 1 FROM public.tournament_registrations
    WHERE tournament_id = _p.tournament_id AND user_id = _p.user_id
  ) THEN
    IF _t.filled_slots >= _t.max_slots THEN RAISE EXCEPTION 'tournament_full'; END IF;
    _slot := _t.filled_slots + 1;
    INSERT INTO public.tournament_registrations
      (tournament_id, user_id, slot_number, paid_amount)
    VALUES (_p.tournament_id, _p.user_id, _slot, _p.amount);
  END IF;

  UPDATE public.payments
     SET status = 'approved',
         processed_at = now(),
         processed_by = auth.uid(),
         rejection_reason = NULL
   WHERE id = _pid;

  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (
    _p.user_id,
    'Payment approved',
    'Your payment has been approved. Registration confirmed for ' || _t.title || '.',
    'success',
    '/tournaments/' || _t.id::text
  );
END;
$$;

-- 6. Reject payment (staff only)
CREATE OR REPLACE FUNCTION public.reject_payment(_pid uuid, _reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _p RECORD; _t_title text;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'not_authorized'; END IF;

  SELECT * INTO _p FROM public.payments WHERE id = _pid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment_not_found'; END IF;
  IF _p.status <> 'pending' THEN RAISE EXCEPTION 'already_processed'; END IF;

  UPDATE public.payments
     SET status = 'rejected',
         processed_at = now(),
         processed_by = auth.uid(),
         rejection_reason = COALESCE(NULLIF(trim(_reason), ''), 'No reason provided')
   WHERE id = _pid;

  SELECT title INTO _t_title FROM public.tournaments WHERE id = _p.tournament_id;

  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (
    _p.user_id,
    'Payment rejected',
    'Your payment for ' || COALESCE(_t_title,'a tournament') || ' was rejected: ' ||
      COALESCE(NULLIF(trim(_reason), ''), 'No reason provided'),
    'wallet',
    '/payments'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_payment(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_payment(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_payment(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reject_payment(uuid, text) TO authenticated, service_role;

-- 7. Storage policies on the existing private 'payment-proofs' bucket
-- Users write to a folder named after their auth.uid()
CREATE POLICY "pp_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "pp_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "pp_select_staff" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND public.is_staff(auth.uid())
  );

-- 8. Storage policies on the existing 'payment-config' bucket (created via tool later; policies added here)
-- Public read for QR; staff writes only.
CREATE POLICY "pc_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'payment-config');

CREATE POLICY "pc_staff_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-config' AND public.is_staff(auth.uid()));

CREATE POLICY "pc_staff_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'payment-config' AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'payment-config' AND public.is_staff(auth.uid()));

CREATE POLICY "pc_staff_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'payment-config' AND public.is_staff(auth.uid()));

-- 9. Extend the existing 'payment' settings row with QR + instructions defaults
UPDATE public.settings
   SET value = value
             || jsonb_build_object(
                  'qr_url', COALESCE(value->>'qr_url', ''),
                  'instructions', COALESCE(value->>'instructions',
                    'Scan the QR or pay to the UPI ID above. After paying, upload a clear screenshot of the successful transaction. Your registration will be confirmed once an admin verifies the payment.')
                )
 WHERE key = 'payment';