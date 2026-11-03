# Tugas 1 — RESTful API Reservasi Ruang Rapat

**Mahasiswa:** Yonathan Rinfi  
**NIM:** 2428240101  
**Kelas:** SI5B  
**Nomor Topik:** 28  
**Topik:** Coworking Space — Reservasi Ruang Rapat

## Deskripsi

RESTful API murni menggunakan Express.js untuk mengelola data reservasi ruang rapat. Data disimpan dalam array di memori sesuai ketentuan tugas, tanpa database dan tanpa halaman HTML.

## Endpoint

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/` | Informasi API |
| GET | `/meeting-reservations` | Mengambil semua reservasi |
| GET | `/meeting-reservations/:id` | Mengambil reservasi berdasarkan ID |
| GET | `/meeting-reservations?tanggal=2026-10-05` | Filter berdasarkan tanggal |
| POST | `/meeting-reservations` | Menambah reservasi |
| PUT | `/meeting-reservations/:id` | Mengganti seluruh data reservasi |
| DELETE | `/meeting-reservations/:id` | Menghapus reservasi |

Field wajib untuk POST dan PUT: `namaPemesan` (string), `ruang` (string), `tanggal` (`YYYY-MM-DD`), `jamMulai` (`HH:mm`), dan `durasiJam` (angka positif).

Contoh request body:

```json
{
  "namaPemesan": "PT Maju Digital",
  "ruang": "Ruang Kenanga",
  "tanggal": "2026-10-05",
  "jamMulai": "13:00",
  "durasiJam": 2
}
```

## Persyaratan dan menjalankan secara lokal

Project menggunakan Node.js 24 LTS. File `.nvmrc` membantu memilih versi tersebut jika memakai nvm.

```bash
nvm use
npm install
npm run dev
```

Server lokal berjalan di `http://localhost:3000`.

## Pengujian

- Postman: koleksi `postman_collection.json` (11 request, 19 assertion; hasil terbaru 19/19 lulus).
- Thunder Client: `thunder-collection.json` berisi request validasi 400 dan endpoint 404. Import file tersebut ke VS Code.

## Tugas 3 — Integrasi MongoDB (2026-11)

- Mengganti penyimpanan array sementara dengan MongoDB + Mongoose.
- Menambahkan schema `Customer` dan `MeetingReservation`: reservasi menyimpan `customerId` reference dan snapshot embedded `pemesan`.
- Menambahkan filter, pagination, sorting, projection pada endpoint daftar.
- Menambahkan pengujian integrasi in-memory; koneksi Atlas asli memerlukan konfigurasi `MONGODB_URI`.
- Panduan: `README_TUGAS3.md`, `docs/SETUP_TUGAS3.md`.



Karena penyimpanan menggunakan array dalam memori, perubahan data dapat kembali ke data awal setelah proses serverless Vercel berhenti atau dimulai ulang. Ini sesuai catatan tugas dan bukan penyimpanan permanen.
