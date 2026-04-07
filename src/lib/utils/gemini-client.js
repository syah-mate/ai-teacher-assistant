/**
 * Gemini API Client Wrapper
 * 
 * Reusable utility untuk memanggil Gemini API dengan:
 * - Error handling yang robust
 * - Retry logic dengan exponential backoff
 * - Timeout handling
 * - User-friendly error messages dalam bahasa Indonesia
 */

/**
 * Call Gemini API melalui endpoint internal
 * 
 * @param {string} prompt - Prompt untuk dikirim ke Gemini
 * @param {object} options - Konfigurasi tambahan
 * @param {number} options.maxRetries - Maksimal percobaan ulang (default: 3)
 * @param {number} options.timeout - Timeout dalam ms (default: 120000 / 2 menit untuk queue)
 * @param {function} options.onQueued - Callback ketika masuk antrian: ({ position, estimatedWait }) => void
 * @param {string} options.model - Model Gemini yang digunakan (server will use GEMINI_MODEL from env)
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
export async function callGeminiAPI(prompt, options = {}) {
	const { maxRetries = 3, timeout = 120000, onQueued = null } = options;
	// Note: Model is controlled by server via GEMINI_MODEL environment variable

	let lastError = null;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeout);

			const response = await fetch('/api/gemini', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ prompt }),
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));

				// Handle specific error codes
				if (response.status === 401) {
					return {
						success: false,
						error: 'Anda harus login terlebih dahulu untuk menggunakan fitur ini.'
					};
				}

				if (response.status === 500 && errorData.error?.includes('API key')) {
					return {
						success: false,
						error:
							'Konfigurasi API Gemini belum diatur. Silakan hubungi administrator untuk mengatur API key.'
					};
				}

				if (response.status === 503) {
					// Queue full - retry setelah estimatedWait
					const waitSeconds = errorData.estimatedWaitSeconds || 60;
					if (onQueued) {
						onQueued({
							position: errorData.queueSize || 0,
							estimatedWait: waitSeconds
						});
					}

					if (attempt < maxRetries) {
						const delay = Math.min(waitSeconds * 1000, 30000); // Max 30 detik
						await sleep(delay);
						continue;
					}

					return {
						success: false,
						error: `Server sedang sangat sibuk. Estimasi tunggu: ${waitSeconds} detik. Silakan coba lagi.`
					};
				}

				if (response.status === 429) {
					// Rate limit exceeded
					if (attempt < maxRetries) {
						const delay = Math.min(1000 * Math.pow(2, attempt), 30000); // Exponential backoff
						await sleep(delay);
						continue;
					}

					return {
						success: false,
						error:
							'Terlalu banyak permintaan. Silakan tunggu beberapa saat sebelum mencoba lagi.'
					};
				}

				// Server error - retry
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

			return {
				success: true,
				data: data.text || data.content || ''
			};
		} catch (error) {
			lastError = error;

			// Timeout error
			if (error.name === 'AbortError') {
				if (attempt < maxRetries) {
					const delay = 2000 * attempt;
					await sleep(delay);
					continue;
				}

				return {
					success: false,
					error:
						'Waktu tunggu habis. Permintaan memakan waktu terlalu lama. Silakan coba lagi dengan prompt yang lebih sederhana.'
				};
			}

			// Network error
			if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
				if (attempt < maxRetries) {
					const delay = 2000 * attempt;
					await sleep(delay);
					continue;
				}

				return {
					success: false,
					error:
						'Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.'
				};
			}

			// Other errors - retry
			if (attempt < maxRetries) {
				const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
				await sleep(delay);
				continue;
			}
		}
	}

	// All retries exhausted
	return {
		success: false,
		error: lastError?.message || 'Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.'
	};
}

/**
 * Helper function untuk delay/sleep
 */
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Stream response dari Gemini API (untuk future implementation)
 * Saat ini Gemini API endpoint belum support streaming, tapi struktur ini
 * siap untuk di-upgrade ketika streaming tersedia
 * 
 * @param {string} prompt - Prompt untuk dikirim
 * @param {function} onChunk - Callback untuk setiap chunk data
 * @param {object} options - Konfigurasi
 */
export async function streamGeminiAPI(prompt, onChunk, options = {}) {
	const { timeout = 60000 } = options;
	// Note: Model is controlled by server via GEMINI_MODEL environment variable

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		const response = await fetch('/api/gemini', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ prompt, model, stream: true }),
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.error || 'Gagal mendapatkan response dari AI');
		}

		// For now, just return the full response
		// TODO: Implement actual streaming when API supports it
		const data = await response.json();
		if (onChunk && data.text) {
			onChunk(data.text);
		}

		return {
			success: true,
			data: data.text || ''
		};
	} catch (error) {
		return {
			success: false,
			error: error.message || 'Terjadi kesalahan saat streaming AI response'
		};
	}
}

/**
 * Validate prompt sebelum dikirim (max length, basic sanitization)
 */
export function validatePrompt(prompt) {
	if (!prompt || typeof prompt !== 'string') {
		return {
			valid: false,
			error: 'Prompt tidak boleh kosong'
		};
	}

	if (prompt.trim().length === 0) {
		return {
			valid: false,
			error: 'Prompt tidak boleh kosong'
		};
	}

	// Max 50,000 characters (Gemini pro limit is higher, but this is reasonable)
	if (prompt.length > 50000) {
		return {
			valid: false,
			error: 'Prompt terlalu panjang. Maksimal 50.000 karakter.'
		};
	}

	return {
		valid: true
	};
}

/**
 * Build structured prompt dengan context kurikulum
 * Helper function untuk memudahkan pembuatan prompt yang konsisten
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
	streamGeminiAPI,
	validatePrompt,
	buildPrompt
};
