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
	 * userInput bisa mengandung templateId untuk custom template.
	 */
	_buildSoalSections(userInput) {
		const sections = [];
		const jenis = (userInput.jenisSoal || '').toLowerCase();

		// Jika template spesifik (misal dari custom template), gunakan sections dari template
		// Tapi tetap filter berdasarkan jenisSoal

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

		// ── 0. Proses file materi jika ada ────────────────────────────────────
		let materiText = '';
		if (userInput.materiFile?.data) {
			try {
				materiText = await this._extractTextFromFile(userInput.materiFile);
				if (materiText) {
					this.log(`File materi "${userInput.materiFile.name}" berhasil dibaca (${materiText.length} karakter)`);
					onProgress?.({ type: 'agent', name: 'SoalAgent', action: 'file_read',
						message: `SoalAgent → file materi "${userInput.materiFile.name}" terbaca ✓` });
				}
			} catch (err) {
				this.log(`Gagal baca file materi: ${err.message}`, 'warn');
			}
		}

		// ── 1. Build dynamic sections ─────────────────────────────────────────
		const sections = this._buildSoalSections(userInput);

		const jenisSoalLabel = userInput.jenisSoal || 'campuran';
		this.log(`Jenis soal: ${jenisSoalLabel} → ${sections.map(s => s.key).join(' + ')}`);

		// ── 2. Delegasi ke OrchestratorAI ─────────────────────────────────────
		const orchestratorAI = new OrchestratorAI();
		const template = {
			templateId: userInput.templateId || 'soal-standar',
			jenis: 'soal',
			isSystemTemplate: !userInput.templateId?.startsWith('custom-'),
			sections
		};

		// Inject materi text & konfigurasi soal ke userInput untuk konteks AI
		const enrichedInput = {
			...userInput,
			materiText, // teks hasil ekstraksi file (jika ada)
			// Normalisasi jumlah soal
			jumlahSoalPg: userInput.jenisSoal?.toLowerCase() === 'campuran'
				? (userInput.jumlahPg || 5)
				: (userInput.jenisSoal?.toLowerCase() === 'esai' ? 0 : (userInput.jumlahSoal || 10)),
			jumlahSoalEsai: userInput.jenisSoal?.toLowerCase() === 'campuran'
				? (userInput.jumlahEsai || 5)
				: (userInput.jenisSoal?.toLowerCase() === 'esai' ? (userInput.jumlahSoal || 5) : 0),
		};

		const pipelineResult = await orchestratorAI.runPipeline(template, enrichedInput, onProgress);

		if (!pipelineResult.success) {
			return this.fail(pipelineResult.error);
		}

		// ── 3. Build fullSchema ───────────────────────────────────────────────
		const fullSchema = { ...pipelineResult.merged };

		// ── 4. Generate DOCX ──────────────────────────────────────────────────
		onProgress?.({ type: 'tool', name: 'generate-docx', action: 'start',
			message: 'generate-docx → membuat file .docx soal...' });

		const docxResult = await generateDocx({ jenis: 'soal', schema: fullSchema, input: enrichedInput });

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
			jumlahPg: userInput.jumlahPg,
			jumlahEsai: userInput.jumlahEsai,
			tingkat: userInput.tingkat,
			levelBloom: userInput.levelBloom,
			selectedTingkat: userInput.selectedTingkat,
			templateId: userInput.templateId || 'soal-standar',
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

	/**
	 * Ekstrak teks dari file base64 (PDF/DOCX/TXT).
	 * Untuk TXT dan PDF sederhana (text-based), baca langsung.
	 * Untuk format lain, return base64 content sebagai string untuk diproses AI.
	 */
	async _extractTextFromFile(fileData) {
		const { data, mimeType, name } = fileData;

		// Untuk file teks — decode langsung
		if (mimeType === 'text/plain' || name?.endsWith('.txt')) {
			try {
				return atob(data);
			} catch {
				return `[File: ${name}] Konten tidak dapat didecode sebagai teks.`;
			}
		}

		// Untuk PDF/DOCX — kirim sebagai base64 agar AI bisa baca
		// AI (Gemini) bisa membaca file binary jika dikirim sebagai inline data
		return `[File terlampir: ${name} (${mimeType})]\nKonten file (base64): data:${mimeType};base64,${data}\n\nGunakan konten file di atas sebagai referensi utama materi pembuatan soal.`;
	}

	fail(error) {
		this.log(error, 'error');
		return { success: false, error };
	}
}
