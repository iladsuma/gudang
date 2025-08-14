# GudangCheckout - Sistem Rekapitulasi Pengiriman

Ini adalah aplikasi Next.js yang dirancang untuk membantu Anda melacak, memproses, dan membuat rekapitulasi pengiriman barang masuk.

## Alur Kerja Aplikasi

1.  **Tambah Pengiriman**: Di halaman utama ("Lacak Pengiriman"), gunakan tombol "Tambah Pengiriman" untuk memasukkan data barang masuk baru, termasuk nomor transaksi, ekspedisi, dan mengunggah file resi dalam format PDF.
2.  **Proses & Cetak**: Pilih satu atau beberapa pengiriman dari tabel, lalu klik tombol "Proses & Cetak Resi". Tindakan ini akan:
    *   Membuat satu file PDF gabungan yang berisi semua resi yang Anda pilih. Setiap resi akan diberi penanda (cth: "resi-sel-1") untuk memudahkan identifikasi.
    *   Memindahkan data pengiriman yang telah diproses dari tabel utama ke halaman "Riwayat".
3.  **Lihat Riwayat**: Buka halaman "Riwayat" untuk melihat semua pengiriman yang telah berhasil Anda proses.
4.  **Buat Faktur**: Di halaman "Faktur", Anda dapat membuat dokumen PDF ringkasan (faktur) berdasarkan data yang ada di riwayat.

## Menjalankan Aplikasi Secara Lokal

Untuk menjalankan aplikasi ini di komputer Anda, Anda memerlukan [Node.js](https://nodejs.org/) (versi 18 atau lebih baru).

1.  **Unduh Kode**: Pastikan Anda memiliki semua file aplikasi ini dalam satu folder.
2.  **Buka Terminal**: Buka terminal atau command prompt Anda dan navigasikan ke dalam folder proyek.
3.  **Install Dependencies**: Jalankan perintah berikut untuk menginstal semua paket yang diperlukan.
    ```bash
    npm install
    ```
4.  **Jalankan Server Pengembangan**: Setelah instalasi selesai, jalankan perintah berikut untuk memulai aplikasi.
    ```bash
    npm run dev
    ```
5.  **Buka di Browser**: Buka browser Anda dan kunjungi alamat `http://localhost:9002`. Aplikasi Anda seharusnya sudah berjalan.

### Akun Demo untuk Login
- **Username**: `admin` | **Password**: `admin`
- **Username**: `user` | **Password**: `user`
