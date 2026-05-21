/**
 * OpenRouter API Manager
 *
 * Manages the single OpenRouter API key and provides a compatible interface
 * for the rest of the application.
 */

import { env } from '$env/dynamic/private';

class OpenRouterManager {
	constructor() {
		this._key = null;
		this._initialized = false;
	}

	_ensureInitialized() {
		if (this._initialized) return;
		this._initialized = true;
		const key = env.OPENROUTER_API_KEY;
		if (!key || !key.trim()) {
			throw new Error('OPENROUTER_API_KEY is not configured. Set it in your .env file.');
		}
		this._key = key.trim();
		console.log('[OpenRouter] Initialized with API key.');
	}

	/** Return a key-like object compatible with the queue/request system */
	getAvailableKey() {
		this._ensureInitialized();
		return { id: 'openrouter', key: this._key };
	}

	/** No-op: OpenRouter handles rate limiting automatically */
	markUsed(_keyObj) {}
	markRateLimited(_keyObj) {}
	markError(_keyObj) {}

	/** Estimated wait time — always 0 since we rely on OpenRouter */
	getWaitTimeSeconds() {
		return 0;
	}

	get key() {
		this._ensureInitialized();
		return this._key;
	}
}

export const keyPool = new OpenRouterManager();

