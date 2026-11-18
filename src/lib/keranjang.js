// Client-side cart. Items live in localStorage; checkout opens WhatsApp with the order text.
const KUNCI = 'estukarya-keranjang';
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const rp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

function baca() {
  try { return JSON.parse(localStorage.getItem(KUNCI)) || []; } catch { return []; }
}
function simpan(isi) {
  try { localStorage.setItem(KUNCI, JSON.stringify(isi)); } catch { /* private mode: cart lasts for this page only */ }
}

let isi = [];

function toast(teks) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.textContent = teks;
  document.body.append(t);
  setTimeout(() => t.remove(), 2200);
}

function render() {
  const total = isi.reduce((s, i) => s + i.jumlah, 0);
  document.querySelectorAll('[data-jumlah]').forEach((el) => (el.textContent = String(total)));
  const wadah = document.querySelector('[data-isi-keranjang]');
  if (!wadah) return;
  if (!isi.length) {
    wadah.innerHTML = '<p class="redup">Keranjang masih kosong. Pilih barang dari halaman Perkakas atau Barang bekas.</p>';
  } else {
    wadah.innerHTML = isi
      .map(
        (i, n) => `
      <div class="laci__item">
        ${i.foto ? `<img src="${esc(i.foto)}" alt="" width="64" height="64" />` : '<span></span>'}
        <div><b>${esc(i.nama)}</b><small>${i.harga ? rp(i.harga) + ' / ' + esc(i.satuan) : 'Harga ditanyakan'}</small></div>
        <div class="laci__jml">
          <button type="button" data-ubah="${n}" data-arah="-1" aria-label="Kurangi ${esc(i.nama)}">−</button>
          <span aria-live="polite">${i.jumlah}</span>
          <button type="button" data-ubah="${n}" data-arah="1" aria-label="Tambah ${esc(i.nama)}">+</button>
        </div>
      </div>`
      )
      .join('');
  }
  const terhitung = isi.filter((i) => i.harga);
  const el = document.querySelector('[data-total]');
  if (el) {
    const jumlah = terhitung.reduce((s, i) => s + i.harga * i.jumlah, 0);
    el.textContent = !isi.length ? '-' : terhitung.length === isi.length ? rp(jumlah) : terhitung.length ? rp(jumlah) + ' + barang tanya harga' : 'Ditanyakan ke admin';
  }
}

function tambah(produk, jumlah) {
  const ada = isi.find((i) => i.id === produk.id);
  if (ada) ada.jumlah += jumlah;
  else isi.push({ ...produk, jumlah });
  simpan(isi);
  render();
  toast(`${produk.nama} masuk keranjang`);
}

function bukaLaci(buka) {
  const laci = document.querySelector('[data-laci]');
  laci.classList.toggle('buka', buka);
  laci.setAttribute('aria-hidden', String(!buka));
  document.body.style.overflow = buka ? 'hidden' : '';
  if (buka) laci.querySelector('.laci__tutup').focus();
}

function pesanWA(nama, kota, catatan) {
  const baris = isi.map((i, n) => `${n + 1}. ${i.nama} x ${i.jumlah} ${i.satuan}${i.harga ? ` (${rp(i.harga)} / ${i.satuan})` : ''}`);
  const teks = [
    'Halo Estu Karya, saya mau pesan:',
    ...baris,
    '',
    `Nama: ${nama}`,
    `Kota tujuan: ${kota}`,
    ...(catatan ? [`Catatan: ${catatan}`] : []),
    '',
    'Mohon info harga akhir, ongkir, dan cara bayarnya. Terima kasih.',
  ].join('\n');
  return `https://wa.me/${window.ESTU_WA}?text=${encodeURIComponent(teks)}`;
}

export function pasangKeranjang() {
  isi = baca();
  render();

  document.addEventListener('click', (e) => {
    const t = e.target.closest('button, a');
    if (!t) return;
    if (t.matches('[data-buka-keranjang]')) bukaLaci(true);
    else if (t.matches('[data-tutup-keranjang]')) bukaLaci(false);
    else if (t.matches('[data-ubah]')) {
      const n = Number(t.dataset.ubah);
      isi[n].jumlah += Number(t.dataset.arah);
      if (isi[n].jumlah <= 0) isi.splice(n, 1);
      simpan(isi);
      render();
    } else if (t.matches('[data-tambah]')) {
      const produk = JSON.parse(t.dataset.tambah);
      const input = document.querySelector(t.dataset.jumlahDari || '#__tidak-ada');
      const jumlah = Math.max(1, parseInt(input?.value || '1', 10) || 1);
      tambah(produk, jumlah);
      if (t.hasAttribute('data-langsung')) bukaLaci(true);
    }
  });
  document.querySelector('[data-tutup-keranjang].laci__latar')?.addEventListener('click', () => bukaLaci(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') bukaLaci(false);
  });

  const form = document.querySelector('[data-form-pesan]');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const galat = form.querySelector('[data-galat]');
    const nama = form.nama.value.trim();
    const kota = form.kota.value.trim();
    const salah = !isi.length ? 'Keranjang masih kosong. Tambahkan barang dulu.' : !nama ? 'Isi nama dulu.' : !kota ? 'Isi kota tujuan pengiriman dulu.' : '';
    galat.hidden = !salah;
    galat.textContent = salah;
    if (salah) {
      (!nama ? form.nama : form.kota).focus();
      return;
    }
    window.open(pesanWA(nama, kota, form.catatan.value.trim()), '_blank', 'noopener');
  });
  form?.addEventListener('input', () => {
    const galat = form.querySelector('[data-galat]');
    galat.hidden = true;
  });

  // Product page: quantity stepper and gallery
  document.querySelectorAll('[data-langkah]').forEach((b) =>
    b.addEventListener('click', () => {
      const input = document.querySelector(b.dataset.target);
      input.value = String(Math.max(1, (parseInt(input.value, 10) || 1) + Number(b.dataset.langkah)));
    })
  );
  document.querySelectorAll('[data-galeri-pilih]').forEach((b) =>
    b.addEventListener('click', () => {
      document.querySelector('[data-galeri-utama]').src = b.dataset.galeriPilih;
      document.querySelectorAll('[data-galeri-pilih]').forEach((x) => x.setAttribute('aria-current', String(x === b)));
    })
  );

  // Catalog filter and search
  const daftar = document.querySelector('[data-katalog]');
  if (daftar) {
    const kartu = [...daftar.querySelectorAll('[data-kategori]')];
    const cari = document.querySelector('[data-cari]');
    const tombol = [...document.querySelectorAll('[data-filter]')];
    const kosong = document.querySelector('[data-tidak-ketemu]');
    let kat = 'semua';
    const terapkan = () => {
      const q = (cari?.value || '').toLowerCase().trim();
      let tampil = 0;
      kartu.forEach((k) => {
        const cocok = (kat === 'semua' || k.dataset.kategori === kat) && (!q || k.dataset.cari.includes(q));
        k.hidden = !cocok;
        if (cocok) tampil++;
      });
      if (kosong) kosong.hidden = tampil > 0;
    };
    tombol.forEach((b) =>
      b.addEventListener('click', () => {
        kat = b.dataset.filter;
        tombol.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        terapkan();
      })
    );
    cari?.addEventListener('input', terapkan);
  }
}
