/**
 * LKPD Content Tool
 *
 * Menggabungkan 4 agent LKPD: PetunjukBelajarAgent, MateriPendukungAgent,
 * LangkahKerjaAgent, EvaluasiRefleksiAgent menjadi 1 tool terpadu.
 *
 * Alasan digabung: keempat agent ini sangat tightly coupled untuk LKPD
 * dan output mereka saling bergantung secara linear.
 */

import { BaseAgent } from '../base-agent.js';

export class LkpdContentTool extends BaseAgent {
	constructor() {
		super(
			'LkpdContentTool',
			'Penyusun Konten LKPD',
			'Petunjuk belajar, materi pendukung, langkah kerja, evaluasi, dan refleksi'
		);
	}

	/**
	 * @param {Object} input
	 * @param {Object} context - Wajib berisi context.identitas dan context.capaian
	 */
	async execute(input, context = {}) {
		this.log(`Starting for: ${input.judul}`);

		const tujuanPembelajaran = context.capaian?.tujuanPembelajaran || [];
		const fokusMateri =
			context.capaian?.capaianPembelajaran?.fokusMateri || '';
		const kataKunci = context.capaian?.kataKunciMateri || [];

		const systemPrompt = this.buildSystemPrompt(`
Buat KONTEN LENGKAP LKPD yang mencakup 4 bagian utama:

1. PETUNJUK BELAJAR
   - Petunjuk umum cara membaca dan mengerjakan LKPD
   - Petunjuk khusus langkah-langkah berurutan
   - Alat/bahan yang dibutuhkan

2. MATERI PENDUKUNG
   - Ringkasan materi dengan konsep kunci
   - Peta konsep
   - Contoh dan ilustrasi konkret
   - Sumber belajar

3. LANGKAH KERJA / TUGAS
   - Aktivitas yang mendorong penemuan konsep (bukan sekadar menyalin)
   - Pertanyaan pemandu yang membuka critical thinking
   - Soal latihan dengan tingkat kesulitan bertahap
   - Ruang jawaban yang jelas

4. EVALUASI & REFLEKSI
   - Soal evaluasi mengukur semua tujuan pembelajaran
   - Rubrik penilaian yang jelas
   - Pertanyaan refleksi diri (metacognition)
   - Panduan kesimpulan

OUTPUT FORMAT (JSON):
{
  "petunjukBelajar": {
    "petunjukUmum": {
      "polaBelajar": "individu/kelompok/berpasangan",
      "waktuPengerjaan": "X menit",
      "instruksiUmum": ["Instruksi 1", "Instruksi 2"]
    },
    "petunjukKhusus": [
      { "langkah": 1, "instruksi": "Deskripsi langkah", "tips": "Tips opsional" }
    ],
    "sikapYangDiharapkan": ["Sikap 1", "Sikap 2"],
    "materiYangDibutuhkan": ["Material 1", "Material 2"]
  },
  "materiPendukung": {
    "ringkasanMateri": {
      "konsepKunci": [
        { "nama": "Nama konsep", "definisi": "Definisi singkat", "penjelasan": "Detail" }
      ],
      "poinPenting": ["Poin 1", "Poin 2"]
    },
    "petaKonsep": {
      "temaSentral": "Tema utama",
      "subTema": [{ "nama": "Sub tema", "deskripsi": "Deskripsi" }]
    },
    "contohDanIlustrasi": [
      { "judul": "Judul contoh", "deskripsi": "Penjelasan contoh konkret" }
    ],
    "sumberBelajar": {
      "referensiBuku": ["Buku 1"],
      "videoRekomendasi": [{ "judul": "Judul video", "deskripsi": "Deskripsi" }],
      "bacaanTambahan": []
    }
  },
  "langkahKerja": {
    "bagianUtama": [
      {
        "bagian": "Bagian 1 - Eksplorasi Konsep",
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
  },
  "evaluasiRefleksi": {
    "evaluasi": {
      "soalEvaluasi": [
        {
          "nomor": 1,
          "soal": "Pertanyaan evaluasi",
          "levelKognitif": "C1/C2/C3/C4/C5/C6",
          "jenisJawaban": "pilihan ganda/essay/isian",
          "kunciJawaban": "Kunci jawaban",
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
            { "level": "Sangat Baik", "skor": "90-100", "deskripsi": "Deskripsi" },
            { "level": "Baik", "skor": "75-89", "deskripsi": "Deskripsi" }
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
}

PRINSIP PENYUSUNAN LKPD:
- SYARAT DIDAKTIK: Mendorong penemuan konsep, bukan sekadar menyalin
- SYARAT KONSTRUKSI: Bahasa jelas, tidak ambigu, sesuai tingkat siswa
- SYARAT TEKNIS: Format rapi, ruang kerja cukup
- Aktivitas student-centered dan engaging
`);

		const userPrompt = `
Judul LKPD        : ${input.judul}
Mata Pelajaran    : ${input.mapel}
Kelas             : ${input.kelas}
Jenis Kegiatan    : ${input.jenisKegiatan || 'pembelajaran umum'}
Pola Belajar      : ${input.polaBelajar || 'berkelompok'}
Alokasi Waktu     : ${input.alokasiWaktu || input.alokasiPerPertemuan || '2x45 menit'}

TUJUAN PEMBELAJARAN:
${tujuanPembelajaran.map((tp, i) => `${i + 1}. ${tp.tujuan || tp}`).join('\n')}

FOKUS MATERI: ${fokusMateri}
KATA KUNCI: ${kataKunci.join(', ')}

Buatlah konten LKPD yang lengkap, sistematis, dan mendorong active learning.
Sesuaikan dengan karakteristik siswa kelas ${input.kelas}.

OUTPUT harus dalam format JSON yang valid.
`;

		try {
			const result = await this.callAI(systemPrompt, userPrompt, { timeout: 90000 });
			if (!result.success) return { success: false, error: result.error, agentName: this.name };

			const data = this.parseJSON(result.data);
			const validation = this.validate(data);
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

	validate(output) {
		const errors = [];
		if (!output.petunjukBelajar) errors.push('petunjukBelajar is required');
		if (!output.materiPendukung) errors.push('materiPendukung is required');
		if (!output.langkahKerja) errors.push('langkahKerja is required');
		if (!output.evaluasiRefleksi) errors.push('evaluasiRefleksi is required');
		return { isValid: errors.length === 0, errors };
	}
}
