/**
 * Kurikulum Merdeka Base Templates
 * 
 * Master template untuk semua konten AI agar sesuai dengan
 * standar Kurikulum Merdeka Indonesia.
 */

/**
 * Mapping Kelas ke Fase Kurikulum Merdeka
 */
export const FASE_MAPPING = {
	1: 'A', // Kelas 1-2
	2: 'A',
	3: 'B', // Kelas 3-4
	4: 'B',
	5: 'C', // Kelas 5-6
	6: 'C',
	7: 'D', // Kelas 7-9 (SMP)
	8: 'D',
	9: 'D',
	10: 'E', // Kelas 10 (SMA)
	11: 'F', // Kelas 11-12 (SMA)
	12: 'F'
};

/**
 * Deskripsi Fase Kurikulum Merdeka
 */
export const FASE_DESKRIPSI = {
	A: 'Fase A (Kelas 1-2): Fase fondasi literasi dan numerasi awal',
	B: 'Fase B (Kelas 3-4): Fase penguatan literasi dan numerasi',
	C: 'Fase C (Kelas 5-6): Fase pengembangan kompetensi dasar',
	D: 'Fase D (Kelas 7-9): Fase penguatan kompetensi',
	E: 'Fase E (Kelas 10): Fase diversifikasi minat',
	F: 'Fase F (Kelas 11-12): Fase spesialisasi dan persiapan karir'
};

/**
 * Dimensi Profil Pelajar Pancasila
 */
export const PROFIL_PELAJAR_PANCASILA = {
	beriman: {
		nama: 'Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia',
		deskripsi:
			'Pelajar Indonesia yang berakhlak mulia adalah pelajar yang berakhlak dalam hubungannya dengan Tuhan Yang Maha Esa, sesama manusia, alam, dan negara.'
	},
	berkebinekaan: {
		nama: 'Berkebinekaan Global',
		deskripsi:
			'Pelajar Indonesia mempertahankan budaya luhur, lokalitas dan identitasnya, serta tetap berpikiran terbuka dalam berinteraksi dengan budaya lain.'
	},
	gotongRoyong: {
		nama: 'Bergotong Royong',
		deskripsi:
			'Pelajar Indonesia memiliki kemampuan untuk melakukan kegiatan secara bersama-sama dengan suka rela agar kegiatan yang dikerjakan dapat berjalan lancar, mudah, dan ringan.'
	},
	mandiri: {
		nama: 'Mandiri',
		deskripsi:
			'Pelajar Indonesia merupakan pelajar mandiri, yaitu pelajar yang bertanggung jawab atas proses dan hasil belajarnya.'
	},
	bernalarKritis: {
		nama: 'Bernalar Kritis',
		deskripsi:
			'Pelajar yang bernalar kritis mampu secara objektif memproses informasi baik kualitatif maupun kuantitatif, membangun keterkaitan antara berbagai informasi, menganalisis informasi, mengevaluasi dan menyimpulkannya.'
	},
	kreatif: {
		nama: 'Kreatif',
		deskripsi:
			'Pelajar yang kreatif mampu memodifikasi dan menghasilkan sesuatu yang orisinal, bermakna, bermanfaat, dan berdampak.'
	}
};

/**
 * Taksonomi Bloom dalam Bahasa Indonesia
 */
