/**
 * Validator Tool
 *
 * Menggabungkan semua ValidatorAgent dari modul-ajar, lkpd, dan soal.
 * Logic validasi disesuaikan berdasarkan input.jenis.
 *
 * Non-critical: pipeline tetap lanjut meski validasi gagal.
 */

import { BaseAgent } from '../base-agent.js';

export class ValidatorTool extends BaseAgent {
	constructor() {
		super(
			'ValidatorTool',
			'Quality Assurance Dokumen Pembelajaran',
			'Validasi kelengkapan, konsistensi, dan kualitas semua jenis dokumen'
		);
	}

	/**
	 * @param {Object} input   - input.jenis menentukan kriteria validasi
	 * @param {Object} context - semua output tool sebelumnya
	 */
	async execute(input, context = {}) {
		this.log(`Starting validation for: ${input.judul} [${input.jenis}]`);

		try {
			const validationResults = {
				isComplete: true,
				missingComponents: [],
				qualityChecks: [],
				recommendations: [],
				qualityScore: 0
			};

			// 1. Structural validation berdasarkan jenis
			const structuralChecks = this.performStructuralValidation(context, input.jenis);
			validationResults.qualityChecks.push(...structuralChecks);

			// 2. AI quality check
			const aiQualityResult = await this.performAIQualityCheck(input, context);

			if (aiQualityResult.success) {
				const aiChecks = this.parseJSON(aiQualityResult.data);
				if (!aiChecks.parseError) {
					validationResults.qualityChecks.push(...(aiChecks.qualityChecks || []));
					validationResults.recommendations.push(...(aiChecks.recommendations || []));
					validationResults.qualityScore = aiChecks.qualityScore || 75;
				}
			} else {
				validationResults.qualityScore = 75; // default fallback
			}

			// 3. Penalti jika ada komponen hilang
			const errorChecks = structuralChecks.filter((c) => c.level === 'error');
			if (errorChecks.length > 0) {
				validationResults.isComplete = false;
				validationResults.qualityScore = Math.min(validationResults.qualityScore, 50);
			}

			this.log(`Validation completed. Score: ${validationResults.qualityScore}/100`);

			// Untuk soal, tambahkan format validasi yang kompatibel dengan frontend soal
			if (input.jenis === 'soal') {
				return {
					success: true,
					data: {
						...validationResults,
						score: validationResults.qualityScore,
						status: validationResults.qualityScore >= 70 ? 'PASSED' : 'NEEDS_IMPROVEMENT',
						passed: validationResults.qualityScore >= 70,
						fullReport: validationResults.recommendations.join('\n')
					},
					agentName: this.name,
					metadata: this.getMetadata()
				};
			}

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

	performStructuralValidation(context, jenis) {
		const checks = [];

		if (jenis === 'modul_ajar') {
			const required = ['identitas', 'capaian', 'kegiatan', 'asesmen'];
			required.forEach((key) => {
				if (!context[key]) {
					checks.push({ level: 'error', component: key, message: `${key} tidak tersedia` });
				} else {
					checks.push({ level: 'success', component: key, message: `${key} tersedia` });
				}
			});

			if (context.capaian) {
				const tp = context.capaian.tujuanPembelajaran;
				if (!tp || tp.length < 3) {
					checks.push({
						level: 'warning',
						component: 'Capaian',
						message: 'Tujuan pembelajaran kurang dari 3 item'
					});
				}
			}

			if (context.kegiatan) {
				const pertemuan = context.kegiatan.pertemuan || [];
				checks.push({
					level: 'success',
					component: 'Kegiatan',
					message: `${pertemuan.length} pertemuan tersedia`
				});
			}
		} else if (jenis === 'lkpd') {
			const required = ['identitas', 'capaian', 'lkpdContent'];
			required.forEach((key) => {
				if (!context[key]) {
					checks.push({ level: 'error', component: key, message: `${key} tidak tersedia` });
				} else {
					checks.push({ level: 'success', component: key, message: `${key} tersedia` });
				}
			});
		} else if (jenis === 'soal') {
			if (!context.soal) {
				checks.push({ level: 'error', component: 'soal', message: 'Data soal tidak tersedia' });
			} else {
				checks.push({ level: 'success', component: 'soal', message: 'Data soal tersedia' });
			}
		}

		return checks;
	}

	async performAIQualityCheck(input, context) {
		const systemPrompt = this.buildSystemPrompt(`
Lakukan QUALITY ASSURANCE terhadap dokumen pembelajaran yang telah dibuat.

ASPEK YANG HARUS DIPERIKSA:
1. KELENGKAPAN - Apakah semua komponen standar ada?
2. KONSISTENSI - Apakah tujuan, kegiatan, dan asesmen konsisten?
3. KUALITAS KONTEN - Apakah konten jelas, terukur, dan praktis?
4. KESESUAIAN KURIKULUM MERDEKA

OUTPUT FORMAT (JSON):
{
  "qualityScore": 85,
  "qualityChecks": [
    { "level": "success/warning/error", "aspect": "Nama aspek", "message": "Deskripsi temuan" }
  ],
  "recommendations": ["Rekomendasi 1", "Rekomendasi 2"]
}
`);

		const contextSummary = this.summarizeContext(context, input.jenis);

		const userPrompt = `
Jenis Dokumen    : ${input.jenis}
Mata Pelajaran   : ${input.mapel}
Kelas            : ${input.kelas}
Topik            : ${input.judul}

${contextSummary}

Lakukan quality check dan berikan penilaian objektif.
OUTPUT harus dalam format JSON yang valid.
`;

		return await this.callAI(systemPrompt, userPrompt, { timeout: 60000 });
	}

	summarizeContext(context, jenis) {
		let summary = '';

		if (jenis === 'modul_ajar') {
			if (context.identitas) summary += `\n[Identitas]: ✓ Ada`;
			if (context.capaian) {
				const tp = context.capaian.tujuanPembelajaran || [];
				summary += `\n[Capaian]: ${tp.length} tujuan pembelajaran`;
			}
			if (context.kegiatan) {
				const pertemuan = context.kegiatan.pertemuan || [];
				summary += `\n[Kegiatan]: ${pertemuan.length} pertemuan`;
			}
			if (context.asesmen) {
				const rubrik = context.asesmen.rubrikPenilaian || [];
				summary += `\n[Asesmen]: ${rubrik.length} rubrik penilaian`;
			}
		} else if (jenis === 'lkpd') {
			if (context.identitas) summary += `\n[Identitas]: ✓ Ada`;
			if (context.capaian) {
				const tp = context.capaian.tujuanPembelajaran || [];
				summary += `\n[Capaian]: ${tp.length} tujuan pembelajaran`;
			}
			if (context.lkpdContent) {
				summary += `\n[Konten LKPD]: petunjuk, materi, langkah kerja, evaluasi ✓`;
			}
		} else if (jenis === 'soal') {
			if (context.soal) {
				summary += `\n[Soal]: ✓ Ada (${context.soal.metadata?.jumlah || '-'} soal)`;
			}
		}

		return summary;
	}
}
