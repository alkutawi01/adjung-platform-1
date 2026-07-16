# 31 — Composition Engine Specification

Dokumen ini mendefinisikan reka bentuk teknikal dan mekanik operasi **Composition Engine** bagi Adjung. Ia menerangkan aliran data masuk, paip proses 10-peringkat secara terperinci, struktur kelas adaptasi, serta konsep **Composition Labs** untuk tujuan pengujian.

---

## 1. Operasi Teras Enjin

Composition Engine bertindak sebagai orkestrator yang menerima input kandungan mentah, memprosesnya melalui satu siri polisi, tatabahasa (grammar), dan ritma (rhythm), serta mengeluarkan satu representasi susun atur dalam bentuk **Layout IR**.

```
Input (Publications + Editorial Assets)
               │
               ▼
┌──────────────────────────────┐
│  Stage 1: Validation         │
├──────────────────────────────┤
│  Stage 2: Eligibility        │
├──────────────────────────────┤
│  Stage 3: Classification     │
├──────────────────────────────┤
│  Stage 4: Policy Application │
├──────────────────────────────┤
│  Stage 5: Ranking & Weighting│
├──────────────────────────────┤
│  Stage 6: Grammar Check      │
├──────────────────────────────┤
│  Stage 7: Rhythm Generation  │
├──────────────────────────────┤
│  Stage 8: Stanza Generation  │
├──────────────────────────────┤
│  Stage 9: Slot Assignment    │
├──────────────────────────────┤
│  Stage 10: Render & Reflow   │
└──────────────────────────────┘
               │
               ▼
     Layout IR (CSS Grid JSON)
```

---

## 2. Paip Proses 10-Peringkat (Technical Details)

### Stage 1: Validation
* **Input**: Semua Editorial Objects mentah dari pangkalan data.
* **Proses**: Menapis keluar draf, data yang rosak, objek tanpa pengecam unik, atau teks yang kosong.
* **Output**: Set Editorial Objects tervalidasi.

### Stage 2: Eligibility
* **Input**: Objek tervalidasi + Konteks Section (Blueprint).
* **Proses**: Menyemak kriteria kelayakan asas (cth. Bahasa dokumen, polisi privasi, status penerbitan 'Published', dan sekatan keahlian).
* **Output**: Kolum takungan yang layak untuk section semasa.

### Stage 3: Editorial Classification
* **Input**: Objek layak.
* **Proses**: Membaca metadata objek untuk menetapkan `EditorialClassification` (→ Spec 29). Mengenalpasti jenis objek (Essay vs Note), keadaan semasa (Featured/Fresh/Classical), dan priority (Pinned/Breaking/Standard).
* **Output**: Objek terklasifikasi.

### Stage 4: Editorial Policy
* **Input**: Objek terklasifikasi.
* **Proses**: Mengaplikasikan peraturan wajaran luaran dan ketetapan pin manual dari editor manusia. Mana-mana objek yang ditandakan sebagai `Pinned` dikhaskan untuk slot tertentu.
* **Output**: Struktur pemetaan pin manual dan arahan wajaran.

### Stage 5: Ranking
* **Input**: Objek terklasifikasi & arahan wajaran.
* **Proses**: Menghitung `FinalScore` menggunakan formula wajaran (→ Spec 29) yang merangkumi `editorial_weight`, `manual_pin`, `ai_score`, `freshness`, dan `section_priority`.
* **Output**: Dua senarai disusun (Sorted Pools):
  - `SortedPublicationPool` (diurutkan mengikut FinalScore menurun)
  - `ResolvedEditorialPool` (disusun berdasarkan aturan relevansi & keutamaan)

### Stage 6: Composition Policy (Grammar Check)
* **Input**: Sorted Pools + Konfigurasi Spatial Grammar dari Blueprint.
* **Proses**: Mengaktifkan enjin validator tatabahasa (→ Spec 30) untuk bersedia menerima dan mengesahkan jujukan stanza yang dicadangkan.
* **Output**: Validator bersedia dengan kekangan (constraints) aktif.

### Stage 7: Rhythm Generation
* **Input**: Sorted Pools + Blueprint Rhythm Strategy & Distribution.
* **Proses**: Menjalankan algoritma penjanaan ritma (→ Spec 30) bagi membina turutan stanza (`[StanzaDefinition]`). Sekiranya jujukan melanggar tatabahasa, ia akan ditolak dan dijana semula dengan kekangan tambahan secara iteratif.
* **Output**: Turutan jenis Stanza yang lulus tatabahasa (Grammar-validated Stanza Sequence).

