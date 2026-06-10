import { BaseAgent } from '../base-agent.js';
import { OrchestratorAI } from '../orchestrator-ai.js';
import { generateDocx } from '../../tools/generate-docx.tool.js';
import { writeDB } from '../../tools/write-db.tool.js';
import { buildIdentitasFromInput } from '../../utils/kelas-fase.js';
import { lkpdStandarTemplate } from '../../templates/lkpd-standar.template.js';
import { lkpdTabelTemplate } from '../../templates/lkpd-tabel.template.js';

const TEMPLATE_REGISTRY = {
	'lkpd-standar': lkpdStandarTemplate,
	'lkpd-tabel':   lkpdTabelTemplate
};

export class LKPDAgent extends BaseAgent {
	constructor() {
		super('LKPDAgent', 'Koordinator LKPD', 'End-to-end pembuatan Lembar Kerja Peserta Didik');
	}

	buildIdentitasFromInput(input) {
		const identitas = buildIdentitasFromInput(input);
		// Override field spesifik LKPD
		identitas.alokasiWaktu = input.alokasiWaktu || input.alokasiPerPertemuan || '2x40 menit';
		identitas.jenisKegiatan = Array.isArray(input.jenisKegiatan)
			? input.jenisKegiatan.join(', ')
			: (input.jenisKegiatan || '');
		identitas.polaBelajar = input.polaBelajar || 'berkelompok';
		return identitas;
	}

	async run(userInput, onProgress) {
		this.log(`Starting: "${userInput.judul}"`);
		onProgress?.({ type: 'agent', name: 'LKPDAgent', action: 'start',
			message: `LKPDAgent → memulai "${userInput.judul}"` });

		// ── 1. Load template ──────────────────────────────────────────────────
		let template = TEMPLATE_REGISTRY[userInput.templateId] ?? lkpdStandarTemplate;

		if (userInput.templateId?.startsWith('custom-') && userInput.customSections?.length > 0) {
			// Normalisasi dari format lama (agentKey, title, batch, critical) ke format baru (key, label, critical)
			// Pertahankan promptMode & customFieldInstruksi agar kustom prompt user di-inject ke alur generate
			const normalizedSections = userInput.customSections.map(s => ({
				key: s.key || s.agentKey,
				label: s.label || s.title || s.agentKey,
				critical: s.critical !== undefined ? s.critical : true,
				promptMode: s.promptMode ?? 'default',
				customFieldInstruksi: s.customFieldInstruksi ?? {}
			}));
			template = {
				templateId: userInput.templateId,
				jenis: 'lkpd',
				isSystemTemplate: false,
				sections: normalizedSections
			};
		}
		this.log(`Template: ${template.templateId}`);

		// ── 2. Build identitas (no AI call) ───────────────────────────────────
		const identitasSchema = this.buildIdentitasFromInput(userInput);

		// ── 3. Delegasi ke OrchestratorAI ─────────────────────────────────────
		const orchestratorAI = new OrchestratorAI();
		const pipelineResult = await orchestratorAI.runPipeline(template, userInput, onProgress);

		if (!pipelineResult.success) {
			return this.fail(pipelineResult.error);
		}

		// ── 4. Build fullSchema ───────────────────────────────────────────────
		const fullSchema = {
			identitas: identitasSchema,
			...pipelineResult.merged
		};

		// ── 5. Generate DOCX ──────────────────────────────────────────────────
		onProgress?.({ type: 'tool', name: 'generate-docx', action: 'start',
			message: 'generate-docx → membuat file .docx LKPD...' });
		const docxResult = await generateDocx({ jenis: 'lkpd', schema: fullSchema, input: userInput });

		if (!docxResult.success) {
			return this.fail('Gagal generate dokumen DOCX');
		}

		onProgress?.({ type: 'tool', name: 'generate-docx', action: 'done',
			message: 'generate-docx → selesai ✓' });

		// ── 6. Simpan ke DB — fire-and-forget ─────────────────────────────────
		const dbRecord = {
			userId: userInput.userId,
			judul: userInput.judul,
			mapel: userInput.mapel,
			kelas: userInput.kelas,
			jenjang: userInput.jenjang,
			alokasiWaktu: userInput.alokasiWaktu,
			jenisKegiatan: userInput.jenisKegiatan,
			polaBelajar: userInput.polaBelajar,
			templateId: userInput.templateId || 'lkpd-standar',
			schema: fullSchema
		};

		if (template.templateId?.startsWith('custom-')) {
			dbRecord.templateSections = template.sections;
		}

		writeDB('lkpd', dbRecord)
			.then(() => onProgress?.({ type: 'tool', name: 'write-db', action: 'done',
				message: 'write-db → tersimpan ✓' }))
			.catch(() => {});

		onProgress?.({ type: 'agent', name: 'LKPDAgent', action: 'completed',
			message: 'LKPDAgent → selesai ✓' });

		return {
			success: true,
			schema: fullSchema,
			fileBuffer: docxResult.buffer,
			fileName: `LKPD_${userInput.judul}.docx`,
			qualityScore: null,
			tokenUsage: pipelineResult.tokenUsage,
			metadata: this.getMetadata()
		};
	}

	fail(error) {
		this.log(error, 'error');
		return { success: false, error };
	}
}
