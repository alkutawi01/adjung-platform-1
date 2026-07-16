# 30 — Editorial Grammar & Rhythm Specification

Dokumen ini mendefinisikan dua sistem yang berbeza tetapi saling melengkapi: **Spatial Grammar** dan **Editorial Rhythm**. Kedua-duanya sering disebut bersama tetapi mesti difahami sebagai dua mekanisme yang menjawab soalan yang berlainan.

---

## 1. Perbezaan Asas: Grammar vs Rhythm

| | Grammar | Rhythm |
|---|---|---|
| Soalan | Boleh atau Tidak boleh? | Apa patut datang selepas ini? |
| Sifat | Peraturan binari, tidak boleh dilanggar | Algoritma penjanaan urutan |
| Output | Ya / Tidak | Turutan Stanza |
| Masa operasi | Semak selepas Rhythm dijana | Dijana sebelum Grammar disemak |

Pipeline enjin sentiasa menjanakan Rhythm dahulu, kemudian menyemak hasilnya dengan Grammar. Jika Grammar gagal, Rhythm dijana semula dengan constraint tambahan.

---

## 2. Spatial Grammar

Grammar menjawab soalan: **"Boleh atau Tidak boleh?"**

Ia adalah set peraturan binari yang tidak boleh dilanggar oleh enjin. Grammar tidak mempunyai pengecualian. Jika sesuatu turutan melanggar Grammar, ia ditolak serta-merta.

### 2.1 Peraturan Grammar Standard

**G-01: Had Hero Berturutan**
Tidak boleh ada dua Stanza Hero berturutan.
```
StanzaHeroLeft -> StanzaHeroRight  ❌
StanzaHeroLeft -> StanzaTriColumn  ✓
```

**G-02: Had Hero dalam Blok**
Tidak lebih daripada satu Stanza Hero dalam setiap 3 stanza berturutan.
```
Hero, Tri, Hero (setiap 3) = ❌
Hero, Tri, Compact (setiap 3) = ✓
```

**G-03: Pemisahan QuranVerse / Hadith**
`QuranVerse` dan `Hadith` tidak boleh berada dalam stanza yang sama dengan kandungan berita (`Breaking`) atau `Note` yang bersifat Editorial Priority `Breaking`.
```
StanzaEditorialBreak[QuranVerse] bersebelahan StanzaCompact[Note:Breaking] = ❌
```

**G-04: Kekerapan Editorial Break Minimum**
Mesti ada sekurang-kurangnya satu `StanzaEditorialBreak` dalam setiap blok N stanza, di mana N ditentukan oleh `rhythm_distribution.editorial_break_frequency` dalam Blueprint.
```
Blueprint.editorial_break_frequency = 4
Urutan: Hero, Tri, Compact, Compact, Compact (5 tanpa Break) = ❌
Urutan: Hero, Tri, Compact, Break (Break pada ke-4) = ✓
```

**G-05: Keseimbangan Kandungan**
Tidak boleh ada lebih daripada 60% slot engine diisi oleh satu kelas Editorial Object yang sama dalam satu halaman.
```
40 slot engine, 25 slot diisi Essay = ❌ (62.5%)
40 slot engine, 22 slot diisi Essay = ✓ (55%)
```

### 2.2 TypeScript Interface

```typescript
interface GrammarRule {
  id: string;          // cth. "G-01"
  label: string;
  description: string;
  validate: (sequence: StanzaDefinition[]) => GrammarValidationResult;
}

interface GrammarValidationResult {
  passed: boolean;
  violated_rule?: string;   // ID peraturan yang dilanggar
  violation_index?: number; // Indeks stanza yang melanggar
  message?: string;
}

interface SpatialGrammar {
  id: string;
  rules: GrammarRule[];
}
```

---

## 3. Editorial Rhythm

Rhythm menjawab soalan: **"Apa patut datang selepas ini?"**

Ia adalah algoritma penjanaan urutan Stanza berdasarkan:
1. Kolam kandungan yang tersedia (Sorted Publication Pool + Reserved Editorial Pool)
2. Strategi ritma yang dipilih oleh Blueprint
3. Nisbah stanza yang ditetapkan oleh Blueprint (bukan oleh Spec ini)

### 3.1 Strategi Ritma (RhythmStrategy)

Strategi ritma menentukan "karakter" keseluruhan halaman — bukan nisbah tepat (nisbah itu milik Blueprint), tetapi cara enjin membuat keputusan urutan.

| Strategi | Karakter | Sesuai Untuk |
|---|---|---|
| `Editorial` | Seimbang. Hero kerap tetapi tidak mendominasi. Ruang untuk Editorial Asset. | Frontpage standard, halaman utama section |
| `Magazine` | Visual berat. Hero sering. Editorial Asset digunakan sebagai pemisah estetik. | Halaman edisi khas, feature magazine |
| `Journal` | Teks berat. Hero jarang. Kandungan padat, pembaca akademik. | Jurnal ilmiah, section penyelidikan |
| `News` | Breaking diutamakan. Refresh pantas. Hero dikhaskan untuk kandungan mendesak. | Section berita, peristiwa semasa |
| `Minimal` | Tiada hero besar. Layout kompak dan tenang. | Arkib, halaman indeks, rujukan |

