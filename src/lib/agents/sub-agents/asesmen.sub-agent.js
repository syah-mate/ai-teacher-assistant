import { BaseSubAgent } from '../base-sub-agent.js';

export class AsesmenSubAgent extends BaseSubAgent {
	constructor() {
		super(
			'AsesmenSubAgent',
			'Perancang Asesmen Pembelajaran',
			'Merancang instrumen asesmen diagnostik, formatif, dan sumatif'
		);
	}

	async execute(input, context = {}) {
		this.log(`Starting for: ${input.judul}`);

		const tujuanList = (context.capaian?.tujuanPembelajaran || [])
			.map((t) => `${t.nomor}. ${t.tujuan}`)
			.join('\n');
		const jumlahPertemuan = context.kegiatan?.pertemuan?.length || input.jumlahPertemuan || 1;

		const systemPrompt = this.buildSystemPrompt(`Rancang instrumen asesmen lengkap untuk pembelajaran Kurikulum Merdeka.

OUTPUT FORMAT JSON:
{
  "asesmenDiagnostik": { "tujuan": "string", "instrumen": ["string"] },
  "asesmenFormatif": [{ "pertemuan": 1, "teknik": "string", "instrumen": "string" }],
  "asesmenSumatif": { "bentuk": "string", "bobot": "string", "instrumen": "string" },
  "rubrikPenilaian": [{ "aspek": "string", "kriteria": { "sangat_baik": "string", "baik": "string", "cukup": "string", "perlu_bimbingan": "string" } }],
  "refleksiGuru": ["string"]
}`);

		const userPrompt = `
Judul             : ${input.judul}
Mapel             : ${input.mapel}
Kelas             : ${input.kelas}
Jumlah Pertemuan  : ${jumlahPertemuan}

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
