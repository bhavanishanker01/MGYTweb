# MAMU HUB — Esports Platform

Production-ready esports tournament platform built on **TanStack Start + Lovable Cloud (Supabase)**.

## Features
- Auth: email/password, Google (via Lovable managed OAuth), password reset
- User dashboard, profile with avatar upload, wallet with deposits/withdrawals
- Tournament list & details (BR Solo/Duo/Squad, CS Squad), automatic slot counting via DB trigger
- Room ID / password unlocked automatically for registered players at `reveal_at`
- Realtime notifications (Supabase Realtime)
- Winners hall, live leaderboard (SQL view), support tickets
- Admin panel: create tournaments, upload room info, approve deposits/withdrawals, ban users, post winners (auto-credits wallet), publish announcements
- RLS on every table, 3 roles (admin, moderator, user) via `user_roles` + `has_role()`

## Stack
- TanStack Start (Vite) + React 19 + TypeScript
- Tailwind CSS v4, shadcn/ui, Framer Motion
- Lovable Cloud (PostgreSQL + Auth + Storage + Realtime)

## Run
The app is pre-connected to Lovable Cloud. Just click Preview.

## Making yourself an admin
After signing up, promote your account in Lovable Cloud → SQL:
```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'you@example.com'
ON CONFLICT DO NOTHING;
```

## Storage buckets
`avatars`, `payment-proofs`, `tournament-banners`, `winner-images`, `documents` — all private, exposed via RLS on `storage.objects` (public read for avatars/banners/winners; owner+staff read for proofs; staff only for documents).

## Route map
- `/` home · `/tournaments` · `/tournaments/:id` · `/winners` · `/leaderboard`
- `/auth` (login/register/forgot tabs) · `/reset-password`
- `/dashboard` · `/profile` · `/wallet` · `/registrations` · `/notifications` · `/support` (all auth-gated)
- `/admin` (staff-gated)
- `/faq` · `/privacy` · `/terms` · `/contact`

## Deploy
Click Publish in Lovable — the app deploys to Lovable's edge hosting with the Cloud backend already connected.
