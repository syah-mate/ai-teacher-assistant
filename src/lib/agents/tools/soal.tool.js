/**
 * Soal Tool
 *
 * Diambil dari SoalGeneratorAgent.
 * Menghasilkan soal dalam format teks (bukan JSON).
 */

import { BaseAgent } from '../base-agent.js';
import { SOAL_BASE_PROMPT } from '$lib/prompts/soal-base.js';

export class SoalTool extends BaseAgent {
	constructor() {
		super(
			'SoalTool',
			'Generator Soal Profesional',
			'Menyusun soal ujian dan evaluasi pembelajaran yang berkualitas sesuai kaidah penyusunan soal dan taksonomi Bloom'
		);
	}

	/**
	 * @param {Object} input
	 * @param {string} input.mapel     - Mata pelajaran
	 * @param {string} input.kelas     - Kelas/tingkat
	 * @param {string} input.judul     - Topik/materi (field unifikasi)
	 * @param {string} [input.topik]   - Topik/materi (backward compat)
	 * @param {string} input.kurikulum - Kurikulum
	 * @param {string} input.jenisSoal - Pilihan Ganda / Esai / Campuran
	 * @param {number} input.jumlahSoal
	 * @param {string} input.tingkat   - Mudah / Sedang / Sulit
	 * @param {string} input.levelBloom - C1-C6 dengan deskripsi
	 */
	async execute(input, context = {}) {
		const startTime = Date.now();
		this.executionCount++;

		const topik = input.judul || input.topik || '';
		const jenis = input.jenisSoal || input.jenis_soal || 'Pilihan Ganda';
		const jumlah = input.jumlahSoal || input.jumlah || 10;
		const tingkat = input.tingkat || 'Sedang';
		const level = input.levelBloom || input.level || 'C2 – Memahami';
		const kurikulum = input.kurikulum || 'Kurikulum Merdeka';

		try {
			const prompt = this.buildPrompt({
				mapel: input.mapel,
				kelas: input.kelas,
				topik,
				kurikulum,
				jenis,
				jumlah,
				tingkat,
				level
			});

			const response = await this.callAPI(prompt);
			const soalData = this.parseResponse(response, {
				mapel: input.mapel,
				kelas: input.kelas,
				topik,
				kurikulum,
				jenis,
				jumlah,
				tingkat,
				level
			});

			this.lastExecutionTime = Date.now() - startTime;

			return {
				success: true,
				data: soalData,
				agentName: this.name,
				metadata: this.getMetadata()
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
				agentName: this.name,
				metadata: this.getMetadata()
			};
		}
	}

