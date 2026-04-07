/**
 * LKPD Orchestrator
 * 
 * Main coordinator untuk mengatur eksekusi semua agents
 * dalam proses pembuatan LKPD yang lengkap dan berkualitas
 * sesuai standar penyusunan LKPD
 */

import { IdentitasAgent } from './identitas-agent.js';
import { CapaianKompetensiAgent } from './capaian-kompetensi-agent.js';
import { PetunjukBelajarAgent } from './petunjuk-belajar-agent.js';
import { MateriPendukungAgent } from './materi-pendukung-agent.js';
import { LangkahKerjaAgent } from './langkah-kerja-agent.js';
import { EvaluasiRefleksiAgent } from './evaluasi-refleksi-agent.js';
import { ValidatorAgent } from './validator-agent.js';

export class LKPDOrchestrator {
	constructor() {
		this.agents = {
			identitas: new IdentitasAgent(),
			capaianKompetensi: new CapaianKompetensiAgent(),
			petunjukBelajar: new PetunjukBelajarAgent(),
			materiPendukung: new MateriPendukungAgent(),
			langkahKerja: new LangkahKerjaAgent(),
			evaluasiRefleksi: new EvaluasiRefleksiAgent(),
			validator: new ValidatorAgent()
		};

		this.state = {
			identitas: null,
			capaianKompetensi: null,
			petunjukBelajar: null,
			materiPendukung: null,
			langkahKerja: null,
			evaluasiRefleksi: null,
			validation: null
		};

		this.executionLog = [];
	}

	/**
	 * Generate LKPD lengkap dengan agentic AI system
	 * 
	 * @param {Object} userInput - Input dari user
	 * @param {Function} onProgress - Callback untuk update progress
	 * @returns {Promise<Object>} Result LKPD
	 */
	async generateLKPD(userInput, onProgress) {
		const totalSteps = 8; // 7 agents + 1 compilation
		let currentStep = 0;

		try {
			this.log('🚀 Starting LKPD generation with Agentic AI');

			// Step 1: Identitas LKPD
			currentStep++;
			onProgress?.({
				step: currentStep,
				total: totalSteps,
				phase: 'identitas',
				message: '📋 Menyusun identitas LKPD...',
				status: 'running'
			});

			const identitasResult = await this.agents.identitas.execute(userInput);
			if (!identitasResult.success) {
				throw new Error(`Identitas Agent: ${identitasResult.error}`);
			}
			this.state.identitas = identitasResult.data;
			this.executionLog.push({ agent: 'IdentitasAgent', success: true, time: identitasResult.metadata.lastExecutionTime });

			// Step 2: Capaian Kompetensi
			currentStep++;
			onProgress?.({
				step: currentStep,
				total: totalSteps,
				phase: 'capaian-kompetensi',
				message: '🎯 Menyusun capaian pembelajaran dan kompetensi...',
				status: 'running'
			});

			const capaianResult = await this.agents.capaianKompetensi.execute(userInput, {
				identitas: this.state.identitas
			});
			if (!capaianResult.success) {
				throw new Error(`Capaian Kompetensi Agent: ${capaianResult.error}`);
			}
			this.state.capaianKompetensi = capaianResult.data;
			this.executionLog.push({ agent: 'CapaianKompetensiAgent', success: true, time: capaianResult.metadata.lastExecutionTime });

			// Step 3: Petunjuk Belajar
			currentStep++;
			onProgress?.({
				step: currentStep,
				total: totalSteps,
				phase: 'petunjuk-belajar',
				message: '📖 Menyusun petunjuk belajar...',
				status: 'running'
			});

			const petunjukResult = await this.agents.petunjukBelajar.execute(userInput, {
				identitas: this.state.identitas,
				capaianKompetensi: this.state.capaianKompetensi
			});
			if (!petunjukResult.success) {
				throw new Error(`Petunjuk Belajar Agent: ${petunjukResult.error}`);
			}
			this.state.petunjukBelajar = petunjukResult.data;
			this.executionLog.push({ agent: 'PetunjukBelajarAgent', success: true, time: petunjukResult.metadata.lastExecutionTime });

			// Step 4: Materi Pendukung
			currentStep++;
			onProgress?.({
				step: currentStep,
				total: totalSteps,
				phase: 'materi-pendukung',
				message: '📚 Menyusun materi pendukung...',
				status: 'running'
			});

			const materiResult = await this.agents.materiPendukung.execute(userInput, {
				identitas: this.state.identitas,
				capaianKompetensi: this.state.capaianKompetensi
			});
			if (!materiResult.success) {
				throw new Error(`Materi Pendukung Agent: ${materiResult.error}`);
			}
			this.state.materiPendukung = materiResult.data;
			this.executionLog.push({ agent: 'MateriPendukungAgent', success: true, time: materiResult.metadata.lastExecutionTime });

			// Step 5: Langkah Kerja
			currentStep++;
			onProgress?.({
				step: currentStep,
				total: totalSteps,
				phase: 'langkah-kerja',
				message: '✏️ Menyusun langkah kerja dan tugas...',
				status: 'running'
			});

			const langkahResult = await this.agents.langkahKerja.execute(userInput, {
				identitas: this.state.identitas,
				capaianKompetensi: this.state.capaianKompetensi,
				petunjukBelajar: this.state.petunjukBelajar,
				materiPendukung: this.state.materiPendukung
			});
			if (!langkahResult.success) {
				throw new Error(`Langkah Kerja Agent: ${langkahResult.error}`);
			}
			this.state.langkahKerja = langkahResult.data;
			this.executionLog.push({ agent: 'LangkahKerjaAgent', success: true, time: langkahResult.metadata.lastExecutionTime });

			// Step 6: Evaluasi & Refleksi
			currentStep++;
			onProgress?.({
				step: currentStep,
				total: totalSteps,
				phase: 'evaluasi-refleksi',
				message: '📊 Menyusun evaluasi dan refleksi...',
				status: 'running'
			});

			const evaluasiResult = await this.agents.evaluasiRefleksi.execute(userInput, {
				identitas: this.state.identitas,
				capaianKompetensi: this.state.capaianKompetensi,
				langkahKerja: this.state.langkahKerja
			});
			if (!evaluasiResult.success) {
				throw new Error(`Evaluasi Refleksi Agent: ${evaluasiResult.error}`);
			}
			this.state.evaluasiRefleksi = evaluasiResult.data;
			this.executionLog.push({ agent: 'EvaluasiRefleksiAgent', success: true, time: evaluasiResult.metadata.lastExecutionTime });

			// Step 7: Validation
			currentStep++;
			onProgress?.({
				step: currentStep,
				total: totalSteps,
				phase: 'validation',
				message: '✅ Memvalidasi kualitas LKPD...',
				status: 'running'
			});

			const validationResult = await this.agents.validator.execute(userInput, this.state);
			if (!validationResult.success) {
				throw new Error(`Validator Agent: ${validationResult.error}`);
			}
			this.state.validation = validationResult.data;
			this.executionLog.push({ agent: 'ValidatorAgent', success: true, time: validationResult.metadata.lastExecutionTime });

			// Step 8: Compile Final LKPD
			currentStep++;
			onProgress?.({
				step: currentStep,
				total: totalSteps,
				phase: 'compilation',
				message: '📦 Menyusun LKPD final...',
				status: 'running'
			});

			const finalLKPD = this.compileLKPD();

			this.log('✅ LKPD generation completed successfully');

			onProgress?.({
				step: currentStep,
				total: totalSteps,
				phase: 'done',
				message: '✨ LKPD berhasil dibuat!',
				status: 'completed'
			});

			return {
				success: true,
				data: finalLKPD,
				metadata: {
					executionLog: this.executionLog,
					totalTime: this.executionLog.reduce((sum, log) => sum + log.time, 0),
					qualityScore: this.state.validation?.qualityScore || 0,
					timestamp: new Date().toISOString()
				}
			};

		} catch (error) {
			this.log(`Error during LKPD generation: ${error.message}`, 'error');
			
			onProgress?.({
				step: currentStep,
				total: totalSteps,
				phase: 'error',
				message: `❌ Error: ${error.message}`,
				status: 'error'
			});

			return {
				success: false,
				error: error.message,
				partialData: this.state,
				executionLog: this.executionLog
			};
		}
	}

