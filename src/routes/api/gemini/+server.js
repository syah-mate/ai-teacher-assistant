/**
 * Gemini API Orchestrator dengan Queue + Key Rotation
 * 
 * Routing request ke 3 path:
 * 1. User key (prioritas tertinggi) - bypass queue & pool
 * 2. System key pool - langsung proses jika ada slot
 * 3. Queue - antrian jika semua key penuh
 * 
 * Rate Limit: 2 generate per jam per user (persisten di MongoDB)
 * PENTING: Rate limit dihitung per ATTEMPT, bukan per SUCCESS
 *          Setiap kali user klik generate, hitungan berkurang
 *          Ini mencegah spam retry jika error
 */

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { keyPool } from '$lib/server/key-pool.js';
import { requestQueue } from '$lib/server/request-queue.js';
import { getCollection } from '$lib/server/db.js';

const GEMINI_MODEL = env.GEMINI_MODEL || 'gemini-2.0-flash';

// Rate limit per user: 2 generate per jam
const USER_RATE_LIMIT = 2;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 jam

/**
 * POST /api/gemini
 * Main endpoint untuk semua request ke Gemini API
 */
export async function POST({ request, locals }) {
	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = locals.user.id || locals.user.userId || locals.user.username || 'anonymous';

	try {
		const body = await request.json();
		const { prompt } = body;

		if (!prompt || typeof prompt !== 'string') {
			return json({ error: 'Prompt is required' }, { status: 400 });
		}

		// Check rate limit (persisten di MongoDB)
		const rateLimitCheck = await checkUserRateLimit(userId);
		if (!rateLimitCheck.allowed) {
			const minutesRemaining = Math.ceil(rateLimitCheck.resetIn / 60);
			return json(
				{
					error: 'Rate limit exceeded',
					message: `Anda sudah mencapai batas ${USER_RATE_LIMIT} generate per jam. Silakan tunggu ${minutesRemaining} menit lagi.`,
					resetIn: rateLimitCheck.resetIn,
					remaining: 0,
					limit: USER_RATE_LIMIT
				},
				{ status: 429 }
			);
		}

		// INCREMENT RATE LIMIT DI AWAL - setiap attempt dihitung, bukan hanya sukses
		// Ini mencegah user spam retry jika error
		await incrementUserRateLimit(userId);
		console.log(`[Gemini API] User ${userId} - Request attempt counted (${rateLimitCheck.remaining - 1} remaining)`);

		// Path 1: Cek apakah user punya API key sendiri
		const userKey = await getUserKey(userId);
		if (userKey) {
			console.log(`[Gemini API] User ${userId} using personal API key`);
			try {
				const result = await callGeminiDirect(userKey, prompt, GEMINI_MODEL);
				// Rate limit already incremented at the beginning
				return json({
					...result,
					keySource: 'user',
					remaining: rateLimitCheck.remaining - 1
				});
			} catch (error) {
				// Jika user key error, return error langsung (tidak fallback ke system)
				if (error.status === 429) {
					return json(
						{
							error: 'User quota exceeded',
							message:
								'Quota API key Anda sudah habis. Tunggu beberapa saat atau gunakan system key dengan menghapus API key pribadi Anda di Pengaturan.'
						},
						{ status: 429 }
					);
				}

				return json(
					{
						error: 'User key error',
						message: error.message || 'Terjadi kesalahan dengan API key Anda.'
					},
					{ status: error.status || 500 }
				);
			}
		}

		// Path 2: Coba ambil system key dari pool
		const availableKey = keyPool.getAvailableKey();
		if (availableKey) {
			console.log(`[Gemini API] User ${userId} using system key ${availableKey.id}`);
			keyPool.markUsed(availableKey);

			try {
				const result = await callGeminiDirect(availableKey.key, prompt, GEMINI_MODEL);
				// Rate limit already incremented at the beginning
				return json({
					...result,
					keySource: 'system',
					remaining: rateLimitCheck.remaining - 1
				});
			} catch (error) {
				// Jika dapat 429, mark key dan fallthrough ke queue
				if (error.status === 429) {
					keyPool.markRateLimited(availableKey);
					console.log(`[Gemini API] ${availableKey.id} rate limited, falling back to queue`);
				} else {
					keyPool.markError(availableKey);
					// Error lain, return langsung
					return json(
						{
							error: 'Gemini API error',
							message: error.message || 'Terjadi kesalahan dari AI service.'
						},
						{ status: error.status || 500 }
					);
				}
			}
		}

		// Path 3: Semua key penuh, masuk antrian
		console.log(`[Gemini API] User ${userId} entering queue`);
		try {
			const result = await requestQueue.enqueue(userId, prompt, GEMINI_MODEL);
			// Rate limit already incremented at the beginning
			return json({
				...result,
				keySource: 'system_queued',
				remaining: rateLimitCheck.remaining - 1
			});
		} catch (error) {
			// Queue error (full, user limit, timeout)
			return json(
				{
					error: error.code || 'Queue error',
					message: error.message || 'Terjadi kesalahan sistem antrian.',
					estimatedWaitSeconds: error.estimatedWaitSeconds,
					queueSize: error.queueSize
				},
				{ status: error.status || 503 }
			);
		}
	} catch (error) {
		console.error('[Gemini API] Unexpected error:', error);
		return json(
			{
				error: 'Internal server error',
				message: 'Terjadi kesalahan sistem. Silakan coba lagi.'
			},
			{ status: 500 }
		);
	}
}

