# OpsTask Pro

OpsTask Pro adalah aplikasi manajemen tugas dan operasional tingkat lanjut yang dirancang untuk meningkatkan produktivitas tim melalui pelacakan proyek yang komprehensif, sinkronisasi data, dan asisten AI terintegrasi.

## Fitur Utama

- Kanban Board
- Redmine Sync
- Timeline View
- Role-Based Access
- Dashboard Chart
- Cloe AI Chat

## Tech Stack

- Next.js
- Tailwind CSS
- PostgreSQL
- PM2

## Instalasi

### Production (VPS/VM)

1. Clone repositori:
   ```bash
   git clone <url-repo>
   cd opstask-pro
   ```
2. Install dependensi:
   ```bash
   npm install
   ```
3. Setup environment variables (lihat bagian Konfigurasi).
4. Build aplikasi:
   ```bash
   npm run build
   ```
5. Jalankan dengan PM2:
   ```bash
   pm2 start npm --name "opstask-pro" -- run start
   ```

### Development

1. Install dependensi:
   ```bash
   npm install
   ```
2. Setup environment variables (lihat bagian Konfigurasi).
3. Jalankan server development:
   ```bash
   npm run dev
   ```

## Konfigurasi

### Environment Variables

Salin file template environment ke file `.env` dan isi nilai yang dibutuhkan:

```bash
cp .env.example .env
```
Buka file `.env` dan sesuaikan nilai konfigurasi (koneksi PostgreSQL, API keys, dll) sebelum menjalankan aplikasi.
