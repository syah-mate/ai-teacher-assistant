import { BaseSubAgent } from '../base-sub-agent.js';

export class SoalEsaiSubAgent extends BaseSubAgent {
	constructor() {
		super(
			'SoalEsaiSubAgent',
			'Pembuat Soal Esai',
			'Membuat soal esai dengan rubrik penilaian yang lengkap'
		);
	}

	async execute(input, context = {}) {
		this.log(`Starting for: ${input.judul}`);

		const jumlah = input.jumlahSoal || 5;
		const capaian = context.capaian?.capaianPembelajaran || '';

		const systemPrompt = this.buildSystemPrompt(`Buat soal esai dengan rubrik penilaian yang lengkap sesuai Kurikulum Merdeka.

OUTPUT FORMAT JSON:
{
  "soalEsai": [{
    "nomor": 1,
    "soal": "string",
    "kunciJawaban": "string",
    "rubrik": { "skor_4": "string", "skor_3": "string", "skor_2": "string", "skor_1": "string" },
    "bobot": 20,
    "levelBloom": "C5"
  }]
}`);

		const userPrompt = `
Judul       : ${input.judul}
Mapel       : ${input.mapel}
Kelas       : ${input.kelas}
Jumlah Soal : ${jumlah}
Tingkat     : ${input.tingkat || 'Sedang'}

${capaian ? `Capaian Pembelajaran:\n${capaian}` : ''}
`;

		const result = await this.callAndParse(systemPrompt, userPrompt);

		if (!result.success) {
			return { success: false, error: result.error, agentName: this.name };
		}

		return { success: true, schema: result.schema, agentName: this.name };
	}
}
