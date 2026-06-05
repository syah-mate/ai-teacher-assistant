/**
 * POST /api/generate-async
 *
 * Endpoint untuk memulai generate (modul ajar, LKPD, soal) secara asynchronous.
 * Proses berjalan di background server — tidak bergantung pada koneksi browser.
 *
 * Request body:
 * {
 *   userInput: { jenis, judul, mapel, kelas, ... },
 *   model: "google/gemini-3.5-flash",
 *   thinkingEffort: "medium"
 * }
 *
 * Response: { jobId: string }
 * Client kemudian poll /api/jobs/[jobId] untuk status.
 */

import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/server/db.js';
import { startJob } from '$lib/server/job-runner.js';
import { ObjectId } from 'mongodb';

const ALLOWED_MODELS = [
	'google/gemini-3.5-flash',
	'x-ai/grok-4.3',
	'openai/gpt-5.5',
	'openai/gpt-5.4-nano'
];
const DEFAULT_MODEL = 'google/gemini-3.5-flash';
const ALLOWED_THINKING = new Set(['low', 'medium', 'high']);
const ALLOWED_JENIS = new Set(['modul_ajar', 'lkpd', 'soal']);

/**
 * Kurangi 1 kuota user secara atomic sebelum job dibuat.
 * Kondisi quota_remaining > 0 mencegah kuota turun di bawah 0 saat request paralel.
 */
async function reserveQuota(userId) {
	try {
		const col = await getCollection('users');
		const userIds = ObjectId.isValid(userId) ? [userId, new ObjectId(userId)] : [userId];
		const result = await col.findOneAndUpdate(
			{
				_id: { $in: userIds },
				quota_remaining: { $gt: 0 }
			},
			{
				$inc: { quota_remaining: -1 },
				$set: { quota_updated_at: new Date() }
			},
			{ returnDocument: 'after' }
		);

		if (!result) {
			return {
				ok: false,
				error: 'Kuota generate Anda sudah habis. Silakan upgrade Plan untuk mendapatkan kuota tambahan.'
			};
		}

		return { ok: true, remaining: result.quota_remaining };
	} catch (err) {
		console.error('[generate-async] reserveQuota error:', err);
		return { ok: false, error: 'Gagal memeriksa kuota. Silakan coba lagi.' };
	}
}

export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = locals.user.id || locals.user._id?.toString();
	if (!userId) {
		return json({ error: 'User ID tidak ditemukan' }, { status: 400 });
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Request body tidak valid' }, { status: 400 });
	}

	const { userInput, model: rawModel, thinkingEffort: rawEffort } = body;

	if (!userInput || !ALLOWED_JENIS.has(userInput.jenis)) {
		return json({ error: 'userInput.jenis tidak valid' }, { status: 400 });
	}

	if (!userInput.judul || !userInput.mapel) {
		return json({ error: 'judul dan mapel wajib diisi' }, { status: 400 });
	}

	const model = ALLOWED_MODELS.includes(rawModel) ? rawModel : DEFAULT_MODEL;
	const thinkingEffort = ALLOWED_THINKING.has(rawEffort) ? rawEffort : 'medium';

	// Sertakan userId di userInput agar agent bisa menggunakannya saat menyimpan data
	const enrichedInput = { ...userInput, userId };

	try {
		const quota = await reserveQuota(userId);
		if (!quota.ok) {
			return json({ error: quota.error }, { status: 402 });
		}

		const col = await getCollection('jobs');
		const result = await col.insertOne({
			userId,
			status: 'queued',
			userInput: enrichedInput,
			model,
			thinkingEffort,
			progress: { step: 0, total: 6, message: 'Antrian job...' },
			createdAt: new Date()
		});

		const jobId = result.insertedId.toString();

		// Mulai background job — fire & forget
		startJob(jobId);

		return json({ success: true, jobId });
	} catch (err) {
		console.error('[generate-async] Error:', err);
		return json({ error: 'Gagal membuat job' }, { status: 500 });
	}
}
