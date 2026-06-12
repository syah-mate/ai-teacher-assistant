// src/lib/templates/section-schema.js
//
// Definisi section + output schema untuk semua jenis dokumen.
// HANYA berisi: key, label, outputSchema, contextHint.
// Tidak ada instruksi prompt — itu urusan orchestrator + AI.
//
// outputSchema: JSON string yang menjadi "kontrak" output sub-agent.
//   Digunakan oleh orchestrator saat brief AI, dan oleh GenericSubAgent
//   saat memvalidasi output.
//
// contextHint: kalimat singkat untuk orchestrator — apa dari hasil section ini
//   yang penting untuk di-pass ke brief section berikutnya.

export const SECTION_SCHEMAS = {

  // ── MODUL AJAR ──────────────────────────────────────────────────────────

  capaian: {
    key: 'capaian',
    label: 'Capaian & Tujuan Pembelajaran',
    jenis: 'modul_ajar',
    contextHint: 'Gunakan tujuanPembelajaran dan profilPelajarPancasila sebagai acuan section berikutnya.',
    fields: [
      { key: 'deskripsiUmum',          schema: 'string' },
      { key: 'kemampuanPrasyarat',     schema: 'string' },
      { key: 'tujuanPembelajaran',     schema: '[{ "nomor": 1, "tujuan": "string", "levelBloom": "C4" }]' },
      { key: 'profilPelajarPancasila', schema: '[{ "dimensi": "string", "implementasi": "string" }]' },
      { key: 'indikatorPencapaian',    schema: '["string"]' },
    ],
    outputSchema: `{
  "deskripsiUmum": "string",
  "kemampuanPrasyarat": "string",
  "tujuanPembelajaran": [{ "nomor": 1, "tujuan": "string", "levelBloom": "C4" }],
  "profilPelajarPancasila": [{ "dimensi": "string", "implementasi": "string" }],
  "indikatorPencapaian": ["string"]
}`
  },

  kegiatan: {
    key: 'kegiatan',
    label: 'Kegiatan Pembelajaran',
    jenis: 'modul_ajar',
    contextHint: 'Gunakan jumlah pertemuan dan metode pembelajaran dari kegiatan sebagai acuan asesmen.',
    fields: [
      { key: 'pertemuan', schema: '[{ "ke": 1, "tujuanPertemuan": "string", "langkahPembelajaran": { "pembuka": [...], "inti": [...], "penutup": [...] }, "diferensiasi": {...}, "pertanyaanPemantik": [...] }]' },
    ],
    outputSchema: `{
  "pertemuan": [{
    "ke": 1,
    "tujuanPertemuan": "string",
    "langkahPembelajaran": {
      "pembuka": [{ "aktivitas": "string", "durasi": "10 menit" }],
      "inti": [
        { "aktivitas": "Orientasi peserta didik pada masalah: ...", "durasi": "15 menit" },
        { "aktivitas": "Mengorganisasikan peserta didik: ...", "durasi": "10 menit" },
        { "aktivitas": "Membimbing penyelidikan individu/kelompok: ...", "durasi": "15 menit" },
        { "aktivitas": "Menyajikan hasil diskusi/presentasi: ...", "durasi": "15 menit" },
        { "aktivitas": "Menganalisis dan mengevaluasi proses: ...", "durasi": "10 menit" }
      ],
      "penutup": [{ "aktivitas": "string", "durasi": "10 menit" }]
    },
    "diferensiasi": { "konten": "string", "proses": "string", "produk": "string" },
    "pertanyaanPemantik": ["string"]
  }]
}`
  },

  asesmen: {
    key: 'asesmen',
    label: 'Asesmen Pembelajaran',
    jenis: 'modul_ajar',
    contextHint: 'Asesmen harus selaras dengan tujuan pembelajaran dan jumlah pertemuan yang sudah dibuat.',
    fields: [
      { key: 'asesmenDiagnostik', schema: '{ "tujuan": "string", "instrumen": ["string"] }' },
      { key: 'asesmenFormatif',   schema: '[{ "pertemuan": 1, "teknik": "string", "instrumen": "string" }]' },
      { key: 'asesmenSumatif',    schema: '{ "bentuk": "string", "bobot": "string", "instrumen": "string" }' },
      { key: 'rubrikPenilaian',   schema: '[{ "aspek": "string", "kriteria": { "sangat_baik": "string", "baik": "string", "cukup": "string", "perlu_bimbingan": "string" } }]' },
      { key: 'refleksiGuru',      schema: '["string"]' },
    ],
    outputSchema: `{
  "asesmenDiagnostik": { "tujuan": "string", "instrumen": ["string"] },
  "asesmenFormatif": [{ "pertemuan": 1, "teknik": "string", "instrumen": "string" }],
  "asesmenSumatif": { "bentuk": "string", "bobot": "string", "instrumen": "string" },
  "rubrikPenilaian": [{ "aspek": "string", "kriteria": { "sangat_baik": "string", "baik": "string", "cukup": "string", "perlu_bimbingan": "string" } }],
  "refleksiGuru": ["string"]
}`
  },

  materi: {
    key: 'materi',
    label: 'Materi Pembelajaran',
    jenis: 'modul_ajar',
    contextHint: 'Ringkasan materi dan konsep kunci untuk referensi section berikutnya.',
    fields: [
      { key: 'ringkasanMateri', schema: 'string' },
      { key: 'konsepKunci',     schema: '[{ "konsep": "string", "definisi": "string" }]' },
      { key: 'faktaPenting',    schema: '["string"]' },
      { key: 'contohAplikasi',  schema: '["string"]' },
      { key: 'sumberReferensi', schema: '["string"]' },
    ],
    outputSchema: `{
  "ringkasanMateri": "string",
  "konsepKunci": [{ "konsep": "string", "definisi": "string" }],
  "faktaPenting": ["string"],
  "contohAplikasi": ["string"],
  "sumberReferensi": ["string"]
}`
  },

  // ── LKPD ────────────────────────────────────────────────────────────────

  capaian_lkpd: {
    key: 'capaian_lkpd',
    label: 'Capaian Pembelajaran LKPD',
    jenis: 'lkpd',
    contextHint: 'Tujuan pembelajaran LKPD menjadi acuan langkah kerja dan penilaian.',
    fields: [
      { key: 'tujuanPembelajaran',     schema: '[{ "nomor": 1, "tujuan": "string", "levelBloom": "C3" }]' },
      { key: 'indikatorKetercapaian',  schema: '["string"]' },
    ],
    outputSchema: `{
  "tujuanPembelajaran": [{ "nomor": 1, "tujuan": "string", "levelBloom": "C3" }],
  "indikatorKetercapaian": ["string"]
}`
  },

  ringkasan_materi: {
    key: 'ringkasan_materi',
    label: 'Ringkasan Materi',
    jenis: 'lkpd',
    contextHint: 'Materi singkat ini dibaca siswa — konsep kunci jadi acuan langkah kerja.',
    fields: [
      { key: 'materiSingkat', schema: 'string' },
      { key: 'konsepKunci',   schema: '[{ "konsep": "string", "definisi": "string" }]' },
      { key: 'faktaPenting',  schema: '["string"]' },
    ],
    outputSchema: `{
  "materiSingkat": "string",
  "konsepKunci": [{ "konsep": "string", "definisi": "string" }],
  "faktaPenting": ["string"]
}`
  },

  langkah_kerja: {
    key: 'langkah_kerja',
    label: 'Langkah Kerja',
    jenis: 'lkpd',
    contextHint: 'Langkah kerja dan jenis kegiatan aktif menjadi acuan rubrik penilaian.',
    fields: [
      { key: 'jenisKegiatanAktif', schema: '["string"]' },
      { key: 'alatBahan',          schema: '["string"]' },
      { key: 'langkahKerja',       schema: '[{ "bagian": "string", "tujuanBagian": "string", "langkah": [...] }]' },
      { key: 'tabelPengamatan',    schema: '{ "judul": "string", "kolom": ["string"], "keterangan": "string" }' },
    ],
    outputSchema: `{
  "jenisKegiatanAktif": ["string"],
  "alatBahan": ["string"],
  "langkahKerja": [{
    "bagian": "string",
    "tujuanBagian": "string",
    "langkah": [{ "nomor": 1, "instruksi": "string", "ruangJawaban": true, "estimasiWaktu": "5 menit" }]
  }],
  "tabelPengamatan": { "judul": "string", "kolom": ["string"], "keterangan": "string" }
}`
  },

  penilaian_lkpd: {
    key: 'penilaian_lkpd',
    label: 'Penilaian LKPD',
    jenis: 'lkpd',
    contextHint: '',
    fields: [
      { key: 'rubrikPenilaian',   schema: '[{ "aspek": "string", "bobot": 25, "kriteria": {...} }]' },
      { key: 'evaluasiRefleksi',  schema: '["string"]' },
      { key: 'totalBobot',        schema: '100' },
    ],
    outputSchema: `{
  "rubrikPenilaian": [{
    "aspek": "string",
    "bobot": 25,
    "kriteria": { "sangat_baik": "string", "baik": "string", "cukup": "string", "perlu_bimbingan": "string" }
  }],
  "evaluasiRefleksi": ["string"],
  "totalBobot": 100
}`
  },

  // ── SOAL ─────────────────────────────────────────────────────────────────

  'soal-pg': {
    key: 'soal-pg',
    label: 'Soal Pilihan Ganda',
    jenis: 'soal',
    contextHint: '',
    fields: [
      { key: 'soalPilihanGanda', schema: '[{ "nomor": 1, "soal": "string", "pilihan": {...}, "kunciJawaban": "A", "pembahasan": "string", "levelBloom": "C3" }]' },
    ],
    outputSchema: `{
  "soalPilihanGanda": [{
    "nomor": 1,
    "soal": "string",
    "pilihan": { "A": "string", "B": "string", "C": "string", "D": "string" },
    "kunciJawaban": "A",
    "pembahasan": "string",
    "levelBloom": "C3"
  }]
}`
  },

  'soal-esai': {
    key: 'soal-esai',
    label: 'Soal Esai',
    jenis: 'soal',
    contextHint: '',
    fields: [
      { key: 'soalEsai', schema: '[{ "nomor": 1, "soal": "string", "petunjukMenjawab": "string", "kunciJawaban": "string", "rubrikPenilaian": "string", "bobot": 20 }]' },
    ],
    outputSchema: `{
  "soalEsai": [{
    "nomor": 1,
    "soal": "string",
    "petunjukMenjawab": "string",
    "kunciJawaban": "string",
    "rubrikPenilaian": "string",
    "bobot": 20
  }]
}`
  }

};

/**
 * Ambil schema berdasarkan agentKey / section key.
 * @param {string} key
 * @returns {Object|null}
 */
export function getSectionSchema(key) {
  return SECTION_SCHEMAS[key] ?? null;
}

/**
 * Ambil semua section untuk jenis dokumen tertentu.
 * @param {'modul_ajar'|'lkpd'|'soal'} jenis
 * @returns {Object[]}
 */
export function getSectionSchemasByJenis(jenis) {
  return Object.values(SECTION_SCHEMAS).filter(s => s.jenis === jenis);
}
