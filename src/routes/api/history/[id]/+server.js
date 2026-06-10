/**
 * GET  /api/history/[id]  – Mengambil satu item riwayat lengkap (termasuk schema) berdasarkan ID.
 * PATCH /api/history/[id] – Menyimpan editedHtml hasil pengeditan oleh user.
 */

import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/server/db.js';
import { ObjectId } from 'mongodb';

const COLLECTIONS = ['modul_ajar', 'lkpd', 'soal'];

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

	for (const name of COLLECTIONS) {
		const col = await getCollection(name);
		const doc = await col.findOne({ _id: objectId, userId });
		if (doc) {
			return json({
				success: true,
				data: {
					_id: doc._id.toString(),
					tipe: name,
					judul: doc.judul || '-',
					mapel: doc.mapel || null,
					kelas: doc.kelas || null,
					jenjang: doc.jenjang || null,
					metode: doc.metode || null,
					modePembelajaran: doc.modePembelajaran || null,
					jumlahPertemuan: doc.jumlahPertemuan || null,
					alokasiPerPertemuan: doc.alokasiPerPertemuan || null,
					templateId: doc.templateId || (name === 'lkpd' ? 'lkpd-standar' : 'modul-ajar-standar'),
					semester: doc.semester || null,
					jenisKegiatan: doc.jenisKegiatan || null,
					alokasiWaktu: doc.alokasiWaktu || null,
					jenisSoal: doc.jenisSoal || null,
					jumlahSoal: doc.jumlahSoal || null,
					tingkat: doc.tingkat || null,
					levelBloom: doc.levelBloom || null,
					schema: doc.schema || null,
					editedHtml: doc.editedHtml || null,
					templateSections: doc.templateSections || null,
					createdAt: doc.createdAt
				}
			});
		}
	}

	return json({ error: 'Data tidak ditemukan' }, { status: 404 });
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

	for (const name of COLLECTIONS) {
		const col = await getCollection(name);
		const result = await col.updateOne(
			{ _id: objectId, userId },
			{ $set: { editedHtml, editedAt: new Date() } }
		);
		if (result.matchedCount > 0) {
			return json({ success: true });
		}
	}

	return json({ error: 'Data tidak ditemukan' }, { status: 404 });
}
