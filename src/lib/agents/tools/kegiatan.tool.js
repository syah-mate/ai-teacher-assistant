/**
 * Kegiatan Tool
 *
 * Diambil dari KegiatanPembelajaranAgent.
 * Hanya digunakan untuk jenis dokumen 'modul_ajar'.
 * Context wajib berisi identitas dan capaian dari tool sebelumnya.
 */

import { BaseAgent } from '../base-agent.js';
import { getModelPembelajaran } from '$lib/prompts/kurikulum-merdeka-base.js';

export class KegiatanTool extends BaseAgent {
	constructor() {
		super(
			'KegiatanTool',
			'Perancang Kegiatan Pembelajaran',
			'Langkah pembelajaran, aktivitas siswa, dan media pembelajaran'
		);
	}

	/**
	 * @param {Object} input
	 * @param {Object} context - Wajib berisi context.identitas dan context.capaian
	 */
	async execute(input, context = {}) {
		this.log(`Starting for: ${input.judul}`);

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

3. PERLENGKAPAN & MEDIA
   - Media pembelajaran, bahan ajar, sumber belajar

4. LANGKAH PEMBELAJARAN (${input.metode || 'Problem Based Learning'})

   A. KEGIATAN PEMBUKA (10-15 menit)
   B. KEGIATAN INTI (60-70 menit)
      Model: ${modelDetail.nama}
      Sintak:
${(modelDetail.sintak || []).map((s, i) => `      ${i + 1}. ${s}`).join('\n')}
   C. KEGIATAN PENUTUP (10-15 menit)

5. CATATAN DIFERENSIASI

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
        "bahanAjar": ["Bahan 1"],
        "sumberBelajar": ["Sumber 1"]
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
Mata Pelajaran      : ${input.mapel}
Kelas               : ${input.kelas}
Topik               : ${input.judul}
Jumlah Pertemuan    : ${jumlahPertemuan}
Alokasi per Pertemuan: ${input.alokasiPerPertemuan || '2x45 menit'}
Metode Pembelajaran : ${input.metode || 'Problem Based Learning'}
Mode                : ${input.modePembelajaran || 'Luring'}

${context.capaian ? `
KONTEKS - TUJUAN PEMBELAJARAN:
${JSON.stringify(context.capaian.tujuanPembelajaran, null, 2)}

ALUR PEMBELAJARAN:
${JSON.stringify(context.capaian.alurTujuanPembelajaran, null, 2)}
` : ''}

Buatlah kegiatan pembelajaran yang LENGKAP dan PRAKTIS untuk ${jumlahPertemuan} pertemuan.
Setiap pertemuan harus detail, terstruktur, dan siap digunakan guru.

OUTPUT harus dalam format JSON yang valid.
`;

		try {
			const result = await this.callAI(systemPrompt, userPrompt, { timeout: 90000 });
			if (!result.success) return { success: false, error: result.error, agentName: this.name };

			const parsedData = this.parseJSON(result.data);

			if (parsedData?.parseError) {
				return {
					success: false,
					error: 'Gagal memparse respons AI. Silakan coba lagi.',
					agentName: this.name
				};
			}

			// Normalize: AI sometimes wraps pertemuan in a parent key
			const normalized = this.normalizeData(parsedData);
			const validation = this.validate(normalized);
			if (!validation.isValid) {
				return {
					success: false,
					error: `Validasi gagal: ${validation.errors.join(', ')}`,
					agentName: this.name
				};
			}

			return { success: true, data: normalized, agentName: this.name, metadata: this.getMetadata() };
		} catch (error) {
			this.log(error.message, 'error');
			return { success: false, error: error.message, agentName: this.name };
		}
	}

	normalizeData(data) {
		if (data.pertemuan && Array.isArray(data.pertemuan)) return data;
		// Cari array pertemuan di nested keys
		for (const key of Object.keys(data)) {
			if (Array.isArray(data[key]) && data[key].length > 0 && data[key][0].nomorPertemuan !== undefined) {
				return { pertemuan: data[key] };
			}
		}
		return data;
	}

	validate(output) {
		const errors = [];
		if (!output.pertemuan || !Array.isArray(output.pertemuan)) {
			errors.push('pertemuan must be an array');
		} else if (output.pertemuan.length === 0) {
			errors.push('pertemuan must have at least 1 item');
		}
		return { isValid: errors.length === 0, errors };
	}

	getModelKey(metode = '') {
		if (metode.includes('Discovery')) return 'discoveryLearning';
		if (metode.includes('Project')) return 'projectBased';
		if (metode.includes('Inquiry')) return 'inquiryLearning';
		return 'pbl';
	}
}
