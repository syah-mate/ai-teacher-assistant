import { BaseAgent } from '../base-agent.js';
import { runSubAgents } from '../../tools/run-sub-agents.tool.js';
import { generateDocx } from '../../tools/generate-docx.tool.js';
import { writeDB } from '../../tools/write-db.tool.js';

export class ModulAjarAgent extends BaseAgent {
	constructor() {
		super(
			'ModulAjarAgent',
			'Koordinator Modul Ajar',
			'End-to-end pembuatan Modul Ajar Kurikulum Merdeka'
		);
	}

	async run(userInput, onProgress) {
		this.log(`Starting: "${userInput.judul}"`);
		onProgress?.({ type: 'agent', name: 'ModulAjarAgent', action: 'start', message: `ModulAjarAgent → memulai "${userInput.judul}"` });

		// ── Batch 1: Identitas & Capaian PARALEL ──
		onProgress?.({ type: 'agent', name: 'ModulAjarAgent', action: 'batch_start', batch: 1, agents: ['identitas', 'capaian'], message: 'Batch 1 → menjalankan identitas + capaian secara paralel' });

		const batch1 = await runSubAgents({
			agents: ['identitas', 'capaian'],
			input: userInput,
			context: {},
			critical: ['identitas', 'capaian'],
			onProgress
		});

		if (!batch1.success) {
			return this.fail(`Batch 1 gagal: ${Object.values(batch1.errors).join(', ')}`);
		}
		onProgress?.({ type: 'agent', name: 'ModulAjarAgent', action: 'batch_done', batch: 1, message: 'Batch 1 selesai ✓ → identitas & capaian tersedia' });

		// ── Batch 2: Kegiatan & Asesmen PARALEL ──
		onProgress?.({ type: 'agent', name: 'ModulAjarAgent', action: 'batch_start', batch: 2, agents: ['kegiatan', 'asesmen'], message: 'Batch 2 → menjalankan kegiatan + asesmen secara paralel' });

		const batch2 = await runSubAgents({
			agents: ['kegiatan', 'asesmen'],
			input: userInput,
			context: batch1.merged,
			critical: ['kegiatan', 'asesmen'],
			onProgress
		});

		if (!batch2.success) {
			return this.fail(`Batch 2 gagal: ${Object.values(batch2.errors).join(', ')}`);
		}
		onProgress?.({ type: 'agent', name: 'ModulAjarAgent', action: 'batch_done', batch: 2, message: 'Batch 2 selesai ✓ → kegiatan & asesmen tersedia' });

		const fullSchema = { ...batch1.merged, ...batch2.merged };

		// ── Tool: Generate DOCX ──
		onProgress?.({ type: 'tool', name: 'generate-docx', action: 'start', message: 'generate-docx → membuat file .docx modul ajar...' });
		const docxResult = await generateDocx({ jenis: 'modul_ajar', schema: fullSchema, input: userInput });

		if (!docxResult.success) {
			onProgress?.({ type: 'tool', name: 'generate-docx', action: 'error', message: 'generate-docx → gagal ✗' });
			return this.fail('Gagal generate dokumen DOCX');
		}
		onProgress?.({ type: 'tool', name: 'generate-docx', action: 'done', message: 'generate-docx → selesai ✓' });

		// Simpan ke DB (fire-and-forget)
		onProgress?.({ type: 'tool', name: 'write-db', action: 'start', message: 'write-db → menyimpan ke database...' });
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
			schema: fullSchema
		}).then(() => onProgress?.({ type: 'tool', name: 'write-db', action: 'done', message: 'write-db → tersimpan ✓' })).catch(() => {});

		onProgress?.({ type: 'agent', name: 'ModulAjarAgent', action: 'completed', message: 'ModulAjarAgent → selesai, mengembalikan hasil ke Orchestrator ✓' });

		const tokenUsage = {
			input: (batch1.tokenUsage?.input || 0) + (batch2.tokenUsage?.input || 0),
			cached: (batch1.tokenUsage?.cached || 0) + (batch2.tokenUsage?.cached || 0),
			output: (batch1.tokenUsage?.output || 0) + (batch2.tokenUsage?.output || 0)
		};

		return {
			success: true,
			schema: fullSchema,
			fileBuffer: docxResult.buffer,
			fileName: `Modul_Ajar_${userInput.judul}.docx`,
			qualityScore: null,
			tokenUsage,
			metadata: this.getMetadata()
		};
	}

	fail(error) {
		this.log(error, 'error');
		return { success: false, error };
	}
}