export const BLOOM_TAXONOMY = {
	C1: {
		level: 'Mengingat (Remember)',
		deskripsi: 'Kemampuan mengingat kembali informasi yang telah dipelajari',
		kataKerja: [
			'menyebutkan',
			'menjelaskan',
			'mendefinisikan',
			'mengidentifikasi',
			'menyatakan',
			'menunjukkan',
			'memberi label',
			'mengingat kembali'
		]
	},
	C2: {
		level: 'Memahami (Understand)',
		deskripsi: 'Kemampuan memahami dan menginterpretasikan informasi',
		kataKerja: [
			'menjelaskan',
			'menguraikan',
			'merangkum',
			'membedakan',
			'memprediksi',
			'mengklasifikasikan',
			'memberi contoh',
			'menafsirkan'
		]
	},
	C3: {
		level: 'Mengaplikasikan (Apply)',
		deskripsi: 'Kemampuan menggunakan informasi dalam situasi baru',
		kataKerja: [
			'menerapkan',
			'menggunakan',
			'melaksanakan',
			'mendemonstrasikan',
			'mengoperasikan',
			'menghitung',
			'memecahkan',
			'mempraktikkan'
		]
	},
	C4: {
		level: 'Menganalisis (Analyze)',
		deskripsi: 'Kemampuan memecah informasi menjadi bagian-bagian dan memahami hubungannya',
		kataKerja: [
			'menganalisis',
			'membandingkan',
			'mengkategorikan',
			'menguji',
			'mengorganisir',
			'menemukan',
			'menghubungkan',
			'menyimpulkan'
		]
	},
	C5: {
		level: 'Mengevaluasi (Evaluate)',
		deskripsi: 'Kemampuan membuat penilaian berdasarkan kriteria dan standar',
		kataKerja: [
			'mengevaluasi',
			'menilai',
			'mempertimbangkan',
			'memutuskan',
			'memilih',
			'menguji',
			'mempertahankan',
			'mengkritik'
		]
	},
	C6: {
		level: 'Mencipta (Create)',
		deskripsi: 'Kemampuan menggabungkan elemen untuk membentuk sesuatu yang baru',
		kataKerja: [
			'merancang',
			'membangun',
			'merencanakan',
			'memproduksi',
			'menemukan',
			'mengembangkan',
			'membuat',
			'menyusun'
		]
	}
};

/**
 * Model Pembelajaran yang Umum Digunakan
 */
export const MODEL_PEMBELAJARAN = {
	discoveryLearning: {
		nama: 'Discovery Learning',
		sintak: [
			'Stimulasi/Pemberian Rangsangan',
			'Identifikasi Masalah',
			'Pengumpulan Data',
			'Pengolahan Data',
			'Pembuktian',
			'Menarik Kesimpulan'
		],
		deskripsi:
			'Model pembelajaran yang menekankan pada proses penemuan konsep melalui eksplorasi dan investigasi mandiri.'
	},
	pbl: {
		nama: 'Problem Based Learning (PBL)',
		sintak: [
			'Orientasi Peserta Didik pada Masalah',
			'Mengorganisasi Peserta Didik untuk Belajar',
			'Membimbing Penyelidikan Individual/Kelompok',
			'Mengembangkan dan Menyajikan Hasil Karya',
			'Menganalisis dan Mengevaluasi Proses Pemecahan Masalah'
		],
		deskripsi:
			'Model pembelajaran yang menggunakan masalah dunia nyata sebagai konteks untuk belajar.'
	},
	projectBased: {
		nama: 'Project Based Learning',
		sintak: [
			'Penentuan Pertanyaan Mendasar',
			'Mendesain Perencanaan Proyek',
			'Menyusun Jadwal',
			'Monitoring',
			'Menguji Hasil',
			'Evaluasi Pengalaman'
		],
		deskripsi:
			'Model pembelajaran yang menggunakan proyek sebagai media pembelajaran untuk mencapai kompetensi.'
	},
	inquiryLearning: {
		nama: 'Inquiry Learning',
		sintak: [
			'Orientasi',
			'Merumuskan Masalah',
			'Merumuskan Hipotesis',
			'Mengumpulkan Data',
			'Menguji Hipotesis',
			'Merumuskan Kesimpulan'
		],
		deskripsi: 'Model pembelajaran yang menekankan pada proses pencarian dan penemuan pengetahuan.'
	}
};

/**
 * Template Asesmen Kurikulum Merdeka
 */
export const JENIS_ASESMEN = {
	diagnostik: {
		nama: 'Asesmen Diagnostik',
		tujuan: 'Mengidentifikasi kompetensi awal, kekuatan, dan kebutuhan peserta didik',
		waktu: 'Awal pembelajaran'
	},
	formatif: {
		nama: 'Asesmen Formatif',
		tujuan:
			'Memantau dan memperbaiki proses pembelajaran, serta mengevaluasi pencapaian tujuan pembelajaran',
		waktu: 'Selama proses pembelajaran'
	},
	sumatif: {
		nama: 'Asesmen Sumatif',
		tujuan: 'Mengevaluasi pencapaian hasil belajar peserta didik',
		waktu: 'Akhir pembelajaran atau akhir periode'
	}
};