	/**
	 * Compile semua komponen menjadi LKPD lengkap
	 */
	compileLKPD() {
		return {
			// Metadata
			metadata: {
				generatedAt: new Date().toISOString(),
				generatedBy: 'LKPD Agentic AI System',
				version: '1.0.0'
			},

			// Identitas LKPD
			identitas: this.state.identitas,

			// Capaian & Kompetensi
			capaianPembelajaran: this.state.capaianKompetensi?.capaianPembelajaran,
			tujuanPembelajaran: this.state.capaianKompetensi?.tujuanPembelajaran,

			// Petunjuk Belajar
			petunjukBelajar: this.state.petunjukBelajar,

			// Materi Pendukung
			materiPendukung: this.state.materiPendukung,

			// Langkah Kerja & Tugas
			langkahKerja: this.state.langkahKerja,

			// Evaluasi & Refleksi
			evaluasi: this.state.evaluasiRefleksi?.evaluasi,
			rubrikPenilaian: this.state.evaluasiRefleksi?.rubrikPenilaian,
			refleksiDiri: this.state.evaluasiRefleksi?.refleksiDiri,
			kesimpulan: this.state.evaluasiRefleksi?.kesimpulan,

			// Validasi & Kualitas
			validasi: {
				kualitasKeseluruhan: this.state.validation?.qualityScore || 0,
				syaratDidaktik: this.state.validation?.syaratDidaktik,
				syaratKonstruksi: this.state.validation?.syaratKonstruksi,
				syaratTeknis: this.state.validation?.syaratTeknis,
				rekomendasi: this.state.validation?.recommendations || []
			}
		};
	}

	/**
	 * Reset state untuk generation baru
	 */
	reset() {
		this.state = {
			identitas: null,
			capaianKompetensi: null,
			petunjukBelajar: null,
			materiPendukung: null,
			langkahKerja: null,
			evaluasiRefleksi: null,
			validation: null
		};
		this.executionLog = [];
	}

	/**
	 * Get current state
	 */
	getState() {
		return { ...this.state };
	}

	/**
	 * Logger
	 */
	log(message, level = 'info') {
		const timestamp = new Date().toISOString();
		const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
		console.log(`[${timestamp}] ${prefix} [LKPDOrchestrator] ${message}`);
	}
}
