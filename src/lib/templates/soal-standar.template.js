// Template Soal Standar — Kurikulum Merdeka
//
// Sections tidak perlu sectionDef lagi — schema ada di section-schema.js.
// Urutan array = urutan eksekusi sequential oleh OrchestratorAI.
// Untuk soal, user bisa pilih PG only / Esai only / campuran (keduanya).

export const soalStandarTemplate = {
	templateId: 'soal-standar',
	label: 'Soal Standar',
	description: 'Template soal lengkap — Pilihan Ganda + Esai sesuai Taksonomi Bloom (C1–C6). Cocok untuk semua mata pelajaran.',
	kurikulum: 'Kurikulum Merdeka',
	jenis: 'soal',
	isSystemTemplate: true,

	// Urutan array = urutan eksekusi sequential oleh OrchestratorAI
	// Sections akan difilter dinamis berdasarkan jenisSoal pilihan user
	sections: [
		{ key: 'soal-pg',   label: 'Soal Pilihan Ganda', critical: true },
		{ key: 'soal-esai', label: 'Soal Esai',          critical: true }
	]
};
