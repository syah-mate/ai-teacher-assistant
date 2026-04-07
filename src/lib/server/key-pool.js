/**
 * Key Pool Manager - Gemini API Key Rotation System
 * 
 * Mengelola rotasi multiple API keys untuk mengatasi rate limit Google Gemini API.
 * Free tier: 15 RPM per key. Dengan multiple keys, kapasitas meningkat secara linear.
 * 
 * Features:
 * - Round-robin key rotation
 * - Automatic cooldown management (65 detik setelah 429)
 * - Per-key RPM tracking dengan sliding window
 * - Statistik dan monitoring
 */

import { env } from '$env/dynamic/private';

// Konstanta sistem
const COOLDOWN_MS = 65_000; // 65 detik cooldown setelah rate limit 429
const RPM_PER_KEY = 15; // Free tier limit per key
const WINDOW_DURATION_MS = 60_000; // 1 menit window untuk RPM tracking

/**
 * Key Pool Manager Class
 */
class KeyPool {
	constructor() {
		this.keys = [];
		this.currentIndex = 0;
		this._initializeKeys();
	}

	/**
	 * Initialize keys dari environment variables
	 * GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3, dst
	 */
	_initializeKeys() {
		const keyVars = [
			env.GEMINI_API_KEY,
			env.GEMINI_API_KEY_2,
			env.GEMINI_API_KEY_3,
			env.GEMINI_API_KEY_4,
			env.GEMINI_API_KEY_5
		];

		let keyId = 1;
		for (const key of keyVars) {
			if (key && key.trim()) {
				this.keys.push({
					id: `key_${keyId}`,
					key: key.trim(),
					requestsThisMinute: 0,
					windowStart: Date.now(),
					cooldownUntil: 0,
					totalRequests: 0,
					totalErrors: 0
				});
				keyId++;
			}
		}

		if (this.keys.length === 0) {
			throw new Error('No Gemini API keys configured. Set GEMINI_API_KEY in environment.');
		}

		console.log(`[KeyPool] Initialized with ${this.keys.length} API key(s)`);
	}

	/**
	 * Get available key menggunakan round-robin
	 * Returns null jika semua key penuh atau dalam cooldown
	 */
	getAvailableKey() {
		const now = Date.now();
		const startIndex = this.currentIndex;

		// Try each key in round-robin fashion
		for (let i = 0; i < this.keys.length; i++) {
			const keyObj = this.keys[this.currentIndex];

			// Move to next key for next call
			this.currentIndex = (this.currentIndex + 1) % this.keys.length;

			// Skip if in cooldown
			if (keyObj.cooldownUntil > now) {
				continue;
			}

			// Reset window jika sudah lewat 1 menit
			if (now - keyObj.windowStart >= WINDOW_DURATION_MS) {
				keyObj.requestsThisMinute = 0;
				keyObj.windowStart = now;
			}

			// Check RPM limit
			if (keyObj.requestsThisMinute < RPM_PER_KEY) {
				return keyObj;
			}
		}

		// Semua key penuh atau cooldown
		return null;
	}

	/**
	 * Mark key sebagai used (increment counter)
	 */
	markUsed(keyObj) {
		keyObj.requestsThisMinute++;
		keyObj.totalRequests++;
	}

	/**
	 * Mark key sebagai rate limited (masuk cooldown 65 detik)
	 */
	markRateLimited(keyObj) {
		const now = Date.now();
		keyObj.cooldownUntil = now + COOLDOWN_MS;
		keyObj.totalErrors++;
		console.log(
			`[KeyPool] ${keyObj.id} rate limited. Cooldown until ${new Date(keyObj.cooldownUntil).toLocaleTimeString()}`
		);
	}

	/**
	 * Mark key error (increment error counter, tapi tidak cooldown)
	 */
	markError(keyObj) {
		keyObj.totalErrors++;
	}

	/**
	 * Get estimasi wait time dalam detik
	 * Returns 0 jika ada key available
	 */
	getWaitTimeSeconds() {
		const now = Date.now();
		let minWaitMs = Infinity;

		for (const keyObj of this.keys) {
			// Jika ada key available, return 0
			if (keyObj.cooldownUntil <= now && keyObj.requestsThisMinute < RPM_PER_KEY) {
				return 0;
			}

			// Hitung wait time untuk key ini
			let waitMs;
			if (keyObj.cooldownUntil > now) {
				// Tunggu cooldown berakhir
				waitMs = keyObj.cooldownUntil - now;
			} else {
				// Tunggu window reset
				const windowEndMs = keyObj.windowStart + WINDOW_DURATION_MS;
				waitMs = windowEndMs - now;
			}

			minWaitMs = Math.min(minWaitMs, waitMs);
		}

		return minWaitMs === Infinity ? 60 : Math.ceil(minWaitMs / 1000);
	}

	/**
	 * Get status semua keys untuk monitoring
	 */
	getStatus() {
		const now = Date.now();
		const totalCapacityRPM = this.keys.length * RPM_PER_KEY;
		let availableKeys = 0;

		const keyStatus = this.keys.map((keyObj) => {
			let status;
			if (keyObj.cooldownUntil > now) {
				const cooldownSecs = Math.ceil((keyObj.cooldownUntil - now) / 1000);
				status = `cooldown_${cooldownSecs}s`;
			} else if (keyObj.requestsThisMinute >= RPM_PER_KEY) {
				status = 'full';
			} else {
				status = 'available';
				availableKeys++;
			}

			return {
				id: keyObj.id,
				status,
				requestsThisMinute: keyObj.requestsThisMinute,
				totalRequests: keyObj.totalRequests,
				totalErrors: keyObj.totalErrors
			};
		});

		return {
			available: availableKeys > 0,
			availableKeys,
			totalKeys: this.keys.length,
			totalCapacityRPM,
			keys: keyStatus
		};
	}

	/**
	 * Get total number of keys
	 */
	getTotalKeys() {
		return this.keys.length;
	}
}

// Singleton instance
export const keyPool = new KeyPool();