	buildPrompt(input) {
		const { mapel, kelas, topik, kurikulum, jenis, jumlah, tingkat, level } = input;

		let jumlahPG = 0;
		let jumlahEsai = 0;

		if (jenis === 'Pilihan Ganda') {
			jumlahPG = jumlah;
		} else if (jenis === 'Esai') {
			jumlahEsai = jumlah;
		} else if (jenis === 'Campuran') {
			jumlahPG = Math.ceil(jumlah * 0.7);
			jumlahEsai = Math.floor(jumlah * 0.3);
		}

		const levelKognitif = level.split('–')[0].trim();
		const namaLevel = level.split('–')[1]?.trim() || '';

		return `${SOAL_BASE_PROMPT}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TUGAS ANDA SEBAGAI SOAL GENERATOR AGENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Anda diminta untuk menyusun soal ujian/evaluasi dengan spesifikasi berikut:

📋 SPESIFIKASI SOAL:
• Mata Pelajaran    : ${mapel}
• Kelas/Tingkat     : ${kelas}
• Topik/Materi      : ${topik}
• Kurikulum         : ${kurikulum}
• Jenis Soal        : ${jenis}
• Jumlah Total      : ${jumlah} soal
${jenis === 'Campuran' ? `  └─ Pilihan Ganda : ${jumlahPG} soal\n  └─ Esai         : ${jumlahEsai} soal` : ''}
• Tingkat Kesulitan : ${tingkat}
• Level Kognitif    : ${level}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 INSTRUKSI EKSEKUSI:

1. **KONTEKS PEMBELAJARAN**
   Pahami karakteristik mata pelajaran ${mapel} untuk kelas ${kelas}.
   Topik "${topik}" harus menjadi fokus utama seluruh soal.

2. **STANDAR KUALITAS**
   - Tingkat kesulitan: ${tingkat}
     ${tingkat === 'Mudah' ? '→ Fokus pada konsep dasar dan pemahaman langsung' : tingkat === 'Sedang' ? '→ Fokus pada aplikasi dan analisis sederhana' : '→ Fokus pada analisis mendalam dan pemecahan masalah kompleks'}
   - Level kognitif: ${levelKognitif} (${namaLevel})

3. **STRUKTUR OUTPUT**

${jenis === 'Pilihan Ganda' || jenis === 'Campuran' ? `
▌ BAGIAN ${jenis === 'Campuran' ? 'A — ' : ''}PILIHAN GANDA ${jenis === 'Campuran' ? `(${jumlahPG} soal)` : ''}

Petunjuk: Pilih satu jawaban yang paling tepat!

[Buat ${jumlahPG} soal pilihan ganda]

Soal [nomor]. [Stem soal yang jelas, fokus, dan sesuai level kognitif ${levelKognitif}...]
   A. [Opsi]
   B. [Opsi]
   C. [Opsi]
   D. [Opsi]

` : ''}

${jenis === 'Esai' || jenis === 'Campuran' ? `
▌ BAGIAN ${jenis === 'Campuran' ? 'B — ' : ''}ESAI ${jenis === 'Campuran' ? `(${jumlahEsai} soal)` : ''}

Petunjuk: Jawablah pertanyaan berikut dengan jelas, lengkap, dan sistematis!

[Buat ${jumlahEsai} soal esai]

Soal [nomor]. [Pertanyaan yang menuntut elaborasi, analisis, atau kreasi sesuai ${levelKognitif}...] ([total poin] poin)

Rubrik Penilaian:
• [Aspek 1]  : [X] poin
• [Aspek 2]  : [X] poin
Total         : [XX] poin

Kunci Jawaban:
[Jawaban ideal yang komprehensif]

` : ''}

4. **KUNCI JAWABAN PILIHAN GANDA**
${jenis !== 'Esai' ? `
Setelah semua soal, buat daftar kunci jawaban:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  KUNCI JAWABAN PILIHAN GANDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. [Kunci]    6. [Kunci]
...
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MULAI GENERATE SOAL SEKARANG!
Format harus PERSIS seperti contoh di atas.
`;
	}

	parseResponse(response, input) {
		const { mapel, kelas, topik, kurikulum, jenis, jumlah, tingkat, level } = input;

		const imageMarkerRegex = /\[GAMBAR_SOAL:\s*([^\]]+)\]/g;
		const imageRequirements = [];
		let match;

		while ((match = imageMarkerRegex.exec(response)) !== null) {
			imageRequirements.push({
				description: match[1].trim(),
				position: match.index,
				marker: match[0]
			});
		}

		const header = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BANK SOAL DAN UJIAN — ${kurikulum.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Mata Pelajaran   : ${mapel}
  Kelas            : ${kelas}
  Topik            : ${topik}
  Jenis Soal       : ${jenis}
  Jumlah Soal      : ${jumlah} butir
  Tingkat Kesulitan: ${tingkat}
  Level Kognitif   : ${level}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

		const footer = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Dibuat dengan Asisten Guru AI
  Tanggal: ${new Date().toLocaleDateString('id-ID', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	})}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

		return {
			fullOutput: header + response + footer,
			rawContent: response,
			imageRequirements,
			metadata: {
				mapel,
				kelas,
				topik,
				kurikulum,
				jenis,
				jumlah,
				tingkat,
				level,
				hasImages: imageRequirements.length > 0,
				imageCount: imageRequirements.length,
				generatedAt: new Date().toISOString()
			}
		};
	}

	async callAPI(prompt) {
		const { callGeminiAPI } = await import('$lib/utils/gemini-client.js');
		const result = await callGeminiAPI(prompt);

		if (!result.success) {
			throw new Error(result.error || 'Failed to call Gemini API');
		}

		return result.data;
	}
}
