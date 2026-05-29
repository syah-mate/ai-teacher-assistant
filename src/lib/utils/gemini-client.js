/**
 * AI API Client Wrapper — OpenRouter
 *
 * Reusable utility untuk memanggil AI API dengan:
 * - Error handling yang robust
 * - Retry logic dengan exponential backoff
 * - Timeout handling
 * - User-friendly error messages dalam bahasa Indonesia
 */

import { get } from 'svelte/store';
import { selectedModel, selectedThinking } from '$lib/stores/modelStore.js';

/**
 * Call AI API melalui endpoint internal
 *
 * @param {string} prompt - Prompt untuk dikirim ke AI
 * @param {object} options - Konfigurasi tambahan
 * @param {number} options.maxRetries - Maksimal percobaan ulang (default: 3)
 * @param {number} options.timeout - Timeout dalam ms (default: 120000)
 * @param {function} options.onQueued - Callback ketika masuk antrian (legacy, no-op)
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
export async function callGeminiAPI(prompt, options = {}) {
	const { maxRetries = 3, timeout = 120000 } = options;
	const model = get(selectedModel);
	const thinkingEffort = get(selectedThinking);

	let lastError = null;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeout);

			const response = await fetch('/api/gemini', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt, model, thinkingEffort }),
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));

				if (response.status === 401) {
					return {
						success: false,
						error: 'Anda harus login terlebih dahulu untuk menggunakan fitur ini.'
					};
				}

				if (response.status === 500) {
					return {
						success: false,
						error: errorData.message || errorData.error || 'Server error. Periksa OPENROUTER_API_KEY di .env dan restart server.'
					};
				}

				if (response.status === 429) {
					if (attempt < maxRetries) {
						const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
						await sleep(delay);
						continue;
					}
					return {
						success: false,
						error: errorData.message || 'Terlalu banyak permintaan. Silakan tunggu beberapa saat sebelum mencoba lagi.'
					};
				}

				if (response.status >= 500 && attempt < maxRetries) {
					const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
					await sleep(delay);
					continue;
				}

				throw new Error(errorData.message || errorData.error || 'Terjadi kesalahan saat menghubungi server');
			}

			const data = await response.json();

			if (data.error) {
				throw new Error(data.error);
			}

			// Dispatch event untuk refresh rate limit indicator
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('generate-success', { detail: data }));
			}

			return {
				success: true,
				data: data.text || data.content || '',
				usage: data.usage || null
			};
		} catch (error) {
			lastError = error;

			if (error.name === 'AbortError') {
				if (attempt < maxRetries) {
					await sleep(2000 * attempt);
					continue;
				}
				return {
					success: false,
					error: 'Waktu tunggu habis. Permintaan memakan waktu terlalu lama. Silakan coba lagi dengan prompt yang lebih sederhana.'
				};
			}

			if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
				if (attempt < maxRetries) {
					await sleep(2000 * attempt);
					continue;
				}
				return {
					success: false,
					error: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.'
				};
			}

			if (attempt < maxRetries) {
				await sleep(Math.min(1000 * Math.pow(2, attempt), 10000));
				continue;
			}
		}
	}

	return {
		success: false,
		error: lastError?.message || 'Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.'
	};
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate prompt sebelum dikirim (max length, basic sanitization)
 */
export function validatePrompt(prompt) {
	if (!prompt || typeof prompt !== 'string') {
		return { valid: false, error: 'Prompt tidak boleh kosong' };
	}
	if (prompt.trim().length === 0) {
		return { valid: false, error: 'Prompt tidak boleh kosong' };
	}
	if (prompt.length > 50000) {
		return { valid: false, error: 'Prompt terlalu panjang. Maksimal 50.000 karakter.' };
	}
	return { valid: true };
}

/**
 * Build structured prompt dengan context kurikulum
 */
export function buildPrompt(systemContext, userInput, outputFormat = '') {
	let prompt = `${systemContext}\n\n`;

	if (typeof userInput === 'object') {
		prompt += 'INPUT DARI PENGGUNA:\n';
		Object.entries(userInput).forEach(([key, value]) => {
			const formattedKey = key
				.replace(/([A-Z])/g, ' $1')
				.toLowerCase()
				.trim();
			prompt += `- ${formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1)}: ${value}\n`;
		});
	} else {
		prompt += `INPUT:\n${userInput}\n`;
	}

	if (outputFormat) {
		prompt += `\nFORMAT OUTPUT:\n${outputFormat}\n`;
	}

	prompt += '\nHASIL:';
	return prompt;
}

export default {
	callGeminiAPI,
	validatePrompt,
	buildPrompt
};

