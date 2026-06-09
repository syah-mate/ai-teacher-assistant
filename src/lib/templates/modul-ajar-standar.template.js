// src/lib/templates/modul-ajar-standar.template.js
import { SECTION_REGISTRY } from './section-registry.js';

export const modulAjarStandarTemplate = {
	templateId: 'modul-ajar-standar',
	label: 'Modul Ajar Standar',
	description: 'Template standar Kurikulum Merdeka — cocok untuk semua mata pelajaran',
	kurikulum: 'Kurikulum Merdeka',
	jenis: 'modul_ajar',
	isSystemTemplate: true, // ← flag: tidak bisa diedit user

	sections: [
		// ── BATCH 1 ──────────────────────────────────────────────────────
		{
			id: 'capaian',
			agentKey: 'capaian',
			batch: 1,
			critical: true,
			sectionDef: SECTION_REGISTRY.capaian.sectionDef
		},

		// ── BATCH 2 — paralel ────────────────────────────────────────────
		{
			id: 'kegiatan',
			agentKey: 'kegiatan',
			batch: 2,
			critical: true,
			sectionDef: SECTION_REGISTRY.kegiatan.sectionDef
		},
		{
			id: 'asesmen',
			agentKey: 'asesmen',
			batch: 2,
			critical: true,
			sectionDef: SECTION_REGISTRY.asesmen.sectionDef
		}
	]
};
