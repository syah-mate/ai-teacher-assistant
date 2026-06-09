// src/routes/api/custom-templates/generate-schema/+server.js
//
// Endpoint AI untuk generate outputSchema JSON dari instruksi bahasa Indonesia.
// Dipanggil sekali saat guru menyimpan template — bukan setiap kali generate modul.

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Generic fallback jika AI gagal
const FALLBACK_SCHEMA = JSON.stringify({ judul: 'string', konten: ['string'] }, null, 2);

const SYSTEM_PROMPT = `Kamu adalah asisten teknis yang bertugas menganalisis instruksi pembuatan konten pendidikan
dan menghasilkan JSON output schema yang sesuai.

ATURAN WAJIB:
1. Output HANYA JSON murni — tidak ada teks lain, tidak ada markdown, tidak ada backtick.
2. Semua value di schema harus berupa type hint string: "string", "number", atau array ["string"].
3. Gunakan nama key dalam format camelCase bahasa Indonesia (misal: ringkasanMateri, daftarPertanyaan).
4. Maksimal 6 key di level root — jangan berlebihan.
5. Jika instruksi menyebut "poin" atau "daftar" atau "list", gunakan array ["string"].
6. Jika instruksi menyebut "tabel" atau "perbandingan", gunakan array of object: [{"kolom1": "string", "kolom2": "string"}].
7. Jika instruksi ambigu atau tidak jelas, kembalikan schema default: {"judul": "string", "konten": ["string"]}

Contoh input → output:

INPUT: "Buat 3 poin materi utama dan 2 pertanyaan refleksi untuk siswa"
OUTPUT: {"materiUtama": ["string"], "pertanyaanRefleksi": ["string"]}

INPUT: "Rangkum materi dalam paragraf singkat lalu beri contoh aplikasi nyata di kehidupan sehari-hari"
OUTPUT: {"ringkasanMateri": "string", "contohAplikasi": ["string"]}

INPUT: "Buat tabel perbandingan antara dua konsep yang dipelajari"
OUTPUT: {"tabelPerbandingan": [{"konsep": "string", "penjelasan": "string", "contoh": "string"}]}

INPUT: "Buat soal latihan beserta kunci jawaban"
OUTPUT: {"soalLatihan": [{"nomor": "string", "pertanyaan": "string", "kunciJawaban": "string"}]}`;

/**
 * POST /api/custom-templates/generate-schema
 * Body: { instruksi: "..." }
 * Response: { schema: "{...}", source: "ai" | "fallback" }
 */
export async function POST({ request, locals }) {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json();
	const instruksi = body?.instruksi?.trim();

	// Validasi input
	if (!instruksi || instruksi.length < 10) {
		return json({ schema: FALLBACK_SCHEMA, source: 'fallback' });
	}

	const apiKey = env.OPENROUTER_API_KEY?.trim();
	if (!apiKey) {
		console.warn('[generate-schema] OPENROUTER_API_KEY tidak dikonfigurasi, menggunakan fallback');
		return json({ schema: FALLBACK_SCHEMA, source: 'fallback' });
	}

	try {
		const response = await fetch(OPENROUTER_BASE_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
				'HTTP-Referer': 'https://asisten-guru-ai.app',
				'X-Title': 'Asisten Guru AI'
			},
			body: JSON.stringify({
				model: 'google/gemini-flash-1.5',
				messages: [
					{ role: 'system', content: SYSTEM_PROMPT },
					{ role: 'user', content: `Instruksi guru: "${instruksi}"\n\nHasilkan JSON output schema yang sesuai.` }
				],
				max_tokens: 300,
				temperature: 0.1
			})
		});

		if (!response.ok) {
			throw new Error(`OpenRouter HTTP ${response.status}`);
		}

		const data = await response.json();
		const raw = data.choices?.[0]?.message?.content?.trim() ?? '';

		// Strip markdown backtick jika ada (defensive)
		const cleaned = raw.replace(/```json|```/gi, '').trim();

		// Validasi hasil adalah JSON valid
		const parsed = JSON.parse(cleaned);

		// Validasi tidak kosong
		if (typeof parsed !== 'object' || parsed === null || Object.keys(parsed).length === 0) {
			throw new Error('Schema kosong');
		}

		return json({
			schema: JSON.stringify(parsed, null, 2),
			source: 'ai'
		});

	} catch (err) {
		// AI gagal parse atau return bukan JSON — fallback ke generic schema
		console.warn('[generate-schema] AI gagal, menggunakan fallback schema:', err.message);
		return json({
			schema: FALLBACK_SCHEMA,
			source: 'fallback'
		});
	}
}
