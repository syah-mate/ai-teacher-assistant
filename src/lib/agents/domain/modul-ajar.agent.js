import { BaseAgent } from '../base-agent.js';
import { OrchestratorAI } from '../orchestrator-ai.js';
import { generateDocx } from '../../tools/generate-docx.tool.js';
import { writeDB } from '../../tools/write-db.tool.js';
import { modulAjarStandarTemplate } from '../../templates/modul-ajar-standar.template.js';

// Registry template — key = templateId yang dikirim dari frontend
const TEMPLATE_REGISTRY = {
	'modul-ajar-standar': modulAjarStandarTemplate
};

export class ModulAjarAgent extends BaseAgent {
	constructor() {
		super(
			'ModulAjarAgent',
			'Koordinator Modul Ajar',
			'End-to-end pembuatan Modul Ajar Kurikulum Merdeka'
		);
	}

	/**
	 * Bangun schema identitas langsung dari userInput tanpa AI call.
	 * Semua field berasal dari form frontend.
	 * Field `deskripsiUmum` akan diisi oleh CapaianSubAgent.
	 */
	buildIdentitasFromInput(input) {
		const kelasToFase = {
			I: 'Fase A', II: 'Fase A', III: 'Fase B', IV: 'Fase B', V: 'Fase C', VI: 'Fase C',
			VII: 'Fase D', VIII: 'Fase D', IX: 'Fase D', X: 'Fase E', XI: 'Fase F', XII: 'Fase F'
		};
		const fase = input.fase || kelasToFase[input.kelas] || '';

		return {
			judul: input.judul,
			identitas: {
				satuan: input.jenjang,
				fase,
				kelas: `Kelas ${input.kelas}`,
				mataPelajaran: input.mapel,
				penulis: input.penulis || 'Guru Mata Pelajaran',
				instansi: input.instansi || 'Sekolah'
			},
			durasiTotal: `${input.jumlahPertemuan || 1} pertemuan`,
			alokasiWaktu: input.alokasiPerPertemuan,
			deskripsiUmum: ''
		};
	}

	async run(userInput, onProgress) {
		this.log(`Starting: "${userInput.judul}"`);
		onProgress?.({ type: 'agent', name: 'ModulAjarAgent', action: 'start',
			message: `ModulAjarAgent → memulai "${userInput.judul}"` });

		// ── 1. Load template ──────────────────────────────────────────────────
		let template = TEMPLATE_REGISTRY[userInput.templateId] ?? modulAjarStandarTemplate;

		// Jika custom template, sections dikirim langsung dari frontend
		if (userInput.templateId?.startsWith('custom-') && userInput.customSections?.length > 0) {
			// Normalisasi dari format lama (agentKey, title, batch, critical) ke format baru (key, label, critical)
			const normalizedSections = userInput.customSections.map(s => ({
				key: s.key || s.agentKey,
				label: s.label || s.title || s.agentKey,
				critical: s.critical !== undefined ? s.critical : true
			}));
			template = {
				templateId: userInput.templateId,
				jenis: 'modul_ajar',
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

		// ── 4. Angkat deskripsiUmum dari capaian ke identitas ─────────────────
		if (pipelineResult.merged.capaian?.deskripsiUmum) {
			identitasSchema.deskripsiUmum = pipelineResult.merged.capaian.deskripsiUmum;
			delete pipelineResult.merged.capaian.deskripsiUmum;
		}

		// ── 5. Build fullSchema ───────────────────────────────────────────────
		const fullSchema = {
			identitas: identitasSchema,
			...pipelineResult.merged
		};

		// ── 6. Generate DOCX ──────────────────────────────────────────────────
		onProgress?.({ type: 'tool', name: 'generate-docx', action: 'start',
			message: 'generate-docx → membuat file .docx modul ajar...' });

		const docxResult = await generateDocx({ jenis: 'modul_ajar', schema: fullSchema, input: userInput });

		if (!docxResult.success) {
			return this.fail('Gagal generate dokumen DOCX');
		}

		onProgress?.({ type: 'tool', name: 'generate-docx', action: 'done',
			message: 'generate-docx → selesai ✓' });

		// ── 7. Simpan ke DB — fire-and-forget ─────────────────────────────────
		const dbRecord = {
			userId: userInput.userId,
			judul: userInput.judul,
			mapel: userInput.mapel,
			kelas: userInput.kelas,
			jenjang: userInput.jenjang,
			metode: userInput.metode,
			modePembelajaran: userInput.modePembelajaran,
			jumlahPertemuan: userInput.jumlahPertemuan,
			alokasiPerPertemuan: userInput.alokasiPerPertemuan,
			templateId: userInput.templateId || 'modul-ajar-standar',
			schema: fullSchema
		};

		// Simpan templateSections untuk custom template agar renderer bisa membaca config
		if (template.templateId?.startsWith('custom-')) {
			dbRecord.templateSections = template.sections;
		}

		writeDB('modul_ajar', dbRecord)
			.then(() => onProgress?.({ type: 'tool', name: 'write-db', action: 'done',
				message: 'write-db → tersimpan ✓' }))
			.catch(() => {});

		onProgress?.({ type: 'agent', name: 'ModulAjarAgent', action: 'completed',
			message: 'ModulAjarAgent → selesai ✓' });

		return {
			success: true,
			schema: fullSchema,
			fileBuffer: docxResult.buffer,
			fileName: `Modul_Ajar_${userInput.judul}.docx`,
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
