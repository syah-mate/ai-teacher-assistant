import { BaseSubAgent } from '../base-sub-agent.js';

export class LangkahKerjaSubAgent extends BaseSubAgent {
	constructor() {
		super(
			'LangkahKerjaSubAgent',
			'Penyusun Langkah Kerja LKPD',
			'Menyusun prosedur kegiatan siswa: eksperimen, latihan soal, project karya, atau observasi'
		);
	}

	async execute(input, context = {}) {
		this.log(`Starting for: ${input.judul}`);

		const tujuanList = (context.capaian_lkpd?.tujuanPembelajaran || [])
			.map((t) => `${t.nomor}. ${t.tujuan}`)
			.join('\n');

		const ringkasan = context.ringkasan_materi?.materiSingkat?.slice(0, 300) || '';
		const jenisKegiatan = Array.isArray(input.jenisKegiatan)
			? input.jenisKegiatan.join(', ')
			: (input.jenisKegiatan || 'umum');

		const systemPrompt = this.buildSystemPrompt(`Susun langkah kerja LKPD sesuai jenis kegiatan yang dipilih.

OUTPUT FORMAT JSON:
{
  "jenisKegiatanAktif": ["string"],
  "alatBahan": ["string"],
  "langkahKerja": [{
    "bagian": "string",
    "tujuanBagian": "string",
    "langkah": [{
      "nomor": 1,
      "instruksi": "string",
      "ruangJawaban": true,
      "estimasiWaktu": "5 menit"
    }]
  }],
  "tabelPengamatan": {
    "judul": "string",
    "kolom": ["string"],
    "keterangan": "string"
  }
}
PENTING: Jangan gunakan tanda kutip ganda di dalam nilai string JSON.`);

		const userPrompt = `
Judul LKPD  : ${input.judul}
Mapel       : ${input.mapel}
Kelas       : ${input.kelas}
Jenis Kegiatan: ${jenisKegiatan}
Pola Belajar: ${input.polaBelajar || 'berkelompok'}
Alokasi Waktu: ${input.alokasiWaktu || '2x40 menit'}

Ringkasan Materi (konteks):
${ringkasan || 'Sesuaikan dengan topik'}

Tujuan Pembelajaran:
${tujuanList || 'Sesuaikan dengan topik'}
`;

		const result = await this.callAndParse(systemPrompt, userPrompt);
		if (!result.success) return { success: false, error: result.error, agentName: this.name };
		return { success: true, schema: result.schema, agentName: this.name };
	}
}
