# Buku Panduan Admin Happy Farmers: Volume 1 - Masuk & Dasbor

### 0. Daftar Isi
- [1. Kontrol Dokumen](#1-kontrol-dokumen)
- [2. Pendahuluan](#2-pendahuluan)
- [3. Memulai](#3-memulai)
- [4. Gambaran Umum Dasbor](#4-gambaran-umum-dasbor)
- [5. Fitur & Modul](#5-fitur--modul)
  - [Masuk & Orientasi](#modul-masuk--orientasi)
  - [Dasbor](#modul-dasbor)
- [6. Alur Kerja Modul](#6-alur-kerja-modul)
- [7. Matriks Peran & Akses](#7-matriks-peran--akses)
- [8. Pemecahan Masalah & FAQ](#8-pemecahan-masalah--faq)
- [9. Glosarium](#9-glosarium)

---

### 1. Kontrol Dokumen
| Versi | Tanggal | Penulis | Deskripsi |
|---------|------|--------|-------------|
| v1.0 | 2026-04-08 | System AI | Draf awal untuk modul Masuk Admin dan Dasbor pada antarmuka Next.js |

### 2. Pendahuluan
Selamat datang di buku panduan sistem Happy Farmers. Volume ini mencakup modul **Masuk (Login) dan Dasbor**. Panduan ini dirancang untuk memberikan langkah-langkah yang diperlukan bagi Administrator Sistem untuk masuk ke dalam sistem secara aman dan memantau metrik rantai pasokan pertanian, tingkat stok, serta tren pengadaan di tingkat makro. Pengelolaan **user**, **role**, **karyawan**, **profil perusahaan**, dan **tema** aplikasi dibahas di [Volume 11: Pengguna & Pengaturan](11_people_org_and_settings.md).

### 3. Memulai
Untuk mengakses sistem Happy Farmers, Anda harus memiliki akun Admin aktif yang disediakan.

1. Buka portal masuk (login) di `/login`.
2. Masukkan kredensial Anda. Kolom berikut wajib diisi:
   - **Email**: Email administratif yang terdaftar (contoh: admin@happyfarmer.com).
   - **Kata Sandi**: Kata sandi rahasia Anda.
3. Klik tombol **Masuk Sekarang**.

### 4. Gambaran Umum Dasbor
Dasbor utama berfungsi sebagai pusat intelijen untuk seluruh operasi Happy Farmers.

![Dasbor – Kondisi Awal Saat Dimuat](./assets/dashboard-initial.png)

Dasbor dibagi ke dalam beberapa zona analitik:
- Bilah Navigasi Utama (kiri)
- Statistik Cepat Bagian Atas (Total Petani, Pengepul, Total Pengadaan, Kuantitas Total)
- Analisis Tren (Grafik area & diagram lingkaran untuk Pengadaan)
- Varian Populer & Tingkat Inventaris Stok di Gudang Utama
- Data Operasional Lahan (Total Area, Pertanian Aktif)

---

### 5. Fitur & Modul

#### Modul: Masuk & Orientasi
- **Nama Fitur**: Autentikasi Staf Aman
- **Deskripsi**: Gerbang utama untuk memverifikasi hak akses administratif Anda ke dalam sistem Happy Farmers.
- **Panduan langkah demi langkah**:
  1. Buka portal web Happy Farmers pada browser Anda.
  2. Ketik **Email** Anda yang telah terdaftar pada kolom yang tersedia.
  3. Ketik **Kata Sandi** Anda. Anda dapat mengklik ikon Mata (Eye) di sebelah ujung kanan untuk menampilkan teks kata sandi.
  4. Klik tombol hijau bertuliskan **Masuk Sekarang**.
- **Input yang Dibutuhkan**: Format Email valid, Kata Sandi.
  - *Aturan Validasi 1*: Jika bidang dibiarkan kosong lalu formulir dikirim, sistem akan menampilkan peringatan: "Silakan lengkapi email dan kata sandi Anda."
  - *Aturan Validasi 2*: Jika server menolak akses akibat kredensial salah, akan muncul boks peringatan merah: "Login gagal. Silakan coba lagi."
- **Tangkapan Layar**:
  - ![Login – State Form Kosong](./assets/login-empty.png)
  - ![Login – Peringatan Validasi](./assets/login-error.png)

#### Modul: Dasbor
- **Nama Fitur**: Metrik & Tren Eksekutif
- **Deskripsi**: Agregasi data waktu nyata yang mencakup semua sektor pertanian, digunakan untuk mengambil keputusan logistik secara makro.
- **Panduan langkah demi langkah**:
  1. Setelah Anda berhasil masuk, halaman Dasbor akan dimuat secara otomatis.
  2. Apabila Anda merasa data stagnan dan ingin memperbaruinya, klik tombol **Perbarui Data** (ikon dua panah melingkar) di sudut kanan atas layar.
  3. Untuk mengubah interval rentang masa (waktu) pada grafik Tren Pengadaan, silakan klik tombol filter di atas grafik. Pilihannya meliputi **30 Hari**, **60 Hari**, atau **90 Hari**.
  4. Gulir halaman ke agak bawah ke bagian Indikator Progres untuk menemukan **Varian Populer** serta ketersediaan instan **Inventaris Stok** yang tersimpan di Gudang Utama.
  5. Untuk meminta bantuan sistem, Anda dapat berinteraksi dengan Asisten Kecerdasan Buatan (AI) lewat menekan tombol **Obrolan Melayang (Floating Chat)** yang terdapat di pojok layar.
- **UI Berbasis Peran**:
  > [!NOTE] Terlihat Oleh: Admin. Dikarenakan hak akses penuh Anda, angka finansial dan statistik pada Dasbor ini mencerminkan metrik di skala Global, tanpa batasan regional apa pun.
- **Perilaku Responsif**:
  > [!NOTE] Mobile: Jika diakses melalui layar kecil smartphone, tata letaknya akan memadat secara dinamis. Dari tampilan blok yang bersebelahan beralih ke wujud vertikal dalam satu lajur menurun.
- **Tangkapan Layar**:
  - ![Dasbor – Tampilan Default 30 Hari](./assets/dashboard-30days.png)
  - ![Dasbor – Pemilihan Filter Rentang Waktu 90 Hari](./assets/dashboard-90days.png)

---

### 6. Alur Kerja Modul

```mermaid
flowchart TD
    A(["Mulai: Pengguna membuka Halaman Login"]) --> B{"Kredensial Diinput?"}
    B -- Tidak --> C["Tampilkan Peringatan: 'Lengkapi email...'"]
    B -- Ya --> D["Server Memverifikasi Data"]
    D -- Gagal --> E["Tampilkan Pesan Error: 'Login gagal'"]
    D -- Sukses --> F(["➜ Modul Dasbor"])
    
    F --> G["Loading Spin: Menghubungkan ke Pusat Data"]
    G --> H["Peramban Memaparkan Widget & Grafik"]
    H --> I{"Interaksi Admin"}
    I -- Mengeklik Filter Waktu --> J["Sistem Menarik Data Metrik Baru"]
    I -- Mengeklik Tombol Refresh --> J
    J --> H
```

---

### 7. Matriks Peran & Akses
| Peran | Modul | Aksi yang Diizinkan |
|------|--------|-----------------|
| Admin | Login | Melakukan proses autentikasi sistem. |
| Admin | Dashboard | Memantau Matrik Global, Menyegarkan Endpoint API Data, Mengubah Interval Grafik Waktu (Filter). |

---

### 8. Pemecahan Masalah & FAQ
**T: Saya telah menekan "Masuk Sekarang" namun sistem memberikan notifikasi "Login gagal. Silakan coba lagi. Apa yang keliru?**
J: Periksalah kembali ketepatan ejaan alamat email administrator Anda. Pastikan tak ada spasi ekstra yang terselip. Mengingat fitur 'lupa sandi' otomatis sedang tidak aktif, bila kesalahan berulang Anda harus mengontak pihak Administrator IT atau DBA untuk dibantu mereset kata sandi.

**T: Animasi *loading* Dasbor saya berputar tak kunjung henti, disertai bacaan "Menghubungkan ke Pusat Data" (Connecting to Data Center).**
J: Normalnya hal tersebut mengindikasikan koneksi internet yang terputus atau server sedang mengalami *downtime* (masa pemeliharaan). Pertolongan pertamanya adalah coba *refresh* peramban (browser) Anda saat jaringan internet kondusif atau bisa dengan mengeklik tombol **Perbarui Data**.

---

### 9. Glosarium
| Istilah | Definisi |
|------|------------|
| **Varian** | Klasifikasi tipe lanjutan/sub-tipe spesifik dari suatu hasil komodifikasi pertanian (contoh perbedaannya: Cabai Merah Keriting *vs.* Cabai Rawit Merah). |
| **Pengadaan (Procurement)** | Proses dan prosedur pembelian serta pengepul komoditas pasca-panen milik para petani ke dalam ekosistem pasokan Happy Farmers. |
| **Operasional Lahan** | Total akumulasi ukuran seluruh petak pertanian, melingkupi jumlah kebun fungsional dan perluasan unit tanah miliknya (dalam Hektar). |

---
> ⚠️ **Outline correction needed**: Tidak diperlukan koreksi. Modul yang dijabarkan sudah ekuivalen seutuhnya dengan cetak biru kerangka.

*Daftar periksa kelengkapan per modul (tersertifikasi):*
- [x] Semua formulir dianalisis beserta *fields* dan validasinya
- [x] Alokasi screenshot ditempatkan di sekuens krusial
- [x] Bagian role-gated UI tertandai (Callout)
- [x] Skema Diagram Alur (Mermaid) terbikin rapi
- [x] Pertanyaan FAQ ditambahkan sesuai *rules* Kompleksitas
- [x] Fitur penaut antarmodul dalam kondisi siap
