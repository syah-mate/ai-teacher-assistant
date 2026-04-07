/**
 * Langkah Kerja Agent untuk LKPD
 * 
 * Specialized agent untuk membuat LANGKAH KERJA/TUGAS pada LKPD
 * Urutan aktivitas, percobaan, atau soal-soal latihan yang sistematis
 */

import { BaseAgent } from '../base-agent.js';

export class LangkahKerjaAgent extends BaseAgent {
	constructor() {
		super(
			'LangkahKerjaAgent',
			'Penyusun Langkah Kerja LKPD',
			'Aktivitas, tugas, dan soal-soal pembelajaran'
		);
	}

	/**
	 * Execute agent untuk generate langkah kerja
	 * 
	 * @param {Object} input - User input
	 * @param {Object} context - Context dari agents sebelumnya
	 * @returns {Promise<Object>}
	 */
	async execute(input, context = {}) {
		this.log(`Starting execution for: ${input.judulLKPD}`);

		try {
			const systemPrompt = this.buildSystemPrompt(`
Buat LANGKAH KERJA/TUGAS yang sistematis dan mendorong active learning.

KOMPONEN LANGKAH KERJA:
1. AKTIVITAS PEMBELAJARAN
   - Urutan kegiatan yang logis
   - Instruksi yang jelas untuk setiap langkah
   - Ruang/kolom untuk siswa menulis jawaban

2. PERTANYAAN PEMANDU
   - Pertanyaan yang menggali pemahaman
   - Mendorong berpikir kritis dan analitis
   - Sesuai dengan level kognitif yang ditargetkan

3. TUGAS/LATIHAN
   - Soal-soal aplikasi konsep
   - Variasi tingkat kesulitan (mudah, sedang, sulit)
   - Kontekstual dan relevan

4. RUANG KERJA
   - Kolom observasi (jika ada eksperimen)
   - Tabel data (jika ada pengumpulan data)
   - Area untuk menjawab, menggambar, atau mencatat

OUTPUT FORMAT (JSON):
{
  "bagianUtama": [
    {
      "bagian": "Nama bagian (mis: Bagian 1 - Eksplorasi Konsep)",
      "tujuanBagian": "Tujuan dari bagian ini",
      "langkahKerja": [
        {
          "nomor": 1,
          "instruksi": "Instruksi yang jelas",
          "jenisAktivitas": "observasi/eksperimen/diskusi/latihan/analisis",
          "pertanyaanPemandu": ["Pertanyaan 1", "Pertanyaan 2"],
          "formatJawaban": "teks/tabel/gambar/diagram",
          "ruangJawaban": "Deskripsi ruang yang disediakan"
        }
      ]
    }
  ],
  "soalLatihan": [
    {
      "nomor": 1,
      "soal": "Pertanyaan/soal",
      "tingkatKesulitan": "mudah/sedang/sulit",
      "jenisJawaban": "pilihan ganda/essay/isian/benar-salah",
      "bobotPoin": 10
    }
  ],
  "tugasPengayaan": {
    "deskripsi": "Tugas tambahan untuk siswa yang lebih cepat",
    "instruksi": "Instruksi tugas pengayaan"
  }
}

PRINSIP PENYUSUNAN (SYARAT DIDAKTIK):
- Mendorong PENEMUAN KONSEP, bukan sekadar menyalin
- Memperhatikan PERBEDAAN INDIVIDUAL (tingkat kesulitan bertahap)
- Fokus pada PROSES, bukan hanya hasil akhir
- Aktivitas yang STUDENT-CENTERED dan engaging

PRINSIP BAHASA (SYARAT KONSTRUKSI):
- Bahasa Indonesia baku sesuai PUEBI
- Kalimat TIDAK AMBIGU
- Tingkat kesulitan bahasa sesuai siswa
`);

			const tujuanPembelajaran = context.capaianKompetensi?.tujuanPembelajaran || [];
			const fokusMateri = context.capaianKompetensi?.capaianPembelajaran?.fokusMateri || '';

			const userPrompt = `
INFORMASI INPUT:
- Judul LKPD: ${input.judulLKPD}
- Kelas: ${input.kelas}
- Jenis Kegiatan: ${input.jenisKegiatan || 'pembelajaran umum'}
- Pola Belajar: ${input.polaBelajar || 'berkelompok'}

TUJUAN PEMBELAJARAN:
${tujuanPembelajaran.map((tp, i) => `${i + 1}. ${tp.tujuan}`).join('\n')}

FOKUS MATERI:
${fokusMateri}

DESKRIPSI AKTIVITAS:
${input.deskripsiAktivitas || 'Sesuai dengan topik dan tujuan pembelajaran'}

TUGAS:
Buatlah langkah kerja yang:
1. Sistematis dan mudah diikuti
2. Mendorong siswa AKTIF menemukan konsep sendiri
3. Memiliki tingkat kesulitan yang bertahap
4. Sesuai dengan karakteristik siswa kelas ${input.kelas}
5. Menyediakan ruang yang cukup untuk siswa bekerja
6. Kontekstual dan bermakna

PENTING:
- Jangan buat soal yang hanya "menyalin" jawaban dari buku
- Dorong critical thinking dan problem solving
- Berikan pertanyaan yang open-ended untuk diskusi

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

			this.log('Langkah Kerja generated successfully');

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

		if (!data.bagianUtama || data.bagianUtama.length === 0) {
			errors.push('Minimal 1 bagian utama harus ada');
		}

		if (data.bagianUtama && data.bagianUtama.length > 0) {
			data.bagianUtama.forEach((bagian, idx) => {
				if (!bagian.langkahKerja || bagian.langkahKerja.length === 0) {
					errors.push(`Bagian ${idx + 1} harus memiliki minimal 1 langkah kerja`);
				}
			});
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}
}
