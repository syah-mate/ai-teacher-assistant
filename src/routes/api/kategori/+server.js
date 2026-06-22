/**
 * GET  /api/kategori  – List semua kategori milik user
 * POST /api/kategori  – Buat kategori baru
 */

import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/server/db.js';

export async function GET({ locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const col = await getCollection('kategori');
		const docs = await col
			.find({})
			.sort({ createdAt: -1 })
			.toArray();

		const kategori = docs.map((doc) => ({
			_id: doc._id.toString(),
			nama: doc.nama,
			deskripsi: doc.deskripsi || '',
			userId: doc.userId || null,
			templateCount: doc.templateCount || 0,
			createdAt: doc.createdAt
		}));

		return json({ kategori });
	} catch (error) {
		console.error('[kategori] GET error:', error);
		return json({ error: 'Gagal mengambil kategori' }, { status: 500 });
	}
}

export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = locals.user.id || locals.user._id?.toString() || null;
	if (!userId) {
		return json({ error: 'User ID tidak ditemukan' }, { status: 400 });
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Request body tidak valid' }, { status: 400 });
	}

	const { nama, deskripsi } = body;

	if (!nama || typeof nama !== 'string' || !nama.trim()) {
		return json({ error: 'Nama kategori wajib diisi' }, { status: 400 });
	}

	try {
		const col = await getCollection('kategori');

		// Cek duplikat nama (case-insensitive)
		const existing = await col.findOne({
			userId,
			nama: { $regex: `^${nama.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
		});
		if (existing) {
			return json({ error: 'Kategori dengan nama ini sudah ada' }, { status: 409 });
		}

		const doc = {
			userId,
			nama: nama.trim(),
			deskripsi: deskripsi?.trim() ?? '',
			templateCount: 0,
			createdAt: new Date()
		};

		const result = await col.insertOne(doc);
		return json({ success: true, _id: result.insertedId.toString(), kategori: { ...doc, _id: result.insertedId.toString() } });
	} catch (error) {
		console.error('[kategori] POST error:', error);
		return json({ error: 'Gagal membuat kategori' }, { status: 500 });
	}
}
