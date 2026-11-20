# Komik Lab 📚✨

Aplikasi mudah alih (Android & iOS) untuk **membuat komik secara automatik**.
Tulis satu idea cerita, pilih genre dan gaya lukisan, dan app akan:

1. **Menulis skrip** — Claude cipta tajuk, watak (dengan rupa yang konsisten), babak, dialog, kapsyen dan kesan bunyi.
2. **Melukis setiap panel** — guna penjana gambar pilihan anda.
3. **Menyusun halaman komik** — panel, belon dialog, kotak kapsyen dan SFX diletak secara automatik.
4. **Sunting & kongsi** — ketik panel untuk ubah dialog atau lukis semula, kemudian kongsi sebagai gambar PNG.

Dialog boleh dalam **Bahasa Melayu** atau **English**.

## Ciri-ciri

- 10 genre (Komedi, Aksi, Fantasi, Seram Ringan, …) dan 8 gaya lukisan (Kartun, Manga, Komik Amerika, Webtoon, Cat Air, Noir, Retro, Animasi 3D)
- 4, 6 atau 8 panel, dengan panel lebar automatik untuk babak pembukaan/klimaks
- 3 penjana gambar yang boleh dipilih dalam app:

  | Penjana | Kunci API | Nota |
  | --- | --- | --- |
  | 🌼 Pollinations | Tiada | Percuma, kadang-kadang perlahan / terhad |
  | 🖼️ OpenAI Image | `OPENAI_API_KEY` | Kualiti tertinggi, berbayar |
  | ✏️ Claude Lukis SVG | `ANTHROPIC_API_KEY` | Gaya vektor ringkas, watak paling konsisten |

- Belon dialog jenis cakap 💬, fikir 💭, jerit 📢 dan bisik 🤫
- Koleksi komik disimpan dalam telefon (gambar disimpan sebagai fail, boleh dibuka luar talian)
- Penjanaan diteruskan walaupun anda tukar skrin; disambung semula jika app ditutup
- **Mod demo**: tanpa sebarang kunci API, app tetap boleh dicuba dengan cerita & lukisan contoh

## Cara ia berfungsi

```
 Telefon (Expo / React Native)                Pelayan (Expo Router API routes)
 ┌───────────────────────────┐   POST /api/script        ┌──────────────────────────┐
 │ Borang idea → Komik baru  │ ───────────────────────▶ │ Claude: skrip berstruktur │
 │                           │   POST /api/panel-image   │ Pollinations / OpenAI /   │
 │ Halaman komik + editor    │ ───────────────────────▶ │ Claude SVG: gambar panel  │
 └───────────────────────────┘                           └──────────────────────────┘
```

Kunci API **hanya** disimpan di pelayan — tidak pernah dimasukkan ke dalam app telefon.

## Mula (pembangunan)

Keperluan: Node.js 20+ dan app **Expo Go** di telefon (atau emulator Android / simulator iOS).

```bash
npm install
cp .env.example .env      # isi ANTHROPIC_API_KEY (dan OPENAI_API_KEY jika mahu)
npm start                 # imbas kod QR dengan Expo Go (telefon & komputer dalam Wi-Fi yang sama)
```

- Tekan `a` untuk emulator Android, `i` untuk simulator iOS, atau `w` untuk pratonton di pelayar.
- Dalam mod pembangunan, API routes dijalankan oleh pelayan Expo yang sama, jadi app terus berfungsi.
- Tanpa `ANTHROPIC_API_KEY`, app berjalan dalam **mod demo**.

### Pemeriksaan

```bash
npm run typecheck
npm run lint
```

## Deploy (production)

App telefon perlukan pelayan awam untuk API routes.

### Pilihan A — EAS Hosting

```bash
npm run build:server            # npx expo export --platform web
npx eas-cli@latest deploy --prod
```

Tetapkan `ANTHROPIC_API_KEY` (dan kunci lain) sebagai pembolehubah persekitaran projek di EAS, kemudian deploy semula.

### Pilihan B — Pelayan Node sendiri (Render, Railway, VPS, …)

```bash
npm run build:server
ANTHROPIC_API_KEY=... PORT=3000 npm run serve
```

### Build app telefon

Beritahu app di mana pelayan anda dengan `EXPO_PUBLIC_API_URL` semasa build, contohnya:

```bash
EXPO_PUBLIC_API_URL=https://pelayan-anda.example.com npx eas-cli@latest build -p android --profile preview
```

(Atau letak `EXPO_PUBLIC_API_URL` dalam bahagian `env` profil build di `eas.json`.)

### Lindungi pelayan anda

Tanpa perlindungan, sesiapa yang tahu alamat pelayan boleh guna kredit API anda. Tetapkan nilai rahsia yang sama di:

- pelayan: `APP_ACCESS_TOKEN=...`
- build app: `EXPO_PUBLIC_APP_TOKEN=...`

Ini menghalang penyalahgunaan biasa (token masih boleh diekstrak daripada app, jadi pantau penggunaan API anda juga).

## Konfigurasi

Lihat [`.env.example`](.env.example) untuk semua pembolehubah. Yang utama:

| Pembolehubah | Kegunaan |
| --- | --- |
| `ANTHROPIC_API_KEY` | Menulis skrip & melukis SVG (wajib untuk komik sebenar) |
| `OPENAI_API_KEY` | Penjana gambar OpenAI |
| `CLAUDE_MODEL` | Model Claude (lalai `claude-opus-5-5`) |
| `DEMO_MODE=1` | Paksa mod demo |
| `EXPO_PUBLIC_API_URL` | Alamat pelayan untuk build telefon |

Nota tentang Claude: skrip dijana dengan *structured outputs* (JSON yang disahkan oleh skema), effort `medium`;
lukisan SVG guna effort `low` supaya setiap panel lebih pantas (ubah di `src/server/claude.ts`).
*Server-side fallback* (`fallbacks: "default"`) diaktifkan supaya permintaan yang ditolak oleh pengelas keselamatan
dicuba semula secara automatik pada model sandaran.

## Struktur projek

```
src/
  app/                    Skrin (Expo Router)
    index.tsx             Laman utama + koleksi komik
    create.tsx            Borang komik baru
    comic/[id].tsx        Paparan komik, kemajuan, kongsi, padam
    api/                  API routes (berjalan di pelayan)
      script+api.ts       Jana skrip dengan Claude
      panel-image+api.ts  Jana gambar panel
      status+api.ts       Kunci mana yang tersedia / mod demo
  components/
    comic/                Halaman komik, panel, belon dialog, kapsyen, SFX
    PanelEditor.tsx       Editor panel
    ui.tsx                Butang, cip, notis
  lib/                    Kod app: jenis data, storan, penjana, API klien
  server/                 Kod pelayan sahaja: Claude, penjana gambar, demo, pengesahan
server.js                 Pelayan Node untuk hos sendiri
```

## Had yang diketahui

- Versi web hanya untuk pratonton: storan pelayar kecil, jadi komik dengan banyak gambar mungkin tidak disimpan.
- Pollinations ialah perkhidmatan percuma pihak ketiga — kadang-kadang lambat, terhad atau berubah. Jika gagal, ketik panel untuk cuba lagi atau tukar penjana.
- Kedudukan belon dialog berdasarkan arahan kepada AI (penutur kiri → belon kiri); tidak selalu tepat. Gunakan editor panel untuk ubah kedudukan.
