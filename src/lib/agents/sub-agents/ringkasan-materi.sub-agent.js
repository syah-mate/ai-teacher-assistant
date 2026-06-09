import { BaseSubAgent } from '../base-sub-agent.js';

export class RingkasanMateriSubAgent extends BaseSubAgent {
	constructor() {
		super(
			'RingkasanMateriSubAgent',
			'Penyusun Ringkasan Materi LKPD',
			'Menyusun materi singkat, konsep kunci, dan fakta penting untuk LKPD'
		);
	}

	async execute(input, context = {}) {
		this.log(`Starting for: ${input.judul}`);

		const tujuanList = (context.capaian_lkpd?.tujuanPembelajaran || [])
			.map((t) => `${t.nomor}. ${t.tujuan}`)
			.join('\n');

		const systemPrompt = this.buildSystemPrompt(`Susun ringkasan materi LKPD yang padat dan mudah dipahami siswa.

OUTPUT FORMAT JSON:
{
  "materiSingkat": "string (2-3 paragraf, bahasa siswa)",
  "konsepKunci": [{ "konsep": "string", "definisi": "string" }],
  "faktaPenting": ["string"]
}`);

		const userPrompt = `
Judul : ${input.judul}
Mapel : ${input.mapel}
Kelas : ${input.kelas}

Tujuan Pembelajaran:
${tujuanList || 'Sesuaikan dengan topik'}
`;

		const result = await this.callAndParse(systemPrompt, userPrompt);
		if (!result.success) return { success: false, error: result.error, agentName: this.name };
		return { success: true, schema: result.schema, agentName: this.name };
	}
}
