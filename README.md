# Komik Lab 📚✨

Aplikasi Android (dan iOS) untuk **membuat komik secara automatik**.
Tulis satu idea cerita, pilih genre dan gaya lukisan, dan app akan:

1. **Menulis skrip** — Claude cipta tajuk, watak (dengan rupa yang konsisten), babak, dialog, kapsyen dan kesan bunyi.
2. **Melukis setiap panel** — guna penjana gambar pilihan anda.
3. **Menyusun halaman komik** — panel, belon dialog, kotak kapsyen dan SFX diletak secara automatik.
4. **Sunting & kongsi** — ketik panel untuk ubah dialog atau lukis semula, kemudian kongsi sebagai gambar PNG.

Dialog boleh dalam **Bahasa Melayu** atau **English**.

---

## 📱 Pasang di telefon Android (APK)

App ini dibina menjadi fail APK menggunakan **Expo EAS Build** (percuma, build dibuat di awan Expo).
Anda perlukan komputer (Windows / Mac / Linux) sekali sahaja untuk memulakan build.

### 1. Sediakan (sekali sahaja)

1. Pasang **Node.js LTS** dari <https://nodejs.org>.
2. Daftar akaun Expo percuma di <https://expo.dev/signup>.
3. Muat turun kod dan pasang pakej:

   ```bash
   git clone -b claude/auto-comic-maker-app-t3uljd https://github.com/azunor82-coder/komik-lab-v3.git
   cd komik-lab-v3
   npm install
   ```

4. Log masuk ke Expo:

   ```bash
   npx eas-cli@latest login
   ```

### 2. Bina APK

```bash
npm run build:apk
```

(Sama dengan `npx eas-cli@latest build --platform android --profile preview`.)

Kali pertama, EAS akan bertanya beberapa soalan — jawab **Yes** untuk semuanya:

- *Create an EAS project?* → **Yes** (ini menambah `projectId` ke `app.json`; commit perubahan itu)
- *Generate a new Android Keystore?* → **Yes** (Expo simpan kunci tandatangan app anda dengan selamat)

Build mengambil masa lebih kurang **10–20 minit**. Bila siap, EAS beri **pautan dan kod QR**.

### 3. Pasang di telefon

1. Buka pautan itu di telefon Android (atau imbas kod QR) dan muat turun fail `.apk`.
2. Buka fail itu. Jika diminta, benarkan **"Pasang apl tidak diketahui"** untuk pelayar / pengurus fail anda.
3. Buka **Komik Lab**.

### 4. Masukkan kunci API

1. Dapatkan kunci API Anthropic di <https://console.anthropic.com/settings/keys> (akaun perlu ada kredit).
2. Dalam app, ketik **⚙️** di laman utama → **Kunci API Anthropic** → tampal kunci → **Simpan**.
   App akan menguji kunci itu dahulu.
3. (Pilihan) Masukkan kunci OpenAI jika mahu guna penjana gambar OpenAI.

Kunci disimpan dengan selamat dalam telefon (Android Keystore) dan hanya dihantar terus kepada Anthropic / OpenAI.
**Tiada pelayan diperlukan.** Tanpa kunci, app berjalan dalam **mod demo** (cerita & lukisan contoh).

> 💡 Tiada komputer? Expo juga boleh bina dari GitHub terus melalui laman expo.dev (bahagian *GitHub* dalam projek),
> tetapi projek EAS perlu dicipta dahulu (langkah `eas init` / build pertama di atas).

---

## Ciri-ciri

- 10 genre (Komedi, Aksi, Fantasi, Seram Ringan, …) dan 8 gaya lukisan (Kartun, Manga, Komik Amerika, Webtoon, Cat Air, Noir, Retro, Animasi 3D)
- 4, 6 atau 8 panel, dengan panel lebar automatik untuk babak pembukaan/klimaks
- 3 penjana gambar yang boleh dipilih dalam app:

  | Penjana | Kunci API | Nota |
  | --- | --- | --- |
  | 🌼 Pollinations | Tiada | Percuma, kadang-kadang perlahan / terhad |
  | 🖼️ OpenAI Image | Kunci OpenAI | Kualiti tertinggi, berbayar |
  | ✏️ Claude Lukis SVG | Kunci Anthropic | Gaya vektor ringkas, watak paling konsisten |

- Belon dialog jenis cakap 💬, fikir 💭, jerit 📢 dan bisik 🤫
- Koleksi komik disimpan dalam telefon (gambar disimpan sebagai fail, boleh dibuka luar talian)
- Penjanaan diteruskan walaupun anda tukar skrin; disambung semula jika app ditutup