/**
 * Helper: Get user's personal API key dari database
 */
async function getUserKey(userId) {
	try {
		const users = await getCollection('users');
		const user = await users.findOne({ username: userId });
		return user?.gemini_api_key || null;
	} catch (error) {
		console.error('[Gemini API] Error getting user key:', error);
		return null;
	}
}

/**
 * Helper: Call Gemini API langsung dengan key tertentu
 */
async function callGeminiDirect(apiKey, prompt, model) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 detik timeout

	try {
		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					contents: [{ parts: [{ text: prompt }] }]
				}),
				signal: controller.signal
			}
		);

		clearTimeout(timeoutId);

		if (!response.ok) {
			const error = await response.json().catch(() => ({}));

			if (response.status === 400) {
				throw {
					status: 400,
					message:
						'Prompt tidak valid atau terlalu panjang. Silakan coba dengan prompt yang lebih pendek.'
				};
			}

			if (response.status === 429) {
				throw {
					status: 429,
					message: 'Rate limit exceeded'
				};
			}

			if (response.status === 403) {
				throw {
					status: 403,
					message: 'API key tidak valid atau tidak memiliki akses.'
				};
			}

			throw {
				status: response.status,
				message: error.error?.message || 'Gemini API error'
			};
		}

		const data = await response.json();

		// Extract text from response
		const text =
			data.candidates?.[0]?.content?.parts?.[0]?.text || data.text || 'No response generated';

		return {
			text,
			model,
			usage: data.usageMetadata || null
		};
	} catch (error) {
		clearTimeout(timeoutId);

		if (error.name === 'AbortError') {
			throw {
				status: 504,
				message:
					'Permintaan memakan waktu terlalu lama. Silakan coba dengan prompt yang lebih sederhana.'
			};
		}

		throw error;
	}
}

/**
 * Helper: Check user rate limit (persisten di MongoDB)
 * Returns: { allowed: boolean, remaining: number, resetIn?: number (seconds) }
 */
async function checkUserRateLimit(userId) {
	try {
		const users = await getCollection('users');
		const now = Date.now();

		const user = await users.findOne({ username: userId });
		if (!user) {
			return { allowed: true, remaining: USER_RATE_LIMIT };
		}

		// Jika tidak ada rate limit data atau sudah expired, allow
		if (!user.rate_limit_reset_at || user.rate_limit_reset_at < now) {
			return { allowed: true, remaining: USER_RATE_LIMIT };
		}

		// Cek apakah sudah mencapai limit
		const count = user.rate_limit_count || 0;
		if (count >= USER_RATE_LIMIT) {
			const resetIn = Math.ceil((user.rate_limit_reset_at - now) / 1000);
			return {
				allowed: false,
				remaining: 0,
				resetIn
			};
		}

		return {
			allowed: true,
			remaining: USER_RATE_LIMIT - count
		};
	} catch (error) {
		console.error('[Rate Limit] Error checking rate limit:', error);
		// Jika error, allow request (fail-open)
		return { allowed: true, remaining: USER_RATE_LIMIT };
	}
}

/**
 * Helper: Increment user rate limit counter (persisten di MongoDB)
 */
async function incrementUserRateLimit(userId) {
	try {
		const users = await getCollection('users');
		const now = Date.now();
		const resetAt = now + RATE_LIMIT_WINDOW_MS;

		const user = await users.findOne({ username: userId });

		// Jika tidak ada rate limit data atau sudah expired, reset
		if (!user || !user.rate_limit_reset_at || user.rate_limit_reset_at < now) {
			await users.updateOne(
				{ username: userId },
				{
					$set: {
						rate_limit_count: 1,
						rate_limit_reset_at: resetAt,
						rate_limit_last_request: now
					}
				}
			);
			console.log(`[Rate Limit] User ${userId} - 1/${USER_RATE_LIMIT} (window reset)`);
		} else {
			// Increment counter
			await users.updateOne(
				{ username: userId },
				{
					$inc: { rate_limit_count: 1 },
					$set: { rate_limit_last_request: now }
				}
			);
			const newCount = (user.rate_limit_count || 0) + 1;
			console.log(`[Rate Limit] User ${userId} - ${newCount}/${USER_RATE_LIMIT}`);
		}
	} catch (error) {
		console.error('[Rate Limit] Error incrementing rate limit:', error);
		// Silent fail - tidak throw error agar tidak ganggu main flow
	}
}
