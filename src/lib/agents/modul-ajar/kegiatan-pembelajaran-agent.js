/**
 * Kegiatan Pembelajaran Agent
 * 
 * Specialized agent untuk membuat DETAIL PERTEMUAN dengan rincian kegiatan pembelajaran:
 * - Tujuan pembelajaran per pertemuan
 * - Indikator keberhasilan
 * - Pertanyaan pemantik
 * - Langkah pembelajaran (Pembuka, Inti, Penutup)
 * - Perlengkapan dan media ajar
 */

import { BaseAgent } from '../base-agent.js';
import { getModelPembelajaran } from '$lib/prompts/kurikulum-merdeka-base.js';

export class KegiatanPembelajaranAgent extends BaseAgent {
	constructor() {
		super(
			'KegiatanPembelajaranAgent',
			'Perancang Kegiatan Pembelajaran',
			'Langkah pembelajaran, aktivitas siswa, dan media pembelajaran'
		);
	}

	/**
	 * Execute agent untuk generate kegiatan pembelajaran per pertemuan
	 * 
	 * @param {Object} input - User input
	 * @param {Object} context - Context dari agents sebelumnya
	 * @returns {Promise<Object>}
	 */
	async execute(input, context = {}) {
		this.log(`Starting execution for: ${input.judulModul}`);

		try {
			// Get model pembelajaran details
			const modelKey = this.getModelKey(input.metode);
			const modelDetail = getModelPembelajaran(modelKey);

			const jumlahPertemuan = parseInt(input.jumlahPertemuan) || 4;

			const systemPrompt = this.buildSystemPrompt(`
Buat KEGIATAN PEMBELAJARAN DETAIL untuk ${jumlahPertemuan} pertemuan.

STRUKTUR SETIAP PERTEMUAN:

1. INFORMASI PERTEMUAN
   - Nomor pertemuan
   - Tujuan pembelajaran pertemuan ini
   - Indikator keberhasilan yang terukur
   - Alokasi waktu

2. PERTANYAAN PEMANTIK
   - 3-4 pertanyaan yang menarik dan memicu berpikir
   - Relevan dengan materi pertemuan
   - Membangun curiosity siswa

3. PERLENGKAPAN & MEDIA
   - Daftar media pembelajaran (PPT, video, alat peraga, dll)
   - Bahan ajar dan LKS
   - Sumber belajar

4. LANGKAH PEMBELAJARAN (${input.metode || 'Problem Based Learning'})

   A. KEGIATAN PEMBUKA (10-15 menit)
      - Apersepsi dan motivasi
      - Orientasi masalah/topik
      - Penyampaian tujuan

   B. KEGIATAN INTI (60-70 menit)
      Model: ${modelDetail.nama}
      Sintak:
${modelDetail.sintak ? modelDetail.sintak.map((s, i) => `      ${i + 1}. ${s}`).join('\n') : ''}
      
      Untuk setiap fase, jelaskan:
      - Aktivitas guru (fasilitator)
      - Aktivitas siswa (aktif learning)
      - Waktu alokasi per fase
      - Instruksi spesifik

   C. KEGIATAN PENUTUP (10-15 menit)
      - Kesimpulan bersama
      - Refleksi pembelajaran
      - Penguatan konsep
      - Penugasan/persiapan pertemuan berikutnya

5. CATATAN DIFERENSIASI
   - Strategi untuk siswa yang kesulitan
   - Pengayaan untuk siswa advanced
   - Adaptasi untuk keberagaman gaya belajar

OUTPUT FORMAT (JSON):
{
  "pertemuan": [
    {
      "nomorPertemuan": 1,
      "judulPertemuan": "Judul spesifik pertemuan",
      "tujuanPertemuan": "Tujuan pembelajaran pertemuan ini",
      "indikatorKeberhasilan": ["Indikator 1", "Indikator 2"],
      "alokasiWaktu": "2 x 45 menit (2 JP)",
      "pertanyaanPemantik": ["Pertanyaan 1?", "Pertanyaan 2?", "Pertanyaan 3?"],
      "perlengkapan": {
        "media": ["Media 1", "Media 2"],
        "bahanAjar": ["Bahan 1", "Bahan 2"],
        "sumberBelajar": ["Sumber 1", "Sumber 2"]
      },
      "langkahPembelajaran": {
        "pembuka": {
          "waktu": "15 menit",
          "aktivitas": [
            {
              "tahap": "Apersepsi",
              "aktivitasGuru": "Deskripsi aktivitas guru",
              "aktivitasSiswa": "Deskripsi aktivitas siswa"
            }
          ]
        },
        "inti": {
          "waktu": "60 menit",
          "fase": [
            {
              "namaFase": "Nama fase sesuai model pembelajaran",
              "waktu": "20 menit",
              "aktivitasGuru": "Deskripsi detail aktivitas guru",
              "aktivitasSiswa": "Deskripsi detail aktivitas siswa",
              "instruksi": "Instruksi spesifik"
            }
          ]
        },
        "penutup": {
          "waktu": "15 menit",
          "aktivitas": [
            {
              "tahap": "Kesimpulan",
              "aktivitasGuru": "Deskripsi aktivitas guru",
              "aktivitasSiswa": "Deskripsi aktivitas siswa"
            }
          ]
        }
      },
      "diferensiasi": {
        "untukSiswaBerkesulitan": "Strategi adaptasi",
        "untukSiswaAdvanced": "Strategi pengayaan",
        "gayaBelajar": "Akomodasi visual, auditori, kinestetik"
      }
    }
  ]
}
`);

			const userPrompt = `
INFORMASI INPUT:
- Mata Pelajaran: ${input.mapel}
- Kelas: ${input.kelas}
- Topik: ${input.judulModul}
- Jumlah Pertemuan: ${jumlahPertemuan}
- Alokasi per Pertemuan: ${input.alokasiPerPertemuan || '2x45 menit'}
- Metode Pembelajaran: ${input.metode || 'Problem Based Learning'}
- Mode: ${input.modePembelajaran || 'Luring'}

${context.capaianTujuan ? `
KONTEKS - TUJUAN PEMBELAJARAN:
${JSON.stringify(context.capaianTujuan.tujuanPembelajaran, null, 2)}

ALUR PEMBELAJARAN:
${JSON.stringify(context.capaianTujuan.alurTujuanPembelajaran, null, 2)}
` : ''}

TUGAS:
Buatlah kegiatan pembelajaran yang LENGKAP dan PRAKTIS untuk ${jumlahPertemuan} pertemuan.
Setiap pertemuan harus detail, terstruktur, dan siap digunakan guru.
Pastikan variasi aktivitas yang engaging dan sesuai dengan karakteristik siswa.

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
	 * Validate kegiatan pembelajaran structure
	 */
	validate(output) {
		const errors = [];

		if (!output.pertemuan || !Array.isArray(output.pertemuan)) {
			errors.push('pertemuan must be an array');
		} else if (output.pertemuan.length === 0) {
			errors.push('pertemuan array cannot be empty');
		} else {
			// Validate each pertemuan
			output.pertemuan.forEach((p, idx) => {
				if (!p.langkahPembelajaran) {
					errors.push(`pertemuan[${idx}].langkahPembelajaran is required`);
				}
				if (!p.pertanyaanPemantik || p.pertanyaanPemantik.length < 2) {
					errors.push(`pertemuan[${idx}].pertanyaanPemantik must have at least 2 questions`);
				}
			});
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}

	/**
	 * Helper: Get model key from metode name
	 */
	getModelKey(metode) {
		if (!metode) return 'pbl';
		
		const lower = metode.toLowerCase();
		if (lower.includes('pbl') || lower.includes('problem')) return 'pbl';
		if (lower.includes('discovery')) return 'discoveryLearning';
		if (lower.includes('project')) return 'projectBased';
		if (lower.includes('inkuiri')) return 'inkuiri';
		if (lower.includes('steam')) return 'steam';
		
		return 'pbl'; // default
	}
}
