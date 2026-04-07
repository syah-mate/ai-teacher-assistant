/**
 * Capaian Kompetensi Agent untuk LKPD
 * 
 * Specialized agent untuk membuat komponen CAPAIAN/KOMPETENSI pada LKPD
 * Mencantumkan CP (Capaian Pembelajaran) Kurikulum Merdeka yang ingin dicapai
 */

import { BaseAgent } from '../base-agent.js';

export class CapaianKompetensiAgent extends BaseAgent {
	constructor() {
		super(
			'CapaianKompetensiAgent',
			'Penyusun Capaian Kompetensi LKPD',
			'Identifikasi dan perumusan capaian pembelajaran yang ingin dicapai'
		);
	}

	/**
	 * Execute agent untuk generate capaian/kompetensi
	 * 
	 * @param {Object} input - User input
	 * @param {Object} context - Context dari identitas agent
	 * @returns {Promise<Object>}
	 */
	async execute(input, context = {}) {
		this.log(`Starting execution for: ${input.judulLKPD}`);

		try {
			const systemPrompt = this.buildSystemPrompt(`
Buat CAPAIAN PEMBELAJARAN (CP) dan KOMPETENSI yang hendak dicapai dalam LKPD ini.

KOMPONEN YANG HARUS DIBUAT:
1. CAPAIAN PEMBELAJARAN (CP)
   - Sesuai dengan Kurikulum Merdeka
   - Spesifik untuk mata pelajaran dan fase
   - Mencakup aspek pengetahuan, keterampilan, dan sikap

2. TUJUAN PEMBELAJARAN
   - Turunan dari CP yang lebih spesifik
   - Terukur dan dapat diamati
   - Menggunakan kata kerja operasional (Bloom's Taxonomy)

3. ELEMEN/SUB ELEMEN
   - Elemen CP yang terkait
   - Sub-elemen yang akan difokuskan

OUTPUT FORMAT (JSON):
{
  "capaianPembelajaran": {
    "fase": "Fase X",
    "elemen": "Nama elemen CP",
    "subElemen": ["Sub elemen 1", "Sub elemen 2"],
    "capaianUtama": "Pernyataan CP sesuai kurikulum merdeka (1-2 paragraf)",
    "fokusMateri": "Fokus materi dalam LKPD ini"
  },
  "tujuanPembelajaran": [
    {
      "domain": "kognitif/afektif/psikomotor",
      "tujuan": "Pernyataan tujuan dengan KKO (kata kerja operasional)",
      "indikator": "Indikator pencapaian yang terukur"
    }
  ],
  "kataKunciMateri": ["kata kunci 1", "kata kunci 2", "kata kunci 3"]
}

PRINSIP PENYUSUNAN:
- CP harus sesuai dengan Kurikulum Merdeka untuk mata pelajaran terkait
- Tujuan pembelajaran harus SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- Gunakan kata kerja operasional yang tepat sesuai level kognitif
- Mencakup aspek kognitif, afektif, dan/atau psikomotor yang relevan
`);

			const userPrompt = `
INFORMASI INPUT:
- Judul LKPD: ${input.judulLKPD}
- Mata Pelajaran: ${input.mapel}
- Kelas: ${input.kelas}
- Semester: ${input.semester || '1'}
- Topik/Materi: ${input.topikMateri || input.judulLKPD}
- Fase: ${context.identitas?.identitas?.fase || 'Fase C'}

KONTEKS TAMBAHAN:
${input.deskripsiMateri ? `Deskripsi Materi: ${input.deskripsiMateri}` : ''}
${input.fokusKompetensi ? `Fokus Kompetensi: ${input.fokusKompetensi}` : ''}

TUGAS:
Buatlah capaian pembelajaran dan tujuan pembelajaran yang sesuai dengan:
1. Kurikulum Merdeka untuk mata pelajaran ${input.mapel}
2. Karakteristik siswa ${input.kelas}
3. Topik materi yang akan dipelajari
4. Dapat dicapai melalui kegiatan dalam LKPD

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

			this.log('Capaian Kompetensi generated successfully');

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

		if (!data.capaianPembelajaran) {
			errors.push('Capaian Pembelajaran harus ada');
		} else {
			if (!data.capaianPembelajaran.capaianUtama) {
				errors.push('Capaian utama harus diisi');
			}
		}

		if (!data.tujuanPembelajaran || data.tujuanPembelajaran.length === 0) {
			errors.push('Minimal 1 tujuan pembelajaran harus ada');
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}
}