### 3.2 Input dan Output Rhythm

```
Input:
  - Sorted Publication Pool    (hasil Peringkat 5: Ranking)
  - Reserved Editorial Pool    (dipelihara, tidak diubah)
  - Blueprint.rhythm_strategy
  - Blueprint.rhythm_distribution
  - SpatialGrammar (untuk semak selepas penjanaan)

Output:
  - Sequence: [StanzaType, ...]
    cth. [StanzaHeroLeft, StanzaTriColumn, StanzaCompact, StanzaEditorialBreak, ...]
```

### 3.3 Logik Penjanaan Ritma (Pseudokod)

```
function generateRhythm(pool, blueprint, grammar):
  sequence = []
  stanza_count = 0
  break_countdown = blueprint.rhythm_distribution.editorial_break_frequency

  while pool.has_content():
    if break_countdown == 0:
      sequence.append(StanzaEditorialBreak)
      break_countdown = blueprint.rhythm_distribution.editorial_break_frequency
      continue

    next_stanza = selectNextStanza(blueprint.rhythm_strategy, blueprint.rhythm_distribution)

    if grammar.validate(sequence + [next_stanza]).passed:
      sequence.append(next_stanza)
      break_countdown -= 1
    else:
      next_stanza = selectAlternativeStanza(sequence, grammar)
      sequence.append(next_stanza)

  return sequence
```

### 3.4 TypeScript Interfaces

```typescript
type RhythmStrategy = 'Editorial' | 'Magazine' | 'Journal' | 'News' | 'Minimal';

// Ini adalah struktur sahaja. Nilai sebenar ditetapkan dalam setiap Blueprint.
interface RhythmDistribution {
  hero_stanza_ratio: number;          // 0.0 - 1.0
  tri_column_stanza_ratio: number;    // 0.0 - 1.0
  compact_stanza_ratio: number;       // 0.0 - 1.0
  editorial_break_frequency: number;  // Satu Editorial Break setiap N stanza
}

interface RhythmGenerationInput {
  publication_pool: ScoredPublication[];
  editorial_pool: EditorialAsset[];
  blueprint: Blueprint;
  grammar: SpatialGrammar;
}

interface RhythmGenerationOutput {
  stanza_sequence: StanzaDefinition[];
  grammar_passes: number;   // Berapa kali Grammar disemak
  grammar_retries: number;  // Berapa kali Rhythm dijana semula akibat kegagalan Grammar
}
```

---

## 4. Editorial Break

`StanzaEditorialBreak` bukan sekadar tempat meletakkan petikan kata (quote). Ia adalah stanza yang boleh menerima **mana-mana Editorial Asset** sebagai pemisah visual dan editorial.

### 4.1 Objek yang Layak sebagai Editorial Break

- `Book`
- `Image`
- `Quote`
- `QuranVerse`
- `Hadith`
- `Timeline`
- `Map`
- `Manuscript`

Pemilihan objek untuk Editorial Break slot ditentukan oleh:
1. Ketersediaan dalam Reserved Editorial Pool
2. Kesesuaian konteks (cth. `QuranVerse` lebih sesuai berdekatan dengan kandungan keagamaan)
3. Variasi — enjin mengelak menggunakan Editorial Asset yang sama berturut-turut

### 4.2 Peraturan Editorial Break

- Editorial Break yang diisi oleh `reserved_editorial` slot tidak boleh digantikan oleh enjin.
- Editorial Break yang diisi oleh `engine_controlled` slot boleh dipilih secara automatik dari pool Editorial Asset yang tersedia.
- Jika tiada Editorial Asset tersedia untuk slot engine pada Editorial Break, slot tersebut dikecilkan (collapsed) dan Spatial Reflow berlaku.

---

## 5. Interaksi Grammar-Rhythm dalam Pipeline

```
[Rhythm Generation]
       |
       v
[Grammar Validation]
       |
      / \
   Lulus  Gagal
    |        |
    v        v
[Stanza   [Rhythm
 Confirmed] Regenerated
           with Constraint]
```

Grammar tidak menghalang Rhythm daripada beroperasi. Ia hanya bertindak sebagai penyemak selepas Rhythm menjana turutan cadangan. Jika turutan gagal Grammar, Rhythm cuba semula dengan satu constraint tambahan yang menghalang corak yang baru sahaja ditolak.

---

## 6. Nota: Nisbah Ritma Adalah Milik Blueprint

Peraturan penting yang mesti dipatuhi semasa implementasi:

**Spec 30 tidak menyimpan sebarang nisbah atau peratusan.** Spec 30 hanya mendefinisikan:
- Struktur antara muka `RhythmDistribution`
- Maksud setiap medan
- Cara enjin menggunakan nisbah tersebut

Nilai sebenar (cth. hero 35%, tri-column 35%) ditetapkan dalam setiap Blueprint masing-masing. Dengan cara ini, nisbah boleh diubah tanpa menyentuh Spec 30.
