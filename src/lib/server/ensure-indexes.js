/**
 * ensure-indexes.js — Setup MongoDB indexes
 * Dipanggil sekali saat server start dari hooks.server.js
 */

import { getCollection } from '$lib/server/db.js';

export async function ensureIndexes() {
	try {
		const userTemplates = await getCollection('user_templates');
		await userTemplates.createIndex({ userId: 1, createdAt: -1 });

		const generatedDocs = await getCollection('generated_docs');
		await generatedDocs.createIndex({ userId: 1, createdAt: -1 });
		await generatedDocs.createIndex(
			{ sourceJobId: 1 },
			{
				name: 'sourceJobId_1',
				unique: true,
				partialFilterExpression: { sourceJobId: { $type: 'string' } }
			}
		);

		console.log('[ensureIndexes] All indexes created successfully');
	} catch (err) {
		console.error('[ensureIndexes] Error creating indexes:', err);
	}
}
