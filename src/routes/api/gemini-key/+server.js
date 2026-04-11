/**
 * API Endpoint untuk mendapatkan Gemini API Key
 * (untuk digunakan oleh client-side image generation)
 */

import { json } from '@sveltejs/kit';
import { keyPool } from '$lib/server/key-pool.js';

/**
 * GET /api/gemini-key
 * Get available API key for client-side usage
 */
export async function GET({ locals }) {
	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Prioritize user's personal API key
		if (locals.user.geminiApiKey) {
			return json({
				apiKey: locals.user.geminiApiKey,
				source: 'user'
			});
		}

		// Fallback to pool key
		const poolKeyObj = keyPool.getAvailableKey();
		if (!poolKeyObj) {
			const waitSeconds = keyPool.getWaitTimeSeconds();
			return json(
				{
					error: `Semua API key sedang penuh. Silakan tunggu ${waitSeconds} detik atau tambahkan API key pribadi di Pengaturan > Integrasi.`
				},
				{ status: 503 }
			);
		}

		// Mark key as used
		keyPool.markUsed(poolKeyObj);

		return json({
			apiKey: poolKeyObj.key,
			source: 'pool'
		});

	} catch (error) {
		console.error('Get API key error:', error);
		return json(
			{
				error: 'Gagal mendapatkan API key'
			},
			{ status: 500 }
		);
	}
}
