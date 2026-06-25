/**
 * job-runner.js — Background Job Runner
 *
 * Menjalankan proses generate di sisi server sebagai background job,
 * terlepas dari koneksi browser user. Menggunakan sistem flexible template.
 *
 * Cara kerja:
 * 1. startJob(jobId) dipanggil setelah job dibuat di MongoDB
 * 2. Job runner mengambil data job dari DB, menjalankan FlexOrchestrator server-side
 * 3. Progress disimpan ke MongoDB secara berkala
 * 4. Hasil disimpan ke koleksi `generated_docs` lalu status job → 'completed'
 * 5. Jika error → status job → 'failed'
 *
 * Untuk isolasi per-job (agar concurrent jobs tidak bentrok):
 * - Menggunakan AsyncLocalStorage agar setiap job punya AI client sendiri
 * - AI client dikunci ke model & thinkingEffort yang dipilih user saat submit
 *
 * Recovery saat server restart:
 * - recoverStaleJobs() mencari job dengan status 'running'/'queued' dan mengulang prosesnya
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { getCollection } from '$lib/server/db.js';
import { ObjectId } from 'mongodb';
import { createServerAIClient } from '$lib/server/ai-client-server.js';
import { DEFAULT_MODEL, DEFAULT_IMAGE_MODEL } from '$lib/server/model-config.js';

// ---------- AsyncLocalStorage Setup ----------
const jobStorage = new AsyncLocalStorage();

// Always reassign globals to the current module's jobStorage.
// This handles hot-reload in dev.
globalThis.__getJobAIClient = () => jobStorage.getStore()?.aiClient ?? null;
globalThis.__getJobDBWriter = () => jobStorage.getStore()?.dbWriter ?? null;
globalThis.__getJobQuotaFns = () => jobStorage.getStore()?.quotaFns ?? null;
globalThis.__isJobServerContext = () => jobStorage.getStore() != null;

// Set in-process tracker agar tidak start job yang sama dua kali
const activeJobs = new Set();

// ---------- Public API ----------

/**
 * Mulai memproses satu job di background (fire & forget).
 */
export function startJob(jobId) {
	if (activeJobs.has(jobId)) return;
	activeJobs.add(jobId);

	// Fire-and-forget — tidak di-await sengaja
	runJob(jobId).finally(() => activeJobs.delete(jobId));
}

/**
 * Cari semua job yang berstatus 'queued' atau 'running' lalu restart.
 */
export async function recoverStaleJobs() {
	try {
		const col = await getCollection('jobs');
		const stale = await col
			.find({ status: { $in: ['queued', 'running'] } })
			.project({ _id: 1 })
			.toArray();

		for (const doc of stale) {
			const id = doc._id.toString();
			console.log(`[JobRunner] Recovering stale job: ${id}`);
			startJob(id);
		}
	} catch (err) {
		console.error('[JobRunner] recoverStaleJobs error:', err);
	}
}

// ---------- Internal ----------

/**
 * Ambil AI config dari MongoDB app_config.
 * Fallback ke default jika belum pernah dikonfigurasi.
 */
async function getAIConfig() {
  try {
    const col = await getCollection('app_config');
    const config = await col.findOne({ _id: 'ai_model_config' });
    return {
      textModel: config?.textModel || DEFAULT_MODEL,
      thinkingEffort: config?.thinkingEffort || 'medium',
      imageModel: config?.imageModel || DEFAULT_IMAGE_MODEL
    };
  } catch (err) {
    console.warn('[JobRunner] Gagal baca AI config, pakai default:', err.message);
    return {
      textModel: DEFAULT_MODEL,
      thinkingEffort: 'medium',
      imageModel: DEFAULT_IMAGE_MODEL
    };
  }
}

