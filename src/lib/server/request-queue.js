/**
 * Request Queue System - Gemini API
 * 
 * Mengelola antrian request ketika semua API keys penuh.
 * Worker background akan memproses antrian ketika ada key tersedia.
 * 
 * Features:
 * - Promise-based enqueueing (HTTP connection tetap open)
 * - Fairness: max 3 item per user di antrian
 * - Auto timeout 60 detik untuk item di antrian
 * - Worker polling setiap 500ms
 */

import { keyPool } from './key-pool.js';
import { env } from '$env/dynamic/private';

// Konstanta
const MAX_QUEUE_SIZE = 50; // Maks total antrian
const MAX_PER_USER_IN_QUEUE = 3; // Fairness: maks per user
const WORKER_INTERVAL_MS = 500; // Poll setiap 500ms
const REQUEST_TIMEOUT_MS = 60_000; // Timeout item di antrian (60 detik)

/**
 * Request Queue Manager Class
 */
class RequestQueue {
	constructor() {
		this.queue = [];
		this.workerRunning = false;
		this._startWorker();
	}

	/**
	 * Enqueue request dan return Promise yang akan resolve ketika diproses
	 * 
	 * @param {string} userId - User ID untuk fairness tracking
	 * @param {string} prompt - Prompt untuk Gemini
	 * @param {string} model - Model Gemini
	 * @returns {Promise<{text: string, model: string, usage: object}>}
	 */
	enqueue(userId, prompt, model) {
		return new Promise((resolve, reject) => {
			// Check user limit
			const userItemsInQueue = this.queue.filter((item) => item.userId === userId).length;
			if (userItemsInQueue >= MAX_PER_USER_IN_QUEUE) {
				reject({
					code: 'QUEUE_USER_FULL',
					message: `Anda sudah memiliki ${MAX_PER_USER_IN_QUEUE} permintaan dalam antrian. Tunggu sebentar sebelum generate lagi.`,
					status: 429
				});
				return;
			}

			// Check total queue size
			if (this.queue.length >= MAX_QUEUE_SIZE) {
				const estimatedWaitSeconds = keyPool.getWaitTimeSeconds();
				reject({
					code: 'QUEUE_FULL',
					message: `Server sedang sangat sibuk. Silakan coba lagi dalam ${estimatedWaitSeconds} detik.`,
					estimatedWaitSeconds,
					queueSize: this.queue.length,
					status: 503
				});
				return;
			}

			// Add to queue
			const item = {
				id: crypto.randomUUID(),
				userId,
				prompt,
				model,
				resolve,
				reject,
				enqueuedAt: Date.now()
			};

			this.queue.push(item);
			console.log(
				`[RequestQueue] Enqueued request for user ${userId}. Queue size: ${this.queue.length}`
			);
		});
	}

	/**
	 * Worker loop - dijalankan setiap WORKER_INTERVAL_MS
	 */
	async _processQueue() {
		// Jika queue kosong, skip
		if (this.queue.length === 0) {
			return;
		}

		// Get available key
		const keyObj = keyPool.getAvailableKey();
		if (!keyObj) {
			// Tidak ada key available, tunggu interval berikutnya
			return;
		}

		// Ambil item pertama dari queue
		const item = this.queue.shift();
		const now = Date.now();

		// Check timeout
		const waitTimeMs = now - item.enqueuedAt;
		if (waitTimeMs > REQUEST_TIMEOUT_MS) {
			console.log(`[RequestQueue] Request ${item.id} timeout after ${waitTimeMs}ms`);
			item.reject({
				code: 'QUEUE_TIMEOUT',
				message: 'Permintaan timeout. Server terlalu sibuk, silakan coba lagi.',
				status: 504
			});
			return;
		}

		// Process request
		console.log(
			`[RequestQueue] Processing request ${item.id} for user ${item.userId} (waited ${Math.round(waitTimeMs / 1000)}s)`
		);

		try {
			// Mark key as used
			keyPool.markUsed(keyObj);

			// Call Gemini API
			const result = await this._callGemini(keyObj.key, item.prompt, item.model);

			// Resolve promise
			item.resolve(result);
		} catch (error) {
			// Handle error
			if (error.status === 429) {
				// Rate limit - mark key dan kembalikan item ke depan antrian
				keyPool.markRateLimited(keyObj);
				this.queue.unshift(item); // Kembalikan ke depan antrian
				console.log(`[RequestQueue] Rate limited on ${keyObj.id}, item returned to queue`);
			} else {
				// Error lain - reject item (tidak dikembalikan ke queue)
				keyPool.markError(keyObj);
				item.reject({
					code: 'GEMINI_ERROR',
					message: error.message || 'Terjadi kesalahan saat memproses permintaan.',
					status: error.status || 500
				});
			}
		}
	}

	/**
	 * Internal: Call Gemini API
	 */
	async _callGemini(apiKey, prompt, model) {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 detik timeout per request

		try {
			const response = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						contents: [{ parts: [{ text: prompt }] }]
					}),
					signal: controller.signal
				}
			);

			clearTimeout(timeoutId);

			if (!response.ok) {
				const error = await response.json().catch(() => ({}));

				if (response.status === 429) {
					throw { status: 429, message: 'Rate limit exceeded' };
				}

				throw {
					status: response.status,
					message: error.error?.message || 'Gemini API error'
				};
			}

			const data = await response.json();

			// Extract text dari response
			const text =
				data.candidates?.[0]?.content?.parts?.[0]?.text || data.text || 'No response generated';

			return {
				text,
				model,
				usage: data.usageMetadata || null
			};
		} catch (error) {
			clearTimeout(timeoutId);
			throw error;
		}
	}

	/**
	 * Start background worker
	 */
	_startWorker() {
		if (this.workerRunning) {
			return;
		}

		this.workerRunning = true;
		console.log(`[RequestQueue] Worker started with ${WORKER_INTERVAL_MS}ms interval`);

		setInterval(() => {
			this._processQueue().catch((error) => {
				console.error('[RequestQueue] Worker error:', error);
			});
		}, WORKER_INTERVAL_MS);
	}

	/**
	 * Get queue size
	 */
	getSize() {
		return this.queue.length;
	}

	/**
	 * Get position of user's oldest item in queue
	 */
	getPosition(userId) {
		const index = this.queue.findIndex((item) => item.userId === userId);
		return index === -1 ? null : index + 1; // 1-indexed position
	}

	/**
	 * Get queue status for monitoring
	 */
	getStatus() {
		const now = Date.now();
		return {
			size: this.queue.length,
			maxSize: MAX_QUEUE_SIZE,
			items: this.queue.map((item) => ({
				id: item.id,
				userId: item.userId,
				waitTimeSeconds: Math.round((now - item.enqueuedAt) / 1000),
				enqueuedAt: new Date(item.enqueuedAt).toISOString()
			}))
		};
	}
}

// Singleton instance
export const requestQueue = new RequestQueue();
