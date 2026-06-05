/**
 * job-runner.js — Background Job Runner
 *
 * Menjalankan proses generate (modul ajar, LKPD, soal) di sisi server
 * sebagai background job, terlepas dari koneksi browser user.
 *
 * Cara kerja:
 * 1. startJob(jobId) dipanggil setelah job dibuat di MongoDB
 * 2. Job runner mengambil data job dari DB, menjalankan orchestrator server-side
 * 3. Progress disimpan ke MongoDB secara berkala
 * 4. Hasil (schema) disimpan ke koleksi modul_ajar/lkpd/soal lalu status job → 'completed'
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

// ---------- AsyncLocalStorage Setup ----------
// Menyimpan context per-job (AI client, DB writer) secara aman di async tree
const jobStorage = new AsyncLocalStorage();

// Pasang resolver global — dibaca oleh gemini-client.js & write-db.tool.js
// tanpa perlu import server-only module dari sana
// Always reassign globals to the current module's jobStorage.
// This handles hot-reload in dev: each module evaluation creates a new jobStorage,
// so the globals must always point to the latest instance.
globalThis.__getJobAIClient = () => jobStorage.getStore()?.aiClient ?? null;
globalThis.__getJobDBWriter = () => jobStorage.getStore()?.dbWriter ?? null;
globalThis.__getJobQuotaFns = () => jobStorage.getStore()?.quotaFns ?? null;
// Skip DOCX generation in server-side jobs — schema is saved directly to MongoDB;
// DOCX is generated on-demand from the export endpoints when user downloads.
globalThis.__isJobServerContext = () => jobStorage.getStore() != null;

// Set in-process tracker agar tidak start job yang sama dua kali
const activeJobs = new Set();
let ensureResultIndexesPromise = null;

// ---------- Public API ----------

/**
 * Mulai memproses satu job di background (fire & forget).
 * Aman dipanggil berkali-kali dengan jobId yang sama — job ke-2 dst diabaikan.
 *
 * @param {string} jobId - MongoDB ObjectId string dari koleksi 'jobs'
 */
export function startJob(jobId) {
	if (activeJobs.has(jobId)) return;
	activeJobs.add(jobId);

	// Fire-and-forget — tidak di-await sengaja
	runJob(jobId).finally(() => activeJobs.delete(jobId));
}

/**
 * Cari semua job yang berstatus 'queued' atau 'running' (bisa terjadi jika
 * server restart di tengah proses) lalu restart.
 * Dipanggil sekali saat server boot dari hooks.server.js.
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
			{ $set: { status: 'running', startedAt: new Date(), progress: { step: 0, total: 6, message: 'Memulai proses generate...' } } }
		);

		// Buat AI client dikunci ke pilihan model user
		const aiClient = createServerAIClient(job.model, job.thinkingEffort);

		// DB writer server-side langsung ke MongoDB
		const dbWriter = makeDirectDBWriter(job.userId);

		// Quota functions server-side
		const quotaFns = makeQuotaFns(job.userId);

		// Jalankan orchestrator di dalam async context job ini
		await jobStorage.run({ aiClient, dbWriter, quotaFns }, async () => {
			const { Orchestrator } = await import('$lib/agents/orchestrator.js');
			const orchestrator = new Orchestrator();
			let lastProgressStep = 0;

			const result = await orchestrator.generate(job.userInput, async (progressData) => {
				// Update progress di MongoDB (throttled — tiap perubahan message)
				try {
					const step = resolveProgressStep(progressData, lastProgressStep);
					lastProgressStep = Math.max(lastProgressStep, step);

					await col.updateOne(
						{ _id: new ObjectId(jobId) },
						{
							$set: {
								progress: {
									step: lastProgressStep,
									total: 6,
									message: progressData.message || '',
									phase: progressData.name || ''
								}
							}
						}
					);
				} catch {
					// Jangan sampai gagal update progress menghentikan generate
				}
			});

			if (result.success) {
				// Simpan hasil ke koleksi tipe (modul_ajar / lkpd / soal)
				const resultId = await saveResult(jobId, job.userInput, result);

				await col.updateOne(
					{ _id: new ObjectId(jobId) },
					{
						$set: {
							status: 'completed',
							completedAt: new Date(),
							resultId,
							resultTipe: job.userInput.jenis,
							progress: { step: 6, total: 6, message: 'Selesai ✓' }
						}
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
							progress: { step: 0, total: 6, message: '❌ ' + (result.error || 'Generate gagal') }
						}
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
					}
				}
			);
		} catch {
			// ignore
		}
	}
}

function resolveProgressStep(progressData, lastStep = 0) {
	if (Number.isFinite(progressData?.step)) {
		return progressData.step;
	}

	if (progressData?.type === 'orchestrator') {
		return 1;
	}

	if (progressData?.action === 'start' || progressData?.action === 'info') {
		return Math.max(lastStep, 1);
	}

	if (progressData?.action === 'batch_start') {
		return Math.max(lastStep, Math.min((progressData.batch ?? 1) + 1, 4));
	}

	if (progressData?.action === 'batch_done') {
		return Math.max(lastStep, Math.min((progressData.batch ?? 1) + 2, 5));
	}

	if (progressData?.type === 'sub-agent' && progressData?.action === 'done') {
		return Math.max(lastStep, 3);
	}

	if (progressData?.type === 'tool') {
		return Math.max(lastStep, 5);
	}

	if (progressData?.action === 'completed') {
		return 5;
	}

	return lastStep;
}

/**
 * Simpan schema hasil ke koleksi yang sesuai dan kembalikan ID-nya.
 */
