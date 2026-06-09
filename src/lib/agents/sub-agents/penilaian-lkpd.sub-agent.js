import { BaseSubAgent } from '../base-sub-agent.js';

export class PenilaianLKPDSubAgent extends BaseSubAgent {
	constructor() {
		super(
			'PenilaianLKPDSubAgent',
			'Penyusun Penilaian LKPD',
			'Menyusun rubrik penilaian dan evaluasi refleksi untuk LKPD'
		);
	}

	async execute(input, context = {}) {
		this.log(`Starting for: ${input.judul}`);

		const tujuanList = (context.capaian_lkpd?.tujuanPembelajaran || [])
			.map((t) => `${t.nomor}. ${t.tujuan}`)
			.join('\n');

		const jenisKegiatan = Array.isArray(input.jenisKegiatan)
			? input.jenisKegiatan.join(', ')
			: (input.jenisKegiatan || 'umum');

		const systemPrompt = this.buildSystemPrompt(`Rancang rubrik penilaian dan evaluasi refleksi untuk LKPD.

OUTPUT FORMAT JSON:
{
  "rubrikPenilaian": [{
    "aspek": "string",
    "bobot": 25,
    "kriteria": {
      "sangat_baik": "string (deskripsi spesifik)",
      "baik": "string",
      "cukup": "string",
      "perlu_bimbingan": "string"
    }
  }],
  "evaluasiRefleksi": ["string (pertanyaan refleksi siswa)"],
  "totalBobot": 100
}`);

		const userPrompt = `
Judul LKPD     : ${input.judul}
Mapel          : ${input.mapel}
Kelas          : ${input.kelas}
Jenis Kegiatan : ${jenisKegiatan}
Pola Belajar   : ${input.polaBelajar || 'berkelompok'}

Tujuan Pembelajaran:
${tujuanList || 'Sesuaikan dengan topik'}
`;

		const result = await this.callAndParse(systemPrompt, userPrompt);
		if (!result.success) return { success: false, error: result.error, agentName: this.name };
		return { success: true, schema: result.schema, agentName: this.name };
	}
}
