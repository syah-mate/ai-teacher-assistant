/**
 * Validator Agent untuk Soal
 * 
 * Agent yang bertugas memvalidasi kualitas soal yang dihasilkan
 * dan memberikan perbaikan jika diperlukan
 */

import { BaseAgent } from '../base-agent.js';

export class ValidatorAgent extends BaseAgent {
	constructor() {
		super(
			'Soal Validator Agent',
			'Quality Assurance Specialist',
			'Memvalidasi kualitas soal berdasarkan kriteria validitas, reliabilitas, daya beda, dan standar penulisan soal'
		);
	}

	/**
	 * Execute validation
	 */
	async execute(input, context = {}) {
		const startTime = Date.now();
		this.executionCount++;

		try {
			const { soalContent, userInput } = input;

			const prompt = this.buildValidationPrompt(soalContent, userInput);
			const response = await this.callAPI(prompt, context.userId);

			// Parse validation result
			const validation = this.parseValidation(response);

			this.lastExecutionTime = Date.now() - startTime;

			return {
				success: true,
				data: validation,
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
	 * Build validation prompt
	 */
	buildValidationPrompt(soalContent, userInput) {
		const { mapel, kelas, topik, jenis, tingkat, level } = userInput;

		return `# TUGAS VALIDASI SOAL

Anda adalah seorang ahli validasi soal yang bertugas memastikan kualitas soal ujian.

## SOAL YANG PERLU DIVALIDASI:

${soalContent}

## SPESIFIKASI YANG DIMINTA:
• Mata Pelajaran    : ${mapel}
• Kelas             : ${kelas}
• Topik             : ${topik}
• Jenis Soal        : ${jenis}
• Tingkat Kesulitan : ${tingkat}
• Level Kognitif    : ${level}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## KRITERIA VALIDASI:

Periksa setiap soal berdasarkan kriteria berikut:

### 1. VALIDITAS KONTEN (30%)
- ✓ Soal sesuai dengan topik "${topik}"
- ✓ Materi sesuai untuk kelas ${kelas}
- ✓ Relevan dengan ${mapel}

### 2. KESESUAIAN KOGNITIF (25%)
- ✓ Soal sesuai dengan level ${level}
- ✓ Kata kerja operasional tepat
- ✓ Tingkat kesulitan: ${tingkat}

### 3. KONSTRUKSI SOAL (25%)
**Untuk Pilihan Ganda:**
- ✓ Stem jelas dan mandiri
- ✓ Opsi homogen
- ✓ Distractor masuk akal
- ✓ Hanya 1 kunci yang benar
- ✓ Tidak ada petunjuk verbal

**Untuk Esai:**
- ✓ Pertanyaan fokus dan jelas
- ✓ Rubrik penilaian terstruktur
- ✓ Kunci jawaban komprehensif
- ✓ Total poin sesuai tingkat kesulitan

### 4. BAHASA DAN REDAKSI (20%)
- ✓ Bahasa Indonesia yang baik dan benar
- ✓ Tidak ambigu
- ✓ Sesuai dengan tingkat siswa
- ✓ Ejaan dan tanda baca benar

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## FORMAT OUTPUT VALIDASI:

Berikan analisis dalam format berikut:

### SKOR KUALITAS: [0-100]

### ANALISIS PER KRITERIA:

**1. Validitas Konten: [0-30]**
[Penjelasan singkat]

**2. Kesesuaian Kognitif: [0-25]**
[Penjelasan singkat]

**3. Konstruksi Soal: [0-25]**
[Penjelasan singkat]

**4. Bahasa dan Redaksi: [0-20]**
[Penjelasan singkat]

### TEMUAN MASALAH:

[Jika ada masalah, list masalah spesifik. Jika tidak ada, tulis "Tidak ada masalah signifikan."]

### REKOMENDASI PERBAIKAN:

[Jika skor < 85, berikan rekomendasi konkret. Jika skor >= 85, tulis "Soal sudah berkualitas baik, siap digunakan."]

### STATUS: 
[LOLOS / PERLU PERBAIKAN MINOR / PERLU PERBAIKAN MAJOR]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MULAI VALIDASI SEKARANG!

Berikan penilaian yang objektif dan konstruktif.
`;
	}

	/**
	 * Parse validation response
	 */
	parseValidation(response) {
		// Extract score
		const scoreMatch = response.match(/SKOR KUALITAS:\s*(\d+)/i);
		const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

		// Extract status
		const statusMatch = response.match(/STATUS:\s*\*?\*?(LOLOS|PERLU PERBAIKAN MINOR|PERLU PERBAIKAN MAJOR)\*?\*?/i);
		const status = statusMatch ? statusMatch[1] : 'UNKNOWN';

		return {
			score,
			status,
			fullReport: response,
			passed: score >= 75, // Threshold untuk passing
			needsImprovement: score < 85
		};
	}

	/**
	 * Call Gemini API via server
	 */
	async callAPI(prompt, userId) {
		const { callGeminiAPI } = await import('$lib/utils/gemini-client.js');
		const result = await callGeminiAPI(prompt, userId);
		
		if (!result.success) {
			throw new Error(result.error || 'Failed to call Gemini API');
		}
		
		// Return the actual text data, not the wrapper object
		return result.data;
	}
}
