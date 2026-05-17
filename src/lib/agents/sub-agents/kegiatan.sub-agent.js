import { BaseSubAgent } from '../base-sub-agent.js';

export class KegiatanSubAgent extends BaseSubAgent {
	constructor() {
		super(
			'KegiatanSubAgent',
			'Perancang Kegiatan Pembelajaran',
			'Merancang langkah kegiatan pembelajaran per pertemuan secara detail'
		);
	}

	async execute(input, context = {}) {
		this.log(`Starting for: ${input.judul}`);

		const tujuanList = (context.capaian?.tujuanPembelajaran || [])
			.map((t) => `${t.nomor}. ${t.tujuan}`)
			.join('\n');

		const systemPrompt = this.buildSystemPrompt(`Rancang kegiatan pembelajaran lengkap per pertemuan sesuai Kurikulum Merdeka.

OUTPUT FORMAT JSON:
{
  "pertemuan": [{
    "ke": 1,
    "tujuanPertemuan": "string",
    "langkahPembelajaran": {
      "pembuka": [{ "aktivitas": "string", "durasi": "10 menit" }],
      "inti": [{ "aktivitas": "string", "durasi": "60 menit" }],
      "penutup": [{ "aktivitas": "string", "durasi": "10 menit" }]
    },
    "diferensiasi": { "konten": "string", "proses": "string", "produk": "string" },
    "pertanyaanPemantik": ["string"]
  }]
}`);

		const userPrompt = `
Judul              : ${input.judul}
Mapel              : ${input.mapel}
Kelas              : ${input.kelas}
Jumlah Pertemuan   : ${input.jumlahPertemuan || 1}
Alokasi Waktu      : ${input.alokasiWaktu || input.alokasiPerPertemuan || '2x45 menit'}
Metode Pembelajaran: ${input.metode || 'Problem Based Learning'}

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
