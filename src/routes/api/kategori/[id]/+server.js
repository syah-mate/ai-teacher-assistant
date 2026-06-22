/**
 * GET    /api/kategori/[id]  – Ambil detail kategori
 * PUT    /api/kategori/[id]  – Update kategori
 * DELETE /api/kategori/[id]  – Hapus kategori
 */

import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/server/db.js';
import { ObjectId } from 'mongodb';

export async function GET({ params, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = locals.user.id || locals.user._id?.toString() || null;
	if (!userId) {
		return json({ error: 'User ID tidak ditemukan' }, { status: 400 });
	}

	const { id } = params;

	let objectId;
	try {
		objectId = new ObjectId(id);
	} catch {
		return json({ error: 'ID tidak valid' }, { status: 400 });
	}

	try {
		const col = await getCollection('kategori');
		const doc = await col.findOne({ _id: objectId, userId });

		if (!doc) {
			return json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
		}

		return json({
			kategori: {
				...doc,
				_id: doc._id.toString()
			}
		});
	} catch (error) {
		console.error('[kategori] GET/[id] error:', error);
		return json({ error: 'Gagal mengambil kategori' }, { status: 500 });
	}
}

export async function PUT({ params, request, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = locals.user.id || locals.user._id?.toString() || null;
	if (!userId) {
		return json({ error: 'User ID tidak ditemukan' }, { status: 400 });
	}

	const { id } = params;

	let objectId;
	try {
		objectId = new ObjectId(id);
	} catch {
		return json({ error: 'ID tidak valid' }, { status: 400 });
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Request body tidak valid' }, { status: 400 });
	}

	const { nama, deskripsi } = body;
	const updateFields = { updatedAt: new Date() };

	if (nama !== undefined) {
		if (typeof nama !== 'string' || !nama.trim()) {
			return json({ error: 'Nama kategori tidak boleh kosong' }, { status: 400 });
		}
		// Cek duplikat nama (kecuali dirinya sendiri)
		const col = await getCollection('kategori');
		const existing = await col.findOne({
			userId,
			_id: { $ne: objectId },
			nama: { $regex: `^${nama.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
		});
		if (existing) {
			return json({ error: 'Kategori dengan nama ini sudah ada' }, { status: 409 });
		}
		updateFields.nama = nama.trim();
	}

	if (deskripsi !== undefined) {
		updateFields.deskripsi = deskripsi?.trim() ?? '';
	}

	try {
		const col = await getCollection('kategori');
		const result = await col.updateOne(
			{ _id: objectId, userId },
			{ $set: updateFields }
		);

		if (result.matchedCount === 0) {
			return json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('[kategori] PUT error:', error);
		return json({ error: 'Gagal update kategori' }, { status: 500 });
	}
}

export async function DELETE({ params, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = locals.user.id || locals.user._id?.toString() || null;
	if (!userId) {
		return json({ error: 'User ID tidak ditemukan' }, { status: 400 });
	}

	const { id } = params;

	let objectId;
	try {
		objectId = new ObjectId(id);
	} catch {
		return json({ error: 'ID tidak valid' }, { status: 400 });
	}

	try {
		const col = await getCollection('kategori');
		const result = await col.deleteOne({ _id: objectId, userId });

		if (result.deletedCount === 0) {
			return json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
		}

		// Hapus referensi kategori dari template yang menggunakannya
		const templateCol = await getCollection('user_templates');
		await templateCol.updateMany(
			{ userId, kategoriId: id },
			{ $unset: { kategoriId: '' } }
		);

		return json({ success: true });
	} catch (error) {
		console.error('[kategori] DELETE error:', error);
		return json({ error: 'Gagal menghapus kategori' }, { status: 500 });
	}
}
