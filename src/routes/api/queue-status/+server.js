/**
 * Queue Status Endpoint
 * GET /api/queue-status
 * 
 * Endpoint untuk monitoring status key pool dan queue.
 * Berguna untuk debugging dan admin dashboard.
 */

import { json } from '@sveltejs/kit';
import { keyPool } from '$lib/server/key-pool.js';
import { requestQueue } from '$lib/server/request-queue.js';

export async function GET({ locals }) {
	// Optional: Bisa ditambahkan auth check untuk admin only
	// if (!locals.user) {
	// 	return json({ error: 'Unauthorized' }, { status: 401 });
	// }

	try {
		const poolStatus = keyPool.getStatus();
		const queueStatus = requestQueue.getStatus();
		const estimatedWaitSeconds = keyPool.getWaitTimeSeconds();

		return json({
			available: poolStatus.available,
			availableKeys: poolStatus.availableKeys,
			totalKeys: poolStatus.totalKeys,
			totalCapacityRPM: poolStatus.totalCapacityRPM,
			queueSize: queueStatus.size,
			estimatedWaitSeconds,
			keys: poolStatus.keys,
			queue: queueStatus.items
		});
	} catch (error) {
		console.error('[Queue Status] Error:', error);
		return json(
			{
				error: 'Failed to get status',
				message: 'Terjadi kesalahan saat mengambil status sistem.'
			},
			{ status: 500 }
		);
	}
}
