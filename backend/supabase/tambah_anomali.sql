-- Jalankan SEKALI di Supabase > SQL Editor (setelah setup.sql).
-- Tabel hasil deteksi anomali. Ditulis oleh skrip Python di laptop, dibaca dashboard lewat /api/pengukuran.

create table if not exists public.anomali (
  channel    smallint primary key check (channel between 1 and 4),
  label      text not null check (label in ('normal', 'anomali')),
  skor       real,                       -- makin kecil (negatif) = makin tidak biasa
  updated_at timestamptz not null default now()
);

-- Kunci pengamanan yang sama dengan tabel lain: RLS aktif tanpa policy,
-- jadi hanya kunci secret (server / skrip laptop) yang bisa mengakses.
alter table public.anomali enable row level security;
