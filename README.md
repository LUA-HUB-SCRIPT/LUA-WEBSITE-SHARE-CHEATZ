# LUAHUB SHARE V5.0.0

Website statis untuk GitHub Pages + Supabase Edge Function sebagai API dan database.

## Isi project
- `index.html`, `style.css`, `app.js`: website.
- `config.js`: Project URL dan Publishable/anon key (public key saja).
- `supabase/schema.sql`: tabel, RLS, dan kuota harian.
- `supabase/functions/links/index.ts`: API GET link approved dan POST link baru.

## Catatan batas URL
Sesuai permintaan awal, URL lebih dari 20 karakter ditolak di frontend DAN server. Kebanyakan URL normal lebih panjang dari 20 karakter. Jika maksudmu minimal 20 karakter atau ingin batas yang lebih longgar, ubah `MAX_URL_LENGTH` di `config.js` dan konstanta `MAX_URL_LENGTH` di `supabase/functions/links/index.ts`.

## 1. Siapkan Supabase
1. Buka project Supabase: `https://supabase.com/dashboard/project/qwguqmdbakymestsguku`.
2. Masuk SQL Editor, buat query baru, lalu jalankan seluruh isi `supabase/schema.sql`.
3. Buka Project Settings → API. Salin **Project URL** dan **Publishable key** (atau legacy `anon` key).
4. Tempel key tersebut di `config.js` pada `SUPABASE_ANON_KEY`.
5. Jangan pernah menaruh Database Password, Secret key, atau `service_role` key di `config.js`, GitHub, atau kode browser.

## 2. Deploy Edge Function
Cara termudah: gunakan Supabase CLI dari komputer.
1. Install Supabase CLI dan login: `supabase login`.
2. Dari folder project, jalankan `supabase link --project-ref qwguqmdbakymestsguku`.
3. Set secrets (gunakan service_role key dari dashboard hanya di terminal lokal saat diminta; jangan commit):
   `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=PASTE_SERVICE_ROLE_KEY RATE_LIMIT_SECRET=BUAT_SECRET_RANDOM_PANJANG`
4. Deploy:
   `supabase functions deploy links`
5. Pastikan function `links` muncul di Dashboard → Edge Functions.

Jika perintah secrets dimasukkan satu per satu di terminal, jangan kirim nilai secret ke chat atau commit ke GitHub.

## 3. Publish ke GitHub Pages
1. Upload semua file website ke repository GitHub, termasuk folder `supabase`.
2. Pastikan `index.html`, `style.css`, `app.js`, dan `config.js` berada di root repository.
3. Repository → Settings → Pages → Deploy from a branch → pilih `main` dan `/ (root)`.
4. Tunggu GitHub Pages selesai deploy, lalu buka URL Pages.

## 4. Moderasi link
Semua kiriman baru berstatus `pending`, jadi belum terlihat publik.
Untuk menyetujui:
1. Supabase Dashboard → Table Editor → `link_submissions`.
2. Cari kiriman yang ingin ditampilkan.
3. Ubah kolom `status` dari `pending` menjadi `approved`.
Untuk menolak, ubah menjadi `rejected`.

## 5. Endpoint
- GET `https://qwguqmdbakymestsguku.supabase.co/functions/v1/links` — mengambil link approved.
- POST endpoint yang sama dengan JSON `{ "url": "https://..." }` — mengirim link.
- Header: `apikey: YOUR_PUBLISHABLE_OR_ANON_KEY`.

REST API `/rest/v1/` adalah endpoint PostgREST untuk tabel. Project ini menggunakan Edge Function `/functions/v1/links` supaya validasi dan kuota dilakukan di server.

## Keamanan dan batasan
- RLS aktif dan tabel tidak bisa diakses langsung oleh anon/authenticated.
- Secret/service role hanya disimpan sebagai Edge Function secret.
- Kuota harian dihitung server-side berdasarkan IP yang diterima function, lalu hanya hash bersalt yang disimpan.
- Batas IP bukan sistem anti-abuse sempurna: jaringan bersama dapat berbagi kuota, dan proxy tertentu bisa memengaruhi header IP.
- Tidak ada upload file. Form hanya menerima URL HTTP/HTTPS.
