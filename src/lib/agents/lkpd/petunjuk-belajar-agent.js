/**
 * Petunjuk Belajar Agent untuk LKPD
 * 
 * Specialized agent untuk membuat PETUNJUK BELAJAR pada LKPD
 * Instruksi cara mengerjakan LKPD secara mandiri atau berkelompok
 */

import { BaseAgent } from '../base-agent.js';

export class PetunjukBelajarAgent extends BaseAgent {
	constructor() {
		super(
			'PetunjukBelajarAgent',
			'Penyusun Petunjuk Belajar LKPD',
			'Instruksi dan panduan cara mengerjakan LKPD'
		);
	}

	/**
	 * Execute agent untuk generate petunjuk belajar
	 * 
	 * @param {Object} input - User input
	 * @param {Object} context - Context dari agents sebelumnya
	 * @returns {Promise<Object>}
	 */
	async execute(input, context = {}) {
		this.log(`Starting execution for: ${input.judulLKPD}`);

		try {
			const systemPrompt = this.buildSystemPrompt(`
Buat PETUNJUK BELAJAR yang jelas, sistematis, dan mudah dipahami siswa.

KOMPONEN PETUNJUK BELAJAR:
1. PETUNJUK UMUM
   - Cara membaca dan memahami LKPD
   - Pola kerja (individu/kelompok)
   - Waktu pengerjaan

2. PETUNJUK KHUSUS
   - Langkah-langkah mengerjakan LKPD secara berurutan
   - Cara mengisi bagian-bagian tertentu
   - Cara melakukan observasi/eksperimen (jika ada)

3. PERATURAN & ETIKA
   - Sikap yang diharapkan selama mengerjakan
   - Kerjasama dalam kelompok
   - Ketelitian dan kejujuran

OUTPUT FORMAT (JSON):
{
  "petunjukUmum": {
    "polaBelajar": "individu/kelompok/berpasangan",
    "waktuPengerjaan": "X menit",
    "instruksiUmum": ["Instruksi 1", "Instruksi 2", "Instruksi 3"]
  },
  "petunjukKhusus": [
    {
      "langkah": 1,
      "instruksi": "Deskripsi langkah yang jelas",
      "tips": "Tips untuk siswa (opsional)"
    }
  ],
  "sikapYangDiharapkan": ["Sikap 1", "Sikap 2", "Sikap 3"],
  "materiYangDibutuhkan": ["Material 1", "Material 2"]
}

PRINSIP PENYUSUNAN:
- Bahasa sederhana dan mudah dipahami siswa
- Urutan logis dan sistematis
- Tidak ambigu atau bermakna ganda (sesuai syarat konstruksi LKPD)
- Mendorong keaktifan dan kemandirian siswa (sesuai syarat didaktik)
- Jelas untuk diikuti tanpa bingung
`);

			const userPrompt = `
INFORMASI INPUT:
- Judul LKPD: ${input.judulLKPD}
- Kelas: ${input.kelas}
- Jenis Kegiatan: ${input.jenisKegiatan || 'kegiatan pembelajaran umum'}
- Pola Belajar: ${input.polaBelajar || 'berkelompok'}
- Alokasi Waktu: ${input.alokasiWaktu || '2x45 menit'}

KONTEKS:
${context.capaianKompetensi?.capaianPembelajaran?.fokusMateri ? 
  `Fokus Materi: ${context.capaianKompetensi.capaianPembelajaran.fokusMateri}` : ''}

JENIS KEGIATAN DALAM LKPD:
${input.jenisKegiatan === 'eksperimen' ? '- Melakukan eksperimen/percobaan' : ''}
${input.jenisKegiatan === 'observasi' ? '- Melakukan observasi' : ''}
${input.jenisKegiatan === 'diskusi' ? '- Diskusi kelompok dan pemecahan masalah' : ''}
${input.jenisKegiatan === 'latihan' ? '- Latihan soal dan aplikasi konsep' : ''}
${!input.jenisKegiatan ? '- Kegiatan pembelajaran umum' : ''}

TUGAS:
Buatlah petunjuk belajar yang:
1. Mudah dipahami siswa kelas ${input.kelas}
2. Memandu siswa mengerjakan LKPD secara mandiri/kelompok
3. Mendorong keaktifan dan tanggung jawab belajar
4. Jelas dan tidak menimbulkan kebingungan

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

			this.log('Petunjuk Belajar generated successfully');

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

		if (!data.petunjukUmum) {
			errors.push('Petunjuk umum harus ada');
		}

		if (!data.petunjukKhusus || data.petunjukKhusus.length === 0) {
			errors.push('Petunjuk khusus harus ada minimal 1 langkah');
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}
}
