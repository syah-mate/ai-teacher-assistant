/**
 * GET /api/jobs/[id]
 *
 * Polling endpoint untuk status background generation job.
 *
 * Response:
 * {
 *   status: 'queued' | 'running' | 'completed' | 'failed',
 *   progress: { step, total, message, phase },
 *   resultId?: string,       -- saat completed
 *   resultTipe?: string,     -- saat completed: modul_ajar | lkpd | soal
 *   error?: string           -- saat failed
 * }
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

	const userId = locals.user.id || locals.user._id?.toString();

	try {
		const col = await getCollection('jobs');
		const job = await col.findOne(
			{ _id: objectId, userId },
			{
				projection: {
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
				}
			}
		);

		if (!job) {
			return json({ error: 'Job tidak ditemukan' }, { status: 404 });
		}

		return json({
			success: true,
			status: job.status,
			progress: job.progress || {},
			log: job.log || [],
			resultId: job.resultId || null,
			resultTipe: job.resultTipe || null,
			error: job.error || null,
			createdAt: job.createdAt,
			startedAt: job.startedAt || null,
			completedAt: job.completedAt || null,
			userInput: {
				jenis: job.userInput?.jenis,
				judul: job.userInput?.judul,
				mapel: job.userInput?.mapel,
				kelas: job.userInput?.kelas
			}
		});
	} catch (err) {
		console.error('[jobs/[id]] Error:', err);
		return json({ error: 'Gagal mengambil status job' }, { status: 500 });
	}
}
