import { BaseSubAgent } from '../base-sub-agent.js';

export class CapaianSubAgent extends BaseSubAgent {
	constructor() {
		super(
			'CapaianSubAgent',
			'Perancang Capaian Pembelajaran',
			'Merancang capaian, tujuan, dan profil pelajar Kurikulum Merdeka'
		);
	}

	async execute(input, context = {}) {
		this.log(`Starting for: ${input.judul}`);

		const fase = context.identitas?.identitas?.fase || '';

		const systemPrompt = this.buildSystemPrompt(`Rancang tujuan pembelajaran dan kemampuan prasyarat sesuai Kurikulum Merdeka.

OUTPUT FORMAT JSON:
{
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
Fase      : ${fase || 'sesuaikan dengan kelas'}
`;

		const result = await this.callAndParse(systemPrompt, userPrompt);

		if (!result.success) {
			return { success: false, error: result.error, agentName: this.name };
		}

		return { success: true, schema: result.schema, agentName: this.name };
	}
}
