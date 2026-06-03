import { BaseAgent } from '../base-agent.js';
import { runSubAgents } from '../../tools/run-sub-agents.tool.js';
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

		// ── 1. Load template ──────────────────────────────────────────────
		const template = TEMPLATE_REGISTRY[userInput.templateId] ?? modulAjarStandarTemplate;
		this.log(`Template: ${template.templateId}`);

		// ── 2. Build identitas (tidak berubah) ────────────────────────────
		onProgress?.({ type: 'agent', name: 'ModulAjarAgent', action: 'info',
			message: 'ModulAjarAgent → membangun identitas dari userInput (no AI call)' });
		const identitasSchema = this.buildIdentitasFromInput(userInput);

		// ── 3. Grouping sections per batch number ─────────────────────────
		const batchMap = {};
		for (const section of template.sections) {
			if (!batchMap[section.batch]) batchMap[section.batch] = [];
			batchMap[section.batch].push(section);
		}
		const batchNumbers = Object.keys(batchMap).map(Number).sort((a, b) => a - b);

		// ── 4. Akumulasi context & tokenUsage lintas batch ────────────────
		let mergedContext = { identitas: identitasSchema };
		const totalTokenUsage = { input: 0, cached: 0, output: 0 };

		// ── 5. Jalankan tiap batch secara sequential ──────────────────────
		for (const batchNum of batchNumbers) {
			const sectionsInBatch = batchMap[batchNum];
			const agentKeys = sectionsInBatch.map((s) => s.agentKey);
			const criticalKeys = sectionsInBatch.filter((s) => s.critical).map((s) => s.agentKey);

			// Build sectionDefs map: { agentKey: sectionDef }
			const sectionDefs = {};
			for (const section of sectionsInBatch) {
				sectionDefs[section.agentKey] = section.sectionDef;
			}

			onProgress?.({ type: 'agent', name: 'ModulAjarAgent', action: 'batch_start',
				batch: batchNum, agents: agentKeys,
				message: `Batch ${batchNum} → ${agentKeys.join(', ')}` });

			const batchResult = await runSubAgents({
				agents: agentKeys,
				input: userInput,
				context: mergedContext,
				critical: criticalKeys,
				sectionDefs,
				onProgress
			});

			if (!batchResult.success) {
				return this.fail(`Batch ${batchNum} gagal: ${Object.values(batchResult.errors).join(', ')}`);
			}

			// Angkat deskripsiUmum ke identitas
			if (batchResult.merged.capaian?.deskripsiUmum) {
				identitasSchema.deskripsiUmum = batchResult.merged.capaian.deskripsiUmum;
				delete batchResult.merged.capaian.deskripsiUmum;
			}

			// Merge hasil ke context untuk batch berikutnya
			mergedContext = { ...mergedContext, ...batchResult.merged };

			// Akumulasi token
			if (batchResult.tokenUsage) {
				totalTokenUsage.input  += batchResult.tokenUsage.input  || 0;
				totalTokenUsage.cached += batchResult.tokenUsage.cached || 0;
				totalTokenUsage.output += batchResult.tokenUsage.output || 0;
			}

			onProgress?.({ type: 'agent', name: 'ModulAjarAgent', action: 'batch_done',
				batch: batchNum, message: `Batch ${batchNum} selesai ✓` });
		}

		// ── 6. Build fullSchema ───────────────────────────────────────────
		const { identitas: _identitasDuplikat, ...restContext } = mergedContext;
		const fullSchema = {
			identitas: identitasSchema,
			...restContext
		};

		// ── 7. Generate DOCX ──────────────────────────────────────────────
		onProgress?.({ type: 'tool', name: 'generate-docx', action: 'start',
			message: 'generate-docx → membuat file .docx modul ajar...' });
		const docxResult = await generateDocx({ jenis: 'modul_ajar', schema: fullSchema, input: userInput });

		if (!docxResult.success) {
			onProgress?.({ type: 'tool', name: 'generate-docx', action: 'error',
				message: 'generate-docx → gagal ✗' });
			return this.fail('Gagal generate dokumen DOCX');
		}
		onProgress?.({ type: 'tool', name: 'generate-docx', action: 'done',
			message: 'generate-docx → selesai ✓' });

		// ── 8. Simpan ke DB — fire-and-forget ─────────────────────────────
		onProgress?.({ type: 'tool', name: 'write-db', action: 'start',
			message: 'write-db → menyimpan ke database...' });
		writeDB('modul_ajar', {
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
		}).then(() => onProgress?.({ type: 'tool', name: 'write-db', action: 'done',
			message: 'write-db → tersimpan ✓' })).catch(() => {});

		onProgress?.({ type: 'agent', name: 'ModulAjarAgent', action: 'completed',
			message: 'ModulAjarAgent → selesai ✓' });

		return {
			success: true,
			schema: fullSchema,
			fileBuffer: docxResult.buffer,
			fileName: `Modul_Ajar_${userInput.judul}.docx`,
			qualityScore: null,
			tokenUsage: totalTokenUsage,
			metadata: this.getMetadata()
		};
	}

	fail(error) {
		this.log(error, 'error');
		return { success: false, error };
	}
}
