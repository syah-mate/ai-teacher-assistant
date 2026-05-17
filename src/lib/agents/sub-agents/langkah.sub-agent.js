import { BaseSubAgent } from '../base-sub-agent.js';

export class LangkahSubAgent extends BaseSubAgent {
	constructor() {
		super(
			'LangkahSubAgent',
			'Penyusun Langkah Kerja LKPD',
			'Menyusun langkah kerja terstruktur untuk Lembar Kerja Peserta Didik'
		);
	}

	async execute(input, context = {}) {
		this.log(`Starting for: ${input.judul}`);

		const tujuanList = (context.capaian?.tujuanPembelajaran || [])
			.map((t) => `${t.nomor}. ${t.tujuan}`)
			.join('\n');
		const ringkasanMateri = context.materi?.ringkasanMateri?.slice(0, 300) || '';

		const systemPrompt = this.buildSystemPrompt(`Susun langkah kerja LKPD yang terstruktur dan interaktif.

OUTPUT FORMAT JSON:
{
  "langkahKerja": [{
    "bagian": "string",
    "tujuanBagian": "string",
    "langkah": [{
      "nomor": 1,
      "instruksi": "string",
      "ruangJawaban": true,
      "estimasiWaktu": "5 menit"
    }]
  }]
}`);

		const userPrompt = `
Judul  : ${input.judul}
Mapel  : ${input.mapel}
Kelas  : ${input.kelas}

Ringkasan Materi (konteks):
${ringkasanMateri || 'Susun sesuai topik'}

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
