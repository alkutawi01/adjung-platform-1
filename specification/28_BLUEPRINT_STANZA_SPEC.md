# 28 — Blueprint & Stanza Specification

Dokumen ini mendefinisikan skema penuh **Blueprint**, **Stanza**, dan **Slot** sebagai asas geometri dan identiti Section Layout Engine. Ia merupakan lanjutan langsung daripada perkara yang diputuskan dalam `27_SECTION_LAYOUT_ENGINE.md`.

---

## 1. Blueprint sebagai Identiti Section

Blueprint bukan sekadar fail konfigurasi geometri. Ia adalah **identiti lengkap sesebuah Section** — menetapkan segala-galanya daripada kolum grid hinggalah kepada kekerapan kandungan digilir semula, dan bilangan minimum penerbitan yang diperlukan sebelum section tersebut boleh dipaparkan kepada pembaca.

Setiap instance section yang berlainan (Frontpage, Malaysian Edition, Scholarly Journal, Magazine) mempunyai Blueprint tersendiri.

### 1.1 Contoh Perbandingan Blueprint

```
Frontpage
  grid_columns:              3
  engine_slots:              35
  reserved_editorial_slots:  5
  refresh_interval:          2 jam

Malaysian Edition
  grid_columns:              3
  engine_slots:              225
  reserved_editorial_slots:  25
  refresh_interval:          6 jam
```

---

## 2. Skema Blueprint (YAML)

```yaml
blueprint:
  id: string                        # Pengecam unik, cth. "frontpage_3col"
  label: string                     # Nama boleh-baca, cth. "Frontpage (3 Kolum)"
  description: string               # Penerangan ringkas tujuan section ini

  grid_columns: int                 # Bilangan kolum CSS Grid (cth. 3 atau 4)

  composition_budget:
    engine_slots: int               # Slot yang diurus oleh enjin secara automatik
    reserved_editorial_slots: int   # Slot yang diurus oleh editor manusia secara manual

  readiness_policy:
    min_publications: int           # Bilangan minimum penerbitan sebelum section boleh dipaparkan
    min_editorial_assets: int       # Bilangan minimum aset editorial sebelum section boleh dipaparkan

  refresh_policy:
    interval_hours: int             # Kekerapan slot dikemaskini (dalam jam)
    strategy: RefreshStrategy       # Jenis penggantian kandungan

  rhythm_strategy: RhythmStrategy       # Nama strategi ritma (-> Spec 30)
  rhythm_distribution: RhythmDistribution  # Nisbah stanza — milik Blueprint ini, bukan Spec 30
  spatial_grammar: string               # Rujukan ke nama set Grammar (-> Spec 30)
```

---

## 3. TypeScript Interfaces

```typescript
// --- Refresh ---

type RefreshStrategy =
  | 'full'          // Gantikan semua slot engine dengan kandungan terbaru
  | 'partial'       // Gantikan sebahagian slot (cth. 50% teratas)
  | 'pinned_only';  // Hanya kemas kini slot yang tidak di-pin

interface RefreshPolicy {
  interval_hours: number;
  strategy: RefreshStrategy;
}

// --- Readiness ---

interface ReadinessPolicy {
  min_publications: number;
  min_editorial_assets: number;
}

// --- Composition Budget ---

interface CompositionBudget {
  engine_slots: number;
  reserved_editorial_slots: number;
}

// --- Rhythm Distribution ---
// Nisbah ini adalah milik setiap Blueprint, bukan Spec 30.
// Spec 30 hanya mendefinisikan struktur antara muka ini.

interface RhythmDistribution {
  hero_stanza_ratio: number;          // 0.0 - 1.0
  tri_column_stanza_ratio: number;    // 0.0 - 1.0
  compact_stanza_ratio: number;       // 0.0 - 1.0
  editorial_break_frequency: number;  // Satu Editorial Break setiap N stanza
}

// --- Blueprint ---

interface Blueprint {
  id: string;
  label: string;
  description: string;
  grid_columns: number;
  composition_budget: CompositionBudget;
  readiness_policy: ReadinessPolicy;
  refresh_policy: RefreshPolicy;
  rhythm_strategy: RhythmStrategy;
  rhythm_distribution: RhythmDistribution;
  spatial_grammar: string;              // Rujukan ke nama set Grammar
  stanza_catalog: StanzaDefinition[];   // Set stanza yang tersedia untuk Blueprint ini
}
```

---

## 4. Stanza

Stanza adalah blok geometri berbilang-baris yang dipilih oleh enjin untuk memenuhi turutan ritma. Setiap stanza mempunyai nama, bilangan baris yang digunakan dalam CSS Grid, dan definisi slot dalaman.

### 4.1 Katalog Stanza Standard

