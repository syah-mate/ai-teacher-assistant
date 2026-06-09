// Template LKPD Standar — layout heading dengan bullets
import { SECTION_REGISTRY } from './section-registry.js';

export const lkpdStandarTemplate = {
	templateId: 'lkpd-standar',
	label: 'LKPD Standar',
	description: 'Template LKPD lengkap — capaian, ringkasan materi, langkah kerja, dan penilaian. Cocok untuk semua jenis kegiatan.',
	kurikulum: 'Kurikulum Merdeka',
	jenis: 'lkpd',
	isSystemTemplate: true,

	sections: [
		// Batch 1 — sequential (harus selesai duluan, hasilnya jadi context batch 2)
		{
			id: 'capaian_lkpd',
			agentKey: 'capaian_lkpd',
			batch: 1,
			critical: true,
			sectionDef: SECTION_REGISTRY.capaian_lkpd.sectionDef
		},

		// Batch 2 — paralel
		{
			id: 'ringkasan_materi',
			agentKey: 'ringkasan_materi',
			batch: 2,
			critical: true,
			sectionDef: SECTION_REGISTRY.ringkasan_materi.sectionDef
		},
		{
			id: 'langkah_kerja',
			agentKey: 'langkah_kerja',
			batch: 2,
			critical: true,
			sectionDef: SECTION_REGISTRY.langkah_kerja.sectionDef
		},
		{
			id: 'penilaian_lkpd',
			agentKey: 'penilaian_lkpd',
			batch: 2,
			critical: false,
			sectionDef: SECTION_REGISTRY.penilaian_lkpd.sectionDef
		}
	]
};
