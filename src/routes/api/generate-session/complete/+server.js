/**
 * Generate Session Complete Endpoint
 * 
 * POST /api/generate-session/complete
 * 
 * Endpoint yang dipanggil SETELAH generate SUKSES.
 * Endpoint ini akan:
 * 1. Increment counter (hanya jika generate sukses)
 * 2. Return status baru
 * 
 * Ini memastikan user HANYA dikenakan quota jika generate benar-benar sukses.
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
	
	console.log('[Generate Complete] ========== GENERATE SUCCESS ==========');
	console.log('[Generate Complete] User:', userId);

	try {
		// Increment rate limit karena generate sukses
		await incrementUserRateLimit(userId);

		// Get updated status
		const rateLimitCheck = await checkUserRateLimit(userId);

		console.log(
			`[Generate Complete] User ${userId} completed generate. Now at: ${USER_RATE_LIMIT - rateLimitCheck.remaining}/${USER_RATE_LIMIT}`
		);

		return json({
			success: true,
			remaining: rateLimitCheck.remaining,
			used: USER_RATE_LIMIT - rateLimitCheck.remaining,
			limit: USER_RATE_LIMIT,
			message: 'Generate completed and counted'
		});
	} catch (error) {
		console.error('[Generate Complete] Error:', error);
		return json(
			{
				error: 'Internal server error',
				message: 'Terjadi kesalahan saat menghitung generate.'
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
			// User exists but needs reset, OR user doesn't exist at all
			if (user) {
				// User exists, just reset the counters
				const result = await users.updateOne(
					{ username: userId },
					{
						$set: {
							rate_limit_count: 1,
							rate_limit_reset_at: resetAt,
							rate_limit_last_request: now
						}
					}
				);
				console.log(`[Rate Limit] User ${userId} - RESET to 1/${USER_RATE_LIMIT} (window expired). Modified: ${result.modifiedCount}`);
			} else {
				// User doesn't exist - this shouldn't happen in normal flow
				console.warn(`[Rate Limit] WARNING: User ${userId} not found in database! Cannot track rate limit.`);
			}
		} else {
			// Increment counter
			const result = await users.updateOne(
				{ username: userId },
				{
					$inc: { rate_limit_count: 1 },
					$set: { rate_limit_last_request: now }
				}
			);
			const newCount = (user.rate_limit_count || 0) + 1;
			console.log(`[Rate Limit] User ${userId} - INCREMENT to ${newCount}/${USER_RATE_LIMIT}. Modified: ${result.modifiedCount}`);
		}
	} catch (error) {
		console.error('[Rate Limit] Error incrementing rate limit:', error);
		throw error; // Re-throw to handle in caller
	}
}
