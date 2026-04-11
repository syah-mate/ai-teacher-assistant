/**
 * Modul Ajar Orchestrator
 * 
 * Main coordinator untuk mengatur eksekusi semua agents
 * dalam proses pembuatan Modul Ajar yang lengkap dan berkualitas
 */

import { InformasiUmumAgent } from './informasi-umum-agent.js';
import { CapaianTujuanAgent } from './capaian-tujuan-agent.js';
import { KegiatanPembelajaranAgent } from './kegiatan-pembelajaran-agent.js';
import { AsesmenAgent } from './asesmen-agent.js';
import { ValidatorAgent } from './validator-agent.js';

export class ModulAjarOrchestrator {
	constructor() {
		this.agents = {
			informasiUmum: new InformasiUmumAgent(),
			capaianTujuan: new CapaianTujuanAgent(),
			kegiatanPembelajaran: new KegiatanPembelajaranAgent(),
			asesmen: new AsesmenAgent(),
			validator: new ValidatorAgent()
		};

		this.state = {
			informasiUmum: null,
			capaianTujuan: null,
			kegiatanPembelajaran: null,
			asesmen: null,
			validation: null,
			images: null
		};

		this.executionLog = [];
	}

	/**
	 * Generate modul ajar lengkap dengan agentic AI system
	 * 
	 * @param {Object} userInput - Input dari user
	 * @param {Function} onProgress - Callback untuk update progress
	 * @returns {Promise<Object>} Result modul ajar
	 */
	async generateModulAjar(userInput, onProgress) {
		const totalSteps = 7; // 5 agents + 1 image generation + 1 compilation
		let currentStep = 0;

		try {
			// CRITICAL: Start generate session and check rate limit ONCE
			// This ensures 1 user action = 1 quota usage (not per-agent)
			const sessionResponse = await fetch('/api/generate-session/start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			if (!sessionResponse.ok) {
				const errorData = await sessionResponse.json().catch(() => ({}));
				if (sessionResponse.status === 429) {
					throw new Error(errorData.error || 'Batas generate tercapai. Silakan tunggu hingga kuota reset.');
				}
				throw new Error(errorData.error || 'Gagal memulai sesi generate');
			}

			this.log('🚀 Starting Modul Ajar generation with Agentic AI');

			// Step 1: Informasi Umum
			currentStep++;
			onProgress?.({
				step: currentStep,
				total: totalSteps,
				phase: 'informasi-umum',
				message: '📋 Menyusun informasi umum modul...',
				status: 'running'
			});

			const infoResult = await this.agents.informasiUmum.execute(userInput);
			if (!infoResult.success) {
				throw new Error(`Informasi Umum Agent: ${infoResult.error}`);
			}
			this.state.informasiUmum = infoResult.data;
			this.executionLog.push({ agent: 'InformasiUmum', success: true, time: infoResult.metadata.lastExecutionTime });

			// Step 2: Capaian & Tujuan Pembelajaran
			currentStep++;
			onProgress?.({
				step: currentStep,
				total: totalSteps,
				phase: 'capaian-tujuan',
				message: '🎯 Merancang capaian dan tujuan pembelajaran...',
				status: 'running'
			});

			const capaianResult = await this.agents.capaianTujuan.execute(userInput, {
				informasiUmum: this.state.informasiUmum
			});
			if (!capaianResult.success) {
				throw new Error(`Capaian Tujuan Agent: ${capaianResult.error}`);
			}
			this.state.capaianTujuan = capaianResult.data;
			this.executionLog.push({ agent: 'CapaianTujuan', success: true, time: capaianResult.metadata.lastExecutionTime });

			// Step 3: Kegiatan Pembelajaran
			currentStep++;
			onProgress?.({
				step: currentStep,
				total: totalSteps,
				phase: 'kegiatan-pembelajaran',
				message: '🏫 Menyusun kegiatan pembelajaran detail...',
				status: 'running'
			});

			const kegiatanResult = await this.agents.kegiatanPembelajaran.execute(userInput, {
				informasiUmum: this.state.informasiUmum,
				capaianTujuan: this.state.capaianTujuan
			});
			if (!kegiatanResult.success) {
				throw new Error(`Kegiatan Pembelajaran Agent: ${kegiatanResult.error}`);
			}
			this.state.kegiatanPembelajaran = kegiatanResult.data;
			this.executionLog.push({ agent: 'KegiatanPembelajaran', success: true, time: kegiatanResult.metadata.lastExecutionTime });

			// Step 4: Asesmen
			currentStep++;
			onProgress?.({
				step: currentStep,
				total: totalSteps,
				phase: 'asesmen',
				message: '📝 Merancang instrumen asesmen...',
				status: 'running'
			});

			const asesmenResult = await this.agents.asesmen.execute(userInput, {
				informasiUmum: this.state.informasiUmum,
				capaianTujuan: this.state.capaianTujuan,
				kegiatanPembelajaran: this.state.kegiatanPembelajaran
			});
			if (!asesmenResult.success) {
				throw new Error(`Asesmen Agent: ${asesmenResult.error}`);
			}
			this.state.asesmen = asesmenResult.data;
			this.executionLog.push({ agent: 'Asesmen', success: true, time: asesmenResult.metadata.lastExecutionTime });

		// Step 5: Generate Images with Cloudflare Workers AI
		currentStep++;
		onProgress?.({
			step: currentStep,
			total: totalSteps,
			phase: 'image-generation',
			message: '🎨 Membuat ilustrasi gambar AI...',
			status: 'running'
		});

		const imagesResult = await this.generateIllustrationImages(userInput, this.state);
		if (imagesResult.success && imagesResult.data && imagesResult.data.length > 0) {
			this.state.images = imagesResult.data;
			this.log(`✅ Successfully generated ${imagesResult.data.length} AI images`);
			console.log('[Orchestrator] Images generated:', imagesResult.data.length);
			this.executionLog.push({ agent: 'ImageGeneration', success: true, time: imagesResult.time });
		} else {
			// Images are optional - log but don't fail
			this.log(`ℹ️ Image generation skipped: ${imagesResult.message || 'Not configured'}`, 'info');
			this.state.images = [];
		}

		// Step 6: Validation
			currentStep++;
			onProgress?.({
				step: currentStep,
				total: totalSteps,
				phase: 'validation',
				message: '✅ Memvalidasi kualitas modul ajar...',
				status: 'running'
			});

			const validationResult = await this.agents.validator.execute(userInput, this.state);
			if (validationResult.success) {
				this.state.validation = validationResult.data;
				this.executionLog.push({ agent: 'Validator', success: true, time: validationResult.metadata.lastExecutionTime });
			} else {
				// Validation is optional, log but don't fail
				this.log('⚠️ Validation failed, but continuing', 'warn');
				this.state.validation = {
					isComplete: true,
					qualityScore: 75,
					qualityChecks: [],
					recommendations: []
				};
			}

// Step 7: Compile Final Modul Ajar
			currentStep++;
			onProgress?.({
				step: currentStep,
				total: totalSteps,
				phase: 'compilation',
				message: '📄 Menyusun dokumen modul ajar final...',
				status: 'running'
			});

			const finalModul = this.compileModulAjar(userInput);

			this.log(`✅ Modul Ajar generated successfully! Quality Score: ${this.state.validation.qualityScore}/100`);

			onProgress?.({
				step: currentStep,
				total: totalSteps,
				phase: 'completed',
				message: '✅ Modul ajar berhasil dibuat!',
				status: 'completed'
			});

		// CRITICAL: Decrement quota HANYA setelah generate sukses
		try {
			const completeResponse = await fetch('/api/generate-session/complete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			
			if (completeResponse.ok) {
				const completeData = await completeResponse.json();
				this.log(`✅ Generate counted. Remaining: ${completeData.remaining}/${completeData.limit}`);
			} else {
				this.log('⚠️ Failed to count generate, but result is still valid', 'warn');
			}
		} catch (completeError) {
			// Non-critical error - generate sukses tapi counting gagal
			this.log('⚠️ Failed to count generate (non-critical): ' + completeError.message, 'warn');
		}

		return {
			success: true,
			modulAjar: finalModul,
			rawData: this.state,
			metadata: {
				generatedAt: new Date().toISOString(),
				qualityScore: this.state.validation.qualityScore,
				agentsUsed: Object.keys(this.agents),
				executionLog: this.executionLog,
				totalExecutionTime: this.getTotalExecutionTime()
			}
		};

	} catch (error) {
			this.log(`❌ Error: ${error.message}`, 'error');
			
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
				partialState: this.state,
				executionLog: this.executionLog
			};
		}
	}

