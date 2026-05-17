import { BaseSubAgent } from '../base-sub-agent.js';

export class EvaluasiSubAgent extends BaseSubAgent {
	constructor() {
		super(
			'EvaluasiSubAgent',
			'Penyusun Soal Evaluasi LKPD',
			'Menyusun soal evaluasi dan pertanyaan refleksi untuk LKPD'
		);
	}

	async execute(input, context = {}) {
		this.log(`Starting for: ${input.judul}`);

		const tujuanList = (context.capaian?.tujuanPembelajaran || [])
			.map((t) => `${t.nomor}. ${t.tujuan}`)
			.join('\n');

		const systemPrompt = this.buildSystemPrompt(`Susun soal evaluasi dan pertanyaan refleksi untuk LKPD.

OUTPUT FORMAT JSON:
{
  "soalEvaluasi": [{ "nomor": 1, "soal": "string", "bobot": 10, "kunciJawaban": "string" }],
  "pertanyaanRefleksi": ["string"],
  "totalBobot": 100
}`);

		const userPrompt = `
Judul  : ${input.judul}
Mapel  : ${input.mapel}
Kelas  : ${input.kelas}

Tujuan Pembelajaran:
${tujuanList || 'Susun sesuai topik'}
`;

		const result = await this.callAndParse(systemPrompt, userPrompt);

		if (!result.success) {
			return { success: false, error: result.error, agentName: this.name };
		}

		return { success: true, schema: result.schema, agentName: this.name };
	}
}
