/**
 * GET /api/history
 * Mengambil riwayat generate user dari collection `generated_docs`.
 */

import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/server/db.js';

export async function GET({ locals, url }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = locals.user.id || locals.user._id?.toString() || null;
	if (!userId) {
		return json({ error: 'User ID tidak ditemukan' }, { status: 400 });
	}

	const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

	try {
		const col = await getCollection('generated_docs');
		const docs = await col
			.find(
				{ userId },
				{ projection: { result: 0 } }
			)
			.sort({ createdAt: -1 })
			.limit(limit)
			.toArray();

		const data = docs.map((doc) => ({
			_id: doc._id.toString(),
			templateId: doc.templateId || null,
			templateName: doc.templateName || 'Unknown',
			userContext: doc.userContext || {},
			createdAt: doc.createdAt
		}));

		return json({ success: true, data });
	} catch (error) {
		console.error('[history] Error:', error);
		return json({ success: false, error: 'Gagal mengambil riwayat' }, { status: 500 });
	}
}
