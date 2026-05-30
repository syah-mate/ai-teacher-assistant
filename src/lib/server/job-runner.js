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
globalThis.__getJobRateLimitFns = () => jobStorage.getStore()?.rateLimitFns ?? null;
// Skip DOCX generation in server-side jobs — schema is saved directly to MongoDB;
// DOCX is generated on-demand from the export endpoints when user downloads.
globalThis.__isJobServerContext = () => jobStorage.getStore() != null;

// Set in-process tracker agar tidak start job yang sama dua kali
const activeJobs = new Set();

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

		// Rate limit functions server-side
		const rateLimitFns = makeRateLimitFns(job.userId);

		// Jalankan orchestrator di dalam async context job ini
		await jobStorage.run({ aiClient, dbWriter, rateLimitFns }, async () => {
			const { Orchestrator } = await import('$lib/agents/orchestrator.js');
			const orchestrator = new Orchestrator();

			const result = await orchestrator.generate(job.userInput, async (progressData) => {
				// Update progress di MongoDB (throttled — tiap perubahan message)
				try {
					await col.updateOne(
						{ _id: new ObjectId(jobId) },
						{
							$set: {
								progress: {
									step: progressData.step ?? 0,
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
				const resultId = await saveResult(job.userInput, result);

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

/**
 * Simpan schema hasil ke koleksi yang sesuai dan kembalikan ID-nya.
 */
async function saveResult(userInput, result) {
	const tipe = userInput.jenis; // modul_ajar | lkpd | soal
	const col = await getCollection(tipe);

	const baseData = {
		userId: userInput.userId,
		judul: userInput.judul,
		mapel: userInput.mapel,
		kelas: userInput.kelas,
		jenjang: userInput.jenjang,
		schema: result.schema,
		createdAt: new Date()
	};

	// Field spesifik per tipe
	if (tipe === 'modul_ajar') {
		Object.assign(baseData, {
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

	const r = await col.insertOne(baseData);
	return r.insertedId.toString();
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
 * Rate limit functions server-side (tanpa melalui /api/generate-session/start|complete).
 * Orchestrator menggunakan ini saat berjalan di background job context.
 */
function makeRateLimitFns(userId) {
	const USER_RATE_LIMIT = 2;
	const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

	async function checkStart() {
		try {
			const col = await getCollection('rate_limits');
			const record = await col.findOne({ userId, type: 'generate' });
			const now = Date.now();

			if (!record) return { ok: true };

			const windowExpired = now - record.windowStart.getTime() > RATE_LIMIT_WINDOW_MS;
			if (windowExpired) return { ok: true };

			if (record.count >= USER_RATE_LIMIT) {
				const resetIn = Math.ceil((record.windowStart.getTime() + RATE_LIMIT_WINDOW_MS - now) / 1000);
				return { ok: false, error: `Rate limit: coba lagi dalam ${Math.ceil(resetIn / 60)} menit.` };
			}

			return { ok: true };
		} catch {
			return { ok: true }; // Gagal cek = izinkan saja
		}
	}

	async function completeSession() {
		try {
			const col = await getCollection('rate_limits');
			const now = new Date();
			const record = await col.findOne({ userId, type: 'generate' });

			if (!record || Date.now() - record.windowStart.getTime() > RATE_LIMIT_WINDOW_MS) {
				await col.updateOne(
					{ userId, type: 'generate' },
					{ $set: { count: 1, windowStart: now } },
					{ upsert: true }
				);
			} else {
				await col.updateOne({ userId, type: 'generate' }, { $inc: { count: 1 } });
			}
		} catch {
			// ignore
		}
	}

	return { checkStart, completeSession };
}
