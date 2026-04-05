import { json } from '@sveltejs/kit';
import { GEMINI_API_KEY, GEMINI_MODEL } from '$env/static/private';

// In-memory rate limiting store
// Format: { userId: { count: number, resetTime: timestamp } }
const rateLimitStore = new Map();

// Rate limit: 50 requests per minute per user
const RATE_LIMIT = 50;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

/**
 * Check if user has exceeded rate limit
 */
function checkRateLimit(userId) {
	const now = Date.now();
	const userLimit = rateLimitStore.get(userId);

	if (!userLimit || now > userLimit.resetTime) {
		// Reset or init
		rateLimitStore.set(userId, {
			count: 1,
			resetTime: now + RATE_LIMIT_WINDOW
		});
		return { allowed: true, remaining: RATE_LIMIT - 1 };
	}

	if (userLimit.count >= RATE_LIMIT) {
		const resetIn = Math.ceil((userLimit.resetTime - now) / 1000);
		return {
			allowed: false,
			remaining: 0,
			resetIn
		};
	}

	userLimit.count++;
	return {
		allowed: true,
		remaining: RATE_LIMIT - userLimit.count
	};
}

export async function POST({ request, locals }) {
	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check rate limit
	const rateLimit = checkRateLimit(locals.user.userId || locals.user.username);
	if (!rateLimit.allowed) {
		return json(
			{
				error: 'Rate limit exceeded',
				message: `Terlalu banyak permintaan. Silakan tunggu ${rateLimit.resetIn} detik.`,
				resetIn: rateLimit.resetIn
			},
			{
				status: 429,
				headers: {
					'X-RateLimit-Limit': RATE_LIMIT.toString(),
					'X-RateLimit-Remaining': '0',
					'X-RateLimit-Reset': rateLimit.resetIn.toString()
				}
			}
		);
	}

	try {
		const body = await request.json();
		// Use model from environment variable, allow client override, fallback to gemini-1.5-flash
		const { prompt, model = GEMINI_MODEL || 'gemini-1.5-flash' } = body;

		if (!prompt) {
			return json({ error: 'Prompt is required' }, { status: 400 });
		}

		if (!GEMINI_API_KEY) {
			return json({ error: 'Gemini API Key not configured on server' }, { status: 500 });
		}

		// Call Gemini API with server-side API key
		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					contents: [{ parts: [{ text: prompt }] }]
				})
			}
		);

		if (!response.ok) {
			const error = await response.json();
			console.error('Gemini API error:', error);

			// Return user-friendly error messages
			if (response.status === 400) {
				return json(
					{
						error: 'Invalid request',
						message: 'Prompt tidak valid atau terlalu panjang. Silakan coba dengan prompt yang lebih pendek.'
					},
					{ status: 400 }
				);
			}

			if (response.status === 429) {
				return json(
					{
						error: 'Gemini API rate limit',
						message:
							'Server API quota exceeded. Silakan hubungi administrator atau tunggu beberapa saat.'
					},
					{ status: 429 }
				);
			}

			if (response.status === 403) {
				return json(
					{
						error: 'API key invalid',
						message: 'API key tidak valid. Silakan hubungi administrator.'
					},
					{ status: 500 }
				);
			}

			return json(
				{
					error: 'Gemini API error',
					message: 'Terjadi kesalahan dari AI service. Silakan coba lagi.',
					details: error
				},
				{ status: response.status }
			);
		}

		const data = await response.json();

		// Extract text from Gemini response
		const text =
			data.candidates?.[0]?.content?.parts?.[0]?.text ||
			data.text ||
			'No response generated';

		return json(
			{
				text,
				model,
				usage: data.usageMetadata || null
			},
			{
				headers: {
					'X-RateLimit-Limit': RATE_LIMIT.toString(),
					'X-RateLimit-Remaining': rateLimit.remaining.toString()
				}
			}
		);
	} catch (error) {
		console.error('Gemini API error:', error);

		// Check if it's a timeout or network error
		if (error.name === 'AbortError' || error.message.includes('timeout')) {
			return json(
				{
					error: 'Request timeout',
					message: 'Permintaan memakan waktu terlalu lama. Silakan coba dengan prompt yang lebih sederhana.'
				},
				{ status: 504 }
			);
		}

		return json(
			{
				error: 'Internal server error',
				message: 'Terjadi kesalahan sistem. Silakan coba lagi.'
			},
			{ status: 500 }
		);
	}
}
