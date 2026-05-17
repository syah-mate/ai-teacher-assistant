import { BaseSubAgent } from '../base-sub-agent.js';

export class IdentitasSubAgent extends BaseSubAgent {
	constructor() {
		super(
			'IdentitasSubAgent',
			'Penyusun Identitas Dokumen',
			'Menyusun identitas lengkap dokumen pembelajaran Kurikulum Merdeka'
		);
	}

	async execute(input, context = {}) {
		this.log(`Starting for: ${input.judul}`);

		const systemPrompt = this.buildSystemPrompt(`Susun identitas lengkap dokumen pembelajaran Kurikulum Merdeka.

OUTPUT FORMAT JSON:
{
  "judul": "string",
  "identitas": {
    "satuan": "SD/SMP/SMA",
    "fase": "Fase X",
    "kelas": "Kelas X",
    "mataPelajaran": "string",
    "penulis": "string",
    "instansi": "string"
  },
  "deskripsiUmum": "string (3-4 kalimat)",
  "durasiTotal": "X pertemuan",
  "alokasiWaktu": "X JP"
}`);

		const userPrompt = `
Jenis dokumen : ${input.jenis || 'modul_ajar'}
Judul         : ${input.judul}
Mata Pelajaran: ${input.mapel}
Kelas         : ${input.kelas}
Penulis       : ${input.penulis || 'Guru Mata Pelajaran'}
Instansi      : ${input.instansi || 'Sekolah'}
Jml Pertemuan : ${input.jumlahPertemuan || 1}
Alokasi Waktu : ${input.alokasiWaktu || input.alokasiPerPertemuan || '2x45 menit'}
`;

		const result = await this.callAndParse(systemPrompt, userPrompt);

		if (!result.success) {
			return { success: false, error: result.error, agentName: this.name };
		}

		return { success: true, schema: result.schema, agentName: this.name };
	}
}
