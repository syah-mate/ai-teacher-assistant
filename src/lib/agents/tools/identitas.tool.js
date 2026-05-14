/**
 * Identitas Tool
 *
 * Menggabungkan InformasiUmumAgent (modul ajar) dan IdentitasAgent (lkpd)
 * menjadi satu tool yang bekerja untuk semua jenis dokumen.
 */

import { BaseAgent } from '../base-agent.js';
import { FASE_MAPPING, FASE_DESKRIPSI } from '$lib/prompts/kurikulum-merdeka-base.js';

export class IdentitasTool extends BaseAgent {
	constructor() {
		super(
			'IdentitasTool',
			'Penyusun Identitas Dokumen',
			'Identitas, deskripsi, dan metadata dokumen pembelajaran'
		);
	}

	/**
	 * @param {Object} input
	 * @param {string} input.jenis          - 'modul_ajar' | 'lkpd' | 'soal'
	 * @param {string} input.judul          - Judul/topik dokumen
	 * @param {string} input.mapel          - Mata pelajaran
	 * @param {string} input.kelas          - Kelas (I-XII)
	 * @param {string} [input.jenjang]      - SD/SMP/SMA (auto-detect jika kosong)
	 * @param {string} [input.semester]     - Semester (untuk LKPD)
	 * @param {string} [input.penulis]      - Nama guru
	 * @param {string} [input.instansi]     - Nama sekolah
	 * @param {number} [input.jumlahPertemuan]
	 * @param {string} [input.alokasiPerPertemuan]
	 * @param {string} [input.alokasiWaktu]
	 * @param {Object} context              - Context dari orchestrator
	 */
	async execute(input, context = {}) {
		this.log(`Starting for: ${input.judul} [${input.jenis}]`);

		const kelasNumber = this.kelasToNumber(input.kelas);
		const fase = FASE_MAPPING[kelasNumber] || 'A';
		const faseDeskripsi = FASE_DESKRIPSI[fase] || '';
		const jenjang = input.jenjang || this.getJenjangFromKelas(input.kelas);

		const labelDokumen = {
			modul_ajar: 'Modul Ajar',
			lkpd: 'Lembar Kerja Peserta Didik (LKPD)',
			soal: 'Instrumen Soal Evaluasi'
		}[input.jenis] || 'Dokumen Pembelajaran';

		const outputFormat =
			input.jenis === 'lkpd'
				? `{
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
}`
				: `{
  "judulModul": "Judul lengkap dokumen",
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
}`;

		const systemPrompt = this.buildSystemPrompt(`
Buat INFORMASI IDENTITAS untuk ${labelDokumen} Kurikulum Merdeka.

OUTPUT FORMAT (JSON):
${outputFormat}
`);

		const userPrompt = `
Jenis Dokumen   : ${labelDokumen}
Judul           : ${input.judul}
Mata Pelajaran  : ${input.mapel}
Kelas           : ${input.kelas} (Fase ${fase})
Jenjang         : ${jenjang}
Fase            : ${fase} — ${faseDeskripsi}
${input.jenis === 'lkpd' ? `Semester        : ${input.semester || '1'}` : ''}
Jumlah Pertemuan: ${input.jumlahPertemuan || 4}
Alokasi Waktu   : ${input.alokasiWaktu || input.alokasiPerPertemuan || '2x45 menit'}
Penulis         : ${input.penulis || 'Guru Mata Pelajaran'}
Instansi        : ${input.instansi || 'Sekolah'}

Buatlah identitas dokumen yang lengkap. Output harus JSON valid.
`;

		try {
			const result = await this.callAI(systemPrompt, userPrompt);
			if (!result.success) return { success: false, error: result.error, agentName: this.name };

			const data = this.parseJSON(result.data);
			const validation = this.validate(data, input.jenis);
			if (!validation.isValid) {
				return {
					success: false,
					error: `Validasi gagal: ${validation.errors.join(', ')}`,
					agentName: this.name
				};
			}

			return { success: true, data, agentName: this.name, metadata: this.getMetadata() };
		} catch (error) {
			this.log(error.message, 'error');
			return { success: false, error: error.message, agentName: this.name };
		}
	}

	validate(output, jenis) {
		const errors = [];
		if (jenis === 'lkpd') {
			if (!output.judulLKPD) errors.push('judulLKPD is required');
			if (!output.identitas) errors.push('identitas is required');
		} else {
			if (!output.judulModul) errors.push('judulModul is required');
			if (!output.identitas) errors.push('identitas is required');
			if (!output.deskripsiUmum) errors.push('deskripsiUmum is required');
		}
		return { isValid: errors.length === 0, errors };
	}

	kelasToNumber(kelas) {
		const map = {
			I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6,
			VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12
		};
		return map[kelas?.toUpperCase()] || parseInt(kelas) || 1;
	}

	getJenjangFromKelas(kelas) {
		const n = this.kelasToNumber(kelas);
		if (n <= 6) return 'SD';
		if (n <= 9) return 'SMP';
		return 'SMA';
	}
}
