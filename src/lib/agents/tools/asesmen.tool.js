/**
 * Asesmen Tool
 *
 * Diambil dari AsesmenAgent.
 * Hanya digunakan untuk jenis dokumen 'modul_ajar'.
 * Context wajib berisi identitas, capaian, kegiatan dari tool sebelumnya.
 */

import { BaseAgent } from '../base-agent.js';

export class AsesmenTool extends BaseAgent {
	constructor() {
		super(
			'AsesmenTool',
			'Perancang Asesmen Pembelajaran',
			'Instrumen penilaian diagnostik, formatif, sumatif, dan rubrik'
		);
	}

	/**
	 * @param {Object} input
	 * @param {Object} context - Wajib berisi context.identitas, context.capaian, context.kegiatan
	 */
	async execute(input, context = {}) {
		this.log(`Starting for: ${input.judul}`);

		const systemPrompt = this.buildSystemPrompt(`
Buat RENCANA ASESMEN LENGKAP yang mencakup seluruh aspek penilaian dalam Kurikulum Merdeka.

JENIS ASESMEN YANG HARUS DIBUAT:

1. ASESMEN DIAGNOSTIK (Awal Pembelajaran)
   - Tujuan: Mengidentifikasi pengetahuan awal dan kesiapan siswa
   - Format: Pertanyaan lisan, kuis singkat, atau observasi
   - Instrumen: 5-8 pertanyaan atau aktivitas diagnostik

2. ASESMEN FORMATIF (Selama Pembelajaran)
   - Monitoring progress dan memberikan feedback per pertemuan

3. ASESMEN SUMATIF (Akhir Pembelajaran)
   - Mengukur pencapaian akhir tujuan pembelajaran

4. RUBRIK PENILAIAN
   - Skala penilaian 4 level: Sangat Baik, Baik, Cukup, Perlu Bimbingan

5. INSTRUMEN REFLEKSI

OUTPUT FORMAT (JSON):
{
  "asesmenDiagnostik": {
    "tujuan": "Mengidentifikasi...",
    "waktu": "15 menit",
    "format": "Kuis/Pertanyaan/Observasi",
    "instrumen": [
      { "nomor": 1, "pertanyaan": "Pertanyaan diagnostik", "tujuan": "Mengukur apa" }
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
      { "komponen": "Nama komponen", "bobot": "40%", "deskripsi": "Apa yang dinilai" }
    ],
    "instrumen": {
      "soalEsai": ["Soal 1", "Soal 2"],
      "soalPilihanGanda": ["Soal 1"],
      "tugasProyek": "Deskripsi tugas proyek (jika ada)"
    }
  },
  "rubrikPenilaian": [
    {
      "jenisAsesmen": "Formatif/Sumatif",
      "aspekYangDinilai": "Nama aspek",
      "kriteria": [
        { "level": "Sangat Baik (90-100)", "deskriptor": "Deskripsi kinerja" },
        { "level": "Baik (80-89)", "deskriptor": "Deskripsi kinerja" },
        { "level": "Cukup (70-79)", "deskriptor": "Deskripsi kinerja" },
        { "level": "Perlu Bimbingan (<70)", "deskriptor": "Deskripsi kinerja" }
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
Mata Pelajaran    : ${input.mapel}
Kelas             : ${input.kelas}
Topik             : ${input.judul}
Jumlah Pertemuan  : ${input.jumlahPertemuan || '4'}

${context.capaian ? `
KONTEKS - TUJUAN PEMBELAJARAN:
${JSON.stringify(context.capaian.tujuanPembelajaran, null, 2)}
` : ''}

${context.kegiatan ? `
KONTEKS - JUMLAH PERTEMUAN:
${(context.kegiatan.pertemuan || []).length} pertemuan
` : ''}

Buatlah rencana asesmen yang KOMPREHENSIF, TERUKUR, dan PRAKTIS.

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
		if (!output.asesmenDiagnostik) errors.push('asesmenDiagnostik is required');
		if (!Array.isArray(output.asesmenFormatif)) errors.push('asesmenFormatif must be an array');
		if (!output.asesmenSumatif) errors.push('asesmenSumatif is required');
		if (!Array.isArray(output.rubrikPenilaian) || output.rubrikPenilaian.length === 0)
			errors.push('rubrikPenilaian must have at least 1 rubrik');
		return { isValid: errors.length === 0, errors };
	}
}
