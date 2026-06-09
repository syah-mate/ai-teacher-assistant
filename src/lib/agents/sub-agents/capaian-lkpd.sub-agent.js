import { BaseSubAgent } from '../base-sub-agent.js';

export class CapaianLKPDSubAgent extends BaseSubAgent {
	constructor() {
		super(
			'CapaianLKPDSubAgent',
			'Perancang Capaian Pembelajaran LKPD',
			'Merancang tujuan pembelajaran spesifik untuk Lembar Kerja Peserta Didik'
		);
	}

	async execute(input, context = {}) {
		this.log(`Starting for: ${input.judul}`);

		const fase = input.fase || context.identitas?.identitas?.fase || 'sesuaikan dengan kelas';

		const systemPrompt = this.buildSystemPrompt(`Rancang tujuan pembelajaran untuk LKPD sesuai Kurikulum Merdeka.

OUTPUT FORMAT JSON:
{
  "tujuanPembelajaran": [{ "nomor": 1, "tujuan": "string", "levelBloom": "C3" }],
  "indikatorKetercapaian": ["string"]
}`);

		const userPrompt = `
Judul LKPD : ${input.judul}
Mapel      : ${input.mapel}
Kelas      : ${input.kelas}
Fase       : ${fase}
Jenis      : ${Array.isArray(input.jenisKegiatan) ? input.jenisKegiatan.join(', ') : (input.jenisKegiatan || 'umum')}
Pola Belajar: ${input.polaBelajar || 'berkelompok'}
${input.tujuanPembelajaran ? `Arahan Tujuan: ${input.tujuanPembelajaran}` : ''}
`;

		const result = await this.callAndParse(systemPrompt, userPrompt);
		if (!result.success) return { success: false, error: result.error, agentName: this.name };
		return { success: true, schema: result.schema, agentName: this.name };
	}
}
