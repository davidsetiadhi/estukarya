// Product data: read from a published Google Sheet (CSV) when PRODUK_CSV_URL is set at
// build time, otherwise from src/data/produk.csv. Both use the same columns.
import toko from '../data/toko.json';
import csvLokal from '../data/produk.csv?raw';

export { toko };

/** Prefix a site path with the deploy base ("/" on Cloudflare, "/estukarya/" on GitHub Pages). */
export const u = (path) => import.meta.env.BASE_URL.replace(/\/$/, '') + path;

/** Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, CRLF). */
export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((v) => v.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v.trim() !== '')) rows.push(row);
  const [head, ...body] = rows;
  const keys = head.map((h) => h.trim());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}

const angka = (v) => {
  const n = Number(String(v).replace(/[^\d]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

function normalize(r) {
  return {
    id: r.id,
    segmen: r.segmen === 'bekas' ? 'bekas' : 'perkakas',
    kategori: r.kategori || 'Lainnya',
    nama: r.nama,
    harga: angka(r.harga),
    satuan: r.satuan || 'buah',
    hargaGrosir: angka(r.harga_grosir),
    minGrosir: angka(r.min_grosir),
    stok: r.stok || 'tanya', // tersedia | tanya | habis | dipesan | terjual
    kondisi: r.kondisi || (r.segmen === 'bekas' ? 'bekas' : 'baru'),
    foto: (r.foto || '').split(';').map((f) => f.trim()).filter(Boolean).map((f) => (f.startsWith('http') ? f : u(`/foto/produk/${f}`))),
    ringkas: r.ringkas,
    deskripsi: r.deskripsi,
    spesifikasi: (r.spesifikasi || '')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const i = s.indexOf(':');
        return i > 0 ? [s.slice(0, i).trim(), s.slice(i + 1).trim()] : ['', s];
      }),
    contoh: r.tampil === 'contoh',
    tampil: r.tampil !== 'tidak',
  };
}

let cache;
export async function semuaProduk() {
  if (cache) return cache;
  const url = import.meta.env.PRODUK_CSV_URL || process.env.PRODUK_CSV_URL;
  let text;
  if (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Gagal mengambil data produk dari Google Sheet (HTTP ${res.status}).`);
    text = await res.text();
  } else {
    text = csvLokal;
  }
  const rows = parseCSV(text).filter((r) => r.id && r.nama).map(normalize);
  // Sample rows ("tampil: contoh") only appear in local development.
  cache = rows.filter((p) => p.tampil && (!p.contoh || import.meta.env.DEV));
  return cache;
}

export async function produkSegmen(segmen) {
  return (await semuaProduk()).filter((p) => p.segmen === segmen);
}

export const rupiah = (n) => 'Rp ' + n.toLocaleString('id-ID');

export const urlProduk = (p) => u(`/${p.segmen === 'bekas' ? 'barang-bekas' : 'perkakas'}/${p.id}/`);

export function waLink(pesan) {
  return `https://wa.me/${toko.whatsapp}?text=${encodeURIComponent(pesan)}`;
}

export const STATUS = {
  tersedia: 'Tersedia',
  tanya: 'Cek stok via WhatsApp',
  habis: 'Stok habis',
  dipesan: 'Sedang dipesan',
  terjual: 'Terjual',
};
