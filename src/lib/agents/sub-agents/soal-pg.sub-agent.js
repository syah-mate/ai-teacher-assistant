import { BaseSubAgent } from '../base-sub-agent.js';

export class SoalPGSubAgent extends BaseSubAgent {
	constructor() {
		super(
			'SoalPGSubAgent',
			'Pembuat Soal Pilihan Ganda',
			'Membuat soal pilihan ganda berkualitas dengan berbagai level Bloom'
		);
	}

	async execute(input, context = {}) {
		this.log(`Starting for: ${input.judul}`);

		const jumlah = input.jumlahSoal || 10;
		const capaian = context.capaian?.capaianPembelajaran || '';

		const systemPrompt = this.buildSystemPrompt(`Buat soal pilihan ganda yang berkualitas sesuai Kurikulum Merdeka.

OUTPUT FORMAT JSON:
{
  "soalPilihanGanda": [{
    "nomor": 1,
    "soal": "string",
    "pilihan": { "A": "string", "B": "string", "C": "string", "D": "string" },
    "kunci": "A",
    "pembahasan": "string",
    "levelBloom": "C3"
  }]
}`);

		const userPrompt = `
Judul         : ${input.judul}
Mapel         : ${input.mapel}
Kelas         : ${input.kelas}
Jumlah Soal   : ${jumlah}
Tingkat       : ${input.tingkat || 'Sedang'}
Level Bloom   : ${input.levelBloom || 'C2-C4'}

${capaian ? `Capaian Pembelajaran:\n${capaian}` : ''}
`;

		const result = await this.callAndParse(systemPrompt, userPrompt);

		if (!result.success) {
			return { success: false, error: result.error, agentName: this.name };
		}

		return { success: true, schema: result.schema, agentName: this.name };
	}
}
