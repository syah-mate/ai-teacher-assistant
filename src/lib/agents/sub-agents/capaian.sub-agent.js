import { BaseSubAgent } from '../base-sub-agent.js';

export class CapaianSubAgent extends BaseSubAgent {
	constructor() {
		super(
			'CapaianSubAgent',
			'Perancang Capaian Pembelajaran',
			'Merancang capaian, tujuan, profil pelajar, dan deskripsi umum modul Kurikulum Merdeka'
		);
	}

	async execute(input, context = {}) {
		this.log(`Starting for: ${input.judul}`);

		const fase = input.fase || context.identitas?.identitas?.fase || 'sesuaikan dengan kelas';

		const systemPrompt = this.buildSystemPrompt(`Rancang tujuan pembelajaran dan deskripsi umum modul sesuai Kurikulum Merdeka.

OUTPUT FORMAT JSON:
{
	"deskripsiUmum": "string (3-4 kalimat ringkasan isi modul, mencakup topik utama, pendekatan pembelajaran, dan relevansi dengan kehidupan siswa)",
  "kemampuanPrasyarat": "string (penjelasan kompetensi/kemampuan yang harus sudah dikuasai siswa sebelum mempelajari modul ini, 2-4 kalimat)",
  "tujuanPembelajaran": [{ "nomor": 1, "tujuan": "string", "levelBloom": "C4" }],
  "alurTujuanPembelajaran": [{ "tahap": 1, "judulTahap": "string", "deskripsi": "string" }],
  "profilPelajarPancasila": [{ "dimensi": "string", "implementasi": "string" }],
  "indikatorPencapaian": ["string"]
}`);

		const userPrompt = `
Jenis     : ${input.jenis || 'modul_ajar'}
Judul     : ${input.judul}
Mapel     : ${input.mapel}
Kelas     : ${input.kelas}
Fase      : ${fase}
Metode    : ${input.metode || '-'}
Pertemuan : ${input.jumlahPertemuan || 1} pertemuan @ ${input.alokasiPerPertemuan || '2x45 menit'}
`;

		const result = await this.callAndParse(systemPrompt, userPrompt);

		if (!result.success) {
			return { success: false, error: result.error, agentName: this.name };
		}

		return { success: true, schema: result.schema, agentName: this.name };
	}
}
