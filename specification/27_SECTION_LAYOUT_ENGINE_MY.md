# Enjin Reka Letak Seksyen Adjung: Spesifikasi Tatabahasa Ruang

A Blueprint is a spatial grammar rather than a page template. It defines how editorial space behaves, not how a page looks. (Satu Blueprint ialah tatabahasa ruang berbanding templat halaman. Ia menetapkan bagaimana ruang editorial bertindak balas, bukannya bagaimana rupa bentuk halaman).

Dokumen ini berfungsi sebagai perlembagaan seni bina rasmi bagi enjin reka letak Seksyen Adjung, menetapkan model kandungan dwi-aliran (dual-stream), paip proses komposisi halaman, dan prinsip ritma, tatabahasa editorial, serta keupayaan slot.

---

## 1. Seni Bina Kandungan Dwi-Aliran (Dual-Stream Content Architecture)

Enjin reka letak tidak memilih semua aset di dalam sesuatu halaman secara automatik. Sebaliknya, ia berfungsi sebagai **Enjin Komposisi (Composition Engine)** yang menyatukan dua aliran kandungan yang bebas menjadi satu susun atur editorial yang tunggal:

1. **Aliran Penerbitan (Publication Stream)**: Aliran artikel, esei, dan nota ilmiah secara automatik yang dikawal oleh peraturan penarafan (ranking).
   - Penerbitan Kasar -> Paip Penerbitan -> **Takungan Penerbitan Muktamad** -> Slot Kawalan Enjin.
2. **Aliran Aset Editorial (Editorial Assets Stream)**: Aset yang dipilih secara manual oleh editor manusia.
   - Pilihan Manual -> **Takungan Editorial Terpelihara** -> Slot Editorial Terpelihara (Reserved Editorial Slots).

```
Aliran Penerbitan (Publication Stream)     Aliran Aset Editorial (Editorial Assets)
    (Penerbitan Kasar)                           (Pilihan Manual)
            │                                            │
            ▼                                            ▼
     [Paip Penerbitan]                    [Takungan Editorial Terpelihara]
            │                                            │
            ▼                                            ▼
[Takungan Penerbitan Muktamad]             [Slot Editorial Terpelihara]
            │                                            │
            └────────────────────┬───────────────────────┘
                                 ▼
                       [Enjin Komposisi]
                                 ▼
                         [Layout IR Akhir]
```

### Pembahagian Tanggungjawab
- **Editor Manusia** menentukan **apakah** kandungan aset editorial terpelihara tersebut (contohnya, Kulit Buku, Gambar Bersejarah, Ayat Al-Quran, Hadis, Petikan Kata, Nota Editorial, Garis Masa, Peta, atau Serpihan Manuskrip).
- **Enjin Komposisi** menentukan **di mana** aset-aset ini patut dipaparkan bagi mengekalkan tatabahasa ruang, keharmonian visual, dan ritma editorial. Enjin sekali-kali tidak boleh membuang, memadam, atau menggantikan aset terpelihara ini.

---

## 2. Belanjawan Komposisi (Composition Budget)

Setiap Blueprint Seksyen mesti menetapkan **Belanjawan Komposisi (Composition Budget)** yang mengawal imbangan antara slot kawalan enjin dan slot editorial terpelihara. Belanjawan ini boleh dikonfigurasikan mengikut Seksyen (contohnya, Edisi Malaysia, Jurnal Ilmiah, Majalah, atau Seksyen Sukan).

```yaml
blueprint:
  id: editorial_utama_3lajur
  composition_budget:
    engine_slots: 225
    reserved_editorial_slots: 25
```

---

## 3. Hierarki Konsep Gubahan (Hierarchy of Composition Concepts)

1. **Blueprint**: Aset konfigurasi utama yang mengandungi bilangan lajur grid, parameter Belanjawan Komposisi, peraturan Tatabahasa Ruang, dan strategi Ritma Editorial.
2. **Spatial Grammar (Tatabahasa Ruang)**: Peraturan struktur halaman yang tidak boleh dilanggar (contohnya, had jumlah hero, peraturan pengecualian tag, had kedudukan bersebelahan nota).
3. **Editorial Rhythm (Ritma Editorial)**: Enjin rentak dinamik yang memutuskan susunan jenis reka letak (contohnya, meletakkan petikan kata selepas artikel berat, atau menjarakkan kedudukan berita utama) berdasarkan metrik kandungan.
4. **Spatial Stanza (Stanza Ruang)**: Templat grid geometri berbilang baris (cth. Stanza Hero Kiri, Stanza Hero Kanan, Lajur Seimbang) yang dipilih untuk memenuhi turutan Ritma.
5. **Slot**: Tempat letak kandungan individu yang mewakili sama ada Slot Kawalan Enjin atau Slot Editorial Terpelihara.

---

## 4. Keupayaan Slot: Tindihan Slaid & Karusel (Slide Stacks & Carousels)

Untuk membolehkan paparan beberapa aset berkaitan tanpa menggunakan ruang grid yang terlalu besar, slot boleh menyokong mod **Karusel bertindan (Carousel Stack)**.

### Peraturan Karusel
- Sesuatu slot mesti dikonfigurasikan secara eksplisit di dalam skema Blueprint untuk membenarkan karusel (`carousel: true`).
- Slot karusel hanya menerima kelas kandungan yang setara sahaja (contohnya, tindihan Buku, atau tindihan Gambar Sejarah).
- Blueprint menetapkan had maksimum item (`max_items`) bagi tindihan tersebut untuk mengelakkan kekusutan visual.
- Output Layout IR akan menghantar tatasusunan (array) penerbitan atau aset di bawah slot tersebut, bukan sekadar objek tunggal.
- Komponen Penterjemah Visual React memaparkan tindihan tersebut sebagai panel slaid animasi dalam lingkungan koordinat slot yang tepat, menghalang sebarang anjakan reka letak (layout shift) pada CSS Grid.

