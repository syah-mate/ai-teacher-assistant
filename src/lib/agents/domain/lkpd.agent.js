import { BaseAgent } from '../base-agent.js';
import { runSubAgents } from '../../tools/run-sub-agents.tool.js';
import { generateDocx } from '../../tools/generate-docx.tool.js';
import { generateImage } from '../../tools/generate-image.tool.js';
import { writeDB } from '../../tools/write-db.tool.js';

export class LKPDAgent extends BaseAgent {
	constructor() {
		super('LKPDAgent', 'Koordinator LKPD', 'End-to-end pembuatan Lembar Kerja Peserta Didik');
	}

	async run(userInput, onProgress) {
		this.log(`Starting: "${userInput.judul}"`);
		onProgress?.({ type: 'agent', name: 'LKPDAgent', action: 'start', message: `LKPDAgent → memulai "${userInput.judul}"` });

		// ── Batch 1: Identitas & Capaian PARALEL ──
		onProgress?.({ type: 'agent', name: 'LKPDAgent', action: 'batch_start', batch: 1, agents: ['identitas', 'capaian'], message: 'Batch 1 → menjalankan identitas + capaian secara paralel' });

		const batch1 = await runSubAgents({
			agents: ['identitas', 'capaian'],
			input: userInput,
			context: {},
			critical: ['identitas', 'capaian'],
			onProgress
		});

		if (!batch1.success)
			return this.fail(`Batch 1 gagal: ${Object.values(batch1.errors).join(', ')}`);
		onProgress?.({ type: 'agent', name: 'LKPDAgent', action: 'batch_done', batch: 1, message: 'Batch 1 selesai ✓ → identitas & capaian tersedia' });

		// ── Batch 2: Materi, Langkah, Evaluasi PARALEL ──
		onProgress?.({ type: 'agent', name: 'LKPDAgent', action: 'batch_start', batch: 2, agents: ['materi', 'langkah', 'evaluasi'], message: 'Batch 2 → menjalankan materi + langkah + evaluasi secara paralel' });

		const batch2 = await runSubAgents({
			agents: ['materi', 'langkah', 'evaluasi'],
			input: userInput,
			context: batch1.merged,
			critical: ['materi', 'langkah', 'evaluasi'],
			onProgress
		});

		if (!batch2.success)
			return this.fail(`Batch 2 gagal: ${Object.values(batch2.errors).join(', ')}`);
		onProgress?.({ type: 'agent', name: 'LKPDAgent', action: 'batch_done', batch: 2, message: 'Batch 2 selesai ✓ → materi, langkah & evaluasi tersedia' });

		// ── Batch 3: Validator (non-critical) ──
		onProgress?.({ type: 'agent', name: 'LKPDAgent', action: 'batch_start', batch: 3, agents: ['validator'], message: 'Batch 3 → menjalankan validator (non-critical)' });
		const fullSchema = { ...batch1.merged, ...batch2.merged };

		const batch3 = await runSubAgents({
			agents: ['validator'],
			input: userInput,
			context: fullSchema,
			critical: [],
			onProgress
		});

		if (batch3.schemas.validator) fullSchema.validator = batch3.schemas.validator;
		onProgress?.({ type: 'agent', name: 'LKPDAgent', action: 'batch_done', batch: 3, message: 'Batch 3 selesai ✓ → validasi kualitas selesai' });

		// ── Tools PARALEL ──
		onProgress?.({ type: 'tool', name: 'generate-image', action: 'start', message: 'generate-image → membuat ilustrasi LKPD...' });
		onProgress?.({ type: 'tool', name: 'generate-docx', action: 'start', message: 'generate-docx → membuat file .docx LKPD...' });

		const [imageResult, docxResult] = await Promise.allSettled([
			generateImage({ prompt: `LKPD ${userInput.mapel}: ${userInput.judul}` }),
			generateDocx({ jenis: 'lkpd', schema: fullSchema, input: userInput })
		]);

		const imageUrl =
			imageResult.status === 'fulfilled' && imageResult.value.success
				? imageResult.value.url
				: null;
		onProgress?.({ type: 'tool', name: 'generate-image', action: imageUrl ? 'done' : 'warn', message: imageUrl ? 'generate-image → selesai ✓' : 'generate-image → dilewati (tidak tersedia)' });

		if (docxResult.status !== 'fulfilled' || !docxResult.value.success) {
			onProgress?.({ type: 'tool', name: 'generate-docx', action: 'error', message: 'generate-docx → gagal ✗' });
			return this.fail('Gagal generate dokumen DOCX');
		}
		onProgress?.({ type: 'tool', name: 'generate-docx', action: 'done', message: 'generate-docx → selesai ✓' });

		fullSchema.image = imageUrl;

		// Simpan ke DB (fire-and-forget)
		onProgress?.({ type: 'tool', name: 'write-db', action: 'start', message: 'write-db → menyimpan ke database...' });
		writeDB('lkpd', {
			userId: userInput.userId,
			judul: userInput.judul,
			schema: fullSchema
		}).then(() => onProgress?.({ type: 'tool', name: 'write-db', action: 'done', message: 'write-db → tersimpan ✓' })).catch(() => {});

		onProgress?.({ type: 'agent', name: 'LKPDAgent', action: 'completed', message: 'LKPDAgent → selesai, mengembalikan hasil ke Orchestrator ✓' });

		return {
			success: true,
			schema: fullSchema,
			fileBuffer: docxResult.value.buffer,
			fileName: `LKPD_${userInput.judul}.docx`,
			qualityScore: fullSchema.validator?.qualityScore ?? null,
			metadata: this.getMetadata()
		};
	}

	fail(error) {
		this.log(error, 'error');
		return { success: false, error };
	}
}
