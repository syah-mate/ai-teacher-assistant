/**
 * API Endpoint untuk Koreksi Ujian dengan AI
 * 
 * Menerima upload foto/PDF hasil ujian siswa dan memberikan:
 * - Analisis jawaban siswa
 * - Evaluasi pemahaman
 * - Penilaian/skor
 * - Rekomendasi pembelajaran
 */

import { json } from '@sveltejs/kit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';
import { keyPool } from '$lib/server/key-pool.js';

const GEMINI_MODEL = env.GEMINI_MODEL || 'gemini-2.0-flash';

/**
 * POST /api/koreksi-ujian
 * Analisis hasil ujian siswa dengan Gemini Vision
 */
export async function POST({ request, locals }) {
	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { files, config } = body;

		if (!files || !Array.isArray(files) || files.length === 0) {
			return json({ error: 'Minimal upload 1 file' }, { status: 400 });
		}

		if (!config?.mataPelajaran || !config?.judulUjian) {
			return json({ error: 'Mata pelajaran dan judul ujian harus diisi' }, { status: 400 });
		}

		// Get API key (prioritize user key, fallback to pool)
		let apiKey = locals.user.geminiApiKey;
		let poolKeyObj = null;

		if (apiKey) {
			// User has personal API key
		} else {
			// Try to get key from pool
			poolKeyObj = keyPool.getAvailableKey();
			if (!poolKeyObj) {
				const waitSeconds = keyPool.getWaitTimeSeconds();
				return json(
					{
						error: `Semua API key sedang penuh. Silakan tunggu ${waitSeconds} detik atau tambahkan API key pribadi di Pengaturan > Integrasi.`
					},
					{ status: 503 }
				);
			}
			apiKey = poolKeyObj.key;
			keyPool.markUsed(poolKeyObj);
		}

		// Initialize Gemini
		const genAI = new GoogleGenerativeAI(apiKey);
		const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

		// Build prompt
		const prompt = buildAnalysisPrompt(config);

		// Prepare image parts for Gemini Vision
		const imageParts = files.map((file) => ({
			inlineData: {
				data: file.data,
				mimeType: file.type
			}
		}));

		// Generate analysis with vision
		const result = await model.generateContent([prompt, ...imageParts]);
		const response = await result.response;
		const analysisText = response.text();

		// Parse the analysis to extract score if available
		const scoreMatch = analysisText.match(/(?:Nilai|Skor)[\s:]*(\d+)/i);
		const score = scoreMatch ? scoreMatch[1] : null;

		// Determine grade
		let grade = null;
		if (score) {
			const numScore = parseInt(score);
			if (numScore >= 90) grade = 'A';
			else if (numScore >= 80) grade = 'B';
			else if (numScore >= 70) grade = 'C';
			else if (numScore >= 60) grade = 'D';
			else grade = 'E';
		}

		return json({
			success: true,
			analysis: analysisText,
			score: score,
			grade: grade,
			metadata: {
				filesProcessed: files.length,
				mataPelajaran: config.mataPelajaran,
				judulUjian: config.judulUjian,
				timestamp: new Date().toISOString()
			}
		});
	} catch (error) {
		console.error('Exam grading error:', error);

		// Mark pool key as rate limited if 429 error
		if (poolKeyObj && (error.message?.includes('429') || error.message?.includes('rate limit'))) {
			keyPool.markRateLimited(poolKeyObj);
		} else if (poolKeyObj) {
			keyPool.markError(poolKeyObj);
		}

		// Handle specific Gemini API errors
		if (error.message?.includes('API key')) {
			return json(
				{
					error: 'API key tidak valid. Silakan periksa konfigurasi API key Anda.'
				},
				{ status: 500 }
			);
		}

		if (error.message?.includes('quota') || error.message?.includes('rate limit') || error.message?.includes('429')) {
			return json(
				{
					error:
						'Quota API habis atau terlalu banyak permintaan. Silakan tunggu beberapa saat atau gunakan API key pribadi.'
				},
				{ status: 429 }
			);
		}

		return json(
			{
				error: 'Terjadi kesalahan saat menganalisis ujian. Silakan coba lagi.'
			},
			{ status: 500 }
		);
	}
}

/**
 * Build analysis prompt for Gemini
 */
function buildAnalysisPrompt(config) {
	const { mataPelajaran, judulUjian, totalSoal, kunciJawaban } = config;

	let prompt = `Anda adalah seorang guru profesional yang ahli dalam mengoreksi dan menilai hasil ujian siswa.

**INFORMASI UJIAN:**
- Mata Pelajaran: ${mataPelajaran}
- Judul Ujian: ${judulUjian}`;

	if (totalSoal) {
		prompt += `\n- Total Soal: ${totalSoal}`;
	}

	if (kunciJawaban) {
		prompt += `\n- Kunci Jawaban:\n${kunciJawaban}`;
	}

	prompt += `

**TUGAS ANDA:**
Analisis hasil ujian siswa dari gambar/dokumen yang diberikan dengan detail:

1. **IDENTIFIKASI JAWABAN**
   - Baca dan identifikasi semua jawaban yang ditulis siswa
   - Catat nomor soal dan jawaban siswa

2. **KOREKSI & PENILAIAN**
   ${kunciJawaban ? '- Bandingkan jawaban siswa dengan kunci jawaban yang diberikan' : '- Evaluasi kebenaran dan kelengkapan jawaban'}
   - Tandai jawaban yang benar, salah, atau kurang lengkap
   - Berikan skor untuk setiap soal (jika memungkinkan)

3. **ANALISIS PEMAHAMAN**
   - Identifikasi konsep-konsep yang sudah dipahami dengan baik
   - Identifikasi konsep-konsep yang masih lemah atau salah
   - Berikan insight tentang pola kesalahan

4. **EVALUASI & FEEDBACK**
   - Berikan feedback konstruktif untuk setiap kesalahan
   - Jelaskan mengapa jawaban salah
   - Berikan penjelasan jawaban yang benar

5. **REKOMENDASI**
   - Saran materi yang perlu dipelajari ulang
   - Tips untuk meningkatkan pemahaman
   - Strategi belajar yang efektif

**FORMAT OUTPUT:**

## RINGKASAN PENILAIAN
Nilai: [skor dari 0-100]
Total Benar: [x dari ${totalSoal || 'y'} soal]
Persentase: [%]

## DETAIL KOREKSI
[List setiap soal dengan status benar/salah dan penjelasan]

## ANALISIS PEMAHAMAN
### Kekuatan
- [Point kuat siswa]

### Kelemahan
- [Point lemah siswa]

## FEEDBACK & REKOMENDASI
[Feedback konstruktif dan saran pembelajaran]

Berikan analisis yang detail, objektif, dan membantu untuk perkembangan siswa.`;

	return prompt;
}