---

## 5. Paip Proses Komposisi 10-Peringkat

Enjin memproses dan menyatukan kedua-dua takungan kandungan menjadi satu Perwakilan Perantaraan Reka Letak (Layout IR) yang berterusan.

```
[Takungan Penerbitan]                    [Takungan Editorial Terpelihara]
         │                                               │
         ▼                                               ▼
[Peringkat 1: Pengesahan (Validation)] (Tapis draf/data rosak)
         │
         ▼
[Peringkat 2: Kelayakan (Eligibility)] (Tapis seksyen & kebenaran)
         │
         ▼
[Peringkat 3: Pengelasan Editorial (Editorial Classification)] (Kumpul mengikut kelas)
         │
         ▼
[Peringkat 4: Polisi Editorial (Editorial Policy)] (Aplikasi wajaran & pin)
         │
         ▼
[Peringkat 5: Susunan (Ranking)] ──► Menghasilkan: Takungan Disusun
         │
         ▼
[Peringkat 6: Polisi Komposisi (Composition Policy)] (Semak belanjawan & tatabahasa)
         │
         ▼
[Peringkat 7: Penjanaan Ritma (Rhythm Generation)] (Jana turutan rentak slot enjin & terpelihara)
         │
         ▼
[Peringkat 8: Penjanaan Stanza (Stanza Generation)] (Pilih blok geometri yang sepadan dengan Ritma)
         │
         ▼
[Peringkat 9: Tugasan Slot & Kebolehsuaian (Slot Assignment & Adaptability)] (Tugasan; sandaran, saiz, ditutup)
         │
         ▼
[Peringkat 10: Penterjemahan Visual (Rendering)] ──► Menghasilkan: Layout IR untuk CSS Grid Berterusan
```

---

## 6. Kebolehsuaian Blueprint & Aliran Semula Ruang (Spatial Reflow)

Disebabkan grid ini dijana secara prosedur, pelarasan slot mengalir ke bahagian bawah secara dinamik:

1. **Kelas Sandaran (Fallback Class)**: Jika slot tidak menemui kandungan pilihan utamanya, ia akan mengambil kandungan kelas boleh diterima.
2. **Ubah Saiz Slot (Resize Slot)**: Jika kandungan sandaran digunakan, koordinat slot mengecil mengikut saiz semula jadi kandungan tersebut (contohnya, slot Buku mengecil daripada 4x4 kepada 3x2 apabila diisi oleh Esei).
3. **Kecilkan Slot (Collapse Slot)**: Jika tiada kandungan untuk slot pilihan, slot tersebut ditandakan sebagai ditutup/dikecilkan.
4. **Aliran Semula Ruang (Spatial Reflow)**: Apabila slot diubah saiz atau ditutup, enjin akan mengira semula anjakan baris (row offset) untuk semua stanza yang berikutnya, memastikan tiada ruang kosong yang ganjil terbentuk dalam halaman.
5. **Pemeliharaan Aset Terpelihara (Preservation of Reserved Assets)**: Enjin tidak boleh sekali-kali membuang, mengubah saiz, atau menggantikan Slot Editorial Terpelihara untuk menyelesaikan masalah kekurangan kandungan. Enjin mesti memelihara semua pilihan manusia.

---

## 7. Perwakilan Perantaraan Reka Letak (Layout Intermediate Representation / Layout IR)

Layout IR yang dihasilkan memetakan kedudukan slot ke koordinat grid. Sila perhatikan bagaimana tugasan yang membenarkan karusel mempunyai senarai kandungan di bawah kunci `publications`:

```json
{
  "blueprintId": "editorial_utama_3lajur",
  "device": "desktop",
  "totalSlots": 250,
  "compositionBudget": {
    "engineSlots": 225,
    "reservedEditorialSlots": 25
  },
  "assignments": [
    {
      "stanzaIndex": 0,
      "slotId": "hero_kiri",
      "slotType": "engine_controlled",
      "gridPosition": { "rowStart": 1, "colStart": 1 },
      "gridSpan": { "rowSpan": 2, "colSpan": 2 },
      "visualWeight": "critical",
      "publication": {
        "id": "pub-120",
        "title": "Pengenalan kepada Logik Islam",
        "contentType": "Essay"
      }
    },
    {
      "stanzaIndex": 0,
      "slotId": "carousel_books_01",
      "slotType": "engine_controlled",
      "gridPosition": { "rowStart": 1, "colStart": 3 },
      "gridSpan": { "rowSpan": 2, "colSpan": 1 },
      "visualWeight": "medium",
      "isCarousel": true,
      "publications": [
        {
          "id": "pub-book-01",
          "title": "Al-Ghazali Mengenai Logik",
          "contentType": "Book"
        },
        {
          "id": "pub-book-02",
          "title": "Ibnu Sina dan Tradisi Aristotelian",
          "contentType": "Book"
        }
      ]
    }
  ]
}
```

---

## 8. Langkah Seterusnya untuk Pelaksanaan

Langkah pembangunan seterusnya akan diteruskan dengan menyusun tiga dokumen spesifikasi utama:
1. **Spesifikasi Blueprint & Stanza**: Takrifan skema bagi reka letak stanza grid, Belanjawan Komposisi, dan fail ritma.
2. **Spesifikasi Polisi Editorial**: Mengurus peraturan pengelasan, susunan, dan kurasi kandungan.
3. **Spesifikasi Tatabahasa & Ritma Editorial**: Menetapkan had turutan, peraturan ritma kandungan, dan corak rentak visual.
