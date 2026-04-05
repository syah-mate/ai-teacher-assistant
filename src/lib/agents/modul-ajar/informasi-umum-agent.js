/**
 * Informasi Umum Agent
 * 
 * Specialized agent untuk membuat komponen INFORMASI UMUM pada Modul Ajar
 * sesuai standar Kurikulum Merdeka
 */

import { BaseAgent } from '../base-agent.js';
import { FASE_MAPPING, FASE_DESKRIPSI } from '$lib/prompts/kurikulum-merdeka-base.js';

export class InformasiUmumAgent extends BaseAgent {
	constructor() {
		super(
			'InformasiUmumAgent',
			'Penyusun Informasi Umum Modul Ajar',
			'Identitas dan deskripsi modul pembelajaran'
		);
	}

	/**
	 * Execute agent untuk generate informasi umum
	 * 
	 * @param {Object} input - User input
	 * @param {string} input.judulModul - Judul/topik modul
	 * @param {string} input.mapel - Mata pelajaran
	 * @param {string} input.kelas - Kelas (I-XII)
	 * @param {string} input.jenjang - SD/SMP/SMA
	 * @param {string} input.penulis - Nama penulis/guru (optional)
	 * @param {string} input.instansi - Nama sekolah (optional)
	 * @returns {Promise<Object>}
	 */
	async execute(input, context = {}) {
		this.log(`Starting execution for: ${input.judulModul}`);

		try {
			// Determine fase dari kelas
			const kelasNumber = this.kelasToNumber(input.kelas);
			const fase = FASE_MAPPING[kelasNumber] || 'A';
			const faseDeskripsi = FASE_DESKRIPSI[fase] || '';

			const systemPrompt = this.buildSystemPrompt(`
Buat INFORMASI UMUM untuk Modul Ajar dengan kriteria berikut:

1. IDENTITAS MODUL yang lengkap dan jelas
2. DESKRIPSI UMUM yang menarik, menjelaskan:
   - Gambaran umum materi yang akan dipelajari
   - Relevansi materi dengan kehidupan siswa
   - Manfaat mempelajari topik ini
   - Pendekatan pembelajaran yang akan digunakan

OUTPUT FORMAT (JSON):
{
  "judulModul": "Judul lengkap modul",
  "identitas": {
    "satuan": "SD/SMP/SMA",
    "jenjang": "Sekolah Dasar/Menengah Pertama/Menengah Atas",
    "fase": "Fase X",
    "faseDeskripsi": "Deskripsi fase",
    "kelas": "Kelas X",
    "mataPelajaran": "Nama mata pelajaran",
    "penulis": "Nama penulis",
    "instansi": "Nama sekolah"
  },
  "deskripsiUmum": "Paragraf deskripsi yang engaging (3-4 kalimat)",
  "durasiTotal": "X pertemuan",
  "alokasiWaktu": "X JP (X menit)"
}
`);

			const userPrompt = `
INFORMASI INPUT:
- Judul Modul: ${input.judulModul}
- Mata Pelajaran: ${input.mapel}
- Kelas: ${input.kelas} (${fase})
- Jenjang: ${input.jenjang || this.getJenjangFromKelas(input.kelas)}
- Jumlah Pertemuan: ${input.jumlahPertemuan || '4 pertemuan'}
- Alokasi per Pertemuan: ${input.alokasiPerPertemuan || '2x45 menit'}
- Penulis: ${input.penulis || 'Guru Mata Pelajaran'}
- Instansi: ${input.instansi || 'Sekolah'}

TUGAS:
Buatlah informasi umum yang lengkap dan menarik untuk modul ajar ini.
Deskripsi harus menjelaskan mengapa topik ini penting dan relevan untuk siswa.

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
	 * Validate informasi umum structure
	 */
	validate(output) {
		const errors = [];

		if (!output.judulModul) errors.push('judulModul is required');
		if (!output.identitas) errors.push('identitas is required');
		if (!output.deskripsiUmum) errors.push('deskripsiUmum is required');

		if (output.identitas && !output.identitas.mataPelajaran) {
			errors.push('identitas.mataPelajaran is required');
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}

	/**
	 * Helper: Convert kelas roman numeral to number
	 */
	kelasToNumber(kelas) {
		const mapping = {
			I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6,
			VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12
		};
		return mapping[kelas] || 1;
	}

	/**
	 * Helper: Get jenjang from kelas
	 */
	getJenjangFromKelas(kelas) {
		const num = this.kelasToNumber(kelas);
		if (num <= 6) return 'SD';
		if (num <= 9) return 'SMP';
		return 'SMA';
	}
}