async function runJob(jobId) {
	const col = await getCollection('jobs');
	let job;

	try {
		job = await col.findOne({ _id: new ObjectId(jobId) });
		if (!job) {
			console.error(`[JobRunner] Job tidak ditemukan: ${jobId}`);
			return;
		}

		// Tandai sebagai running
		await col.updateOne(
			{ _id: new ObjectId(jobId) },
			{
				$set: {
					status: 'running',
					startedAt: new Date(),
					progress: { step: 0, total: 10, message: 'Memulai proses generate...' },
					log: [{ timestamp: new Date(), message: '🚀 Memulai proses generate...', type: 'info' }]
				}
			}
		);

		// Baca config AI dari DB (bukan dari job — sudah dipusatkan di app_config)
		const aiConfig = await getAIConfig();
		console.log(`[JobRunner] Job ${jobId} menggunakan model: ${aiConfig.textModel}, thinking: ${aiConfig.thinkingEffort}`);
		const aiClient = createServerAIClient(aiConfig.textModel, aiConfig.thinkingEffort);

		// DB writer server-side langsung ke MongoDB
		const dbWriter = makeDirectDBWriter(job.userId);

		// Quota functions server-side
		const quotaFns = makeQuotaFns(job.userId);

		// Jalankan orchestrator di dalam async context job ini
		await jobStorage.run({ aiClient, dbWriter, quotaFns }, async () => {
			const { Orchestrator } = await import('$lib/agents/orchestrator.js');
			const orchestrator = new Orchestrator();
			let lastProgressStep = 0;

			const result = await orchestrator.generate(
				job.templateId,
				job.userContext,
				async (progressData) => {
					try {
						const step = resolveProgressStep(progressData, lastProgressStep);
						lastProgressStep = Math.max(lastProgressStep, step);

						const logEntry = {
							timestamp: new Date(),
							message: progressData.message || '',
							type: progressData.type || 'info'
						};

						await col.updateOne(
							{ _id: new ObjectId(jobId) },
							{
								$set: {
									progress: {
										step: lastProgressStep,
										total: 10,
										message: progressData.message || '',
										phase: progressData.name || ''
									}
								},
								$push: { log: logEntry }
							}
						);
					} catch {
						// Jangan sampai gagal update progress menghentikan generate
					}
				}
			);

			if (result.success) {
				// Simpan hasil ke collection generated_docs
				const resultId = await saveFlexResult(jobId, job.userId, job.templateId, job.userContext, result);

				await col.updateOne(
					{ _id: new ObjectId(jobId) },
					{
						$set: {
							status: 'completed',
							completedAt: new Date(),
							resultId,
							progress: { step: 10, total: 10, message: 'Selesai ✓' }
						},
						$push: { log: { timestamp: new Date(), message: '✅ Generate selesai — hasil disimpan', type: 'success' } }
					}
				);
			} else {
				await col.updateOne(
					{ _id: new ObjectId(jobId) },
					{
						$set: {
							status: 'failed',
							completedAt: new Date(),
							error: result.error || 'Generate gagal',
							progress: { step: 0, total: 10, message: '❌ ' + (result.error || 'Generate gagal') }
						},
						$push: { log: { timestamp: new Date(), message: '❌ ' + (result.error || 'Generate gagal'), type: 'error' } }
					}
				);
			}
		});
	} catch (err) {
		console.error(`[JobRunner] Job ${jobId} error:`, err);
		try {
			await col.updateOne(
				{ _id: new ObjectId(jobId) },
				{
					$set: {
						status: 'failed',
						completedAt: new Date(),
						error: err.message || 'Kesalahan tidak terduga',
						progress: { message: '❌ ' + (err.message || 'Kesalahan tidak terduga') }
					},
					$push: { log: { timestamp: new Date(), message: '❌ ' + (err.message || 'Kesalahan tidak terduga'), type: 'error' } }
				}
			);
		} catch {
			// ignore
		}
	}
}

/**
 * Map setiap progress event ke step numerik (0–10).
 * Hanya mengenali event type baru: orchestrator, section, field
 */
function resolveProgressStep(progressData, lastStep = 0) {
	if (Number.isFinite(progressData?.step)) {
		return progressData.step;
	}

	const { type, action } = progressData;
	const INC = 0.5;

	// ── Orchestrator events ─────────────────────────────────
	if (type === 'orchestrator') {
		if (action === 'start') return Math.max(lastStep, 1);
		if (action === 'refining_prompts') return Math.max(lastStep, lastStep + INC);
		if (action === 'rendering') return Math.max(lastStep, 9);
		if (action === 'done') return 10;
		return Math.max(lastStep, lastStep + INC);
	}

	// ── Section events ──────────────────────────────────────
	if (type === 'section') {
		if (action === 'start') return Math.max(lastStep, 2);
		if (action === 'done') return Math.max(lastStep, 8);
		return Math.max(lastStep, lastStep + INC);
	}

	// ── Field events ────────────────────────────────────────
	if (type === 'field') {
		if (action === 'done') return Math.max(lastStep, lastStep + INC);
		if (action === 'error') return lastStep;
		return Math.max(lastStep, lastStep + INC);
	}

	// ── Fallback ────────────────────────────────────────────
	return Math.min(9.7, lastStep + INC);
}

/**
 * Simpan hasil FlexOrchestrator ke collection `generated_docs`.
 */
async function saveFlexResult(jobId, userId, templateId, userContext, result) {
	const col = await getCollection('generated_docs');

	// Idempotensi per job
	const existing = await col.findOne({ sourceJobId: jobId }, { projection: { _id: 1 } });
	if (existing?._id) {
		return existing._id.toString();
	}

	const doc = {
		userId,
		templateId,
		templateName: result.templateName || 'Unknown',
		userContext,
		result: {
			sections: result.sections || [],
			htmlOutput: result.htmlOutput || ''
		},
		sourceJobId: jobId,
		createdAt: new Date()
	};

	try {
		const r = await col.insertOne(doc);
		return r.insertedId.toString();
	} catch (err) {
		if (err?.code === 11000) {
			const winner = await col.findOne({ sourceJobId: jobId }, { projection: { _id: 1 } });
			if (winner?._id) return winner._id.toString();
		}
		throw err;
	}
}

/**
 * DB writer yang menulis langsung ke MongoDB.
 */
function makeDirectDBWriter(userId) {
	return async function writeDBDirect(collection, data) {
		try {
			const col = await getCollection(collection);
			const result = await col.insertOne({
				...data,
				userId,
				createdAt: new Date()
			});
			return { success: true, id: result.insertedId.toString() };
		} catch (err) {
			return { success: false, error: err.message };
		}
	};
}

/**
 * Quota functions server-side untuk background job context.
 * Kuota sudah di-reserve secara atomic di POST /api/generate-async.
 */
function makeQuotaFns(userId) {
	async function checkQuota() {
		return { ok: true };
	}

	async function consumeQuota() {
		// no-op — quota sudah dikurangi sebelum job dibuat
	}

	return { checkQuota, consumeQuota };
}
