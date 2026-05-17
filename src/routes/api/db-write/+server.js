/**
 * POST /api/db-write
 * Menulis data ke MongoDB collection.
 * Digunakan oleh write-db.tool.js yang berjalan di sisi client.
 */

import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/server/db.js';

export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { collection, data } = await request.json();

		if (!collection || !data) {
			return json({ error: 'collection dan data wajib diisi' }, { status: 400 });
		}

		const col = await getCollection(collection);
		const result = await col.insertOne({
			...data,
			userId: locals.user.id || locals.user._id?.toString() || null,
			createdAt: new Date()
		});

		return json({ success: true, id: result.insertedId.toString() });
	} catch (error) {
		console.error('[db-write] Error:', error);
		return json({ success: false, error: 'Gagal menyimpan data' }, { status: 500 });
	}
}