## Cara ia berfungsi

App boleh menjana komik dalam tiga mod (lihat skrin ⚙️ Tetapan):

| Mod | Bila | Bagaimana |
| --- | --- | --- |
| 📱 **Kunci dalam telefon** | Kunci Anthropic disimpan dalam Tetapan | Telefon terus memanggil Claude / OpenAI / Pollinations |
| 🖥️ **Pelayan** | Mod pembangunan (`npm start`) atau build dengan `EXPO_PUBLIC_API_URL` | Telefon memanggil API routes Expo; kunci di pelayan |
| 🎭 **Demo** | Tiada kunci dan tiada pelayan | Cerita dan lukisan contoh terbina dalam |

Logik penjanaan (prompt Claude, penjana gambar, demo, pembersihan skrip) berada dalam `src/core/` dan dikongsi oleh
telefon dan pelayan.

## Pembangunan

Keperluan: Node.js 20+ dan app **Expo Go** di telefon (atau emulator Android).

```bash
npm install
cp .env.example .env      # pilihan: kunci untuk mod pelayan
npm start                 # imbas kod QR dengan Expo Go (telefon & komputer dalam Wi-Fi yang sama)
```

- Tekan `a` untuk emulator Android atau `w` untuk pratonton di pelayar.
- Dalam mod pembangunan, tanpa kunci dalam Tetapan, app guna API routes pada pelayan Expo (kunci dari `.env`).

Pemeriksaan:

```bash
npm run typecheck
npm run lint
```

## Mod pelayan (pilihan — jika app dikongsi dengan orang lain)

Jika anda mahu orang lain guna app tanpa memasukkan kunci sendiri, simpan kunci di pelayan:

```bash
npm run build:server            # npx expo export --platform web
npx eas-cli@latest deploy --prod   # EAS Hosting
# atau hos sendiri: ANTHROPIC_API_KEY=... PORT=3000 npm run serve
```

Kemudian bina app dengan `EXPO_PUBLIC_API_URL=https://pelayan-anda...` (letak dalam bahagian `env` profil build di
`eas.json`). Untuk menghalang orang lain guna pelayan anda, tetapkan `APP_ACCESS_TOKEN` di pelayan dan nilai yang
sama sebagai `EXPO_PUBLIC_APP_TOKEN` dalam build. Semua pembolehubah ada dalam [`.env.example`](.env.example).

Nota tentang Claude: model lalai `claude-opus-5-5`. Skrip dijana dengan *structured outputs* (JSON yang disahkan
oleh skema) pada effort `medium`; lukisan SVG pada effort `low` supaya setiap panel lebih pantas (ubah di
`src/core/claude.ts`). *Server-side fallback* (`fallbacks: "default"`) diaktifkan supaya permintaan yang ditolak
oleh pengelas keselamatan dicuba semula secara automatik pada model sandaran.

## Struktur projek

```
src/
  app/                    Skrin (Expo Router)
    index.tsx             Laman utama + koleksi komik
    create.tsx            Borang komik baru
    comic/[id].tsx        Paparan komik, kemajuan, kongsi, padam
    settings.tsx          Kunci API & mod semasa
    api/                  API routes (mod pelayan)
  components/             Halaman komik, panel, belon dialog, editor panel, UI
  core/                   Logik penjanaan dikongsi: Claude, penjana gambar, demo, skema
  lib/                    Kod app: storan, tetapan, pemilih mod, penjana, kongsi
  server/                 Kod pelayan sahaja: konfigurasi env, pengesahan, HTTP
metro.config.js           Guna binaan CommonJS SDK Anthropic (elak ralat import bulat)
eas.json                  Profil EAS Build (preview = APK)
server.js                 Pelayan Node untuk hos sendiri
```

## Had yang diketahui

- Belum diuji pada telefon sebenar dengan kunci API sebenar — sila laporkan jika ada masalah.
- iPhone memerlukan akaun Apple Developer (USD 99/tahun) untuk dipasang.
- Versi web hanya untuk pratonton: storan pelayar kecil, dan kunci disimpan dalam storan pelayar biasa.
- Pollinations ialah perkhidmatan percuma pihak ketiga — kadang-kadang lambat, terhad atau berubah. Jika gagal, ketik panel untuk cuba lagi atau tukar penjana.
- Kedudukan belon dialog berdasarkan arahan kepada AI (penutur kiri → belon kiri); tidak selalu tepat. Gunakan editor panel untuk ubah kedudukan.
