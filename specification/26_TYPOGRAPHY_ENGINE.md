# Typography Engine

## 1. Pengenalan

Enjin Tipografi Adjung direka khusus untuk mengendalikan kerumitan paparan teks pelbagai bahasa, dengan fokus utama kepada pertembungan antara skrip Latin (Kiri-ke-Kanan / LTR) dan skrip Arab/Jawi (Kanan-ke-Kiri / RTL) apabila menggunakan anotasi teks atau "gloss".

Enjin tipografi ini menolak pendekatan berasaskan gaya CSS global (regex-heavy global CSS) yang cuba merawat semua skrip dengan cara yang sama. Sebaliknya, ia membina dan meluluskan `TypographyContext` dari peringkat dokumen hinggalah ke komponen paling asas.

## 2. TypographyContext

Struktur data teras untuk menentukan enjin pemaparan:

```typescript
export interface TypographyContext {
  direction: 'ltr' | 'rtl';
  primaryScript: 'latin' | 'arabic';
  renderer: 'latin' | 'rtl';
  annotationEngine: 'span' | 'ruby';
}
```

Pengesanan `primaryScript` (menggunakan fungsi utiliti `resolveTypographyContext`) dilakukan *sekali sahaja* pada tahap dokumen, berdasarkan kandungan dan tajuk. Metadata ini kemudiannya disalurkan ke fungsi-fungsi pengurai.

## 3. Senibina Pemaparan Dwicabang (Bifurcated Rendering)

Dokumen akan dirender menggunakan salah satu daripada dua senibina (pipeline) anotasi bergantung kepada `annotationEngine`:

### 3.1. LTR Pipeline (Latin)
* **Annotation Engine**: `span`
* **Pendekatan CSS**: `position: absolute` pada gloss (`span.interlinear-gloss`).
* **Kestabilan Geometri**: Sangat stabil. Tidak mengganggu irama baris teks asal.
* **HTML Output**:
  ```html
  <span class="interlinear-word">
    <span class="interlinear-gloss">Gloss</span>
    <bdi>BaseWord</bdi>
  </span>
  ```

### 3.2. RTL Pipeline (Arab/Jawi)
* **Annotation Engine**: `ruby`
* **Pendekatan CSS**: Standard HTML5 `<ruby>` digabungkan dengan `<bdi>` dan `display: inline-block` (`.script-rtl-ruby`).
* **Penyelesaian**: Pilihan terbaik bagi mengekalkan sambungan huruf kaligrafi Jawi (cursive script) tanpa mengalami perpecahan atau ralat geometri ketika dipaparkan pada pelayar web moden (Blink/WebKit).
* **HTML Output**:
  ```html
  <bdi class="script-rtl-ruby">
    <ruby class="script-rtl-word">
      BaseWord
      <rt class="script-rtl-gloss">Gloss</rt>
    </ruby>
  </bdi>
  ```

## 4. Pelaksanaan Pengurai Kongsi (Shared Parser)

Fungsi teras:
1. `markdownToHtml`: Menerima `typographyContext` dan memancarkan format HTML (samada `span` atau `ruby`) yang sesuai.
2. `parseInlineFormatting`: Mencapai token format `INTERLINEAR` dan menentukan komponen React berasaskan konteks tipografi dokumen.
3. `wrapBadgesWithWords`: Mengelompokkan perkataan-perkataan berserta lencana (seperti footnote/margin notes) agar kekal sebaris.

## 5. Peraturan Emas (Golden Rules)
1. **Renderer tidak dibenarkan mengubah geometri dokumen LTR semata-mata untuk menyokong RTL.** Kes LTR hendaklah sentiasa stabil tanpa gangguan.
2. **Jangan bergantung kepada tag bahasa dokumen semata-mata.** Pengesanan haruslah dibuat berdasarkan aksara dominan di dalam keseluruhan kandungan (Skrip Utama).
3. **Pemisahan Kelas CSS.** Tiada sebarang kelas CSS yang dikongsi oleh pemapar `span` dan pemapar `ruby`. Mereka mesti wujud secara bebas (isolated).
