/**
 * Soal Generator Agent
 * 
 * Agent utama yang bertanggung jawab menghasilkan soal-soal berkualitas
 * berdasarkan input user (mata pelajaran, topik, jenis soal, dll)
 */

import { BaseAgent } from '../base-agent.js';
import { SOAL_BASE_PROMPT } from '$lib/prompts/soal-base.js';

export class SoalGeneratorAgent extends BaseAgent {
	constructor() {
		super(
			'Soal Generator Agent',
			'Generator Soal Profesional',
			'Menyusun soal ujian dan evaluasi pembelajaran yang berkualitas dengan mengikuti kaidah penyusunan soal dan taksonomi Bloom'
		);
	}

	/**
	 * Execute agent untuk generate soal
	 * 
	 * @param {Object} input - User input
	 * @param {string} input.mapel - Mata pelajaran
	 * @param {string} input.kelas - Kelas/tingkat
	 * @param {string} input.topik - Topik/materi
	 * @param {string} input.kurikulum - Kurikulum yang digunakan
	 * @param {string} input.jenis - Jenis soal (Pilihan Ganda/Esai/Campuran)
	 * @param {number} input.jumlah - Jumlah soal
	 * @param {string} input.tingkat - Tingkat kesulitan
	 * @param {string} input.level - Level kognitif Bloom
	 */
	async execute(input, context = {}) {
		const startTime = Date.now();
		this.executionCount++;

		try {
			const { mapel, kelas, topik, kurikulum, jenis, jumlah, tingkat, level } = input;

			// Build prompt untuk generate soal
			const prompt = this.buildPrompt(input);

			// Call Gemini API
			const response = await this.callAPI(prompt, context.userId);

			// Parse dan format response
			const soalData = this.parseResponse(response, input);

			this.lastExecutionTime = Date.now() - startTime;

			return {
				success: true,
				data: soalData,
				metadata: {
					agent: this.name,
					executionTime: this.lastExecutionTime,
					executionCount: this.executionCount,
					timestamp: new Date().toISOString()
				}
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
				metadata: {
					agent: this.name,
					executionTime: Date.now() - startTime,
					timestamp: new Date().toISOString()
				}
			};
		}
	}

