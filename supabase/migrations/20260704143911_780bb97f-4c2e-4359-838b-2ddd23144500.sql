
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.user_status AS ENUM ('active', 'suspended', 'banned');
CREATE TYPE public.tournament_type AS ENUM ('br_solo', 'br_duo', 'br_squad', 'cs_squad');
CREATE TYPE public.tournament_status AS ENUM ('upcoming', 'live', 'completed', 'cancelled');
CREATE TYPE public.tx_type AS ENUM ('deposit', 'withdraw', 'entry_fee', 'prize', 'refund', 'adjustment');
CREATE TYPE public.tx_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.notif_type AS ENUM ('info', 'success', 'warning', 'error', 'tournament', 'wallet');

-- ============ UPDATED_AT HELPER ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  uid TEXT UNIQUE NOT NULL DEFAULT ('MAMU' || upper(substring(replace(gen_random_uuid()::text,'-','') from 1 for 8))),
  email TEXT,
  full_name TEXT,
  game_name TEXT,
  game_uid TEXT,
  phone TEXT,
  avatar_url TEXT,
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','moderator'));
$$;

-- ============ WALLETS ============
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  locked NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (locked >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_wallets_updated BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type tx_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  status tx_status NOT NULL DEFAULT 'completed',
  reference TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_wtx_user ON public.wallet_transactions(user_id, created_at DESC);
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.deposit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL,
  txn_id TEXT,
  proof_url TEXT,
  status request_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dep_user ON public.deposit_requests(user_id, created_at DESC);
CREATE INDEX idx_dep_status ON public.deposit_requests(status);
GRANT SELECT, INSERT ON public.deposit_requests TO authenticated;
GRANT ALL ON public.deposit_requests TO service_role;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.withdraw_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL,
  account_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status request_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_wd_user ON public.withdraw_requests(user_id, created_at DESC);
CREATE INDEX idx_wd_status ON public.withdraw_requests(status);
GRANT SELECT, INSERT ON public.withdraw_requests TO authenticated;
GRANT ALL ON public.withdraw_requests TO service_role;
ALTER TABLE public.withdraw_requests ENABLE ROW LEVEL SECURITY;

-- ============ TOURNAMENTS ============
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type tournament_type NOT NULL,
  map TEXT,
  mode TEXT,
  entry_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  prize_pool NUMERIC(12,2) NOT NULL DEFAULT 0,
  per_kill_prize NUMERIC(12,2) DEFAULT 0,
  max_slots INTEGER NOT NULL CHECK (max_slots > 0),
  filled_slots INTEGER NOT NULL DEFAULT 0,
  banner_url TEXT,
  rules TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  registration_deadline TIMESTAMPTZ,
  status tournament_status NOT NULL DEFAULT 'upcoming',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tour_status ON public.tournaments(status, start_time);
GRANT SELECT ON public.tournaments TO anon, authenticated;
GRANT ALL ON public.tournaments TO service_role;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_tour_updated BEFORE UPDATE ON public.tournaments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID UNIQUE NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL,
  room_password TEXT NOT NULL,
  reveal_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_rooms_updated BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_name TEXT,
  players JSONB NOT NULL DEFAULT '[]'::jsonb,
  slot_number INTEGER,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, user_id)
);
CREATE INDEX idx_reg_tour ON public.tournament_registrations(tournament_id);
CREATE INDEX idx_reg_user ON public.tournament_registrations(user_id);
GRANT SELECT, INSERT ON public.tournament_registrations TO authenticated;
GRANT ALL ON public.tournament_registrations TO service_role;
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position INTEGER,
  kills INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  prize NUMERIC(12,2) NOT NULL DEFAULT 0,
  mvp BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mr_tour ON public.match_results(tournament_id);
CREATE INDEX idx_mr_user ON public.match_results(user_id);
GRANT SELECT ON public.match_results TO anon, authenticated;
GRANT ALL ON public.match_results TO service_role;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  prize NUMERIC(12,2) NOT NULL,
  image_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_win_tour ON public.winners(tournament_id);
GRANT SELECT ON public.winners TO anon, authenticated;
GRANT ALL ON public.winners TO service_role;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type notif_type NOT NULL DEFAULT 'info',
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- ============ SUPPORT ============
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  admin_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ticket_user ON public.support_tickets(user_id, created_at DESC);
GRANT SELECT, INSERT ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_ticket_updated BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SETTINGS & LOGS ============
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_log_created ON public.activity_logs(created_at DESC);
GRANT SELECT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============ LEADERBOARD VIEW ============
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  p.id AS user_id,
  p.uid,
  COALESCE(p.game_name, p.full_name, 'Player') AS name,
  p.avatar_url,
  COUNT(DISTINCT mr.tournament_id) AS matches,
  COALESCE(SUM(mr.kills),0)::int AS kills,
  COALESCE(SUM(CASE WHEN mr.position = 1 THEN 1 ELSE 0 END),0)::int AS wins,
  COALESCE(SUM(CASE WHEN mr.mvp THEN 1 ELSE 0 END),0)::int AS mvps,
  COALESCE(SUM(mr.points),0)::int AS points,
  COALESCE(SUM(mr.prize),0) AS total_prize
FROM public.profiles p
LEFT JOIN public.match_results mr ON mr.user_id = p.id
GROUP BY p.id, p.uid, p.game_name, p.full_name, p.avatar_url;

GRANT SELECT ON public.leaderboard TO anon, authenticated;

