/**
 * Asesmen Agent
 * 
 * Specialized agent untuk membuat RENCANA ASESMEN:
 * - Asesmen Diagnostik
 * - Asesmen Formatif
 * - Asesmen Sumatif
 * - Rubrik Penilaian
 * - Instrumen Refleksi
 */

import { BaseAgent } from '../base-agent.js';

export class AsesmenAgent extends BaseAgent {
	constructor() {
		super(
			'AsesmenAgent',
			'Perancang Asesmen Pembelajaran',
			'Instrumen penilaian diagnostik, formatif, sumatif, dan rubrik'
		);
	}

	/**
	 * Execute agent untuk generate asesmen lengkap
	 * 
	 * @param {Object} input - User input
	 * @param {Object} context - Context dari agents sebelumnya
	 * @returns {Promise<Object>}
	 */
	async execute(input, context = {}) {
		this.log(`Starting execution for: ${input.judulModul}`);

		try {
			const systemPrompt = this.buildSystemPrompt(`
Buat RENCANA ASESMEN LENGKAP yang mencakup seluruh aspek penilaian dalam Kurikulum Merdeka.

JENIS ASESMEN YANG HARUS DIBUAT:

1. ASESMEN DIAGNOSTIK (Awal Pembelajaran)
   - Tujuan: Mengidentifikasi pengetahuan awal dan kesiapan siswa
   - Format: Pertanyaan lisan, kuis singkat, atau observasi
   - Waktu: 10-15 menit di pertemuan pertama
   - Instrumen: 5-8 pertanyaan atau aktivitas diagnostik

2. ASESMEN FORMATIF (Selama Pembelajaran)
   - Tujuan: Monitoring progress dan memberikan feedback
   - Format: Kuis, tanya jawab, observasi, tugas, diskusi
   - Waktu: Dilakukan di setiap pertemuan
   - Instrumen: Berbagai teknik per pertemuan
   - Kriteria keberhasilan yang jelas

3. ASESMEN SUMATIF (Akhir Pembelajaran)
   - Tujuan: Mengukur pencapaian akhir tujuan pembelajaran
   - Format: Tes tertulis, proyek, presentasi, atau portofolio
   - Mencakup semua tujuan pembelajaran
   - Instrumen: Soal/tugas yang komprehensif

4. RUBRIK PENILAIAN
   - Rubrik untuk setiap jenis asesmen
   - Kriteria penilaian yang jelas dan terukur
   - Skala penilaian (4 level: Sangat Baik, Baik, Cukup, Perlu Bimbingan)
   - Deskriptor untuk setiap level

5. INSTRUMEN REFLEKSI
   - Refleksi siswa terhadap pembelajaran
   - Refleksi guru terhadap efektivitas pembelajaran
   - Format sederhana dan mudah digunakan

PRINSIP ASESMEN:
- Otentik dan kontekstual
- Berpusat pada siswa
- Mendorong higher-order thinking
- Fair dan tidak bias
- Memberikan feedback yang konstruktif

OUTPUT FORMAT (JSON):
{
  "asesmenDiagnostik": {
    "tujuan": "Mengidentifikasi...",
    "waktu": "15 menit",
    "format": "Kuis/Pertanyaan/Observasi",
    "instrumen": [
      {
        "nomor": 1,
        "pertanyaan": "Pertanyaan diagnostik",
        "tujuan": "Mengukur apa"
      }
    ]
  },
  "asesmenFormatif": [
    {
      "pertemuan": 1,
      "teknik": "Tanya jawab/Kuis/Observasi",
      "deskripsi": "Deskripsi aktivitas asesmen",
      "kriteria": "Kriteria keberhasilan",
      "instrumen": "Detail instrumen atau pertanyaan"
    }
  ],
  "asesmenSumatif": {
    "jenis": "Tes tertulis/Proyek/Presentasi/Portofolio",
    "deskripsi": "Deskripsi lengkap asesmen sumatif",
    "waktu": "90 menit",
    "komponenPenilaian": [
      {
        "komponen": "Nama komponen",
        "bobot": "40%",
        "deskripsi": "Apa yang dinilai"
      }
    ],
    "instrumen": {
      "soalEsai": ["Soal 1", "Soal 2"],
      "soalPilihanGanda": ["Soal 1", "Soal 2"],
      "tugasProyek": "Deskripsi tugas proyek (jika ada)"
    }
  },
  "rubrikPenilaian": [
    {
      "jenisAsesmen": "Formatif/Sumatif",
      "aspekYangDinilai": "Nama aspek",
      "kriteria": [
        {
          "level": "Sangat Baik (90-100)",
          "deskriptor": "Deskripsi kinerja level ini"
        },
        {
          "level": "Baik (80-89)",
          "deskriptor": "Deskripsi kinerja level ini"
        },
        {
          "level": "Cukup (70-79)",
          "deskriptor": "Deskripsi kinerja level ini"
        },
        {
          "level": "Perlu Bimbingan (<70)",
          "deskriptor": "Deskripsi kinerja level ini"
        }
      ]
    }
  ],
  "refleksi": {
    "refleksiSiswa": {
      "pertanyaanPanduan": ["Pertanyaan 1?", "Pertanyaan 2?", "Pertanyaan 3?"]
    },
    "refleksiGuru": {
      "aspekRefleksi": ["Aspek 1", "Aspek 2", "Aspek 3"]
    }
  }
}
`);

			const userPrompt = `
INFORMASI INPUT:
- Mata Pelajaran: ${input.mapel}
- Kelas: ${input.kelas}
- Topik: ${input.judulModul}
- Jumlah Pertemuan: ${input.jumlahPertemuan || '4'}

${context.capaianTujuan ? `
KONTEKS - TUJUAN PEMBELAJARAN:
${JSON.stringify(context.capaianTujuan.tujuanPembelajaran, null, 2)}
` : ''}

${context.kegiatanPembelajaran ? `
KONTEKS - JUMLAH PERTEMUAN:
${context.kegiatanPembelajaran.pertemuan.length} pertemuan
` : ''}

TUGAS:
Buatlah rencana asesmen yang KOMPREHENSIF, TERUKUR, dan PRAKTIS.
Pastikan asesmen mencakup semua aspek (kognitif, afektif, psikomotorik) dan sesuai dengan tujuan pembelajaran.
Rubrik harus jelas dan mudah digunakan oleh guru.

OUTPUT harus dalam format JSON yang valid.
`;

			const result = await this.callAI(systemPrompt, userPrompt, { timeout: 90000 });

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
	 * Validate asesmen structure
	 */
	validate(output) {
		const errors = [];

		if (!output.asesmenDiagnostik) {
			errors.push('asesmenDiagnostik is required');
		}

		if (!output.asesmenFormatif || !Array.isArray(output.asesmenFormatif)) {
			errors.push('asesmenFormatif must be an array');
		}

		if (!output.asesmenSumatif) {
			errors.push('asesmenSumatif is required');
		}

		if (!output.rubrikPenilaian || !Array.isArray(output.rubrikPenilaian)) {
			errors.push('rubrikPenilaian must be an array');
		} else if (output.rubrikPenilaian.length === 0) {
			errors.push('rubrikPenilaian must have at least 1 rubrik');
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}
}