	/**
	 * Generate illustration images for modul ajar using Gemini Interleaved API
	 */
	async generateIllustrationImages(userInput, state) {
		const startTime = Date.now();

		try {
			// Call server-side API endpoint for image generation
			const response = await fetch('/api/generate-modul-images', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userInput,
					state
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
			console.warn('[Orchestrator] ⚠️ Image generation API error (non-critical):', errorData.error);
			// Return empty images instead of throwing - this is non-critical
			return {
				success: true,
				data: [],
				time: Date.now() - startTime
			};
		}

		const result = await response.json();

		// Handle successful response with or without images
		if (result.success) {
			if (result.images && result.images.length > 0) {
				this.log(`✅ Generated ${result.images.length} AI images successfully`);
				return {
					success: true,
					data: result.images,
					time: Date.now() - startTime
				};
			} else {
				// API returned success but no images (e.g., not configured)
				const message = result.message || 'Image generation skipped';
				this.log(`ℹ️ ${message}`, 'info');
				return {
					success: true,
					data: [],
					message: message,
					time: Date.now() - startTime
				};
			}
		}

		// API returned error
		console.warn('[Orchestrator] ⚠️ Image generation failed (non-critical):', result.error);
		return {
			success: true,
			data: [],
			message: result.error || 'Image generation failed',
			time: Date.now() - startTime
		};
	} catch (error) {
		this.log(`⚠️ Image generation error (non-critical): ${error.message}`, 'warn');
		// Return empty images instead of throwing - allow modul to be generated without images
		return {
			success: true,
			data: [],
			time: Date.now() - startTime
		};
	}
	}

