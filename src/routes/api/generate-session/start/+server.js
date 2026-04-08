/**
 * Generate Session Start Endpoint
 * 
 * POST /api/generate-session/start
 * 
 * Endpoint yang dipanggil SEBELUM user mulai generate apapun.
 * Endpoint ini yang akan:
 * 1. Check rate limit user
 * 2. Increment counter (only once per generate session)
 * 3. Return OK untuk proceed atau error jika limit exceeded
 * 
 * Frontend harus call endpoint ini SEBELUM orchestrator run.
 */

import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/server/db.js';

// Rate limit per user: 2 generate per jam
const USER_RATE_LIMIT = 2;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 jam

export async function POST({ locals }) {
	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Use username for rate limit tracking (consistent with database schema)
	const userId = locals.user.username;
	
	console.log('[Generate Session] ========== NEW REQUEST ==========');
	console.log('[Generate Session] User:', userId);
	console.log('[Generate Session] Full user object:', JSON.stringify(locals.user, null, 2));

	try {
		// Check rate limit (persisten di MongoDB)
		// NOTE: Kita HANYA check di sini, TIDAK decrement
		// Decrement dilakukan di /api/generate-session/complete setelah generate SUKSES
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

		console.log(
			`[Generate Session] User ${userId} can start generate. Current: ${USER_RATE_LIMIT - rateLimitCheck.remaining}/${USER_RATE_LIMIT}`
		);

		return json({
			success: true,
			remaining: rateLimitCheck.remaining,
			limit: USER_RATE_LIMIT,
			message: 'Generate session check passed'
		});
	} catch (error) {
		console.error('[Generate Session] Error:', error);
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
 * Helper: Check user rate limit (persisten di MongoDB)
 */
async function checkUserRateLimit(userId) {
	try {
		const users = await getCollection('users');
		const now = Date.now();

		const user = await users.findOne({ username: userId });
		
		console.log(`[Rate Limit Check] User ${userId} - Found in DB: ${!!user}, Has limit data: ${!!(user?.rate_limit_reset_at)}`);
		
		if (!user) {
			console.log(`[Rate Limit Check] User ${userId} - Not found in DB, allowing with full quota`);
			return { allowed: true, remaining: USER_RATE_LIMIT };
		}

		// Jika tidak ada rate limit data atau sudah expired, allow
		if (!user.rate_limit_reset_at || user.rate_limit_reset_at < now) {
			console.log(`[Rate Limit Check] User ${userId} - Limit expired or not set, allowing with full quota`);
			return { allowed: true, remaining: USER_RATE_LIMIT };
		}

		// Cek apakah sudah mencapai limit
		const count = user.rate_limit_count || 0;
		console.log(`[Rate Limit Check] User ${userId} - Current count: ${count}/${USER_RATE_LIMIT}`);
		
		if (count >= USER_RATE_LIMIT) {
			const resetIn = Math.ceil((user.rate_limit_reset_at - now) / 1000);
			console.log(`[Rate Limit Check] User ${userId} - LIMIT EXCEEDED. Reset in ${resetIn}s`);
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
