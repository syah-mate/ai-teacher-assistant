/**
 * Identitas Agent untuk LKPD
 * 
 * Specialized agent untuk membuat komponen IDENTITAS pada LKPD
 * sesuai standar penyusunan LKPD
 */

import { BaseAgent } from '../base-agent.js';
import { FASE_MAPPING, FASE_DESKRIPSI } from '$lib/prompts/kurikulum-merdeka-base.js';

export class IdentitasAgent extends BaseAgent {
	constructor() {
		super(
			'IdentitasAgent',
			'Penyusun Identitas LKPD',
			'Informasi identitas dan deskripsi umum LKPD'
		);
	}

	/**
	 * Execute agent untuk generate identitas LKPD
	 * 
	 * @param {Object} input - User input
	 * @param {string} input.judulLKPD - Judul/topik LKPD
	 * @param {string} input.mapel - Mata pelajaran
	 * @param {string} input.kelas - Kelas (I-XII)
	 * @param {string} input.semester - Semester (1/2)
	 * @param {string} input.jenjang - SD/SMP/SMA
	 * @param {string} input.penulis - Nama penulis/guru (optional)
	 * @param {string} input.instansi - Nama sekolah (optional)
	 * @param {string} input.alokasiWaktu - Alokasi waktu (optional)
	 * @returns {Promise<Object>}
	 */
	async execute(input, context = {}) {
		this.log(`Starting execution for: ${input.judulLKPD}`);

		try {
			// Determine fase dari kelas
			const kelasNumber = this.kelasToNumber(input.kelas);
			const fase = FASE_MAPPING[kelasNumber] || 'A';
			const faseDeskripsi = FASE_DESKRIPSI[fase] || '';

			const systemPrompt = this.buildSystemPrompt(`
Buat IDENTITAS LKPD yang lengkap dan jelas sesuai standar penyusunan LKPD.

KOMPONEN IDENTITAS LKPD:
1. Judul LKPD - menarik, deskriptif, sesuai materi
2. Mata Pelajaran
3. Kelas/Semester
4. Alokasi Waktu
5. Informasi tambahan (penulis, instansi, tahun ajaran)

OUTPUT FORMAT (JSON):
{
  "judulLKPD": "Judul lengkap dan menarik",
  "subJudul": "Sub judul atau tema (jika ada)",
  "identitas": {
    "mataPelajaran": "Nama mata pelajaran",
    "kelas": "Kelas X",
    "semester": "Semester X",
    "fase": "Fase X",
    "faseDeskripsi": "Deskripsi fase",
    "jenjang": "SD/SMP/SMA",
    "alokasiWaktu": "X menit / X JP",
    "penulis": "Nama penulis",
    "instansi": "Nama sekolah",
    "tahunAjaran": "YYYY/YYYY"
  },
  "deskripsiSingkat": "Deskripsi singkat LKPD (1-2 kalimat)"
}

PRINSIP PENYUSUNAN:
- Judul harus menarik dan menggambarkan isi LKPD
- Informasi lengkap dan mudah dibaca
- Sesuai dengan standar format dokumen LKPD
`);

			const userPrompt = `
INFORMASI INPUT:
- Judul LKPD: ${input.judulLKPD}
- Mata Pelajaran: ${input.mapel}
- Kelas: ${input.kelas} (${fase})
- Semester: ${input.semester || '1'}
- Jenjang: ${input.jenjang || this.getJenjangFromKelas(input.kelas)}
- Alokasi Waktu: ${input.alokasiWaktu || '2x45 menit'}
- Penulis: ${input.penulis || 'Guru Mata Pelajaran'}
- Instansi: ${input.instansi || 'Sekolah'}

TUGAS:
Buatlah identitas LKPD yang lengkap, jelas, dan menarik.
Pastikan semua informasi terisi dengan baik dan sesuai standar.

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
				return {
					success: false,
					error: `Validation failed: ${validation.errors.join(', ')}`,
					agentName: this.name
				};
			}

			this.log('Identitas LKPD generated successfully');

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
	 * Validate output data
	 */
	validate(data) {
		const errors = [];

		if (!data.judulLKPD) errors.push('Judul LKPD harus diisi');
		if (!data.identitas) errors.push('Identitas harus ada');
		if (data.identitas && !data.identitas.mataPelajaran) errors.push('Mata pelajaran harus diisi');
		if (data.identitas && !data.identitas.kelas) errors.push('Kelas harus diisi');

		return {
			isValid: errors.length === 0,
			errors
		};
	}

	/**
	 * Helper: Konversi kelas (string/romawi) ke number
	 */
	kelasToNumber(kelas) {
		const romawiMap = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 
		                   'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
		return romawiMap[kelas?.toUpperCase()] || parseInt(kelas) || 1;
	}

	/**
	 * Helper: Get jenjang from kelas
	 */
	getJenjangFromKelas(kelas) {
		const kelasNum = this.kelasToNumber(kelas);
		if (kelasNum >= 1 && kelasNum <= 6) return 'SD';
		if (kelasNum >= 7 && kelasNum <= 9) return 'SMP';
		if (kelasNum >= 10 && kelasNum <= 12) return 'SMA';
		return 'SD';
	}
}
