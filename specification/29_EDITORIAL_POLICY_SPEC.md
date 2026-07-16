# 29 — Editorial Policy Specification

Dokumen ini mendefinisikan **Editorial Object Classes**, sistem pengelasan tiga lapisan, sistem pemberat skor, dan peraturan resolusi sandaran (fallback) untuk Section Layout Engine.

---

## 1. Istilah Asas: Editorial Object

Adjung tidak mengurus "kandungan" semata-mata. Ia mengurus **Editorial Objects** — entiti yang mempunyai kelas, identiti, dan peranan editorial tersendiri.

Terdapat dua keluarga Editorial Object yang dipisahkan sepenuhnya:

---

### 1.1 Publication

Objek yang dihasilkan oleh penulis. Diterbitkan melalui proses editorial.

| Kelas | Keterangan |
|---|---|
| `Essay` | Tulisan panjang, berasaskan argumen atau analisis |
| `Note` | Catatan pendek, pemikiran ringkas, atau pemerhatian |

> Nota: Istilah `Article` tidak wujud dalam seni bina Adjung. Gunakan `Essay` atau `Note`.

---

### 1.2 Editorial Asset

Objek yang dipilih atau disediakan oleh editor manusia. Tidak melalui proses penerbitan penulis.

| Kelas | Keterangan |
|---|---|
| `Book` | Kulit buku atau rujukan bibliografi |
| `Image` | Gambar bersejarah, fotografi, atau ilustrasi |
| `Quote` | Petikan kata pilihan editorial (pull quote) |
| `QuranVerse` | Ayat Al-Quran dengan maklumat surah dan ayat |
| `Hadith` | Hadis dengan maklumat sumber dan darjat |
| `Timeline` | Garis masa peristiwa sejarah |
| `Map` | Peta geografi atau sejarah |
| `Manuscript` | Serpihan manuskrip atau dokumen arkib |

---

## 2. Pengelasan Editorial (3 Lapisan)

Pengelasan editorial berjalan secara berurutan, tidak dicampur dalam satu senarai rata. Setiap lapisan mempunyai skop dan tujuan yang berbeza.

```
Lapisan 1: Publication Type
    (Essay / Note)
         |
         v
Lapisan 2: Editorial State
    (Featured / Fresh / Classical / Archival)
         |
         v
Lapisan 3: Editorial Priority
    (Pinned / Breaking / Standard)
```

### 2.1 Lapisan 1 — Publication Type

Kelas asas objek editorial. Ditetapkan semasa penciptaan dan tidak berubah.

| Nilai | Keterangan |
|---|---|
| `Essay` | Penerbitan panjang berasaskan argumen |
| `Note` | Penerbitan pendek atau catatan ringkas |

### 2.2 Lapisan 2 — Editorial State

Keadaan editorial semasa penerbitan, boleh berubah dari masa ke masa.

| Nilai | Keterangan |
|---|---|
| `Featured` | Dipilih secara editorial sebagai kandungan menonjol |
| `Fresh` | Penerbitan baharu, masih dalam tempoh kesegaran |
| `Classical` | Penerbitan lama yang kekal relevan |
| `Archival` | Penerbitan yang diarkibkan, biasanya tidak dipaparkan di halaman utama |

### 2.3 Lapisan 3 — Editorial Priority

Keutamaan dalam persaingan slot, boleh diubah oleh editor pada bila-bila masa.

| Nilai | Keterangan |
|---|---|
| `Pinned` | Dikunci kepada slot tertentu oleh editor manusia — mengatasi semua skor automatik |
| `Breaking` | Kandungan mendesak yang diberi keutamaan segera |
| `Standard` | Keutamaan biasa, bersaing berdasarkan skor pemberat |

---

## 3. Contoh Pengelasan Lengkap

```
Publication Type:  Essay
Editorial State:   Featured
Editorial Priority: Pinned
```

Bermaksud: Ini adalah esei panjang, yang telah dipilih oleh editor sebagai menonjol, dan dikunci kepada slot tertentu.

---

## 4. Sistem Pemberat (Weighting System)

