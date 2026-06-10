// Template LKPD Standar — layout heading dengan bullets
//
// Sections tidak perlu sectionDef lagi — schema ada di section-schema.js.
// Urutan array = urutan eksekusi sequential oleh OrchestratorAI.

export const lkpdStandarTemplate = {
	templateId: 'lkpd-standar',
	label: 'LKPD Standar',
	description: 'Template LKPD lengkap — capaian, ringkasan materi, langkah kerja, dan penilaian. Cocok untuk semua jenis kegiatan.',
	kurikulum: 'Kurikulum Merdeka',
	jenis: 'lkpd',
	isSystemTemplate: true,

	// Urutan array = urutan eksekusi sequential oleh OrchestratorAI
	sections: [
		{ key: 'capaian_lkpd',     label: 'Capaian Pembelajaran LKPD', critical: true },
		{ key: 'ringkasan_materi', label: 'Ringkasan Materi',          critical: true },
		{ key: 'langkah_kerja',    label: 'Langkah Kerja',             critical: true },
		{ key: 'penilaian_lkpd',   label: 'Penilaian LKPD',            critical: false }
	]
};
