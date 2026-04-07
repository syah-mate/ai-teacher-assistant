/**
 * User Gemini Key Management Endpoint
 * 
 * Endpoint untuk guru menyimpan/menghapus API key Gemini mereka sendiri.
 * Guru dengan user key akan bypass queue dan pool sepenuhnya.
 * 
 * GET    /api/user/gemini-key - Cek status key (tidak expose key asli)
 * POST   /api/user/gemini-key - Validasi + simpan key
 * DELETE /api/user/gemini-key - Hapus key (fallback ke system pool)
 */

import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/server/db.js';
import { env } from '$env/dynamic/private';

// Regex untuk validasi format Gemini API key
const GEMINI_KEY_REGEX = /^AIza[0-9A-Za-z_-]{35}$/;

/**
 * GET - Cek status key user saat ini
 */
export async function GET({ locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const userId = locals.user.id || locals.user.userId || locals.user.username;
		const users = await getCollection('users');
		const user = await users.findOne({ username: userId });

		if (!user || !user.gemini_api_key) {
			return json({
				hasKey: false,
				maskedKey: null,
				setAt: null
			});
		}

		// Mask key untuk keamanan (tampilkan hanya 10 char pertama dan 4 terakhir)
		const key = user.gemini_api_key;
		const maskedKey = key.substring(0, 10) + '...' + key.substring(key.length - 4);

		return json({
			hasKey: true,
			maskedKey,
			setAt: user.gemini_key_set_at || null
		});
	} catch (error) {
		console.error('[User Gemini Key] GET error:', error);
		return json(
			{
				error: 'Failed to get key status',
				message: 'Terjadi kesalahan saat mengambil status API key.'
			},
			{ status: 500 }
		);
	}
}

/**
 * POST - Validasi dan simpan API key
 */
export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { apiKey } = body;

		if (!apiKey || typeof apiKey !== 'string') {
			return json(
				{
					error: 'API key is required',
					message: 'API key tidak boleh kosong.'
				},
				{ status: 400 }
			);
		}

		const trimmedKey = apiKey.trim();

		// Validasi format
		if (!GEMINI_KEY_REGEX.test(trimmedKey)) {
			return json(
				{
					error: 'Invalid API key format',
					message:
						'Format API key tidak valid. API key Gemini harus diawali dengan "AIza" dan memiliki panjang 39 karakter.'
				},
				{ status: 400 }
			);
		}

		// Test key dengan memanggil Gemini API
		const testResult = await testGeminiKey(trimmedKey);
		if (!testResult.valid) {
			return json(
				{
					error: 'Invalid API key',
					message: testResult.message || 'API key tidak valid atau tidak aktif.'
				},
				{ status: 400 }
			);
		}

		// Simpan ke database
		const userId = locals.user.id || locals.user.userId || locals.user.username;
		const users = await getCollection('users');

		await users.updateOne(
			{ username: userId },
			{
				$set: {
					gemini_api_key: trimmedKey,
					gemini_key_set_at: new Date()
				}
			}
		);

		console.log(`[User Gemini Key] User ${userId} set personal API key`);

		return json({
			success: true,
			message: 'API key berhasil disimpan dan divalidasi.'
		});
	} catch (error) {
		console.error('[User Gemini Key] POST error:', error);
		return json(
			{
				error: 'Failed to save key',
				message: 'Terjadi kesalahan saat menyimpan API key.'
			},
			{ status: 500 }
		);
	}
}

/**
 * DELETE - Hapus API key user
 */
export async function DELETE({ locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const userId = locals.user.id || locals.user.userId || locals.user.username;
		const users = await getCollection('users');

		await users.updateOne(
			{ username: userId },
			{
				$unset: {
					gemini_api_key: '',
					gemini_key_set_at: ''
				}
			}
		);

		console.log(`[User Gemini Key] User ${userId} removed personal API key`);

		return json({
			success: true,
			message: 'API key berhasil dihapus. Anda akan menggunakan system API key.'
		});
	} catch (error) {
		console.error('[User Gemini Key] DELETE error:', error);
		return json(
			{
				error: 'Failed to delete key',
				message: 'Terjadi kesalahan saat menghapus API key.'
			},
			{ status: 500 }
		);
	}
}

/**
 * Helper: Test Gemini API key validity
 */
async function testGeminiKey(apiKey) {
	try {
		const model = env.GEMINI_MODEL || 'gemini-2.0-flash';
		const testPrompt = 'Say "OK" if you can read this.';

		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					contents: [{ parts: [{ text: testPrompt }] }]
				}),
				signal: AbortSignal.timeout(10000) // 10 detik timeout
			}
		);

		if (!response.ok) {
			const error = await response.json().catch(() => ({}));

			if (response.status === 400) {
				return {
					valid: false,
					message: 'API key tidak valid atau format request salah.'
				};
			}

			if (response.status === 403) {
				return {
					valid: false,
					message: 'API key tidak memiliki akses ke Gemini API.'
				};
			}

			if (response.status === 429) {
				return {
					valid: false,
					message:
						'API key valid, tetapi quota sudah habis. Tunggu beberapa saat atau gunakan key lain.'
				};
			}

			return {
				valid: false,
				message: `API key error: ${error.error?.message || 'Unknown error'}`
			};
		}

		// Key valid
		return {
			valid: true,
			message: 'API key valid dan berfungsi.'
		};
	} catch (error) {
		console.error('[User Gemini Key] Test error:', error);
		return {
			valid: false,
			message: 'Tidak dapat memvalidasi API key. Periksa koneksi internet Anda.'
		};
	}
}
