import { BaseAgent } from '../base-agent.js';
import { OrchestratorAI } from '../orchestrator-ai.js';
import { generateDocx } from '../../tools/generate-docx.tool.js';
import { writeDB } from '../../tools/write-db.tool.js';

export class SoalAgent extends BaseAgent {
	constructor() {
		super('SoalAgent', 'Koordinator Soal', 'Pembuatan instrumen soal evaluasi');
	}

	/**
	 * Bangun sections array dinamis berdasarkan jenisSoal dari userInput.
	 * Soal PG dan Esai jalan sequential dengan OrchestratorAI.
	 */
	_buildSoalSections(userInput) {
		const sections = [];
		const jenis = (userInput.jenisSoal || '').toLowerCase();

		if (jenis !== 'esai') {
			sections.push({ key: 'soal-pg', label: 'Soal Pilihan Ganda', critical: true });
		}
		if (jenis !== 'pilihan ganda' && jenis !== 'pg') {
			sections.push({ key: 'soal-esai', label: 'Soal Esai', critical: true });
		}
		// Jika tidak ada yang cocok, buat keduanya
		if (sections.length === 0) {
			sections.push(
				{ key: 'soal-pg', label: 'Soal Pilihan Ganda', critical: true },
				{ key: 'soal-esai', label: 'Soal Esai', critical: true }
			);
		}

		return sections;
	}

	async run(userInput, onProgress) {
		this.log(`Starting: "${userInput.judul}"`);
		onProgress?.({ type: 'agent', name: 'SoalAgent', action: 'start',
			message: `SoalAgent → memulai "${userInput.judul}"` });

		// ── 1. Build dynamic sections ─────────────────────────────────────────
		const sections = this._buildSoalSections(userInput);

		this.log(`Jenis soal: ${userInput.jenisSoal || 'campuran'} → ${sections.map(s => s.key).join(' + ')}`);

		// ── 2. Delegasi ke OrchestratorAI ─────────────────────────────────────
		const orchestratorAI = new OrchestratorAI();
		const template = {
			templateId: 'soal',
			jenis: 'soal',
			isSystemTemplate: true,
			sections
		};

		const pipelineResult = await orchestratorAI.runPipeline(template, userInput, onProgress);

		if (!pipelineResult.success) {
			return this.fail(pipelineResult.error);
		}

		// ── 3. Build fullSchema ───────────────────────────────────────────────
		const fullSchema = { ...pipelineResult.merged };

		// ── 4. Generate DOCX ──────────────────────────────────────────────────
		onProgress?.({ type: 'tool', name: 'generate-docx', action: 'start',
			message: 'generate-docx → membuat file .docx soal...' });

		const docxResult = await generateDocx({ jenis: 'soal', schema: fullSchema, input: userInput });

		if (!docxResult.success) {
			return this.fail('Gagal generate dokumen DOCX');
		}

		onProgress?.({ type: 'tool', name: 'generate-docx', action: 'done',
			message: 'generate-docx → selesai ✓' });

		// ── 5. Simpan ke DB — fire-and-forget ─────────────────────────────────
		writeDB('soal', {
			userId: userInput.userId,
			judul: userInput.judul,
			mapel: userInput.mapel,
			kelas: userInput.kelas,
			jenjang: userInput.jenjang,
			jenisSoal: userInput.jenisSoal,
			jumlahSoal: userInput.jumlahSoal,
			tingkat: userInput.tingkat,
			levelBloom: userInput.levelBloom,
			schema: fullSchema
		})
			.then(() => onProgress?.({ type: 'tool', name: 'write-db', action: 'done',
				message: 'write-db → tersimpan ✓' }))
			.catch(() => {});

		onProgress?.({ type: 'agent', name: 'SoalAgent', action: 'completed',
			message: 'SoalAgent → selesai ✓' });

		return {
			success: true,
			schema: fullSchema,
			fileBuffer: docxResult.buffer,
			fileName: `Soal_${userInput.judul}.docx`,
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
