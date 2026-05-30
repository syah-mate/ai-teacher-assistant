/**
 * GET /api/history
 * Mengambil riwayat generate user dari semua koleksi (modul_ajar, lkpd, soal).
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
	const tipeFilter = url.searchParams.get('tipe'); // modul_ajar | lkpd | soal | null (semua)

	try {
		const collections = [
			{ name: 'modul_ajar', tipe: 'modul_ajar', label: 'Modul Ajar / RPP' },
			{ name: 'lkpd', tipe: 'lkpd', label: 'LKPD' },
			{ name: 'soal', tipe: 'soal', label: 'Soal' }
		];

		const filtered = tipeFilter
			? collections.filter((c) => c.tipe === tipeFilter)
			: collections;

		const promises = filtered.map(async ({ name, tipe, label }) => {
			const col = await getCollection(name);
			const docs = await col
				.find({ userId }, { projection: { schema: 0 } })
				.sort({ createdAt: -1 })
				.limit(limit)
				.toArray();

			return docs.map((doc) => ({
				_id: doc._id.toString(),
				tipe,
				label,
				judul: doc.judul || '-',
				mapel: doc.mapel || null,
				kelas: doc.kelas || null,
				jenjang: doc.jenjang || null,
				// modul_ajar
				metode: doc.metode || null,
				modePembelajaran: doc.modePembelajaran || null,
				jumlahPertemuan: doc.jumlahPertemuan || null,
				alokasiPerPertemuan: doc.alokasiPerPertemuan || null,
				// lkpd
				semester: doc.semester || null,
				jenisKegiatan: doc.jenisKegiatan || null,
				alokasiWaktu: doc.alokasiWaktu || null,
				// soal
				jenisSoal: doc.jenisSoal || null,
				jumlahSoal: doc.jumlahSoal || null,
				tingkat: doc.tingkat || null,
				levelBloom: doc.levelBloom || null,
				createdAt: doc.createdAt
			}));
		});

		const results = await Promise.all(promises);
		const merged = results
			.flat()
			.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
			.slice(0, limit);

		return json({ success: true, data: merged });
	} catch (error) {
		console.error('[history] Error:', error);
		return json({ success: false, error: 'Gagal mengambil riwayat' }, { status: 500 });
	}
}
