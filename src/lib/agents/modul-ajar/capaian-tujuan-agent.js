/**
 * Capaian & Tujuan Agent
 * 
 * Specialized agent untuk membuat komponen CAPAIAN & TUJUAN PEMBELAJARAN:
 * - Capaian Pembelajaran (CP)
 * - Tujuan Pembelajaran (TP)
 * - Alur Tujuan Pembelajaran (ATP)
 * - Dimensi Profil Pelajar Pancasila (PPP)
 */

import { BaseAgent } from '../base-agent.js';
import { 
	getKurikulumMerdekaContext, 
	PROFIL_PELAJAR_PANCASILA,
	BLOOM_TAXONOMY 
} from '$lib/prompts/kurikulum-merdeka-base.js';

export class CapaianTujuanAgent extends BaseAgent {
	constructor() {
		super(
			'CapaianTujuanAgent',
			'Perancang Capaian & Tujuan Pembelajaran',
			'CP, TP, ATP, dan Profil Pelajar Pancasila'
		);
	}

	/**
	 * Execute agent untuk generate capaian & tujuan pembelajaran
	 * 
	 * @param {Object} input - User input + context dari agent sebelumnya
	 * @param {Object} context - Context dari InformasiUmumAgent
	 * @returns {Promise<Object>}
	 */
	async execute(input, context = {}) {
		this.log(`Starting execution for: ${input.judulModul}`);

		try {
			const kelasNumber = this.kelasToNumber(input.kelas);
			const kurikulumContext = getKurikulumMerdekaContext(kelasNumber, input.mapel);

			const systemPrompt = this.buildSystemPrompt(`
Buat CAPAIAN & TUJUAN PEMBELAJARAN untuk Modul Ajar dengan kriteria:

${kurikulumContext}

KOMPONEN YANG HARUS DIBUAT:

1. CAPAIAN PEMBELAJARAN (CP)
   - Sesuai dengan fase dan mata pelajaran
   - Mengacu pada CP Kemendikbudristek
   - Spesifik untuk topik yang diajarkan

2. TUJUAN PEMBELAJARAN (TP)
   - Minimal 4-6 tujuan pembelajaran
   - Menggunakan kata kerja operasional Bloom (C1-C6)
   - Format: "Peserta didik mampu [kata kerja] ... (C[level])"
   - Terukur dan achievable
   - Mencakup berbagai level kognitif

3. ALUR TUJUAN PEMBELAJARAN (ATP)
   - Urutan logis pembelajaran
   - Dari sederhana ke kompleks
   - 4-6 tahapan belajar
   - Setiap tahap jelas dan terstruktur

4. PROFIL PELAJAR PANCASILA (PPP)
   - Pilih 2-3 dimensi yang paling relevan
   - Jelaskan bagaimana dimensi tersebut dikembangkan
   - Spesifik untuk topik pembelajaran

TAKSONOMI BLOOM:
${Object.entries(BLOOM_TAXONOMY).map(([level, data]) => 
	`${level}: ${data.level} - ${data.kataKerja.slice(0, 5).join(', ')}`
).join('\n')}

OUTPUT FORMAT (JSON):
{
  "capaianPembelajaran": "Deskripsi CP yang sesuai fase dan mapel",
  "tujuanPembelajaran": [
    {
      "nomor": 1,
      "tujuan": "Peserta didik mampu...",
      "levelBloom": "C4",
      "aspek": "Kognitif/Afektif/Psikomotorik"
    }
  ],
  "alurTujuanPembelajaran": [
    {
      "tahap": 1,
      "judulTahap": "Pengenalan Konsep",
      "deskripsi": "Siswa diperkenalkan dengan..."
    }
  ],
  "profilPelajarPancasila": [
    {
      "dimensi": "Bernalar Kritis",
      "deskripsi": "Siswa mengembangkan kemampuan bernalar kritis melalui...",
      "implementasi": "Konkret bagaimana dimensi ini dikembangkan"
    }
  ]
}
`);

			const userPrompt = `
INFORMASI INPUT:
- Mata Pelajaran: ${input.mapel}
- Kelas: ${input.kelas}
- Topik: ${input.judulModul}
- Durasi: ${input.jumlahPertemuan || '4'} pertemuan
- Metode: ${input.metode || 'Problem Based Learning'}

${context.informasiUmum ? `
KONTEKS DARI AGENT SEBELUMNYA:
${JSON.stringify(context.informasiUmum.deskripsiUmum, null, 2)}
` : ''}

TUGAS:
Buatlah capaian dan tujuan pembelajaran yang komprehensif, terstruktur, dan sesuai dengan standar Kurikulum Merdeka.
Pastikan tujuan pembelajaran mencakup berbagai level kognitif Bloom (C1-C6).

OUTPUT harus dalam format JSON yang valid.
`;

			const result = await this.callAI(systemPrompt, userPrompt);

			if (!result.success) {
				return {
					success: false,
					error: result.error,
					agentName: this.name
				};
			}

			const parsedData = this.parseJSON(result.data);
			const validation = this.validate(parsedData);

			if (!validation.isValid) {
				this.log(`Validation failed: ${validation.errors.join(', ')}`, 'warn');
				return {
					success: false,
					error: `Validasi gagal: ${validation.errors.join(', ')}`,
					agentName: this.name
				};
			}

			this.log('Execution completed successfully');

			return {
				success: true,
				data: parsedData,
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
	 * Validate capaian & tujuan structure
	 */
	validate(output) {
		const errors = [];

		if (!output.capaianPembelajaran) {
			errors.push('capaianPembelajaran is required');
		}

		if (!output.tujuanPembelajaran || !Array.isArray(output.tujuanPembelajaran)) {
			errors.push('tujuanPembelajaran must be an array');
		} else if (output.tujuanPembelajaran.length < 3) {
			errors.push('tujuanPembelajaran must have at least 3 items');
		}

		if (!output.alurTujuanPembelajaran || !Array.isArray(output.alurTujuanPembelajaran)) {
			errors.push('alurTujuanPembelajaran must be an array');
		}

		if (!output.profilPelajarPancasila || !Array.isArray(output.profilPelajarPancasila)) {
			errors.push('profilPelajarPancasila must be an array');
		} else if (output.profilPelajarPancasila.length < 2) {
			errors.push('profilPelajarPancasila must have at least 2 dimensions');
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}

	/**
	 * Helper: Convert kelas roman to number
	 */
	kelasToNumber(kelas) {
		const mapping = {
			I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6,
			VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12
		};
		return mapping[kelas] || 1;
	}
}
