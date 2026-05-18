import { BaseAgent } from '../base-agent.js';
import { runSubAgents } from '../../tools/run-sub-agents.tool.js';
import { generateDocx } from '../../tools/generate-docx.tool.js';
import { writeDB } from '../../tools/write-db.tool.js';

export class SoalAgent extends BaseAgent {
	constructor() {
		super('SoalAgent', 'Koordinator Soal', 'Pembuatan instrumen soal evaluasi');
	}

	async run(userInput, onProgress) {
		this.log(`Starting: "${userInput.judul}"`);
		onProgress?.({ type: 'agent', name: 'SoalAgent', action: 'start', message: `SoalAgent → memulai "${userInput.judul}"` });

		// Soal PG dan Esai tidak saling bergantung → paralel langsung
		const agentsToRun = [];
		// jenisSoal bisa: 'Pilihan Ganda', 'Esai', 'Campuran', 'pg', 'esai'
		const jenis = (userInput.jenisSoal || '').toLowerCase();
		if (jenis !== 'esai') agentsToRun.push('soal-pg');
		if (jenis !== 'pilihan ganda' && jenis !== 'pg') agentsToRun.push('soal-esai');
		// Jika tidak ada yang cocok (misal jenis tidak diisi), buat keduanya
		if (agentsToRun.length === 0) {
			agentsToRun.push('soal-pg', 'soal-esai');
		}

		onProgress?.({ type: 'agent', name: 'SoalAgent', action: 'batch_start', batch: 1, agents: agentsToRun, message: `Batch 1 → menjalankan ${agentsToRun.join(' + ')} secara paralel` });

		const batch1 = await runSubAgents({
			agents: agentsToRun,
			input: userInput,
			context: {},
			critical: agentsToRun,
			onProgress
		});

		if (!batch1.success)
			return this.fail(`Batch 1 gagal: ${Object.values(batch1.errors).join(', ')}`);
		onProgress?.({ type: 'agent', name: 'SoalAgent', action: 'batch_done', batch: 1, message: `Batch 1 selesai ✓ → ${agentsToRun.join(' & ')} tersedia` });

		const fullSchema = { ...batch1.merged };

		// Validator (non-critical)
		onProgress?.({ type: 'agent', name: 'SoalAgent', action: 'batch_start', batch: 2, agents: ['validator'], message: 'Batch 2 → menjalankan validator (non-critical)' });
		const batch2 = await runSubAgents({
			agents: ['validator'],
			input: userInput,
			context: fullSchema,
			critical: [],
			onProgress
		});
		if (batch2.schemas.validator) fullSchema.validator = batch2.schemas.validator;
		onProgress?.({ type: 'agent', name: 'SoalAgent', action: 'batch_done', batch: 2, message: 'Batch 2 selesai ✓ → validasi kualitas selesai' });

		onProgress?.({ type: 'tool', name: 'generate-docx', action: 'start', message: 'generate-docx → membuat file .docx soal...' });
		const docxResult = await generateDocx({ jenis: 'soal', schema: fullSchema, input: userInput });
		if (!docxResult.success) {
			onProgress?.({ type: 'tool', name: 'generate-docx', action: 'error', message: 'generate-docx → gagal ✗' });
			return this.fail('Gagal generate dokumen DOCX');
		}
		onProgress?.({ type: 'tool', name: 'generate-docx', action: 'done', message: 'generate-docx → selesai ✓' });

		// Simpan ke DB (fire-and-forget)
		onProgress?.({ type: 'tool', name: 'write-db', action: 'start', message: 'write-db → menyimpan ke database...' });
		writeDB('soal', {
			userId: userInput.userId,
			judul: userInput.judul,
			schema: fullSchema
		}).then(() => onProgress?.({ type: 'tool', name: 'write-db', action: 'done', message: 'write-db → tersimpan ✓' })).catch(() => {});

		onProgress?.({ type: 'agent', name: 'SoalAgent', action: 'completed', message: 'SoalAgent → selesai, mengembalikan hasil ke Orchestrator ✓' });

		const tokenUsage = {
			input: (batch1.tokenUsage?.input || 0) + (batch2.tokenUsage?.input || 0),
			cached: (batch1.tokenUsage?.cached || 0) + (batch2.tokenUsage?.cached || 0),
			output: (batch1.tokenUsage?.output || 0) + (batch2.tokenUsage?.output || 0)
		};

		return {
			success: true,
			schema: fullSchema,
			fileBuffer: docxResult.buffer,
			fileName: `Soal_${userInput.judul}.docx`,
			qualityScore: fullSchema.validator?.qualityScore ?? null,
			tokenUsage,
			metadata: this.getMetadata()
		};
	}

	fail(error) {
		this.log(error, 'error');
		return { success: false, error };
	}
}
