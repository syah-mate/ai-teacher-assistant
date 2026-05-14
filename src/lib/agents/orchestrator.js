/**
 * Single Orchestrator — Agentic AI System
 *
 * Satu orchestrator untuk semua jenis dokumen:
 * - modul_ajar (RPP/Modul Ajar Kurikulum Merdeka)
 * - lkpd (Lembar Kerja Peserta Didik)
 * - soal (Instrumen Soal Evaluasi)
 *
 * Orchestrator membaca userInput.jenis dan memutuskan sendiri
 * tool mana yang dipanggil dan urutannya via PIPELINES.
 */

import { IdentitasTool } from './tools/identitas.tool.js';
import { CapaianTool } from './tools/capaian.tool.js';
import { KegiatanTool } from './tools/kegiatan.tool.js';
import { AsesmenTool } from './tools/asesmen.tool.js';
import { LkpdContentTool } from './tools/lkpd-content.tool.js';
import { SoalTool } from './tools/soal.tool.js';
import { ImageTool } from './tools/image.tool.js';
import { ValidatorTool } from './tools/validator.tool.js';
import { CompilerTool } from './tools/compiler.tool.js';

// ─────────────────────────────────────────────────────
// Tool Registry — daftarkan semua tool yang tersedia
// ─────────────────────────────────────────────────────
const TOOL_REGISTRY = {
	identitas: () => new IdentitasTool(),
	capaian: () => new CapaianTool(),
	kegiatan: () => new KegiatanTool(),
	asesmen: () => new AsesmenTool(),
	lkpdContent: () => new LkpdContentTool(),
	soal: () => new SoalTool(),
	image: () => new ImageTool(),
	validator: () => new ValidatorTool(),
	compiler: () => new CompilerTool()
};

// ─────────────────────────────────────────────────────
// Pipeline definitions
// Urutan array = urutan eksekusi tool
// ─────────────────────────────────────────────────────
const PIPELINES = {
	modul_ajar: ['identitas', 'capaian', 'kegiatan', 'asesmen', 'image', 'validator', 'compiler'],
	lkpd: ['identitas', 'capaian', 'lkpdContent', 'image', 'validator', 'compiler'],
	soal: ['soal', 'image', 'validator', 'compiler']
};

// Non-critical tools: jika gagal, pipeline tetap lanjut
const NON_CRITICAL_TOOLS = new Set(['image', 'validator']);

export class Orchestrator {
	/**
	 * Entry point utama
	 *
	 * @param {Object} userInput
	 * @param {string} userInput.jenis - 'modul_ajar' | 'lkpd' | 'soal'
	 * @param {string} userInput.judul - Judul/topik dokumen
	 * @param {string} userInput.mapel - Mata pelajaran
	 * @param {string} userInput.kelas - Kelas (I-XII)
	 * @param {Function} [onProgress]  - callback({ step, total, phase, message, status })
	 * @returns {Promise<Object>}
	 */
	async generate(userInput, onProgress) {
		const pipeline = PIPELINES[userInput.jenis];

		if (!pipeline) {
			return {
				success: false,
				error: `Jenis dokumen tidak dikenal: ${userInput.jenis}`
			};
		}

		// Cek rate limit sekali di awal
		const session = await this.startSession();
		if (!session.ok) {
			return { success: false, error: session.error };
		}

		const totalSteps = pipeline.length;
		const context = {}; // shared memory antar tool
		const executionLog = [];

		this.log(`🚀 Starting generation: ${userInput.jenis} — "${userInput.judul}"`);

		try {
			for (let i = 0; i < pipeline.length; i++) {
				const toolName = pipeline[i];
				const tool = TOOL_REGISTRY[toolName]();
				const isCritical = !NON_CRITICAL_TOOLS.has(toolName);

				onProgress?.({
					step: i + 1,
					total: totalSteps,
					phase: toolName,
					message: this.getProgressMessage(toolName),
					status: 'running'
				});

				const result = await tool.execute(userInput, context);

				if (!result.success && isCritical) {
					throw new Error(`[${toolName}] ${result.error}`);
				}

				// Simpan output ke context dengan key = nama tool
				context[toolName] = result.success ? result.data : null;
				executionLog.push({
					tool: toolName,
					success: result.success,
					time: result.metadata?.lastExecutionTime || 0
				});

				if (!result.success && !isCritical) {
					this.log(`⚠️ Non-critical tool "${toolName}" failed: ${result.error}`, 'warn');
				}
			}

			// Hitung quota setelah seluruh pipeline sukses
			await this.completeSession();

			onProgress?.({
				step: totalSteps,
				total: totalSteps,
				phase: 'completed',
				message: '✅ Dokumen berhasil dibuat!',
				status: 'completed'
			});

			const qualityScore =
				context.validator?.qualityScore ??
				context.validator?.score ??
				null;

			return {
				success: true,
				dokumen: context.compiler, // output final dari CompilerTool
				rawContext: context, // semua intermediate output
				metadata: {
					jenis: userInput.jenis,
					pipeline,
					executionLog,
					qualityScore,
					generatedAt: new Date().toISOString()
				}
			};
		} catch (error) {
			onProgress?.({
				phase: 'error',
				message: `❌ ${error.message}`,
				status: 'error'
			});

			return {
				success: false,
				error: error.message,
				partialContext: context,
				executionLog
			};
		}
	}

	getProgressMessage(toolName) {
		const messages = {
			identitas: '📋 Menyusun identitas dokumen...',
			capaian: '🎯 Merancang capaian & tujuan pembelajaran...',
			kegiatan: '🏫 Menyusun kegiatan pembelajaran...',
			asesmen: '📝 Merancang instrumen asesmen...',
			lkpdContent: '📄 Menyusun konten LKPD...',
			soal: '❓ Membuat soal evaluasi...',
			image: '🎨 Membuat ilustrasi AI...',
			validator: '✅ Memvalidasi kualitas dokumen...',
			compiler: '📄 Menyusun dokumen final...'
		};
		return messages[toolName] || `⚙️ Menjalankan ${toolName}...`;
	}

	async startSession() {
		try {
			const res = await fetch('/api/generate-session/start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				if (res.status === 429) {
					return {
						ok: false,
						error: data.error || 'Batas generate tercapai. Silakan tunggu hingga kuota reset.'
					};
				}
				return { ok: false, error: data.error || 'Gagal memulai sesi generate' };
			}

			return { ok: true };
		} catch (error) {
			return { ok: false, error: 'Gagal terhubung ke server: ' + error.message };
		}
	}

	async completeSession() {
		try {
			const res = await fetch('/api/generate-session/complete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			if (res.ok) {
				const data = await res.json();
				this.log(`✅ Generate counted. Remaining: ${data.remaining}/${data.limit}`);
			} else {
				this.log('⚠️ Failed to count generate, but result is still valid', 'warn');
			}
		} catch (error) {
			this.log('⚠️ Failed to count generate (non-critical): ' + error.message, 'warn');
		}
	}

	log(message, level = 'info') {
		const timestamp = new Date().toISOString();
		const prefix = `[${timestamp}] [Orchestrator]`;

		switch (level) {
			case 'error':
				console.error(`${prefix} ❌`, message);
				break;
			case 'warn':
				console.warn(`${prefix} ⚠️`, message);
				break;
			default:
				console.log(`${prefix} ℹ️`, message);
		}
	}
}