| Nama Stanza | Baris Grid | Keterangan |
|---|---|---|
| `StanzaHeroLeft` | 2 | Hero besar di kiri (2 kolum), artikel kecil di kanan (1 kolum) |
| `StanzaHeroRight` | 2 | Hero besar di kanan (2 kolum), artikel kecil di kiri (1 kolum) |
| `StanzaTriColumn` | 1-2 | Tiga lajur sama berat, sesuai untuk Essay atau Note |
| `StanzaEditorialBreak` | 1-2 | Barisan aset editorial terpelihara (Book, Image, Quote, Timeline, dsb.) |
| `StanzaCompact` | 1 | Dua atau empat artikel kecil tanpa hero — kandungan padat |

### 4.2 TypeScript Interface

```typescript
interface StanzaDefinition {
  id: string;               // cth. "StanzaHeroLeft"
  label: string;
  grid_rows: number;        // Bilangan baris CSS Grid yang digunakan
  slots: SlotDefinition[];  // Slot dalaman stanza ini
}
```

---

## 5. Slot

Slot adalah unit paling asas dalam reka letak — tempat letak tunggal untuk satu Editorial Object atau satu set Carousel.

### 5.1 Jenis Slot

| Jenis | Keterangan |
|---|---|
| `engine_controlled` | Diurus oleh enjin — kandungan dipilih berdasarkan skor dan ritma |
| `reserved_editorial` | Diurus oleh editor manusia — kandungan tidak boleh diubah oleh enjin |

### 5.2 TypeScript Interface

```typescript
// Rujukan ke Editorial Object Classes (-> Spec 29)
type EditorialObjectClass =
  | 'Essay' | 'Note'                      // Publication
  | 'Book' | 'Image' | 'Quote'            // Editorial Asset
  | 'QuranVerse' | 'Hadith'
  | 'Timeline' | 'Map' | 'Manuscript';

interface SlotDefinition {
  slot_id: string;                              // cth. "hero_left", "carousel_books_01"
  slot_type: 'engine_controlled' | 'reserved_editorial';
  preferred_class: EditorialObjectClass;
  fallback_classes: EditorialObjectClass[];     // Urutan keutamaan sandaran
  grid_position: {
    col_start: number;
    col_span: number;
    row_span: number;
  };
  carousel: boolean;
  max_items?: number;                           // Hanya relevan jika carousel = true
  visual_weight: 'critical' | 'high' | 'medium' | 'low';
}
```

---

## 6. Layout Intermediate Representation (Layout IR)

Layout IR adalah output akhir enjin — pemetaan setiap slot kepada koordinat grid dan kandungan yang ditugaskan.

```typescript
interface PublicationRef {
  id: string;
  title: string;
  editorial_object_class: EditorialObjectClass;
}

interface SlotAssignment {
  stanza_index: number;
  slot_id: string;
  slot_type: 'engine_controlled' | 'reserved_editorial';
  grid_position: { row_start: number; col_start: number };
  grid_span: { row_span: number; col_span: number };
  visual_weight: 'critical' | 'high' | 'medium' | 'low';
  is_carousel: boolean;

  // Satu daripada dua berikut akan hadir:
  publication?: PublicationRef;       // Slot tunggal
  publications?: PublicationRef[];    // Slot carousel

  // Metadata adaptasi
  adaptation?: 'resized' | 'collapsed' | 'fallback_used';
  original_preferred_class?: EditorialObjectClass;
  resolved_class?: EditorialObjectClass;
}

interface LayoutIR {
  blueprint_id: string;
  device: 'desktop' | 'tablet' | 'mobile';
  generated_at: string;             // ISO 8601
  total_slots: number;
  composition_budget: CompositionBudget;
  assignments: SlotAssignment[];
}
```

---

## 7. Prinsip Kebolehsuaian Slot (Adaptability)

Apabila kandungan pilihan tiada, slot boleh beradaptasi mengikut urutan berikut:

1. **Fallback** — Gunakan kelas sandaran pertama dalam `fallback_classes`
2. **Resize** — Kecilkan koordinat slot mengikut saiz semula jadi kelas sandaran
3. **Collapse** — Tandakan slot sebagai ditutup jika tiada sandaran tersedia
4. **Spatial Reflow** — Kira semula anjakan baris semua stanza selepasnya

Slot `reserved_editorial` tidak boleh melalui mana-mana peringkat adaptasi ini. Ia mesti dipaparkan seperti yang ditetapkan oleh editor manusia.

---

## 8. Contoh Blueprint Lengkap: Frontpage

```yaml
blueprint:
  id: frontpage_3col
  label: Frontpage (3 Kolum)
  description: Halaman hadapan Adjung. Kandungan digilir setiap 2 jam.
  grid_columns: 3

  composition_budget:
    engine_slots: 35
    reserved_editorial_slots: 5

  readiness_policy:
    min_publications: 10
    min_editorial_assets: 2

  refresh_policy:
    interval_hours: 2
    strategy: partial

  rhythm_strategy: Editorial
  rhythm_distribution:
    hero_stanza_ratio: 0.35
    tri_column_stanza_ratio: 0.35
    compact_stanza_ratio: 0.20
    editorial_break_frequency: 4

  spatial_grammar: standard_grammar_v1
```
