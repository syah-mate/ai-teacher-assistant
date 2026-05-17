import { BaseSubAgent } from '../base-sub-agent.js';

export class ValidatorSubAgent extends BaseSubAgent {
	constructor() {
		super(
			'ValidatorSubAgent',
			'Validator Kualitas Dokumen',
			'Memvalidasi kualitas dan kelengkapan dokumen pembelajaran'
		);
	}

	async execute(input, context = {}) {
		this.log(`Starting for: ${input.judul}`);

		const contextSummary = JSON.stringify(context, null, 2).slice(0, 1000);

		const systemPrompt = this.buildSystemPrompt(`Validasi kualitas dan kelengkapan dokumen pembelajaran Kurikulum Merdeka.

OUTPUT FORMAT JSON:
{
  "qualityScore": 87,
  "qualityChecks": [{ "aspek": "string", "status": "pass|fail|warning", "catatan": "string" }],
  "rekomendasi": ["string"],
  "isComplete": true
}`);

		const userPrompt = `
Judul : ${input.judul}
Jenis : ${input.jenis || 'dokumen pembelajaran'}
Mapel : ${input.mapel}
Kelas : ${input.kelas}

Schema yang divalidasi (ringkasan):
${contextSummary}
`;

		const result = await this.callAndParse(systemPrompt, userPrompt);

		if (!result.success) {
			return { success: false, error: result.error, agentName: this.name };
		}

		return { success: true, schema: result.schema, agentName: this.name };
	}
}