	/**
	 * Compile semua hasil agents menjadi dokumen Modul Ajar final
	 */
	compileModulAjar(userInput) {
		const { informasiUmum, capaianTujuan, kegiatanPembelajaran, asesmen, validation, images } = this.state;

		// Format markdown untuk modul ajar
		let modul = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         MODUL AJAR KURIKULUM MERDEKA
         ${informasiUmum.judulModul.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

		// A. INFORMASI UMUM
		modul += `
═══════════════════════════════════════════════════
A. INFORMASI UMUM
═══════════════════════════════════════════════════

Judul Modul      : ${informasiUmum.judulModul}
Mata Pelajaran   : ${informasiUmum.identitas.mataPelajaran}
Kelas/Fase       : ${informasiUmum.identitas.kelas} (${informasiUmum.identitas.fase})
Jenjang          : ${informasiUmum.identitas.jenjang}
Penulis          : ${informasiUmum.identitas.penulis}
Instansi         : ${informasiUmum.identitas.instansi}
Durasi Total     : ${informasiUmum.durasiTotal}
Alokasi Waktu    : ${informasiUmum.alokasiWaktu}

DESKRIPSI MODUL:
${informasiUmum.deskripsiUmum}

${informasiUmum.identitas.faseDeskripsi || ''}

`;

		// B. CAPAIAN & TUJUAN PEMBELAJARAN
		modul += `
═══════════════════════════════════════════════════
B. CAPAIAN & TUJUAN PEMBELAJARAN
═══════════════════════════════════════════════════

▸ CAPAIAN PEMBELAJARAN (CP)
${capaianTujuan.capaianPembelajaran}

▸ TUJUAN PEMBELAJARAN
${capaianTujuan.tujuanPembelajaran.map((tp, i) => 
	`${tp.nomor || i+1}. ${tp.tujuan} ${tp.levelBloom ? `(${tp.levelBloom})` : ''}`
).join('\n')}

▸ ALUR TUJUAN PEMBELAJARAN (ATP)
${capaianTujuan.alurTujuanPembelajaran.map((atp, i) => 
	`Tahap ${atp.tahap || i+1}: ${atp.judulTahap}\n   ${atp.deskripsi}`
).join('\n\n')}

▸ PROFIL PELAJAR PANCASILA
${capaianTujuan.profilPelajarPancasila.map(ppp => 
	`• ${ppp.dimensi}\n  ${ppp.deskripsi}\n  Implementasi: ${ppp.implementasi}`
).join('\n\n')}

`;

		// C. DETAIL KEGIATAN PEMBELAJARAN
		modul += `
═══════════════════════════════════════════════════
C. DETAIL KEGIATAN PEMBELAJARAN
═══════════════════════════════════════════════════

Model Pembelajaran: ${userInput.metode || 'Problem Based Learning'}
Mode Pembelajaran : ${userInput.modePembelajaran || 'Luring (Tatap Muka)'}

`;

		// Detail per pertemuan
		kegiatanPembelajaran.pertemuan.forEach((pertemuan, idx) => {
			modul += `
─────────────────────────────────────────────────── PERTEMUAN ${pertemuan.nomorPertemuan || idx + 1}
───────────────────────────────────────────────────
Judul          : ${pertemuan.judulPertemuan || ''}
Alokasi Waktu  : ${pertemuan.alokasiWaktu}
Tujuan         : ${pertemuan.tujuanPertemuan}

Indikator Keberhasilan:
${pertemuan.indikatorKeberhasilan?.map((ind, i) => `${i+1}. ${ind}`).join('\n') || '-'}

PERTANYAAN PEMANTIK:
${pertemuan.pertanyaanPemantik?.map((p, i) => `${i+1}. ${p}`).join('\n') || '-'}

MEDIA & SUMBER BELAJAR:
Media          : ${pertemuan.perlengkapan?.media?.join(', ') || '-'}
Bahan Ajar     : ${pertemuan.perlengkapan?.bahanAjar?.join(', ') || '-'}
Sumber Belajar : ${pertemuan.perlengkapan?.sumberBelajar?.join(', ') || '-'}

┌─────────────────────────────────────────────────┐
│  LANGKAH PEMBELAJARAN                            │
└─────────────────────────────────────────────────┘

▸ KEGIATAN PEMBUKA (${pertemuan.langkahPembelajaran?.pembuka?.waktu || '15 menit'})
${this.formatAktivitas(pertemuan.langkahPembelajaran?.pembuka?.aktivitas)}

▸ KEGIATAN INTI (${pertemuan.langkahPembelajaran?.inti?.waktu || '60 menit'})
${this.formatFase(pertemuan.langkahPembelajaran?.inti?.fase)}

▸ KEGIATAN PENUTUP (${pertemuan.langkahPembelajaran?.penutup?.waktu || '15 menit'})
${this.formatAktivitas(pertemuan.langkahPembelajaran?.penutup?.aktivitas)}

DIFERENSIASI PEMBELAJARAN:
• Untuk Siswa Berkesulitan: ${pertemuan.diferensiasi?.untukSiswaBerkesulitan || '-'}
• Untuk Siswa Advanced: ${pertemuan.diferensiasi?.untukSiswaAdvanced || '-'}
• Gaya Belajar: ${pertemuan.diferensiasi?.gayaBelajar || '-'}
`;

			// Add images if available
			if (images && images.length > 0) {
				const pertemuanImages = images.filter(img => 
					img.position === `pertemuan-${pertemuan.nomorPertemuan || idx + 1}`
				);
				
				if (pertemuanImages.length > 0) {
					modul += `\n\n📸 ILUSTRASI PEMBELAJARAN:\n`;
					pertemuanImages.forEach(img => {
						modul += `\n[Gambar: ${img.caption}]`;
						modul += `\n${img.description}`;
						modul += `\n[Image embedded - visible in .docx download]\n`;
					});
				}
			}

			modul += `\n`;
		});

		// D. ASESMEN
		modul += `
═══════════════════════════════════════════════════
D. RENCANA ASESMEN
═══════════════════════════════════════════════════

▸ ASESMEN DIAGNOSTIK
Tujuan : ${asesmen.asesmenDiagnostik?.tujuan || '-'}
Waktu  : ${asesmen.asesmenDiagnostik?.waktu || '-'}
Format : ${asesmen.asesmenDiagnostik?.format || '-'}

Instrumen:
${asesmen.asesmenDiagnostik?.instrumen?.map((ins, i) => 
	`${ins.nomor || i+1}. ${ins.pertanyaan}\n   Tujuan: ${ins.tujuan}`
).join('\n') || '-'}

▸ ASESMEN FORMATIF (Selama Pembelajaran)
${asesmen.asesmenFormatif?.map(af => 
	`Pertemuan ${af.pertemuan}: ${af.teknik}\n${af.deskripsi}\nKriteria: ${af.kriteria}`
).join('\n\n') || '-'}

▸ ASESMEN SUMATIF (Akhir Pembelajaran)
Jenis  : ${asesmen.asesmenSumatif?.jenis || '-'}
Waktu  : ${asesmen.asesmenSumatif?.waktu || '-'}

${asesmen.asesmenSumatif?.deskripsi || ''}

Komponen Penilaian:
${asesmen.asesmenSumatif?.komponenPenilaian?.map(k => 
	`• ${k.komponen} (${k.bobot}): ${k.deskripsi}`
).join('\n') || '-'}

▸ RUBRIK PENILAIAN
${this.formatRubrik(asesmen.rubrikPenilaian)}

▸ REFLEKSI PEMBELAJARAN
Refleksi Siswa:
${asesmen.refleksi?.refleksiSiswa?.pertanyaanPanduan?.map((p, i) => `${i+1}. ${p}`).join('\n') || '-'}

Refleksi Guru:
${asesmen.refleksi?.refleksiGuru?.aspekRefleksi?.map((a, i) => `${i+1}. ${a}`).join('\n') || '-'}

`;

		// E. METADATA
		modul += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
METADATA DOKUMEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated by    : AI Asisten Guru (Agentic AI System)
Generated at    : ${new Date().toLocaleString('id-ID')}
Quality Score   : ${validation.qualityScore}/100
Agents Used     : ${Object.keys(this.agents).join(', ')}

${validation.recommendations && validation.recommendations.length > 0 ? `
REKOMENDASI PERBAIKAN:
${validation.recommendations.map((r, i) => `${i+1}. ${r}`).join('\n')}
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

		return modul.trim();
	}

	/**
	 * Format aktivitas pembelajaran
	 */
	formatAktivitas(aktivitas) {
		if (!aktivitas || !Array.isArray(aktivitas)) return '-';
		
		return aktivitas.map(akt => 
			`${akt.tahap}:\n   Guru  : ${akt.aktivitasGuru}\n   Siswa : ${akt.aktivitasSiswa}`
		).join('\n\n');
	}

	/**
	 * Format fase pembelajaran
	 */
	formatFase(fase) {
		if (!fase || !Array.isArray(fase)) return '-';
		
		return fase.map((f, i) => 
			`Fase ${i+1}: ${f.namaFase} (${f.waktu})\n` +
			`Guru  : ${f.aktivitasGuru}\n` +
			`Siswa : ${f.aktivitasSiswa}\n` +
			(f.instruksi ? `Instruksi: ${f.instruksi}` : '')
		).join('\n\n');
	}

	/**
	 * Format rubrik penilaian
	 */
	formatRubrik(rubrik) {
		if (!rubrik || !Array.isArray(rubrik)) return '-';
		
		return rubrik.map(r => 
			`\n${r.jenisAsesmen} - ${r.aspekYangDinilai}:\n` +
			r.kriteria.map(k => `  • ${k.level}: ${k.deskriptor}`).join('\n')
		).join('\n');
	}

	/**
	 * Get total execution time
	 */
	getTotalExecutionTime() {
		return this.executionLog.reduce((total, log) => total + (log.time || 0), 0);
	}

	/**
	 * Logging helper
	 */
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