-- ============ RLS POLICIES ============
-- profiles
CREATE POLICY "profiles_select_all_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_staff_update" ON public.profiles FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

-- user_roles
CREATE POLICY "roles_select_own_or_staff" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- wallets
CREATE POLICY "wallets_select_own_or_staff" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- wallet_transactions
CREATE POLICY "wtx_select_own_or_staff" ON public.wallet_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- deposit_requests
CREATE POLICY "dep_select_own_or_staff" ON public.deposit_requests FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "dep_insert_own" ON public.deposit_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- withdraw_requests
CREATE POLICY "wd_select_own_or_staff" ON public.withdraw_requests FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "wd_insert_own" ON public.withdraw_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- tournaments
CREATE POLICY "tour_public_read" ON public.tournaments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "tour_staff_write" ON public.tournaments FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- rooms: only registered users after reveal_at, or staff
CREATE POLICY "rooms_registered_after_reveal" ON public.rooms FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid()) OR (
    reveal_at <= now() AND EXISTS (
      SELECT 1 FROM public.tournament_registrations tr
      WHERE tr.tournament_id = rooms.tournament_id AND tr.user_id = auth.uid()
    )
  )
);

-- tournament_registrations
CREATE POLICY "reg_select_own_or_staff" ON public.tournament_registrations FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "reg_insert_own" ON public.tournament_registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- match_results / winners / announcements are public read
CREATE POLICY "mr_public_read" ON public.match_results FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "mr_staff_write" ON public.match_results FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "win_public_read" ON public.winners FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "win_staff_write" ON public.winners FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "ann_public_read" ON public.announcements FOR SELECT TO anon, authenticated USING (is_active OR public.is_staff(auth.uid()));
CREATE POLICY "ann_staff_write" ON public.announcements FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- notifications
CREATE POLICY "notif_select_own" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "notif_update_own" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- support tickets
CREATE POLICY "ticket_select_own_or_staff" ON public.support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "ticket_insert_own" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ticket_staff_update" ON public.support_tickets FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

-- settings
CREATE POLICY "settings_public_read" ON public.settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings_admin_write" ON public.settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- activity logs (staff read only)
CREATE POLICY "logs_staff_read" ON public.activity_logs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- ============ AUTO-CREATE PROFILE + WALLET + ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.wallets (user_id) VALUES (NEW.id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SLOT COUNTER TRIGGER ============
CREATE OR REPLACE FUNCTION public.bump_filled_slots()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tournaments SET filled_slots = filled_slots + 1 WHERE id = NEW.tournament_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tournaments SET filled_slots = GREATEST(0, filled_slots - 1) WHERE id = OLD.tournament_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER trg_slot_count
  AFTER INSERT OR DELETE ON public.tournament_registrations
  FOR EACH ROW EXECUTE FUNCTION public.bump_filled_slots();

-- ============ REGISTRATION RPC (deducts wallet + registers atomically) ============
CREATE OR REPLACE FUNCTION public.register_for_tournament(_tour_id UUID, _team_name TEXT DEFAULT NULL, _players JSONB DEFAULT '[]'::jsonb)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid UUID := auth.uid();
  _t RECORD;
  _wallet RECORD;
  _reg_id UUID;
  _new_bal NUMERIC(12,2);
  _slot INTEGER;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO _t FROM public.tournaments WHERE id = _tour_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'tournament_not_found'; END IF;
  IF _t.status <> 'upcoming' THEN RAISE EXCEPTION 'registration_closed'; END IF;
  IF _t.filled_slots >= _t.max_slots THEN RAISE EXCEPTION 'tournament_full'; END IF;
  IF EXISTS (SELECT 1 FROM public.tournament_registrations WHERE tournament_id = _tour_id AND user_id = _uid) THEN
    RAISE EXCEPTION 'already_registered';
  END IF;

  SELECT * INTO _wallet FROM public.wallets WHERE user_id = _uid FOR UPDATE;
  IF _wallet.balance < _t.entry_fee THEN RAISE EXCEPTION 'insufficient_balance'; END IF;

  _new_bal := _wallet.balance - _t.entry_fee;
  UPDATE public.wallets SET balance = _new_bal WHERE user_id = _uid;

  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, status, reference, note)
  VALUES (_uid, 'entry_fee', -_t.entry_fee, _new_bal, 'completed', _tour_id::text, 'Tournament entry: ' || _t.title);

  _slot := _t.filled_slots + 1;
  INSERT INTO public.tournament_registrations (tournament_id, user_id, team_name, players, slot_number, paid_amount)
  VALUES (_tour_id, _uid, _team_name, _players, _slot, _t.entry_fee)
  RETURNING id INTO _reg_id;

  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (_uid, 'Registered!', 'You are in for ' || _t.title, 'tournament', '/tournaments/' || _t.id::text);

  RETURN _reg_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.register_for_tournament(UUID, TEXT, JSONB) TO authenticated;

-- ============ DEFAULT SETTINGS ============
INSERT INTO public.settings (key, value) VALUES
  ('site', '{"name":"MAMU HUB","tagline":"Compete. Win. Dominate.","currency":"₹","support_email":"support@mamuhub.gg"}'::jsonb),
  ('payment', '{"upi_id":"mamuhub@upi","min_deposit":50,"min_withdraw":100}'::jsonb),
  ('social', '{"discord":"","telegram":"","youtube":"","instagram":""}'::jsonb);
