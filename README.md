[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Aethervanguard/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Aethervanguard/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Coast Cover Studio

Ubah foto + caption menjadi cover art gaya GTA 6 — langsung di browser, tanpa jaringan.

## Cara kerja

- Unggah foto, tulis caption, lalu render menjadi poster cover art bergaya GTA 6:
  halftone, 5 gradasi warna, outline tebal, arsir (hatching), langit gradasi,
  dan tekstur kertas.
- **6 layout** cover dan **5 grade** warna — pilih kombinasi yang paling pas
  untuk fotomu.
- Ekspor sebagai PNG siap posting:
  - `1080 × 1080` (feed persegi)
  - `1080 × 1350` (feed potret)
  - `1920 × 1080` (landscape / wallpaper)
- Sepenuhnya offline: semua pemrosesan berjalan lokal di browser, foto tidak
  diunggah ke server mana pun.

## Cara menjalankan

```bash
node serve.ts
```

Lalu buka [http://localhost:8080](http://localhost:8080) di browser.

Alternatif (mode headless / output file):

```bash
node main.ts
```

dengan `MAKEFUN_OUTPUT_DIR` diset ke folder tujuan render.

## Bounty

Dibangun untuk bounty make.fun
[gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01) — $250.

Referral: https://make.fun/r/6c5vqfqh (kode `6c5vqfqh`).

## Lisensi

Lihat [LICENSE](LICENSE).
