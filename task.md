# Todo List - Typography Engine

- [x] 1. Kemas kini `types.ts`: Tambah antara muka `TypographyContext`.
- [x] 2. Kemas kini `utils.tsx`: Pindahkan `isArabicText` ke atas (jika perlu) dan tambah utiliti `resolveTypographyContext(entry)`.
- [x] 3. Utiliti Pengurai Kongsi (Shared Parser):
  - [x] Kemas kini `markdownToHtml` dan `htmlToMarkdown` untuk menerima `TypographyContext`.
  - [x] Ubah logik regex supaya mematuhi pilihan `annotationEngine` (span vs ruby).
- [x] 4. Pengesahan & Pengujian:
  - [x] Sahkan kompilasi dengan `npm run build`.
  - [x] Pastikan paparan LTR (Melayu/Inggeris) kekal stabil tanpa sebarang perubahan reka bentuk.
  - [x] Pastikan paparan RTL (Arab/Jawi) selari di antara mod Desk (Editor) dan Published (View).
- [x] 5. Penstrukturan Semula CSS (`index.css`):
  - [x] Pindahkan dan asingkan `.interlinear-word` (Ltr) dan cipta `.script-rtl-ruby` (RTL).
- [x] 6. Tulis `26_TYPOGRAPHY_ENGINE.md` untuk mencatatkan spesifikasi ini.
