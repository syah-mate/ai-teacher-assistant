/**
 * Validator Agent
 * 
 * Quality checker untuk memvalidasi kelengkapan dan kualitas Modul Ajar
 * yang dihasilkan oleh agents lain
 */

import { BaseAgent } from '../base-agent.js';

export class ValidatorAgent extends BaseAgent {
	constructor() {
		super(
			'ValidatorAgent',
			'Quality Assurance Modul Ajar',
			'Validasi kelengkapan, konsistensi, dan kualitas modul ajar'
		);
	}

	/**
	 * Execute validation terhadap semua output agents
	 * 
	 * @param {Object} input - User input original
	 * @param {Object} context - Semua hasil dari agents sebelumnya
	 * @returns {Promise<Object>}
	 */
	async execute(input, context = {}) {
		this.log('Starting validation process');

		try {
			const validationResults = {
				isComplete: true,
				missingComponents: [],
				qualityChecks: [],
				recommendations: [],
				qualityScore: 0
			};

			// 1. Check kelengkapan komponen
			const requiredComponents = [
				'informasiUmum',
				'capaianTujuan',
				'kegiatanPembelajaran',
				'asesmen'
			];

			requiredComponents.forEach(component => {
				if (!context[component]) {
					validationResults.isComplete = false;
					validationResults.missingComponents.push(component);
				}
			});

			// 2. Structural validation
			const structuralChecks = this.performStructuralValidation(context);
			validationResults.qualityChecks.push(...structuralChecks);

			// 3. Quality checks via AI
			const aiQualityResult = await this.performAIQualityCheck(input, context);
			
			if (aiQualityResult.success) {
				const aiChecks = this.parseJSON(aiQualityResult.data);
				validationResults.qualityChecks.push(...(aiChecks.qualityChecks || []));
				validationResults.recommendations.push(...(aiChecks.recommendations || []));
				validationResults.qualityScore = aiChecks.qualityScore || 0;
			}

			// 4. Calculate overall validation
			if (validationResults.missingComponents.length > 0) {
				validationResults.qualityScore = Math.min(validationResults.qualityScore, 50);
			}

			this.log(`Validation completed. Score: ${validationResults.qualityScore}/100`);

			return {
				success: true,
				data: validationResults,
				agentName: this.name,
				metadata: this.getMetadata()
			};

		} catch (error) {
			this.log(error.message, 'error');
			return {
				success: false,
				error: error.message,
				agentName: this.name
			};
		}
	}

	/**
	 * Perform structural validation (synchronous checks)
	 */
	performStructuralValidation(context) {
		const checks = [];

		// Check informasi umum
		if (context.informasiUmum) {
			if (!context.informasiUmum.deskripsiUmum) {
				checks.push({
					level: 'error',
					component: 'Informasi Umum',
					message: 'Deskripsi umum tidak lengkap'
				});
			} else {
				checks.push({
					level: 'success',
					component: 'Informasi Umum',
					message: 'Informasi umum lengkap'
				});
			}
		}

		// Check capaian & tujuan
		if (context.capaianTujuan) {
			const tp = context.capaianTujuan.tujuanPembelajaran;
			if (!tp || tp.length < 3) {
				checks.push({
					level: 'warning',
					component: 'Capaian & Tujuan',
					message: 'Tujuan pembelajaran kurang dari 3 item'
				});
			} else {
				checks.push({
					level: 'success',
					component: 'Capaian & Tujuan',
					message: `Tujuan pembelajaran lengkap (${tp.length} item)`
				});
			}

			const ppp = context.capaianTujuan.profilPelajarPancasila;
			if (!ppp || ppp.length < 2) {
				checks.push({
					level: 'warning',
					component: 'Capaian & Tujuan',
					message: 'Profil Pelajar Pancasila kurang dari 2 dimensi'
				});
			}
		}

		// Check kegiatan pembelajaran
		if (context.kegiatanPembelajaran) {
			const pertemuan = context.kegiatanPembelajaran.pertemuan;
			if (pertemuan && pertemuan.length > 0) {
				checks.push({
					level: 'success',
					component: 'Kegiatan Pembelajaran',
					message: `Kegiatan pembelajaran untuk ${pertemuan.length} pertemuan tersedia`
				});

				// Check each pertemuan
				pertemuan.forEach((p, idx) => {
					if (!p.pertanyaanPemantik || p.pertanyaanPemantik.length < 2) {
						checks.push({
							level: 'warning',
							component: `Pertemuan ${idx + 1}`,
							message: 'Pertanyaan pemantik kurang dari 2'
						});
					}
				});
			}
		}

		// Check asesmen
		if (context.asesmen) {
			if (context.asesmen.rubrikPenilaian && context.asesmen.rubrikPenilaian.length > 0) {
				checks.push({
					level: 'success',
					component: 'Asesmen',
					message: 'Rubrik penilaian tersedia'
				});
			} else {
				checks.push({
					level: 'error',
					component: 'Asesmen',
					message: 'Rubrik penilaian tidak tersedia'
				});
			}
		}

		return checks;
	}

