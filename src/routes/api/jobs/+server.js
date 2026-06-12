/**
 * GET /api/jobs
 * Mengambil daftar background generation jobs milik user.
 * Digunakan di halaman Riwayat untuk menampilkan job yang sedang berjalan.
 *
 * Query params:
 *   status: queued|running|completed|failed|active (active = queued+running)
 *   limit: max 20 (default: 10)
 */

import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/server/db.js';

export async function GET({ locals, url }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = locals.user.id || locals.user._id?.toString();
	const rawStatus = url.searchParams.get('status') || 'active';
	const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 20);

	let statusFilter;
	if (rawStatus === 'active') {
		statusFilter = { $in: ['queued', 'running'] };
	} else {
		statusFilter = rawStatus;
	}

	try {
		const col = await getCollection('jobs');
		const jobs = await col
			.find({ userId, status: statusFilter })
			.sort({ createdAt: -1 })
			.limit(limit)
			.project({
				status: 1,
				progress: 1,
				log: 1,
				resultId: 1,
				resultTipe: 1,
				error: 1,
				createdAt: 1,
				startedAt: 1,
				completedAt: 1,
				'userInput.jenis': 1,
				'userInput.judul': 1,
				'userInput.mapel': 1,
				'userInput.kelas': 1
			})
			.toArray();

		return json({
			success: true,
			data: jobs.map((j) => ({
				_id: j._id.toString(),
				status: j.status,
				progress: j.progress || {},
				log: j.log || [],
				resultId: j.resultId || null,
				resultTipe: j.resultTipe || null,
				error: j.error || null,
				createdAt: j.createdAt,
				startedAt: j.startedAt || null,
				completedAt: j.completedAt || null,
				jenis: j.userInput?.jenis,
				judul: j.userInput?.judul,
				mapel: j.userInput?.mapel,
				kelas: j.userInput?.kelas
			}))
		});
	} catch (err) {
		console.error('[jobs] Error:', err);
		return json({ error: 'Gagal mengambil daftar job' }, { status: 500 });
	}
}