### Stage 8: Stanza Generation
* **Input**: Stanza Sequence.
* **Proses**: Membina grid geometri kosong berdasarkan kolum CSS Grid Blueprint dan definisi tinggi (grid_rows) bagi setiap Stanza.
* **Output**: Grid Layout IR Kosong (Layout Skeleton).

### Stage 9: Slot Assignment & Adaptability
* **Input**: Layout Skeleton + Sorted Pools.
* **Proses**: Menugaskan Editorial Objects ke dalam slot yang sepadan. Jika objek dengan kelas pilihan (`preferred_class`) tiada, enjin akan memulakan proses adaptasi:
  1. Menggunakan kelas sandaran (`fallback_classes`).
  2. Melakukan pengecilan koordinat slot (`Resize Slot`) jika saiz sandaran lebih kecil.
  3. Menutup slot (`Collapse Slot`) jika tiada sandaran yang layak.
* **Output**: Draf tugasan slot dengan metadata adaptasi.

### Stage 10: Spatial Reflow & Rendering
* **Input**: Draf tugasan slot.
* **Proses**: Mengira semula anjakan baris (`row_start` offsets) bagi semua stanza di bawah slot-slot yang dikecilkan atau ditutup untuk mengelakkan lompang visual dalam CSS Grid. Mengeluarkan objek Layout IR yang lengkap.
* **Output**: Objek JSON `LayoutIR` muktamad.

---

## 3. Komponen Adaptasi dan Spatial Reflow

Apabila berlaku pengecilan (`Resize`) atau penutupan (`Collapse`) slot, enjin akan mengira semula row offset menggunakan logik iteratif:

```typescript
function applySpatialReflow(assignments: SlotAssignment[]): SlotAssignment[] {
  let rowOffset = 0;
  let currentStanzaIndex = -1;
  let stanzaRowAdjustment = 0;

  // Diurutkan mengikut stanza_index dan row_start
  const sorted = [...assignments].sort((a, b) => a.stanza_index - b.stanza_index);

  for (const assignment of sorted) {
    if (assignment.stanza_index !== currentStanzaIndex) {
      currentStanzaIndex = assignment.stanza_index;
      rowOffset += stanzaRowAdjustment;
      stanzaRowAdjustment = 0;
    }

    // Ubah posisi berdasarkan offset terkumpul
    assignment.grid_position.row_start += rowOffset;

    // Jika slot ditutup (collapsed), ia tidak menyumbang kepada ketinggian stanza
    if (assignment.adaptation === 'collapsed') {
      // Slot yang ditutup tidak menambah baris
      continue;
    }

    // Jika diubah saiz (resized), gunakan row_span yang diselaraskan
    const activeRowSpan = assignment.grid_span.row_span;
    stanzaRowAdjustment = Math.max(stanzaRowAdjustment, activeRowSpan);
  }

  return sorted;
}
```

---

## 4. Composition Labs

**Composition Labs** adalah kawasan/mod pengujian terisolasi yang membolehkan penyelidik, pereka layout, dan editor untuk mensimulasikan dan melihat hasil gubahan enjin sebelum ia diterapkan ke dalam production.

### 4.1 Keupayaan Utama Labs

1. **Simulasi Grammar & Rhythm**: Menguji perubahan peraturan Grammar atau nisbah Rhythm Distribution secara interaktif.
2. **Visualizer AI Score**: Memaparkan pengaruh `ai_score` terhadap kedudukan artikel dan menguji keseimbangan reka letak.
3. **Analisis Prestasi (Performance)**: Mengira masa pemprosesan penjanaan Layout IR untuk mengesan isu regresi atau kebocoran memori dalam enjin gelung (looping).
4. **Persekitaran Tanpa Kesan (Zero Side-Effects)**: Data simulasi tidak disimpan ke pangkalan data utama, membolehkan ujian tekanan (stress-test) dijalankan dengan selamat.

---

## 5. TypeScript Interfaces

```typescript
interface CompositionEngineConfig {
  enable_ai_influence: boolean;
  max_rhythm_generation_attempts: number;
  enable_reflow_logs: boolean;
}

interface CompositionLabsReport {
  generated_layout: LayoutIR;
  generation_time_ms: number;
  grammar_checks_count: number;
  grammar_violations_detected: number;
  reflow_adjustments_applied: number;
  ai_score_influence_ratio: number; // 0.0 - 1.0
}
```
