# Website Estu Karya

Website katalog dan pemesanan Estu Karya (Ceper, Klaten, sejak 1986). Situs statis Astro: setiap barang punya halaman sendiri untuk SEO, keranjang tersimpan di browser, dan pesanan dikirim lewat WhatsApp.

## Mengubah data barang

Semua barang ada di `src/data/produk.csv`. Satu baris adalah satu barang.

| Kolom | Isi |
|---|---|
| `id` | alamat halaman, huruf kecil dan tanda hubung, misalnya `cangkul-dpu` |
| `segmen` | `perkakas` atau `bekas` |
| `kategori` | nama kelompok di filter, misalnya `Sabit dan parang` |
| `nama` | nama barang |
| `harga` | angka tanpa titik, misalnya `65000`. Kosongkan untuk "Tanya harga" |
| `satuan` | `buah`, `unit`, `kodi`, dan sebagainya |
| `harga_grosir`, `min_grosir` | harga grosir dan jumlah minimalnya (boleh kosong) |
| `stok` | `tersedia`, `tanya`, `habis`, `dipesan`, atau `terjual` |
| `kondisi` | `baru` atau `bekas` |
| `foto` | nama file di `public/foto/produk/`, pisahkan dengan `;`. Boleh juga link `https://...` |
| `ringkas` | satu kalimat untuk kartu dan hasil Google |
| `deskripsi` | penjelasan lengkap |
| `spesifikasi` | `Ukuran: 37 x 15 cm; Bahan: baja` |
| `tampil` | `ya`, `tidak`, atau `contoh` (contoh hanya muncul saat dicoba di laptop) |

### Pakai Google Sheet

1. Buat Google Sheet dengan kolom yang sama persis (salin baris pertama `produk.csv`).
2. File, Bagikan, Publikasikan ke web, pilih sheet, format CSV, lalu Publikasikan. Salin link-nya.
3. Di Cloudflare Pages, tambahkan variabel lingkungan `PRODUK_CSV_URL` berisi link tadi.
4. Website membaca sheet setiap kali di-build. Untuk memperbarui, tekan "Retry deployment" di Cloudflare, atau pasang Deploy Hook yang dijalankan terjadwal.

## Data toko

Nomor WhatsApp, alamat, jam buka, dan link marketplace ada di `src/data/toko.json`.

## Menjalankan di laptop

```bash
npm install
npm run dev
```

Buka http://localhost:4321. Untuk versi produksi: `npm run build`, hasilnya di folder `dist/`.

## Tayang di Cloudflare Pages

GitHub Pages tidak boleh dipakai untuk toko online, jadi website ini di-host di Cloudflare Pages (gratis, boleh untuk usaha).

1. Masuk ke dash.cloudflare.com, buka Workers & Pages, Create, Pages, Connect to Git.
2. Pilih repo ini. Framework preset: Astro. Build command: `npm run build`. Output: `dist`.
3. Setelah tayang di `estukarya.pages.dev`, sambungkan domain `estukarya.id` lewat Custom domains, lalu ganti `site` di `astro.config.mjs` dan alamat sitemap di `public/robots.txt`.

## Foto

Foto lama berasal dari arsip website estukarya.com (2013 sampai 2016) dan disiapkan dengan `../siapkan_foto.py`. Ganti dengan foto baru yang terang dan tajam begitu tersedia: ukuran sekitar 1000 px, rasio 4:3.