	/**
	 * Perform AI-powered quality check
	 */
	async performAIQualityCheck(input, context) {
		const systemPrompt = this.buildSystemPrompt(`
Lakukan QUALITY ASSURANCE terhadap Modul Ajar yang telah dibuat.

ASPEK YANG HARUS DIPERIKSA:

1. KELENGKAPAN
   - Apakah semua komponen standar ada?
   - Apakah detail cukup untuk digunakan guru?

2. KONSISTENSI
   - Apakah tujuan pembelajaran konsisten dengan kegiatan?
   - Apakah asesmen mengukur tujuan yang ditetapkan?
   - Apakah alokasi waktu realistis?

3. KUALITAS KONTEN
   - Apakah tujuan pembelajaran jelas dan terukur?
   - Apakah kegiatan pembelajaran engaging dan student-centered?
   - Apakah asesmen komprehensif dan adil?

4. KESESUAIAN KURIKULUM MERDEKA
   - Apakah mengacu pada Capaian Pembelajaran yang benar?
   - Apakah mengembangkan Profil Pelajar Pancasila?
   - Apakah menggunakan pendekatan pembelajaran aktif?

5. PRAKTIKALITAS
   - Apakah mudah dipahami dan diimplementasikan guru?
   - Apakah sumber daya yang dibutuhkan realistis?
   - Apakah ada diferensiasi pembelajaran?

BERIKAN PENILAIAN:
- Quality Score: 0-100
- Quality Checks: daftar temuan (positif dan area perbaikan)
- Recommendations: saran konkret untuk perbaikan

OUTPUT FORMAT (JSON):
{
  "qualityScore": 85,
  "qualityChecks": [
    {
      "level": "success/warning/error",
      "aspect": "Nama aspek",
      "message": "Deskripsi temuan"
    }
  ],
  "recommendations": [
    "Rekomendasi 1",
    "Rekomendasi 2"
  ]
}
`);

		const contextSummary = this.summarizeContext(context);

		const userPrompt = `
MODUL AJAR YANG HARUS DIVALIDASI:

Input Original:
- Mata Pelajaran: ${input.mapel}
- Kelas: ${input.kelas}
- Topik: ${input.judulModul}

${contextSummary}

TUGAS:
Lakukan quality check menyeluruh dan berikan penilaian objektif.
Fokus pada kelengkapan, kualitas, dan kesesuaian dengan standar Kurikulum Merdeka.

OUTPUT harus dalam format JSON yang valid.
`;

		return await this.callAI(systemPrompt, userPrompt, { timeout: 60000 });
	}

	/**
	 * Summarize context untuk AI validation
	 */
	summarizeContext(context) {
		let summary = '';

		if (context.informasiUmum) {
			summary += `\n[Informasi Umum]: ✓ Ada`;
		}

		if (context.capaianTujuan) {
			const tp = context.capaianTujuan.tujuanPembelajaran || [];
			const ppp = context.capaianTujuan.profilPelajarPancasila || [];
			summary += `\n[Capaian & Tujuan]: ${tp.length} tujuan pembelajaran, ${ppp.length} dimensi PPP`;
		}

		if (context.kegiatanPembelajaran) {
			const pertemuan = context.kegiatanPembelajaran.pertemuan || [];
			summary += `\n[Kegiatan Pembelajaran]: ${pertemuan.length} pertemuan`;
		}

		if (context.asesmen) {
			const rubrik = context.asesmen.rubrikPenilaian || [];
			summary += `\n[Asesmen]: ${rubrik.length} rubrik penilaian`;
		}

		return summary;
	}
}
