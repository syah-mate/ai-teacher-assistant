import { BaseSubAgent } from '../base-sub-agent.js';

export class MateriSubAgent extends BaseSubAgent {
	constructor() {
		super(
			'MateriSubAgent',
			'Penyusun Materi Pembelajaran',
			'Menyusun ringkasan materi, konsep kunci, dan fakta penting'
		);
	}

	async execute(input, context = {}) {
		this.log(`Starting for: ${input.judul}`);

		const tujuanList = (context.capaian?.tujuanPembelajaran || [])
			.map((t) => `${t.nomor}. ${t.tujuan}`)
			.join('\n');

		const systemPrompt = this.buildSystemPrompt(`Susun materi pembelajaran yang komprehensif dan relevan.

OUTPUT FORMAT JSON:
{
  "ringkasanMateri": "string (paragraf lengkap)",
  "konsepKunci": [{ "konsep": "string", "definisi": "string" }],
  "faktaPenting": ["string"],
  "contohAplikasi": ["string"],
  "sumberReferensi": ["string"]
}`);

		const userPrompt = `
Judul : ${input.judul}
Mapel : ${input.mapel}
Kelas : ${input.kelas}

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
