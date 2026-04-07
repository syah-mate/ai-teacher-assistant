/**
 * Validator Agent untuk LKPD
 * 
 * Quality assurance untuk memvalidasi LKPD berdasarkan 3 syarat utama:
 * 1. Syarat Didaktik - Mendorong keaktifan dan kemandirian siswa
 * 2. Syarat Konstruksi - Bahasa yang baku, jelas, dan tidak ambigu
 * 3. Syarat Teknis - Format, layout, dan keterbacaan dokumen
 */

import { BaseAgent } from '../base-agent.js';

export class ValidatorAgent extends BaseAgent {
	constructor() {
		super(
			'ValidatorAgent',
			'Quality Assurance LKPD',
			'Validasi kelengkapan dan kualitas LKPD sesuai standar'
		);
	}

	/**
	 * Execute validation terhadap semua output LKPD
	 * 
	 * @param {Object} input - User input original
	 * @param {Object} context - Semua hasil dari agents sebelumnya
	 * @returns {Promise<Object>}
	 */
	async execute(input, context = {}) {
		this.log('Starting LKPD validation process');

		try {
			const validationResults = {
				isComplete: true,
				missingComponents: [],
				syaratDidaktik: {
					status: 'pending',
					checks: [],
					score: 0
				},
				syaratKonstruksi: {
					status: 'pending',
					checks: [],
					score: 0
				},
				syaratTeknis: {
					status: 'pending',
					checks: [],
					score: 0
				},
				qualityScore: 0,
				recommendations: []
			};

			// 1. Check kelengkapan komponen
			const requiredComponents = [
				{ key: 'identitas', name: 'Identitas LKPD' },
				{ key: 'capaianKompetensi', name: 'Capaian/Kompetensi' },
				{ key: 'petunjukBelajar', name: 'Petunjuk Belajar' },
				{ key: 'materiPendukung', name: 'Materi Pendukung' },
				{ key: 'langkahKerja', name: 'Langkah Kerja/Tugas' },
				{ key: 'evaluasiRefleksi', name: 'Evaluasi/Refleksi' }
			];

			requiredComponents.forEach(component => {
				if (!context[component.key]) {
					validationResults.isComplete = false;
					validationResults.missingComponents.push(component.name);
				}
			});

			// 2. Structural validation (quick checks)
			const structuralChecks = this.performStructuralValidation(context);
			validationResults.recommendations.push(...structuralChecks);

			// 3. AI-based quality validation
			const aiValidation = await this.performAIValidation(input, context);
			
			if (aiValidation.success) {
				const aiResult = this.parseJSON(aiValidation.data);
				
				validationResults.syaratDidaktik = aiResult.syaratDidaktik || validationResults.syaratDidaktik;
				validationResults.syaratKonstruksi = aiResult.syaratKonstruksi || validationResults.syaratKonstruksi;
				validationResults.syaratTeknis = aiResult.syaratTeknis || validationResults.syaratTeknis;
				validationResults.qualityScore = aiResult.qualityScore || 0;
				validationResults.recommendations.push(...(aiResult.recommendations || []));
			}

			// 4. Calculate overall status
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
	 * Perform quick structural validation
	 */
	performStructuralValidation(context) {
		const checks = [];

		// Check identitas
		if (context.identitas) {
			if (!context.identitas.judulLKPD) {
				checks.push('⚠️ Judul LKPD belum ada');
			}
			if (!context.identitas.identitas?.alokasiWaktu) {
				checks.push('⚠️ Alokasi waktu sebaiknya dicantumkan');
			}
		}

		// Check capaian kompetensi
		if (context.capaianKompetensi) {
			const tujuan = context.capaianKompetensi.tujuanPembelajaran;
			if (!tujuan || tujuan.length === 0) {
				checks.push('⚠️ Tujuan pembelajaran harus ada minimal 1');
			}
		}

		// Check langkah kerja
		if (context.langkahKerja) {
			const bagian = context.langkahKerja.bagianUtama;
			if (!bagian || bagian.length === 0) {
				checks.push('⚠️ Langkah kerja harus memiliki aktivitas');
			}
		}

		// Check evaluasi
		if (context.evaluasiRefleksi) {
			const soal = context.evaluasiRefleksi.evaluasi?.soalEvaluasi;
			if (!soal || soal.length === 0) {
				checks.push('⚠️ Soal evaluasi harus ada');
			}
		}

		return checks;
	}

	/**
	 * Perform AI-based quality validation
	 */
	async performAIValidation(input, context) {
		const systemPrompt = this.buildSystemPrompt(`
Lakukan VALIDASI KUALITAS LKPD berdasarkan 3 SYARAT KELAYAKAN:

**1. SYARAT DIDAKTIK**
Kriteria:
✓ Mendorong keaktifan siswa (bukan sekadar menyalin jawaban)
✓ Memperhatikan perbedaan individual (tingkat kesulitan bertahap)
✓ Menekankan pada proses penemuan konsep, bukan hanya hasil akhir

**2. SYARAT KONSTRUKSI**
Kriteria:
✓ Menggunakan Bahasa Indonesia yang baku sesuai PUEBI
✓ Kalimat tidak bermakna ganda (ambigu)
✓ Tingkat kesulitan bahasa sesuai dengan usia dan jenjang siswa

**3. SYARAT TEKNIS**
Kriteria:
✓ Font mudah dibaca (contoh: Arial, Calibri, atau Comic Sans untuk SD)
✓ Visual/gambar yang relevan dan kontras baik
✓ Layout memiliki ruang kosong cukup untuk siswa menulis

OUTPUT FORMAT (JSON):
{
  "syaratDidaktik": {
    "status": "baik/cukup/kurang",
    "score": 0-100,
    "checks": [
      {
        "kriteria": "Nama kriteria",
        "terpenuhi": true/false,
        "catatan": "Penjelasan"
      }
    ]
  },
  "syaratKonstruksi": {
    "status": "baik/cukup/kurang",
    "score": 0-100,
    "checks": [
      {
        "kriteria": "Nama kriteria",
        "terpenuhi": true/false,
        "catatan": "Penjelasan"
      }
    ]
  },
  "syaratTeknis": {
    "status": "baik/cukup/kurang",
    "score": 0-100,
    "checks": [
      {
        "kriteria": "Nama kriteria",
        "terpenuhi": true/false,
        "catatan": "Penjelasan"
      }
    ]
  },
  "qualityScore": 0-100,
  "recommendations": [
    "Rekomendasi perbaikan 1",
    "Rekomendasi perbaikan 2"
  ]
}

PANDUAN PENILAIAN:
- Score 90-100: Sangat Baik (memenuhi semua kriteria)
- Score 75-89: Baik (memenuhi sebagian besar kriteria)
- Score 60-74: Cukup (memenuhi kriteria dasar)
- Score <60: Kurang (perlu perbaikan signifikan)
`);

		const userPrompt = `
VALIDASI LKPD INI:

IDENTITAS:
${JSON.stringify(context.identitas, null, 2)}

CAPAIAN KOMPETENSI:
${JSON.stringify(context.capaianKompetensi, null, 2)}

PETUNJUK BELAJAR:
${JSON.stringify(context.petunjukBelajar, null, 2)}

LANGKAH KERJA (sampel):
${JSON.stringify(context.langkahKerja?.bagianUtama?.[0], null, 2)}

EVALUASI (sampel):
${JSON.stringify(context.evaluasiRefleksi?.evaluasi?.soalEvaluasi?.slice(0, 3), null, 2)}

TUGAS:
1. Periksa apakah LKPD ini memenuhi SYARAT DIDAKTIK
2. Periksa apakah bahasa memenuhi SYARAT KONSTRUKSI
3. Evaluasi aspek SYARAT TEKNIS yang dapat dinilai dari konten
4. Berikan score keseluruhan dan rekomendasi perbaikan

Fokuskan pada:
- Apakah aktivitas mendorong active learning?
- Apakah bahasa jelas dan tidak ambigu?
- Apakah struktur memungkinkan ruang kerja yang cukup?
- Apakah ada variasi tingkat kesulitan?

OUTPUT harus dalam format JSON yang valid.
`;

		return await this.callAI(systemPrompt, userPrompt);
	}

	/**
	 * Validate output data
	 */
	validate(data) {
		const errors = [];

		if (!data.syaratDidaktik) errors.push('Validasi syarat didaktik harus ada');
		if (!data.syaratKonstruksi) errors.push('Validasi syarat konstruksi harus ada');
		if (!data.syaratTeknis) errors.push('Validasi syarat teknis harus ada');

		return {
			isValid: errors.length === 0,
			errors
		};
	}
}
