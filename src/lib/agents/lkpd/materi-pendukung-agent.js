/**
 * Materi Pendukung Agent untuk LKPD
 * 
 * Specialized agent untuk membuat MATERI PENDUKUNG pada LKPD
 * Ringkasan materi, referensi bacaan, atau link video pembelajaran
 */

import { BaseAgent } from '../base-agent.js';

export class MateriPendukungAgent extends BaseAgent {
	constructor() {
		super(
			'MateriPendukungAgent',
			'Penyusun Materi Pendukung LKPD',
			'Ringkasan materi, konsep kunci, dan sumber belajar'
		);
	}

	/**
	 * Execute agent untuk generate materi pendukung
	 * 
	 * @param {Object} input - User input
	 * @param {Object} context - Context dari agents sebelumnya
	 * @returns {Promise<Object>}
	 */
	async execute(input, context = {}) {
		this.log(`Starting execution for: ${input.judulLKPD}`);

		try {
			const systemPrompt = this.buildSystemPrompt(`
Buat MATERI PENDUKUNG yang membantu siswa memahami konsep sebelum mengerjakan tugas.

KOMPONEN MATERI PENDUKUNG:
1. RINGKASAN MATERI
   - Konsep kunci yang perlu dipahami
   - Penjelasan singkat dan padat
   - Bahasa yang mudah dipahami siswa

2. PETA KONSEP / INFO GRAFIS
   - Hubungan antar konsep
   - Visualisasi materi (deskripsi)

3. CONTOH & ILUSTRASI
   - Contoh konkret dari konsep
   - Ilustrasi yang relevan dengan kehidupan siswa

4. SUMBER BELAJAR
   - Referensi buku
   - Link video pembelajaran (jika ada)
   - Sumber bacaan tambahan

OUTPUT FORMAT (JSON):
{
  "ringkasanMateri": {
    "konsepKunci": [
      {
        "nama": "Nama konsep",
        "definisi": "Definisi singkat",
        "penjelasan": "Penjelasan lebih detail"
      }
    ],
    "poinPenting": ["Poin 1", "Poin 2", "Poin 3"]
  },
  "petaKonsep": {
    "temaSentral": "Tema utama",
    "subTema": [
      {
        "nama": "Sub tema",
        "deskripsi": "Deskripsi singkat"
      }
    ]
  },
  "contohDanIlustrasi": [
    {
      "judul": "Judul contoh",
      "deskripsi": "Penjelasan contoh konkret"
    }
  ],
  "sumberBelajar": {
    "referensiBuku": ["Buku 1", "Buku 2"],
    "videoRekomendasi": [
      {
        "judul": "Judul video",
        "deskripsi": "Deskripsi singkat isi video",
        "url": "URL (opsional)"
      }
    ],
    "bacaanTambahan": ["Link/sumber tambahan"]
  }
}

PRINSIP PENYUSUNAN:
- Materi harus esensial dan fokus pada yang penting
- Bahasa sederhana sesuai tingkat pemahaman siswa
- Berikan contoh yang relevan dengan kehidupan nyata
- Tidak terlalu panjang, cukup untuk memahami konsep dasar
- Mendukung siswa dalam mengerjakan tugas di LKPD
`);

			const kataKunci = context.capaianKompetensi?.kataKunciMateri || [];
			const fokusMateri = context.capaianKompetensi?.capaianPembelajaran?.fokusMateri || '';

			const userPrompt = `
INFORMASI INPUT:
- Judul LKPD: ${input.judulLKPD}
- Mata Pelajaran: ${input.mapel}
- Kelas: ${input.kelas}
- Topik: ${input.topikMateri || input.judulLKPD}

KONTEKS PEMBELAJARAN:
- Fokus Materi: ${fokusMateri}
- Kata Kunci: ${kataKunci.join(', ')}
- Tujuan Pembelajaran: ${context.capaianKompetensi?.tujuanPembelajaran?.map(t => t.tujuan).join('; ') || ''}

DESKRIPSI MATERI TAMBAHAN:
${input.deskripsiMateri || 'Sesuai dengan judul dan topik LKPD'}

TUGAS:
Buatlah materi pendukung yang:
1. Memberikan bekal pemahaman dasar untuk mengerjakan LKPD
2. Ringkas namun lengkap mencakup konsep kunci
3. Mudah dipahami siswa kelas ${input.kelas}
4. Relevan dan aplikatif untuk kehidupan siswa

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

			this.log('Materi Pendukung generated successfully');

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

		if (!data.ringkasanMateri) {
			errors.push('Ringkasan materi harus ada');
		}

		if (!data.ringkasanMateri?.konsepKunci || data.ringkasanMateri.konsepKunci.length === 0) {
			errors.push('Minimal 1 konsep kunci harus ada');
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}
}
