/**
 * Capaian Tool
 *
 * Menggabungkan CapaianTujuanAgent (modul ajar) dan CapaianKompetensiAgent (lkpd).
 * Output disesuaikan berdasarkan input.jenis.
 */

import { BaseAgent } from '../base-agent.js';
import {
	getKurikulumMerdekaContext,
	PROFIL_PELAJAR_PANCASILA,
	BLOOM_TAXONOMY
} from '$lib/prompts/kurikulum-merdeka-base.js';

export class CapaianTool extends BaseAgent {
	constructor() {
		super(
			'CapaianTool',
			'Perancang Capaian & Tujuan Pembelajaran',
			'CP, TP, ATP, Profil Pelajar Pancasila, KD, dan indikator'
		);
	}

	/**
	 * @param {Object} input
	 * @param {string} input.jenis  - 'modul_ajar' | 'lkpd'
	 * @param {string} input.judul
	 * @param {string} input.mapel
	 * @param {string} input.kelas
	 * @param {Object} context      - Wajib berisi context.identitas (output IdentitasTool)
	 */
	async execute(input, context = {}) {
		this.log(`Starting for: ${input.judul} [${input.jenis}]`);

		const kelasNumber = this.kelasToNumber(input.kelas);
		const kurikulumContext = getKurikulumMerdekaContext(kelasNumber, input.mapel);
		const identitas = context.identitas;

		const isModulAjar = input.jenis === 'modul_ajar';

		const outputFormatModulAjar = `{
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
}`;

		const outputFormatLKPD = `{
  "capaianPembelajaran": {
    "fase": "Fase X",
    "elemen": "Nama elemen CP",
    "subElemen": ["Sub elemen 1", "Sub elemen 2"],
    "capaianUtama": "Pernyataan CP sesuai kurikulum merdeka",
    "fokusMateri": "Fokus materi dalam LKPD ini"
  },
  "tujuanPembelajaran": [
    {
      "domain": "kognitif/afektif/psikomotor",
      "tujuan": "Pernyataan tujuan dengan KKO",
      "indikator": "Indikator pencapaian yang terukur"
    }
  ],
  "kataKunciMateri": ["kata kunci 1", "kata kunci 2", "kata kunci 3"]
}`;

		const bloomInfo = Object.entries(BLOOM_TAXONOMY || {})
			.map(([level, data]) => `${level}: ${data.level} - ${(data.kataKerja || []).slice(0, 5).join(', ')}`)
			.join('\n');

		const systemPrompt = this.buildSystemPrompt(`
Buat CAPAIAN & TUJUAN PEMBELAJARAN sesuai Kurikulum Merdeka untuk jenis dokumen: ${input.jenis}.

${kurikulumContext}

${isModulAjar ? `TAKSONOMI BLOOM:\n${bloomInfo}` : ''}

OUTPUT FORMAT (JSON):
${isModulAjar ? outputFormatModulAjar : outputFormatLKPD}
`);

		const faseInfo = isModulAjar
			? identitas?.identitas?.fase || ''
			: identitas?.identitas?.fase || '';

		const userPrompt = `
Judul           : ${input.judul}
Mata Pelajaran  : ${input.mapel}
Kelas           : ${input.kelas}
Fase            : ${faseInfo}
Jenis Dokumen   : ${input.jenis}
Durasi          : ${input.jumlahPertemuan || '4'} pertemuan
Metode          : ${input.metode || 'Problem Based Learning'}

${context.identitas ? `KONTEKS IDENTITAS:\n${JSON.stringify(context.identitas?.deskripsiUmum || context.identitas?.deskripsiSingkat || '', null, 2)}` : ''}

Buatlah capaian dan tujuan pembelajaran yang terukur dan sesuai Kurikulum Merdeka.
Output harus JSON valid.
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
		if (jenis === 'modul_ajar') {
			if (!output.capaianPembelajaran) errors.push('capaianPembelajaran is required');
			if (!Array.isArray(output.tujuanPembelajaran) || output.tujuanPembelajaran.length < 3)
				errors.push('tujuanPembelajaran must be an array with at least 3 items');
			if (!Array.isArray(output.alurTujuanPembelajaran))
				errors.push('alurTujuanPembelajaran must be an array');
			if (!Array.isArray(output.profilPelajarPancasila) || output.profilPelajarPancasila.length < 2)
				errors.push('profilPelajarPancasila must have at least 2 dimensions');
		} else if (jenis === 'lkpd') {
			if (!output.capaianPembelajaran) errors.push('capaianPembelajaran is required');
			if (!Array.isArray(output.tujuanPembelajaran) || output.tujuanPembelajaran.length === 0)
				errors.push('tujuanPembelajaran must be a non-empty array');
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
}