Skor akhir setiap penerbitan untuk persaingan slot engine dikira menggunakan formula berikut:

```
FinalScore = editorial_weight + manual_pin + ai_score + freshness + section_priority
```

### 4.1 Komponen Skor

| Komponen | Jenis | Keterangan |
|---|---|---|
| `editorial_weight` | float (0.0–1.0) | Pemberat editorial berdasarkan Editorial State |
| `manual_pin` | boolean boost | Jika `true`, skor mendapat tambahan mutlak yang mengatasi semua komponen lain |
| `ai_score` | float (0.0–1.0) | Relevansi dan kualiti dinilai oleh sistem AI (hanya sokongan, bukan autoriti) |
| `freshness` | float (0.0–1.0) | Nilai berkurangan secara beransur mengikut umur penerbitan |
| `section_priority` | float (0.0–1.0) | Pemberat khusus section — sesetengah section mengutamakan Classical lebih daripada Fresh |

### 4.2 Peraturan AI Score

- AI Score adalah **faktor sokongan**, bukan faktor penentu.
- Editor manusia melalui `manual_pin` sentiasa mengatasi AI Score.
- AI Score tidak boleh menyebabkan penerbitan `Archival` bersaing dengan penerbitan `Featured`.

### 4.3 Freshness Decay

Freshness dikira menggunakan kurva pelesapan beransur:

```
freshness = max(0, 1 - (age_in_hours / decay_threshold_hours))
```

Nilai `decay_threshold_hours` ditentukan oleh `refresh_policy.interval_hours` dalam Blueprint.

---

## 5. Fallback Resolution

Apabila slot engine tidak dapat menemui kandungan kelas pilihan, enjin mencari sandaran mengikut urutan berikut:

1. Cari kandungan `preferred_class` yang memenuhi syarat — jika ada, gunakan terus.
2. Cuba `fallback_classes[0]` — kelas sandaran pertama dalam senarai slot.
3. Jika masih tiada, cuba `fallback_classes[1]`, dan seterusnya.
4. Jika semua kelas sandaran habis, tandakan slot sebagai `collapsed` dan lakukan Spatial Reflow.

### 5.1 Contoh Urutan Fallback

```yaml
slot:
  slot_id: hero_left
  preferred_class: Essay
  fallback_classes:
    - Note
    - Book
```

Slot ini akan cuba mengisi dengan `Essay` dahulu. Jika tiada `Essay` tersedia, ia akan cuba `Note`. Jika `Note` juga tiada, ia akan cuba `Book`. Jika semuanya tiada, slot ditutup.

### 5.2 Peraturan Fallback Merentas Keluarga

Fallback boleh merentas keluarga (dari Publication kepada Editorial Asset) tetapi hanya jika slot tersebut dikonfigurasikan secara eksplisit untuk menerimanya. Slot yang hanya menerima Publication tidak boleh secara diam-diam mengisi Editorial Asset.

---

## 6. TypeScript Interfaces

```typescript
// --- Editorial Object Classes ---

type PublicationClass = 'Essay' | 'Note';

type EditorialAssetClass =
  | 'Book'
  | 'Image'
  | 'Quote'
  | 'QuranVerse'
  | 'Hadith'
  | 'Timeline'
  | 'Map'
  | 'Manuscript';

type EditorialObjectClass = PublicationClass | EditorialAssetClass;

// --- Editorial Classification (3 Lapisan) ---

type PublicationType = 'Essay' | 'Note';

type EditorialState = 'Featured' | 'Fresh' | 'Classical' | 'Archival';

type EditorialPriority = 'Pinned' | 'Breaking' | 'Standard';

interface EditorialClassification {
  publication_type: PublicationType;
  editorial_state: EditorialState;
  editorial_priority: EditorialPriority;
}

// --- Weighting ---

interface PublicationScore {
  editorial_weight: number;    // 0.0 - 1.0
  manual_pin: boolean;
  ai_score: number;            // 0.0 - 1.0
  freshness: number;           // 0.0 - 1.0
  section_priority: number;    // 0.0 - 1.0
  final_score: number;         // Jumlah akhir
}
```
