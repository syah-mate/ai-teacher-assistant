/**
 * ai-client-server.js — Server-side AI client
 *
 * Pemanggil OpenRouter API langsung dari sisi server (tanpa melalui /api/gemini).
 * Digunakan oleh background job runner agar proses generate tidak bergantung
 * pada koneksi browser user.
 *
 * Interface sama dengan callGeminiAPI di utils/gemini-client.js:
 *   callGeminiAPIServer(prompt, options) → { success, data, error, usage }
 */

import { env } from '$env/dynamic/private';
import { ALLOWED_MODELS, DEFAULT_MODEL } from './model-config.js';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const HTTP_REFERER = env.VITE_APP_URL || 'https://asisten-guru-ai.app';

/**
 * Buat server-side AI client yang dikunci ke model & thinkingEffort tertentu.
 * Kembalikan fungsi dengan signature yang sama dengan callGeminiAPI.
 *
 * @param {string} model - Model ID (dari ALLOWED_MODELS)
 * @param {string|null} thinkingEffort - 'low' | 'medium' | 'high' | null
 * @returns {(prompt: string, options?: object) => Promise<{success: boolean, data?: string, error?: string, usage?: object}>}
 */
export function createServerAIClient(model, thinkingEffort = null) {
	const resolvedModel = ALLOWED_MODELS.includes(model) ? model : DEFAULT_MODEL;

	return async function callAIServer(prompt, options = {}) {
		const { timeout = 120000, maxRetries = 3 } = options;

		const apiKey = env.OPENROUTER_API_KEY?.trim();
		if (!apiKey) {
			return {
				success: false,
				error: 'OPENROUTER_API_KEY tidak dikonfigurasi di server.'
			};
		}

		let lastError = null;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeout);

			try {
				const reasoningParam =
					thinkingEffort ? { reasoning: { effort: thinkingEffort } } : {};

				const response = await fetch(OPENROUTER_BASE_URL, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${apiKey}`,
						'HTTP-Referer': HTTP_REFERER,
						'X-Title': 'Asisten Guru AI'
					},
					body: JSON.stringify({
						model: resolvedModel,
						messages: [{ role: 'user', content: prompt }],
						...reasoningParam
					}),
					signal: controller.signal
				});

				clearTimeout(timeoutId);

				if (!response.ok) {
					const errData = await response.json().catch(() => ({}));

					if (response.status === 429) {
						if (attempt < maxRetries) {
							const delay = Math.min(2000 * Math.pow(2, attempt), 30000);
							await sleep(delay);
							continue;
						}
						return { success: false, error: 'Rate limit OpenRouter. Coba lagi nanti.' };
					}

					if (response.status >= 500 && attempt < maxRetries) {
						const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
						await sleep(delay);
						continue;
					}

					lastError = errData.error?.message || `OpenRouter API error ${response.status}`;
					return { success: false, error: lastError };
				}

				const data = await response.json();
				const text = data.choices?.[0]?.message?.content || '';

				return {
					success: true,
					data: text,
					usage: data.usage
						? {
								promptTokenCount: data.usage.prompt_tokens,
								cachedContentTokenCount: 0,
								candidatesTokenCount: data.usage.completion_tokens
							}
						: null
				};
			} catch (err) {
				clearTimeout(timeoutId);
				if (err.name === 'AbortError') {
					lastError = 'Timeout: permintaan ke OpenRouter terlalu lama.';
					if (attempt < maxRetries) continue;
					return { success: false, error: lastError };
				}
				lastError = err.message;
				if (attempt < maxRetries) {
					await sleep(1000 * attempt);
					continue;
				}
			}
		}

		return { success: false, error: lastError || 'AI API gagal setelah beberapa percobaan.' };
	};
}

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}
