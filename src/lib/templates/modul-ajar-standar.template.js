// src/lib/templates/modul-ajar-standar.template.js
//
// Template Modul Ajar Standar — Kurikulum Merdeka
// Sections tidak perlu sectionDef lagi — schema ada di section-schema.js.
// Urutan array = urutan eksekusi sequential oleh OrchestratorAI.

export const modulAjarStandarTemplate = {
	templateId: 'modul-ajar-standar',
	label: 'Modul Ajar Standar',
	description: 'Template standar Kurikulum Merdeka — cocok untuk semua mata pelajaran',
	kurikulum: 'Kurikulum Merdeka',
	jenis: 'modul_ajar',
	isSystemTemplate: true,

	// Urutan array = urutan eksekusi sequential oleh OrchestratorAI
	sections: [
		{ key: 'capaian',  label: 'Capaian & Tujuan Pembelajaran', critical: true },
		{ key: 'kegiatan', label: 'Kegiatan Pembelajaran',          critical: true },
		{ key: 'asesmen',  label: 'Asesmen Pembelajaran',           critical: true }
	]
};
