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

export const SECTION_REGISTRY = {

	capaian: {
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

	asesmen: {
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
