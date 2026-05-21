/**
 * AI API endpoint — powered by OpenRouter
 *
 * Rate Limit: 2 generate per jam per user (persisten di MongoDB)
 * PENTING: Rate limit INCREMENT dilakukan di /api/generate-session/start
 *          Endpoint ini hanya CHECK rate limit untuk prevent access jika sudah limit
 */

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getCollection } from '$lib/server/db.js';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

const ALLOWED_MODELS = [
	'google/gemini-3.5-flash',
	'x-ai/grok-4.3',
	'openai/gpt-5.5'
];

const DEFAULT_MODEL = ALLOWED_MODELS[0];

// Rate limit per user: 2 generate per jam
const USER_RATE_LIMIT = 2;

/**
 * POST /api/gemini
 */
export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = locals.user.username;

	try {
		const body = await request.json();
		const { prompt, model: requestedModel } = body;

		if (!prompt || typeof prompt !== 'string') {
			return json({ error: 'Prompt is required' }, { status: 400 });
		}

		// Validate model — fall back to default if not in allowed list
		const model = ALLOWED_MODELS.includes(requestedModel) ? requestedModel : DEFAULT_MODEL;

		// Check rate limit
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

		const apiKey = env.OPENROUTER_API_KEY?.trim();
		if (!apiKey) {
			return json(
				{
					error: 'Konfigurasi API belum diatur. Silakan hubungi administrator untuk mengatur OpenRouter API key.'
				},
				{ status: 500 }
			);
		}

		console.log(`[AI API] User ${userId} calling model: ${model}`);
		const result = await callOpenRouter(apiKey, prompt, model);

		return json(result);
	} catch (error) {
		console.error('[AI API] Unexpected error:', error);
		return json(
			{
				error: 'Internal server error',
				message: error.message || 'Terjadi kesalahan sistem. Silakan coba lagi.'
			},
			{ status: error.status || 500 }
		);
	}
}

/**
 * Call OpenRouter API
 */
async function callOpenRouter(apiKey, prompt, model) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 60000);

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
				model,
				messages: [{ role: 'user', content: prompt }]
			}),
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			const error = await response.json().catch(() => ({}));

			if (response.status === 429) {
				throw { status: 429, message: 'Terlalu banyak permintaan. Silakan tunggu beberapa saat.' };
			}
			if (response.status === 401) {
				throw { status: 401, message: 'OpenRouter API key tidak valid.' };
			}

			throw {
				status: response.status,
				message: error.error?.message || 'OpenRouter API error'
			};
		}

		const data = await response.json();
		const text = data.choices?.[0]?.message?.content || 'No response generated';

		return {
			text,
			model,
			usage: data.usage
				? {
						promptTokenCount: data.usage.prompt_tokens,
						candidatesTokenCount: data.usage.completion_tokens,
						totalTokenCount: data.usage.total_tokens
					}
				: null
		};
	} catch (error) {
		clearTimeout(timeoutId);
		if (error.name === 'AbortError') {
			throw {
				status: 504,
				message: 'Permintaan memakan waktu terlalu lama. Silakan coba lagi dengan prompt yang lebih sederhana.'
			};
		}
		throw error;
	}
}

/**
 * Check user rate limit (persisten di MongoDB)
 */
async function checkUserRateLimit(userId) {
	try {
		const users = await getCollection('users');
		const now = Date.now();
		const user = await users.findOne({ username: userId });

		if (!user) return { allowed: true, remaining: USER_RATE_LIMIT };
		if (!user.rate_limit_reset_at || user.rate_limit_reset_at < now) {
			return { allowed: true, remaining: USER_RATE_LIMIT };
		}

		const count = user.rate_limit_count || 0;
		if (count >= USER_RATE_LIMIT) {
			const resetIn = Math.ceil((user.rate_limit_reset_at - now) / 1000);
			return { allowed: false, remaining: 0, resetIn };
		}

		return { allowed: true, remaining: USER_RATE_LIMIT - count };
	} catch (error) {
		console.error('[Rate Limit] Error checking rate limit:', error);
		return { allowed: true, remaining: USER_RATE_LIMIT };
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
