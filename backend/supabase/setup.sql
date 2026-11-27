-- Jalankan sekali di Supabase: SQL Editor > New query > tempel semua > Run.
-- Aman dijalankan ulang (memakai IF NOT EXISTS / ON CONFLICT).

-- 1) Riwayat pengukuran: satu baris per kanal per kiriman dari ESP32.
create table if not exists public.pengukuran (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  channel     smallint    not null check (channel between 1 and 4),
  voltage_v   real        not null,
  current_a   real        not null,
  power_w     real        not null
);
create index if not exists pengukuran_created_at_idx
  on public.pengukuran (created_at desc);

-- 2) Status terakhir perangkat: selalu hanya satu baris (id = 1).
create table if not exists public.status_perangkat (
  id         smallint primary key default 1 check (id = 1),
  last_seen  timestamptz not null default now(),
  led_on     boolean     not null default false,
  rssi       integer,
  uptime_s   bigint
);

-- 3) Perintah dari admin. 'led' dipakai untuk prototipe;
--    relay1..relay4 disiapkan untuk versi final.
create table if not exists public.perintah (
  target      text primary key,
  nilai       boolean     not null default false,
  updated_at  timestamptz not null default now()
);

insert into public.perintah (target, nilai) values
  ('led', false),
  ('relay1', false),
  ('relay2', false),
  ('relay3', false),
  ('relay4', false)
on conflict (target) do nothing;

-- 4) Keamanan: nyalakan Row Level Security TANPA policy apa pun.
--    Artinya kunci publik (publishable/anon) tidak bisa membaca atau menulis.
--    Hanya server Vercel (memakai secret key) yang bisa mengakses tabel ini.
alter table public.pengukuran       enable row level security;
alter table public.status_perangkat enable row level security;
alter table public.perintah         enable row level security;

-- Opsional: hapus data lama (jalankan manual kapan perlu, mis. tiap minggu).
-- delete from public.pengukuran where created_at < now() - interval '7 days';