	/**
	 * Build prompt untuk Gemini API
	 */
	buildPrompt(input) {
		const { mapel, kelas, topik, kurikulum, jenis, jumlah, tingkat, level } = input;

		// Tentukan komposisi soal jika campuran
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

		// Extract level kognitif
		const levelKognitif = level.split('–')[0].trim(); // C1, C2, etc.
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
   - Setiap soal HARUS berkualitas: valid, reliabel, memiliki daya beda
   - Tingkat kesulitan: ${tingkat}
     ${tingkat === 'Mudah' ? '→ Fokus pada konsep dasar dan pemahaman langsung' : tingkat === 'Sedang' ? '→ Fokus pada aplikasi dan analisis sederhana' : '→ Fokus pada analisis mendalam dan pemecahan masalah kompleks'}
   - Level kognitif: ${levelKognitif} (${namaLevel})
     → Gunakan kata kerja operasional yang sesuai dengan level ini

3. **STRUKTUR OUTPUT**

${jenis === 'Pilihan Ganda' || jenis === 'Campuran' ? `
▌ BAGIAN ${jenis === 'Campuran' ? 'A — ' : ''}PILIHAN GANDA ${jenis === 'Campuran' ? `(${jumlahPG} soal)` : ''}

Petunjuk: Pilih satu jawaban yang paling tepat!

[Buat ${jumlahPG} soal pilihan ganda dengan format berikut untuk SETIAP soal:]

Soal [nomor]. [Stem soal yang jelas, fokus, dan sesuai level kognitif ${levelKognitif}...]
   A. [Opsi yang homogen dengan kunci]
   B. [Opsi yang homogen dengan kunci]
   C. [Opsi yang homogen dengan kunci]
   D. [Opsi yang homogen dengan kunci]
   ${jenis !== 'Campuran' ? 'E. [Opsi yang homogen dengan kunci]' : ''}

PENTING untuk PG:
- Stem soal harus lengkap dan mandiri (bisa dipahami tanpa melihat opsi)
- Semua opsi harus homogen dalam panjang dan kompleksitas
- Distractor (pengecoh) harus masuk akal bagi siswa yang belum paham
- Hindari petunjuk verbal seperti "semua benar", "a dan b benar", dll
- Kunci jawaban harus distribusi merata (jangan semua B atau semua C)

` : ''}

${jenis === 'Esai' || jenis === 'Campuran' ? `
▌ BAGIAN ${jenis === 'Campuran' ? 'B — ' : ''}ESAI ${jenis === 'Campuran' ? `(${jumlahEsai} soal)` : ''}

Petunjuk: Jawablah pertanyaan berikut dengan jelas, lengkap, dan sistematis!

[Buat ${jumlahEsai} soal esai dengan format berikut untuk SETIAP soal:]

Soal [nomor]. [Pertanyaan yang menuntut elaborasi, analisis, atau kreasi sesuai ${levelKognitif}...] ([total poin] poin)

Rubrik Penilaian:
• [Aspek 1: misal konsep/definisi]           : [X] poin
• [Aspek 2: misal penjelasan/mekanisme]      : [X] poin
• [Aspek 3: misal contoh/aplikasi]           : [X] poin
• [Aspek 4: misal analisis/kesimpulan]       : [X] poin
• Sistematika, tata bahasa, dan EYD          : [X] poin
                                      Total   : [XX] poin

Kunci Jawaban:
[Jawaban ideal yang mencakup semua aspek dalam rubrik dengan lengkap]

PENTING untuk Esai:
- Soal harus mendorong berpikir tingkat tinggi (analisis/evaluasi/kreasi)
- Rubrik harus spesifik dan terukur (ada breakdown poin per aspek)
- Kunci jawaban harus komprehensif dan menjadi contoh jawaban sempurna
- Total poin per soal: ${tingkat === 'Mudah' ? '10-15' : tingkat === 'Sedang' ? '15-20' : '20-25'} poin

` : ''}

4. **KUNCI JAWABAN PILIHAN GANDA**
${jenis !== 'Esai' ? `
Setelah semua soal, buat daftar kunci jawaban:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  KUNCI JAWABAN PILIHAN GANDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. [Kunci]    6. [Kunci]
2. [Kunci]    7. [Kunci]
3. [Kunci]    8. [Kunci]
...

CATATAN: Distribusi kunci harus variatif dan merata, TIDAK boleh pola tertentu!
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 KRITERIA KEBERHASILAN:

✓ Semua soal 100% relevan dengan topik "${topik}"
✓ Tingkat kesulitan konsisten: ${tingkat}
✓ Level kognitif sesuai: ${level}
✓ Soal PG: distractor berkualitas, kunci jelas, tidak ambigu
✓ Soal Esai: rubrik terstruktur, kunci jawaban komprehensif
✓ Bahasa Indonesia yang baik dan benar (EYD)
✓ Format rapi, profesional, dan mudah dibaca

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MULAI GENERATE SOAL SEKARANG!

Berikan output soal yang LENGKAP dan SIAP PAKAI untuk guru.
Format harus PERSIS seperti contoh di atas.
`;
	}

	/**
	 * Parse response dari Gemini
	 */
	parseResponse(response, input) {
		// Response dari Gemini sudah dalam format yang diminta
		// Tinggal wrap dengan header profesional

		const { mapel, kelas, topik, kurikulum, jenis, jumlah, tingkat, level } = input;

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
			metadata: {
				mapel,
				kelas,
				topik,
				kurikulum,
				jenis,
				jumlah,
				tingkat,
				level,
				generatedAt: new Date().toISOString()
			}
		};
	}

	/**
	 * Call Gemini API via server
	 */
	async callAPI(prompt, userId) {
		// Import dynamic untuk menghindari circular dependency
		const { callGeminiAPI } = await import('$lib/utils/gemini-client.js');
		const result = await callGeminiAPI(prompt, userId);
		
		if (!result.success) {
			throw new Error(result.error || 'Failed to call Gemini API');
		}
		
		// Return the actual text data, not the wrapper object
		return result.data;
	}
}
