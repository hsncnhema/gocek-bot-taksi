-- ================================================================
-- GÖCEK BOT TAKSİ — Supabase Setup
-- Supabase Dashboard → SQL Editor'da çalıştırın
-- ================================================================

-- ─── TABLOLAR ──────────────────────────────────────────────────

create table if not exists public.tekneler (
  id          text primary key,
  isim        text not null,
  kapasite    int  not null default 10,
  model       text not null,
  emoji       text not null default '⛵',
  durum       text not null default 'musait' check (durum in ('musait', 'mesgul', 'hizmetdisi')),
  yil         int,
  uzunluk     text,
  motor       text,
  hiz         text,
  yakit       text default 'Benzin',
  aciklama    text,
  ozellikler  text[] not null default '{}',
  renk        text not null default '#0D7EA0',
  glow        text,
  sira        int  not null default 0,
  created_at  timestamptz default now()
);

create table if not exists public.noktalar (
  id          text primary key,
  isim        text    not null,
  lat         float8  not null,
  lng         float8  not null,
  tip         text    not null default 'koy' check (tip in ('boarding', 'koy')),
  created_at  timestamptz default now()
);

-- ─── RLS ───────────────────────────────────────────────────────

alter table public.tekneler enable row level security;
alter table public.noktalar  enable row level security;

-- Herkes okuyabilir
create policy "Public read tekneler" on public.tekneler for select using (true);
create policy "Public read noktalar" on public.noktalar  for select using (true);

-- Anon yazabilir (Admin PIN UI koruyor)
create policy "Anon write tekneler" on public.tekneler for all using (true) with check (true);
create policy "Anon write noktalar" on public.noktalar  for all using (true) with check (true);

-- ─── SEED VERİSİ ───────────────────────────────────────────────

insert into public.tekneler
  (id, isim, kapasite, model, emoji, durum, yil, uzunluk, motor, hiz, yakit, aciklama, ozellikler, renk, glow, sira)
values
  ('bot1', 'Göcek I',   12, 'Ribeye 750',        '⛵',  'musait',    2019, '7.5m',  '150 HP Yamaha',  '35 knot', 'Benzin',
   'Göcek koylarını keşfetmek için ideal, konforlu ve hızlı tekne. Geniş güverte alanı ve yüzme platformu ile hem gölge sevenler hem de deniz tutkunları için mükemmel bir seçim.',
   array['Güneşlik','Deniz suyu','Yüzme merdiveni','Bluetooth müzik','Soğutma kutusu'],
   '#0D7EA0', 'rgba(13,126,160,0.5)', 1),

  ('bot2', 'Göcek II',  8,  'Ranieri 585',       '🚤', 'musait',    2021, '5.85m', '115 HP Mercury', '40 knot', 'Benzin',
   'Küçük gruplar için hız ve manevra kabiliyetiyle öne çıkan tekne. 2021 model filomuzun en yeni üyesi, konfor ve performansı bir arada sunuyor.',
   array['Yüksek hız','Müzik sistemi','Soğutma kutusu','Bimini gölgelik','Bluetooth'],
   '#00c6ff', 'rgba(0,198,255,0.5)', 2),

  ('bot3', 'Göcek III', 15, 'Lomac 700 TT',      '⛴️', 'mesgul',    2018, '7.0m',  '200 HP Suzuki',  '30 knot', 'Benzin',
   'Büyük gruplar için geniş güverte ve eksiksiz konfor. Filomuzun en büyük teknesi, 15 kişiye kadar rahatça seyahat imkânı sunar.',
   array['Büyük platform','Tam gölgelik','WC','Derin hacim','Bluetooth müzik','Soğutma kutusu'],
   '#f59e0b', 'rgba(245,158,11,0.4)', 3),

  ('bot4', 'Göcek IV',  10, 'Joker Coaster 580', '🛥️', 'hizmetdisi',2020, '5.8m',  '150 HP Honda',   '38 knot', 'Benzin',
   'Orta boy gruplar için çok yönlü ve dayanıklı tekne. Şu anda bakım sürecinde, yakında tekrar hizmetinizde.',
   array['Güneşlik','Soğutma kutusu','Yüzme merdiveni'],
   '#6b7280', 'rgba(107,114,128,0.2)', 4)
on conflict (id) do nothing;

insert into public.noktalar (id, isim, lat, lng, tip) values
  ('skopea',       'Skopea İskelesi',  36.7550, 28.9200, 'boarding'),
  ('mucev',        'Muçev İskelesi',   36.7620, 28.9350, 'boarding'),
  ('tersane',      'Tersane Koyu',     36.7850, 28.9100, 'koy'),
  ('akvaryum',     'Akvaryum Koyu',    36.7900, 28.8950, 'koy'),
  ('yassica',      'Yassıca Adası',    36.7750, 28.8800, 'koy'),
  ('gocek_adasi',  'Göcek Adası',      36.7680, 28.9050, 'koy'),
  ('domuz',        'Domuz Adası',      36.7720, 28.8700, 'koy'),
  ('boynuz',       'Boynuz Bükü',      36.7450, 28.8600, 'koy'),
  ('at_buku',      'At Bükü',          36.7380, 28.8750, 'koy'),
  ('hamam',        'Hamam Koyu',       36.8050, 28.8900, 'koy'),
  ('bedri',        'Bedri Rahmi Koyu', 36.7200, 28.9300, 'koy'),
  ('sarsala',      'Büyük Sarsala',    36.7150, 28.9500, 'koy'),
  ('kucuksarsala', 'Küçük Sarsala',    36.7180, 28.9650, 'koy'),
  ('buyukova',     'Büyükova Koyu',    36.7100, 28.9800, 'koy'),
  ('marti',        'Martı Koyu',       36.8100, 28.8750, 'koy'),
  ('binlik',       'Binlik Koyu',      36.8150, 28.8600, 'koy'),
  ('osmanaga',     'Osmanağa Koyu',    36.7600, 28.8500, 'koy'),
  ('ayten',        'Ayten Koyu',       36.7520, 28.8350, 'koy')
on conflict (id) do nothing;