/**
 * Template Rubrik Penilaian
 */
export const TEMPLATE_RUBRIK = {
	sangat_baik: {
		nilai: '86-100',
		predikat: 'Sangat Baik (A)',
		deskripsi: 'Menguasai kompetensi dengan sangat baik, mampu menerapkan di berbagai konteks'
	},
	baik: {
		nilai: '71-85',
		predikat: 'Baik (B)',
		deskripsi: 'Menguasai kompetensi dengan baik, mampu menerapkan di beberapa konteks'
	},
	cukup: {
		nilai: '56-70',
		predikat: 'Cukup (C)',
		deskripsi: 'Menguasai kompetensi dasar, perlu pendampingan dalam penerapan'
	},
	perlu_bimbingan: {
		nilai: '0-55',
		predikat: 'Perlu Bimbingan (D)',
		deskripsi: 'Belum menguasai kompetensi, perlu bimbingan intensif'
	}
};

/**
 * Komponen RPP/Modul Ajar Kurikulum Merdeka
 */
export const KOMPONEN_MODUL_AJAR = [
	'Informasi Umum',
	'Capaian Pembelajaran',
	'Tujuan Pembelajaran',
	'Profil Pelajar Pancasila',
	'Sarana dan Prasarana',
	'Target Peserta Didik',
	'Model Pembelajaran',
	'Kegiatan Pembelajaran',
	'Asesmen',
	'Pengayaan dan Remedial',
	'Refleksi Guru dan Peserta Didik',
	'Lampiran (LKPD, Bahan Bacaan, dll)'
];

/**
 * Generate system context untuk prompt AI - VERSI RINGKAS
 * Optimasi untuk menghemat token
 */
export function getKurikulumMerdekaContext(kelas, mataPelajaran) {
	const fase = FASE_MAPPING[kelas];

	return `Buat materi Kurikulum Merdeka untuk ${mataPelajaran} kelas ${kelas} (Fase ${fase}).

Prinsip: Student-centered, kontekstual, menyenangkan.
PPP: Beriman, Mandiri, Gotong Royong, Bernalar Kritis, Kreatif.
Tujuan: Gunakan Bloom C1-C6 (Ingat, Paham, Aplikasi, Analisis, Evaluasi, Cipta).
Gunakan bahasa Indonesia profesional.`;
}

/**
 * Generate learning objectives berdasarkan Bloom's taxonomy
 */
export function generateLearningObjective(topic, bloomLevel, kelas) {
	const bloom = BLOOM_TAXONOMY[bloomLevel];
	const kataKerja = bloom.kataKerja[0]; // Ambil kata kerja pertama sebagai default

	return `Peserta didik mampu ${kataKerja.toLowerCase()} ${topic.toLowerCase()} dengan benar sesuai tingkat ${
		bloom.level
	}.`;
}

/**
 * Get model pembelajaran details
 */
export function getModelPembelajaran(modelKey) {
	return MODEL_PEMBELAJARAN[modelKey] || MODEL_PEMBELAJARAN.discoveryLearning;
}

/**
 * Generate rubrik penilaian template
 */
export function generateRubrikTemplate(kriteria) {
	const rubrik = Object.entries(TEMPLATE_RUBRIK).map(([key, data]) => {
		return {
			kategori: data.predikat,
			rentangNilai: data.nilai,
			deskripsi: data.deskripsi,
			kriteria: kriteria || 'Sesuaikan dengan aspek yang dinilai'
		};
	});

	return rubrik;
}

export default {
	FASE_MAPPING,
	FASE_DESKRIPSI,
	PROFIL_PELAJAR_PANCASILA,
	BLOOM_TAXONOMY,
	MODEL_PEMBELAJARAN,
	JENIS_ASESMEN,
	TEMPLATE_RUBRIK,
	KOMPONEN_MODUL_AJAR,
	getKurikulumMerdekaContext,
	generateLearningObjective,
	getModelPembelajaran,
	generateRubrikTemplate
};
