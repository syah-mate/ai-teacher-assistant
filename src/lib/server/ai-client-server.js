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
import { ALLOWED_MODELS, DEFAULT_MODEL, MODELS_SUPPORTING_REASONING } from './model-config.js';

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
				// Only send reasoning param to models that support it
				const supportsReasoning = MODELS_SUPPORTING_REASONING.has(resolvedModel);
				const reasoningParam =
					thinkingEffort && supportsReasoning ? { reasoning: { effort: thinkingEffort } } : {};

				// content bisa berupa string (text only) atau array [{type,text},{type,image_url,...}]
				const messageContent = Array.isArray(prompt) ? prompt : prompt;

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
						messages: [{ role: 'user', content: messageContent }],
						max_tokens: 8192,
						...reasoningParam
					}),
					signal: controller.signal
				});

				clearTimeout(timeoutId);

				if (!response.ok) {
					const errData = await response.json().catch(() => ({}));
					const errMsg = errData.error?.message || '';
					const errMeta = errData.error?.metadata || {};

					if (response.status === 429) {
						if (attempt < maxRetries) {
							const delay = Math.min(2000 * Math.pow(2, attempt), 30000);
							console.warn(`[AI-Client] Rate limited (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms`);
							await sleep(delay);
							continue;
						}
						return { success: false, error: 'Rate limit OpenRouter. Coba lagi nanti.' };
					}

					// Provider errors (502/503 dari upstream model provider) — retry lebih agresif
					const isProviderError =
						(response.status === 502 || response.status === 503 || response.status === 504) ||
						/provider|upstream|overloaded|currently unavailable/i.test(errMsg);

					if (isProviderError && attempt < maxRetries) {
						const delay = Math.min(3000 * Math.pow(2, attempt), 30000);
						console.warn(`[AI-Client] Provider error (attempt ${attempt}/${maxRetries}), status=${response.status}, model=${resolvedModel}, retrying in ${delay}ms: ${errMsg || '(no message)'}`, errMeta ? JSON.stringify(errMeta) : '');
						await sleep(delay);
						continue;
					}

					if (response.status >= 500 && attempt < maxRetries) {
						const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
						console.warn(`[AI-Client] Server error (attempt ${attempt}/${maxRetries}), status=${response.status}, retrying in ${delay}ms: ${errMsg || '(no message)'}`);
						await sleep(delay);
						continue;
					}

					// Log non-retryable errors with full details
					console.error(`[AI-Client] Non-retryable error: status=${response.status}, model=${resolvedModel}, message=${errMsg || '(no message)'}`, JSON.stringify(errData));

					lastError = errMsg || `OpenRouter API error ${response.status}`;
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