async function saveResult(jobId, userInput, result) {
	const tipe = userInput.jenis; // modul_ajar | lkpd | soal
	await ensureResultIndexes();
	const col = await getCollection(tipe);

	// Idempotensi per job: satu job hanya boleh menghasilkan satu dokumen hasil.
	const existing = await col.findOne({ sourceJobId: jobId }, { projection: { _id: 1 } });
	if (existing?._id) {
		return existing._id.toString();
	}

	const baseData = {
		userId: userInput.userId,
		judul: userInput.judul,
		mapel: userInput.mapel,
		kelas: userInput.kelas,
		jenjang: userInput.jenjang,
		sourceJobId: jobId,
		schema: result.schema,
		createdAt: new Date()
	};

	// Field spesifik per tipe
	if (tipe === 'modul_ajar') {
		Object.assign(baseData, {
			templateId: userInput.templateId || 'modul-ajar-standar',
			metode: userInput.metode,
			modePembelajaran: userInput.modePembelajaran,
			jumlahPertemuan: userInput.jumlahPertemuan,
			alokasiPerPertemuan: userInput.alokasiPerPertemuan
		});
	} else if (tipe === 'lkpd') {
		Object.assign(baseData, {
			semester: userInput.semester,
			jenisKegiatan: userInput.jenisKegiatan,
			alokasiWaktu: userInput.alokasiWaktu
		});
	} else if (tipe === 'soal') {
		Object.assign(baseData, {
			jenisSoal: userInput.jenisSoal,
			jumlahSoal: userInput.jumlahSoal,
			tingkat: userInput.tingkat,
			levelBloom: userInput.levelBloom
		});
	}

	try {
		const r = await col.insertOne(baseData);
		return r.insertedId.toString();
	} catch (err) {
		// Jika race condition antar worker/hot-reload memicu insert bersamaan,
		// index unique sourceJobId menjaga agar hanya satu dokumen yang lolos.
		if (err?.code === 11000) {
			const winner = await col.findOne({ sourceJobId: jobId }, { projection: { _id: 1 } });
			if (winner?._id) return winner._id.toString();
		}
		throw err;
	}
}

async function ensureResultIndexes() {
	if (!ensureResultIndexesPromise) {
		ensureResultIndexesPromise = (async () => {
			const collections = ['modul_ajar', 'lkpd', 'soal'];
			for (const name of collections) {
				const col = await getCollection(name);
				await col.createIndex(
					{ sourceJobId: 1 },
					{
						name: 'sourceJobId_1',
						unique: true,
						partialFilterExpression: { sourceJobId: { $type: 'string' } }
					}
				);
			}
		})();
	}

	return ensureResultIndexesPromise;
}

/**
 * DB writer yang menulis langsung ke MongoDB (tanpa melalui /api/db-write).
 * Diinjeksikan ke globalThis.__getJobDBWriter() oleh write-db.tool.js.
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
 * Dipanggil oleh Orchestrator via globalThis.__getJobQuotaFns()
 *
 * @param {string} userId - MongoDB _id user sebagai string
 */
function makeQuotaFns(userId) {
	/**
	 * Kuota sudah di-reserve secara atomic di POST /api/generate-async.
	 * Fungsi ini dipertahankan agar kontrak orchestrator tetap sama.
	 */
	async function checkQuota() {
		return { ok: true };
	}

	/**
	 * Kuota sudah dikurangi sebelum job dimulai, jadi tidak ada aksi setelah selesai.
	 */
	async function consumeQuota() {
		// no-op
	}

	return { checkQuota, consumeQuota };
}
