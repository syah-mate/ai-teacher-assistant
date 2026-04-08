/**
 * User Rate Limit Status Endpoint
 * 
 * GET /api/user/rate-limit - Cek status rate limit user saat ini
 */

import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/server/db.js';

const USER_RATE_LIMIT = 2;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 jam

/**
 * GET - Cek status rate limit user
 */
export async function GET({ locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Use username for rate limit tracking (consistent with database schema)
		const userId = locals.user.username;
		console.log(`[Rate Limit Status] Checking for user: ${userId}`);
		
		const users = await getCollection('users');
		const now = Date.now();

		const user = await users.findOne({ username: userId });
		
		console.log(`[Rate Limit Status] User found: ${!!user}, Has limit: ${!!(user?.rate_limit_count)}`);

		// Jika tidak ada rate limit data atau sudah expired
		if (!user || !user.rate_limit_reset_at || user.rate_limit_reset_at < now) {
			console.log(`[Rate Limit Status] No limit data or expired - returning full quota`);
			return json({
				limit: USER_RATE_LIMIT,
				remaining: USER_RATE_LIMIT,
				used: 0,
				resetAt: null,
				resetIn: 0,
				isLimited: false
			});
		}

		const count = user.rate_limit_count || 0;
		const remaining = Math.max(0, USER_RATE_LIMIT - count);
		const resetIn = Math.ceil((user.rate_limit_reset_at - now) / 1000);
		const isLimited = count >= USER_RATE_LIMIT;

		console.log(`[Rate Limit Status] Count: ${count}/${USER_RATE_LIMIT}, Remaining: ${remaining}, Reset in: ${resetIn}s`);

		return json({
			limit: USER_RATE_LIMIT,
			remaining,
			used: count,
			resetAt: new Date(user.rate_limit_reset_at).toISOString(),
			resetIn,
			isLimited,
			lastRequest: user.rate_limit_last_request
				? new Date(user.rate_limit_last_request).toISOString()
				: null
		});
	} catch (error) {
		console.error('[Rate Limit Status] Error:', error);
		return json(
			{
				error: 'Failed to get rate limit status',
				message: 'Terjadi kesalahan saat mengambil status rate limit.'
			},
			{ status: 500 }
		);
	}
}
