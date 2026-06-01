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
		onProgress?.({ type: 'agent', name: 'ModulAjarAgent', action: 'start', message: `ModulAjarAgent → memulai "${userInput.judul}"` });

		// ── Bangun identitas dari userInput (tanpa AI call) ──
		onProgress?.({ type: 'agent', name: 'ModulAjarAgent', action: 'info', message: 'ModulAjarAgent → membangun identitas dari userInput (no AI call)' });
		const identitasSchema = this.buildIdentitasFromInput(userInput);

		// ── Batch 1: Capaian (single agent) ──
		onProgress?.({ type: 'agent', name: 'ModulAjarAgent', action: 'batch_start', batch: 1, agents: ['capaian'], message: 'Batch 1 → menjalankan capaian' });

		const batch1 = await runSubAgents({
			agents: ['capaian'],
			input: userInput,
			context: { identitas: identitasSchema },
			critical: ['capaian'],
			onProgress
		});

		if (!batch1.success) {
			return this.fail(`Batch 1 gagal: ${Object.values(batch1.errors).join(', ')}`);
		}

		if (batch1.merged.capaian?.deskripsiUmum) {
			identitasSchema.deskripsiUmum = batch1.merged.capaian.deskripsiUmum;
			delete batch1.merged.capaian.deskripsiUmum;
		}

		onProgress?.({ type: 'agent', name: 'ModulAjarAgent', action: 'batch_done', batch: 1, message: 'Batch 1 selesai ✓ → capaian tersedia' });

		// ── Batch 2: Kegiatan & Asesmen PARALEL ──
		onProgress?.({ type: 'agent', name: 'ModulAjarAgent', action: 'batch_start', batch: 2, agents: ['kegiatan', 'asesmen'], message: 'Batch 2 → menjalankan kegiatan + asesmen secara paralel' });

		const batch2 = await runSubAgents({
			agents: ['kegiatan', 'asesmen'],
			input: userInput,
			context: { ...batch1.merged, identitas: identitasSchema },
			critical: ['kegiatan', 'asesmen'],
			onProgress
		});

		if (!batch2.success) {
			return this.fail(`Batch 2 gagal: ${Object.values(batch2.errors).join(', ')}`);
		}
		onProgress?.({ type: 'agent', name: 'ModulAjarAgent', action: 'batch_done', batch: 2, message: 'Batch 2 selesai ✓ → kegiatan & asesmen tersedia' });

		const fullSchema = {
			identitas: identitasSchema,
			...batch1.merged,
			...batch2.merged
		};

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
