/**
 * GET  /api/history/[id]  – Mengambil satu item riwayat lengkap (termasuk result).
 * PATCH /api/history/[id] – Menyimpan editedHtml hasil pengeditan oleh user.
 */

import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/server/db.js';
import { ObjectId } from 'mongodb';

export async function GET({ params, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;

	let objectId;
	try {
		objectId = new ObjectId(id);
	} catch {
		return json({ error: 'ID tidak valid' }, { status: 400 });
	}

	const userId = locals.user.id || locals.user._id?.toString() || null;

	const col = await getCollection('generated_docs');
	const doc = await col.findOne({ _id: objectId, userId });

	if (!doc) {
		return json({ error: 'Data tidak ditemukan' }, { status: 404 });
	}

	return json({
		success: true,
		data: {
			_id: doc._id.toString(),
			templateId: doc.templateId || null,
			templateName: doc.templateName || 'Unknown',
			templateDescription: doc.templateDescription || '',
			userContext: doc.userContext || {},
			result: doc.result || null,
			editedHtml: doc.editedHtml || null,
			createdAt: doc.createdAt
		}
	});
}

export async function PATCH({ params, request, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;

	let objectId;
	try {
		objectId = new ObjectId(id);
	} catch {
		return json({ error: 'ID tidak valid' }, { status: 400 });
	}

	const userId = locals.user.id || locals.user._id?.toString() || null;

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Body tidak valid' }, { status: 400 });
	}

	const { editedHtml } = body;
	if (typeof editedHtml !== 'string') {
		return json({ error: 'editedHtml wajib berupa string' }, { status: 400 });
	}

	const col = await getCollection('generated_docs');
	const result = await col.updateOne(
		{ _id: objectId, userId },
		{ $set: { editedHtml, editedAt: new Date() } }
	);
	if (result.matchedCount > 0) {
		return json({ success: true });
	}

	return json({ error: 'Data tidak ditemukan' }, { status: 404 });
}
