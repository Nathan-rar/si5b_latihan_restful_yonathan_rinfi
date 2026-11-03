# PAW Tugas 3 — MongoDB Atlas

Project API reservasi ruang rapat SI5B Topik 28. Tugas 3 melanjutkan REST API tugas sebelumnya dengan MongoDB melalui Mongoose.

## Persyaratan
- Node.js 24.x (`nvm use`)
- Akun MongoDB Atlas dan free cluster
- Network Access pada Atlas mengizinkan IP komputer
- Database user (username/password berbeda dari login Atlas)

## Menjalankan lokal

```bash
nvm use
npm install
cp .env.example .env.local
```

Edit `.env.local`, ganti placeholder `MONGODB_URI` dengan connection string Atlas. Pilih `Database > Connect > Drivers > Node.js`; ganti `<password>` dengan password database user, encode karakter khusus URL, dan pastikan nama database tercantum sebelum query string. Jangan commit `.env.local` atau tempel URI berisi credential di chat.

```bash
npm run dev
```

Server: `http://localhost:3000`. Tes: `npm test` (MongoDB sementara lokal via `mongodb-memory-server`, tidak perlu Atlas untuk unit test).

## Model hubungan
- `Customer` tersimpan dalam collection terpisah. Reservasi menyimpan `customerId` sebagai ObjectId reference (`ref: Customer`); detail endpoint menggunakan `populate`.
- Reservasi juga menyematkan snapshot `pemesan: { nama, email }`. Ini embedding; snapshot mempertahankan detail pemesan pada saat booking.
- `emailPemesan` opsional pada POST/PUT. Jika tidak diberikan, API membentuk alamat internal `reservasi.local` berdasarkan nama. Untuk identitas pelanggan yang konsisten, berikan email stabil.

## Endpoint utama dan query
`GET /meeting-reservations`

| Opsi | Query contoh |
|---|---|
| Filter ruang/tanggal/jam | `?ruang=Ruang%20Kenanga&tanggal=2026-11-10` |
| Cari nama atau ruang | `?q=Kenanga` |
| Filter nama | `?namaPemesan=PT%20Maju` |
| Pagination | `?page=2&limit=10` (limit maksimum 100) |
| Sorting | `?sort=-tanggal,ruang` (tanda `-` = descending) |
| Projection | `?fields=ruang,tanggal,pemesan.nama` |

Response daftar: `{ status, data, pagination: { page, limit, total, totalPages } }`. Sort/projection memakai allowlist field.

CRUD tetap tersedia pada `/meeting-reservations` dan `/meeting-reservations/:id`. ID detail adalah MongoDB ObjectId.

## Test
`npm test` menjalankan integrasi dengan MongoDB in-memory. `npm run test:postman` menjalankan Postman collection terhadap API lokal yang telah berjalan dan memakai `postman_environment.json`.

## Deploy
Set `MONGODB_URI` pada environment variable deployment (mis. Vercel) dan izinkan koneksi dari deployment di Atlas Network Access. Jangan taruh URI rahasia di source control. Test in-memory bukan pengganti tes koneksi ke Atlas.
