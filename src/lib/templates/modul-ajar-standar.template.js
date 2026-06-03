// src/lib/templates/modul-ajar-standar.template.js

export const modulAjarStandarTemplate = {
	templateId: 'modul-ajar-standar',
	label: 'Modul Ajar Standar',
	description: 'Template standar Kurikulum Merdeka — cocok untuk semua mata pelajaran',
	kurikulum: 'Kurikulum Merdeka',
	jenis: 'modul_ajar',

	sections: [
		// ── BATCH 1 ──────────────────────────────────────────────────────
		{
			id: 'capaian',
			agentKey: 'capaian',
			batch: 1,
			critical: true,
			sectionDef: {
				namaSection: 'Capaian & Tujuan Pembelajaran',
				instruksi: `Rancang tujuan pembelajaran dan deskripsi umum modul sesuai Kurikulum Merdeka.
Gunakan kata kerja operasional Taksonomi Bloom (C1–C6) untuk tujuan pembelajaran.
Profil Pelajar Pancasila harus relevan langsung dengan topik, bukan generik.
deskripsiUmum berisi 3–4 kalimat yang mencakup topik utama, pendekatan, dan relevansi dengan kehidupan siswa.`,
				outputSchema: `{
  "deskripsiUmum": "string",
  "kemampuanPrasyarat": "string",
  "tujuanPembelajaran": [{ "nomor": 1, "tujuan": "string", "levelBloom": "C4" }],
  "alurTujuanPembelajaran": [{ "tahap": 1, "judulTahap": "string", "deskripsi": "string" }],
  "profilPelajarPancasila": [{ "dimensi": "string", "implementasi": "string" }],
  "indikatorPencapaian": ["string"]
}`
			}
		},

		// ── BATCH 2 — paralel ────────────────────────────────────────────
		{
			id: 'kegiatan',
			agentKey: 'kegiatan',
			batch: 2,
			critical: true,
			sectionDef: {
				namaSection: 'Kegiatan Pembelajaran',
				instruksi: `Rancang kegiatan pembelajaran lengkap per pertemuan sesuai Kurikulum Merdeka.
Setiap pertemuan WAJIB punya 3 fase: Pembuka → Inti → Penutup.
Sertakan diferensiasi konten/proses/produk dan minimal 2 pertanyaan pemantik per pertemuan.
PENTING: Jangan gunakan tanda kutip ganda (") di dalam nilai string JSON. Ganti dengan koma atau tanda lain.`,
				outputSchema: `{
  "pertemuan": [{
    "ke": 1,
    "tujuanPertemuan": "string",
    "langkahPembelajaran": {
      "pembuka": [{ "aktivitas": "string", "durasi": "10 menit" }],
      "inti": [{ "aktivitas": "string", "durasi": "60 menit" }],
      "penutup": [{ "aktivitas": "string", "durasi": "10 menit" }]
    },
    "diferensiasi": { "konten": "string", "proses": "string", "produk": "string" },
    "pertanyaanPemantik": ["string"]
  }]
}`
			}
		},
		{
			id: 'asesmen',
			agentKey: 'asesmen',
			batch: 2,
			critical: true,
			sectionDef: {
				namaSection: 'Asesmen Pembelajaran',
				instruksi: `Rancang instrumen asesmen lengkap: diagnostik (sebelum belajar), formatif (tiap pertemuan), dan sumatif (akhir).
Rubrik penilaian harus operasional — tiap level (sangat baik/baik/cukup/perlu bimbingan) deskripsinya spesifik dan terukur, bukan generik.
Refleksi guru berupa pertanyaan reflektif (diawali kata tanya), bukan pernyataan.`,
				outputSchema: `{
  "asesmenDiagnostik": { "tujuan": "string", "instrumen": ["string"] },
  "asesmenFormatif": [{ "pertemuan": 1, "teknik": "string", "instrumen": "string" }],
  "asesmenSumatif": { "bentuk": "string", "bobot": "string", "instrumen": "string" },
  "rubrikPenilaian": [{
    "aspek": "string",
    "kriteria": {
      "sangat_baik": "string",
      "baik": "string",
      "cukup": "string",
      "perlu_bimbingan": "string"
    }
  }],
  "refleksiGuru": ["string"]
}`
			}
		}
	]
};
