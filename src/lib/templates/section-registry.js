// src/lib/templates/section-registry.js
//
// Registry semua section standar yang bisa dipilih di Template Builder.
// Key = agentKey (harus SAMA PERSIS dengan key di SUB_AGENT_REGISTRY di run-sub-agents.tool.js)
//
// Setiap entry berisi:
//   - agentKey    : key untuk memanggil sub-agent
//   - label       : nama tampil di Builder UI
//   - description : penjelasan singkat untuk user
//   - batch       : 1 (sequential, harus duluan) atau 2 (paralel)
//   - critical    : jika gagal, hentikan pipeline
//   - sectionDef  : { namaSection, instruksi, outputSchema } — dikirim ke executeFromTemplate()
//   - jenis       : 'modul_ajar' | 'lkpd' — untuk filter di Template Builder

export const SECTION_REGISTRY = {

	capaian: {
		jenis: 'modul_ajar',
		agentKey: 'capaian',
		label: 'Kemampuan Prasyarat & Tujuan Pembelajaran',
		description: 'Kemampuan prasyarat, tujuan pembelajaran, dan profil pelajar Pancasila',
		batch: 1,
		critical: true,
		schemaFields: ['Kemampuan Prasyarat', 'Tujuan Pembelajaran', 'Profil Pelajar Pancasila'],
		customPromptFields: [
			{
				key: 'kemampuanPrasyarat',
				label: 'Kemampuan Prasyarat',
				placeholder: 'Contoh: Siswa sudah bisa membaca dan menulis kalimat sederhana',
				defaultInstruksi: 'Jelaskan kompetensi yang harus sudah dikuasai siswa sebelum mempelajari modul ini, 2-4 kalimat.'
			},
			{
				key: 'tujuanPembelajaran',
				label: 'Tujuan Pembelajaran',
				placeholder: 'Contoh: Fokus pada kemampuan berpikir kritis level C4-C5',
				defaultInstruksi: 'Gunakan kata kerja operasional Taksonomi Bloom (C1–C6). Buat tujuan yang spesifik dan terukur.'
			},
			{
				key: 'profilPelajarPancasila',
				label: 'Profil Pelajar Pancasila',
				placeholder: 'Contoh: Fokus pada dimensi Gotong Royong dan Bernalar Kritis',
				defaultInstruksi: 'Pilih dimensi yang relevan langsung dengan topik pembelajaran, bukan generik.'
			}
		],
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

	kegiatan: {
		jenis: 'modul_ajar',
		agentKey: 'kegiatan',
		label: 'Kegiatan Pembelajaran',
		description: 'Langkah pembelajaran per pertemuan: Pembuka, Inti, Penutup + diferensiasi',
		batch: 2,
		critical: true,
		schemaFields: ['Pertanyaan Pemantik', 'Pembuka', 'Inti', 'Penutup', 'Diferensiasi'],
		customPromptFields: [
			{
				key: 'pertemuan',
				label: 'Kegiatan Per Pertemuan',
				placeholder: 'Contoh: Gunakan metode diskusi kelompok dan presentasi, hindari ceramah satu arah',
				defaultInstruksi: 'Setiap pertemuan WAJIB punya 3 fase: Pembuka → Inti → Penutup. Sertakan diferensiasi dan pertanyaan pemantik.'
			}
		],
		sectionDef: {
			namaSection: 'Kegiatan Pembelajaran',
			instruksi: `Rancang kegiatan pembelajaran lengkap per pertemuan sesuai Kurikulum Merdeka.
Setiap pertemuan WAJIB punya 3 fase: Pembuka → Inti → Penutup.
Fase INTI WAJIB terdiri dari 5 langkah (sintak model pembelajaran):
  1. Orientasi peserta didik pada masalah
  2. Mengorganisasikan peserta didik
  3. Membimbing penyelidikan individu/kelompok
  4. Menyajikan hasil diskusi/presentasi
  5. Menganalisis dan mengevaluasi proses pemecahan masalah
Setiap langkah INTI adalah satu item array dengan aktivitas dan durasi masing-masing.
Sertakan diferensiasi konten/proses/produk dan minimal 2 pertanyaan pemantik per pertemuan.
PENTING: Jangan gunakan tanda kutip ganda (") di dalam nilai string JSON. Ganti dengan koma atau tanda lain.`,
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
		}
	},

	asesmen: {
		jenis: 'modul_ajar',
		agentKey: 'asesmen',
		label: 'Asesmen Pembelajaran',
		description: 'Asesmen diagnostik, formatif per pertemuan, dan sumatif',
		batch: 2,
		critical: true,
		schemaFields: ['Asesmen Diagnostik', 'Asesmen Formatif', 'Asesmen Sumatif'],
		customPromptFields: [
			{
				key: 'asesmenDiagnostik',
				label: 'Asesmen Diagnostik',
				placeholder: 'Contoh: Gunakan kuis lisan 5 pertanyaan sebelum pelajaran dimulai',
				defaultInstruksi: 'Rancang asesmen untuk mengetahui kemampuan awal siswa sebelum pembelajaran.'
			},
			{
				key: 'asesmenFormatif',
				label: 'Asesmen Formatif',
				placeholder: 'Contoh: Gunakan observasi dan lembar checklist per pertemuan',
				defaultInstruksi: 'Rancang asesmen formatif untuk tiap pertemuan — teknik dan instrumen yang sesuai.'
			},
			{
				key: 'asesmenSumatif',
				label: 'Asesmen Sumatif',
				placeholder: 'Contoh: Gunakan soal uraian 5 nomor dengan bobot merata',
				defaultInstruksi: 'Rancang asesmen sumatif di akhir pembelajaran — bentuk, bobot, dan instrumen.'
			}
		],
		sectionDef: {
			namaSection: 'Asesmen Pembelajaran',
			instruksi: `Rancang instrumen asesmen lengkap: diagnostik (sebelum belajar), formatif (tiap pertemuan), dan sumatif (akhir).
Rubrik penilaian harus operasional — tiap level deskripsinya spesifik dan terukur.
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
	},

	materi: {
		jenis: 'modul_ajar',
		agentKey: 'materi',
		label: 'Materi Pembelajaran',
		description: 'Kata pengantar dan materi pokok pembelajaran',
		batch: 2,
		critical: false,
		schemaFields: ['Kata Pengantar', 'Materi Pokok'],
		customPromptFields: [
			{
				key: 'ringkasanMateri',
				label: 'Kata Pengantar (Ringkasan Materi)',
				placeholder: 'Contoh: Tulis dalam gaya bercerita yang menarik untuk siswa SD',
				defaultInstruksi: 'Susun ringkasan materi yang komprehensif dan relevan, 2-3 paragraf.'
			},
			{
				key: 'materiPokok',
				label: 'Materi Pokok (Konsep & Fakta)',
				placeholder: 'Contoh: Fokus pada 3 konsep utama dengan contoh kehidupan sehari-hari',
				defaultInstruksi: 'Jelaskan konsep kunci dengan definisi jelas, fakta penting, dan contoh aplikasi kontekstual.'
			}
		],
		sectionDef: {
			namaSection: 'Materi Pembelajaran',
			instruksi: `Susun materi pembelajaran yang komprehensif dan relevan dengan topik.
Konsep kunci harus disertai definisi yang jelas dan mudah dipahami siswa.
Contoh aplikasi harus kontekstual dengan kehidupan nyata siswa.`,
			outputSchema: `{
  "ringkasanMateri": "string",
  "konsepKunci": [{ "konsep": "string", "definisi": "string" }],
  "faktaPenting": ["string"],
  "contohAplikasi": ["string"],
  "sumberReferensi": ["string"]
}`
		}
	},

	evaluasi: {
		jenis: 'modul_ajar',
		agentKey: 'evaluasi',
		label: 'Soal Evaluasi & Refleksi',
		description: 'Soal evaluasi, rubrik penilaian, dan refleksi guru',
		batch: 2,
		critical: false,
		schemaFields: ['Soal & Kunci Jawaban', 'Rubrik Penilaian', 'Refleksi Guru'],
		customPromptFields: [
			{
				key: 'soalEvaluasi',
				label: 'Soal & Kunci Jawaban',
				placeholder: 'Contoh: Buat 5 soal uraian level C4, bobot merata 20 poin tiap soal',
				defaultInstruksi: 'Susun soal evaluasi yang mengukur ketercapaian tujuan. Total bobot harus 100. Kunci jawaban ringkas dan tepat.'
			},
			{
				key: 'pertanyaanRefleksi',
				label: 'Refleksi Guru',
				placeholder: 'Contoh: Fokus pada refleksi efektivitas metode pembelajaran yang digunakan',
				defaultInstruksi: 'Buat pertanyaan reflektif untuk guru — diawali kata tanya, mendorong evaluasi diri.'
			}
		],
		sectionDef: {
			namaSection: 'Soal Evaluasi & Refleksi',
			instruksi: `Susun soal evaluasi yang mengukur ketercapaian tujuan pembelajaran.
Total bobot semua soal harus 100. Kunci jawaban harus ringkas dan tepat.
Pertanyaan refleksi mendorong siswa berpikir tentang proses belajar mereka.`,
			outputSchema: `{
  "soalEvaluasi": [{ "nomor": 1, "soal": "string", "bobot": 10, "kunciJawaban": "string" }],
  "pertanyaanRefleksi": ["string"],
  "totalBobot": 100
}`
		}
	},

	langkah: {
		jenis: 'modul_ajar',
		agentKey: 'langkah',
		label: 'Langkah-Langkah Kegiatan',
		description: 'Langkah detail kegiatan siswa dan guru',
		batch: 2,
		critical: false,
		schemaFields: ['Aktivitas Guru', 'Aktivitas Siswa', 'Durasi'],
		customPromptFields: [
			{
				key: 'langkahKegiatan',
				label: 'Langkah Kegiatan',
				placeholder: 'Contoh: Sertakan alokasi waktu detail per langkah, max 10 langkah',
				defaultInstruksi: 'Uraikan langkah kegiatan secara detail — peran guru dan siswa, serta alokasi waktu per langkah.'
			}
		],
		sectionDef: {
			namaSection: 'Langkah-Langkah Kegiatan',
			instruksi: `Uraikan langkah-langkah kegiatan secara detail dan terstruktur.
Setiap langkah harus jelas peran guru dan siswa.
Sertakan alokasi waktu per langkah.`,
			outputSchema: `{
  "langkahKegiatan": [{
    "nomor": 1,
    "namaLangkah": "string",
    "aktivitasGuru": "string",
    "aktivitasSiswa": "string",
    "durasi": "string"
  }]
}`
		}
	},

	// ── SECTION LKPD ─────────────────────────────────────────────────────────

	capaian_lkpd: {
		jenis: 'lkpd',
		agentKey: 'capaian_lkpd',
		label: 'Capaian Pembelajaran LKPD',
		description: 'Tujuan pembelajaran spesifik untuk lembar kerja ini',
		batch: 1,
		critical: true,
		schemaFields: ['Tujuan Pembelajaran'],
		customPromptFields: [
			{
				key: 'tujuanPembelajaran',
				label: 'Tujuan Pembelajaran',
				placeholder: 'Contoh: Fokus pada kemampuan menganalisis data eksperimen',
				defaultInstruksi: 'Gunakan kata kerja operasional Taksonomi Bloom. Tujuan harus spesifik dan terukur untuk satu sesi LKPD.'
			}
		],
		sectionDef: {
			namaSection: 'Capaian Pembelajaran',
			instruksi: `Rancang tujuan pembelajaran untuk LKPD ini sesuai Kurikulum Merdeka.
Tujuan harus spesifik, terukur, dan dapat dicapai dalam satu sesi kegiatan.
Gunakan kata kerja operasional Taksonomi Bloom (C1–C6).`,
			outputSchema: `{
  "tujuanPembelajaran": [{ "nomor": 1, "tujuan": "string", "levelBloom": "C3" }],
  "indikatorKetercapaian": ["string"]
}`
		}
	},

	ringkasan_materi: {
		jenis: 'lkpd',
		agentKey: 'ringkasan_materi',
		label: 'Ringkasan Materi',
		description: 'Materi singkat, konsep kunci, dan fakta penting untuk siswa',
		batch: 2,
		critical: true,
		schemaFields: ['Materi Singkat', 'Konsep Kunci', 'Fakta Penting'],
		customPromptFields: [
			{
				key: 'materiSingkat',
				label: 'Materi Singkat',
				placeholder: 'Contoh: Tulis dalam gaya yang mudah dipahami siswa SMP',
				defaultInstruksi: 'Susun ringkasan materi yang padat dan relevan, 2-3 paragraf, ditulis untuk siswa bukan guru.'
			},
			{
				key: 'konsepKunci',
				label: 'Konsep Kunci',
				placeholder: 'Contoh: Fokus pada 3 konsep utama dengan definisi sederhana',
				defaultInstruksi: 'Definisi konsep harus sederhana, jelas, dan mudah diingat siswa.'
			},
			{
				key: 'faktaPenting',
				label: 'Fakta Penting',
				placeholder: 'Contoh: Sertakan angka/data yang menarik perhatian siswa',
				defaultInstruksi: 'Fakta harus relevan dengan kehidupan sehari-hari siswa.'
			}
		],
		sectionDef: {
			namaSection: 'Ringkasan Materi',
			instruksi: `Susun materi ringkas yang akan dibaca siswa sebelum atau saat mengerjakan LKPD.
Tulis untuk siswa (bukan guru) — bahasa jelas, kontekstual, tidak terlalu teknis.
Konsep kunci harus disertai definisi sederhana yang mudah diingat.
Fakta penting harus relevan dengan kehidupan sehari-hari atau menarik perhatian.`,
			outputSchema: `{
  "materiSingkat": "string",
  "konsepKunci": [{ "konsep": "string", "definisi": "string" }],
  "faktaPenting": ["string"]
}`
		}
	},

	langkah_kerja: {
		jenis: 'lkpd',
		agentKey: 'langkah_kerja',
		label: 'Langkah Kerja',
		description: 'Prosedur kegiatan: eksperimen, latihan soal, project karya, atau observasi',
		batch: 2,
		critical: true,
		schemaFields: ['Eksperimen', 'Latihan Soal', 'Project Karya', 'Observasi'],
		customPromptFields: [
			{
				key: 'langkahKegiatan',
				label: 'Instruksi Khusus Langkah Kerja',
				placeholder: 'Contoh: Gunakan alat yang tersedia di laboratorium sekolah, max 8 langkah',
				defaultInstruksi: 'Langkah harus urut, jelas, dan bisa dikerjakan mandiri oleh siswa tanpa bimbingan penuh guru.'
			}
		],
		sectionDef: {
			namaSection: 'Langkah Kerja',
			instruksi: `Susun langkah kerja sesuai jenis kegiatan yang dipilih (jenisKegiatan dari userInput).
Jika eksperimen: sertakan alat/bahan, prosedur step-by-step, dan tabel pengamatan.
Jika latihan soal: susun soal bertahap dari mudah ke sulit dengan ruang jawaban.
Jika project karya: sertakan tahap perencanaan, pembuatan, dan presentasi.
Jika observasi: sertakan panduan pengamatan, tabel pencatatan, dan pertanyaan analisis.
Setiap langkah harus bisa dikerjakan mandiri oleh siswa.
PENTING: Jangan gunakan tanda kutip ganda (") di dalam nilai string JSON.`,
			outputSchema: `{
  "jenisKegiatanAktif": ["string"],
  "alatBahan": ["string"],
  "langkahKerja": [{
    "bagian": "string",
    "tujuanBagian": "string",
    "langkah": [{
      "nomor": 1,
      "instruksi": "string",
      "ruangJawaban": true,
      "estimasiWaktu": "5 menit"
    }]
  }],
  "tabelPengamatan": {
    "judul": "string",
    "kolom": ["string"],
    "keterangan": "string"
  }
}`
		}
	},

	penilaian_lkpd: {
		jenis: 'lkpd',
		agentKey: 'penilaian_lkpd',
		label: 'Penilaian',
		description: 'Rubrik penilaian dan evaluasi hasil kerja siswa',
		batch: 2,
		critical: false,
		schemaFields: ['Rubrik Penilaian', 'Evaluasi & Penilaian'],
		customPromptFields: [
			{
				key: 'rubrikPenilaian',
				label: 'Rubrik Penilaian',
				placeholder: 'Contoh: Gunakan 4 level penilaian dengan deskripsi spesifik tiap aspek',
				defaultInstruksi: 'Rubrik harus operasional — deskripsi tiap level harus spesifik dan terukur, bukan generik.'
			},
			{
				key: 'evaluasiPenilaian',
				label: 'Evaluasi & Penilaian',
				placeholder: 'Contoh: Sertakan soal refleksi untuk siswa tentang proses belajar',
				defaultInstruksi: 'Evaluasi mencakup refleksi proses belajar dan penilaian diri siswa.'
			}
		],
		sectionDef: {
			namaSection: 'Penilaian',
			instruksi: `Rancang instrumen penilaian LKPD yang operasional.
Rubrik penilaian: tiap level harus deskripsinya spesifik dan terukur (bukan "baik", "cukup" tanpa keterangan).
Evaluasi mencakup soal refleksi siswa tentang proses dan hasil belajar.
Skor total rubrik harus 100.`,
			outputSchema: `{
  "rubrikPenilaian": [{
    "aspek": "string",
    "bobot": 25,
    "kriteria": {
      "sangat_baik": "string",
      "baik": "string",
      "cukup": "string",
      "perlu_bimbingan": "string"
    }
  }],
  "evaluasiRefleksi": ["string"],
  "totalBobot": 100
}`
		}
	}
};

/**
 * Ambil array section registry untuk ditampilkan di UI builder.
 * @returns {Array} list section yang bisa dipilih user
 */
export function getSectionRegistryList() {
	return Object.values(SECTION_REGISTRY);
}

/**
 * Ambil array section registry yang difilter berdasarkan jenis.
 * @param {'modul_ajar'|'lkpd'} jenis
 * @returns {Array} list section yang sesuai jenis
 */
export function getSectionRegistryByJenis(jenis) {
	return Object.values(SECTION_REGISTRY).filter(s => s.jenis === jenis);
}

/**
 * Ambil sectionDef dari registry berdasarkan agentKey.
 * @param {string} agentKey
 * @returns {Object|null}
 */
export function getSectionDef(agentKey) {
	return SECTION_REGISTRY[agentKey]?.sectionDef ?? null;
}

/**
 * Ambil metadata section dari registry berdasarkan agentKey.
 * @param {string} agentKey
 * @returns {Object|null}
 */
export function getSectionMeta(agentKey) {
	const entry = SECTION_REGISTRY[agentKey];
	if (!entry) return null;
	return {
		agentKey: entry.agentKey,
		label: entry.label,
		description: entry.description,
		batch: entry.batch,
		critical: entry.critical
	};
}

/**
 * Generic schema fallback untuk section kustom jika AI gagal generate schema.
 * Cukup untuk semua kebutuhan dasar guru — dirender oleh CustomTemplateRenderer
 * sebagai bullets atau table sesuai displayType.
 */
export const FALLBACK_CUSTOM_SCHEMA = JSON.stringify({
	judul: 'string',
	konten: ['string']
}, null, 2);
