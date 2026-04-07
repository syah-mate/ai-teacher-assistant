/**
 * Evaluasi Refleksi Agent untuk LKPD
 * 
 * Specialized agent untuk membuat EVALUASI/REFLEKSI pada LKPD
 * Mengukur pemahaman dan refleksi siswa terhadap proses belajar
 */

import { BaseAgent } from '../base-agent.js';

export class EvaluasiRefleksiAgent extends BaseAgent {
	constructor() {
		super(
			'EvaluasiRefleksiAgent',
			'Penyusun Evaluasi dan Refleksi LKPD',
			'Penilaian pemahaman dan refleksi pembelajaran'
		);
	}

	/**
	 * Execute agent untuk generate evaluasi dan refleksi
	 * 
	 * @param {Object} input - User input
	 * @param {Object} context - Context dari agents sebelumnya
	 * @returns {Promise<Object>}
	 */
	async execute(input, context = {}) {
		this.log(`Starting execution for: ${input.judulLKPD}`);

		try {
			const systemPrompt = this.buildSystemPrompt(`
Buat EVALUASI dan REFLEKSI untuk mengukur pemahaman dan menumbuhkan kesadaran belajar siswa.

KOMPONEN EVALUASI & REFLEKSI:

1. SOAL EVALUASI
   - Mengukur pencapaian tujuan pembelajaran
   - Variasi level kognitif (C1-C6)
   - Soal terukur dan objektif

2. RUBRIK PENILAIAN
   - Kriteria penilaian yang jelas
   - Indikator keberhasilan
   - Skala penilaian

3. REFLEKSI DIRI
   - Pertanyaan reflektif tentang proses belajar
   - Menggali pemahaman dan perasaan siswa
   - Mendorong metacognition

4. KESIMPULAN
   - Siswa merangkum pembelajaran
   - Menghubungkan dengan konsep yang dipelajari

OUTPUT FORMAT (JSON):
{
  "evaluasi": {
    "soalEvaluasi": [
      {
        "nomor": 1,
        "soal": "Pertanyaan evaluasi",
        "levelKognitif": "C1/C2/C3/C4/C5/C6",
        "jenisJawaban": "pilihan ganda/essay/isian/praktik",
        "kunciJawaban": "Kunci jawaban (opsional untuk guru)",
        "skorMaksimal": 10
      }
    ],
    "totalSkor": 100
  },
  "rubrikPenilaian": {
    "kriteria": [
      {
        "aspek": "Nama aspek yang dinilai",
        "indikator": [
          {
            "level": "Sangat Baik",
            "skor": "90-100",
            "deskripsi": "Deskripsi kriteria"
          },
          {
            "level": "Baik",
            "skor": "75-89",
            "deskripsi": "Deskripsi kriteria"
          }
        ]
      }
    ]
  },
  "refleksiDiri": {
    "pertanyaanRefleksi": [
      "Apa yang sudah kamu pahami dari pembelajaran hari ini?",
      "Apa yang masih membuatmu bingung?",
      "Bagaimana perasaanmu selama belajar?",
      "Apa yang akan kamu lakukan untuk memperbaiki pemahamanmu?"
    ],
    "formatRefleksi": "teks bebas/checklist/skala"
  },
  "kesimpulan": {
    "pertanyaanPemandu": ["Pemandu 1", "Pemandu 2"],
    "instruksi": "Tuliskan kesimpulanmu tentang materi yang dipelajari"
  }
}

PRINSIP PENYUSUNAN:
- Evaluasi harus TERUKUR dan sesuai dengan tujuan pembelajaran
- Pertanyaan refleksi mendorong KESADARAN BELAJAR (metacognition)
- Rubrik membantu siswa memahami ekspektasi kualitas kerja
- Bahasa yang mendorong siswa jujur dan terbuka
- Variasi jenis soal untuk mengakomodasi gaya belajar berbeda
`);

			const tujuanPembelajaran = context.capaianKompetensi?.tujuanPembelajaran || [];

			const userPrompt = `
INFORMASI INPUT:
- Judul LKPD: ${input.judulLKPD}
- Kelas: ${input.kelas}
- Mata Pelajaran: ${input.mapel}

TUJUAN PEMBELAJARAN YANG HARUS DIEVALUASI:
${tujuanPembelajaran.map((tp, i) => `${i + 1}. ${tp.tujuan} (Indikator: ${tp.indikator})`).join('\n')}

FOKUS EVALUASI:
${input.fokusEvaluasi || 'Sesuai dengan tujuan pembelajaran yang telah ditetapkan'}

TUGAS:
Buatlah evaluasi dan refleksi yang:
1. Mengukur SEMUA tujuan pembelajaran yang telah ditetapkan
2. Memiliki variasi level kognitif (tidak hanya C1-C2)
3. Mendorong siswa untuk refleksi mendalam tentang pembelajaran
4. Memiliki rubrik yang jelas dan objektif
5. Sesuai dengan karakteristik siswa kelas ${input.kelas}

PENTING:
- Soal evaluasi harus mengukur pemahaman, bukan sekadar hafalan
- Pertanyaan refleksi harus membuat siswa berpikir tentang PROSES belajarnya
- Rubrik harus spesifik dan dapat digunakan untuk self-assessment

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

			this.log('Evaluasi Refleksi generated successfully');

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

		if (!data.evaluasi) {
			errors.push('Bagian evaluasi harus ada');
		}

		if (!data.evaluasi?.soalEvaluasi || data.evaluasi.soalEvaluasi.length === 0) {
			errors.push('Minimal 1 soal evaluasi harus ada');
		}

		if (!data.refleksiDiri) {
			errors.push('Bagian refleksi diri harus ada');
		}

		if (!data.refleksiDiri?.pertanyaanRefleksi || data.refleksiDiri.pertanyaanRefleksi.length === 0) {
			errors.push('Minimal 1 pertanyaan refleksi harus ada');
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}
}
