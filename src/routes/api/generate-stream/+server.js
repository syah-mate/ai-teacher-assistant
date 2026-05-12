/**
 * Generate Stream API — SSE endpoint untuk streaming interleaved text+image sections
 *
 * Flow:
 * 1. Terima prompt dari client
 * 2. Panggil Gemini (via key pool, sama seperti /api/gemini)
 * 3. Parse response sebagai JSON array sections
 * 4. Stream setiap section via SSE — text langsung, image via generate-image endpoint
 */

import { env } from '$env/dynamic/private';
import { keyPool } from '$lib/server/key-pool.js';
import { parseInterleavedResponse } from '$lib/utils/parseInterleavedResponse.js';

const GEMINI_MODEL = env.GEMINI_MODEL || 'gemini-2.0-flash';

/** @param {import('@sveltejs/kit').RequestEvent} event */
export async function POST({ request, locals, fetch: kitFetch }) {
	if (!locals.user) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
	}

	const { prompt, context = '' } = await request.json();

	if (!prompt || typeof prompt !== 'string') {
		return new Response(JSON.stringify({ error: 'Prompt is required' }), { status: 400 });
	}

	const stream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();

			/** @param {object} data */
			function sendEvent(data) {
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
			}

			try {
				sendEvent({ type: 'status', message: 'Membuat konten...' });

				// Dapatkan API key
				let apiKey = locals.user.geminiApiKey;
				let poolKeyObj = null;

				if (!apiKey) {
					poolKeyObj = keyPool.getAvailableKey();
					if (!poolKeyObj) {
						sendEvent({ type: 'error', message: 'Semua API key sedang penuh. Coba lagi nanti.' });
						controller.close();
						return;
					}
					apiKey = poolKeyObj.key;
					keyPool.markUsed(poolKeyObj);
				}

				// Bangun full prompt dengan context
				const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

				// Panggil Gemini
				const geminiRes = await fetch(
					`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							contents: [{ parts: [{ text: fullPrompt }] }]
						})
					}
				);

				if (!geminiRes.ok) {
					if (poolKeyObj) keyPool.markError(poolKeyObj);
					sendEvent({ type: 'error', message: `Gemini error: ${geminiRes.status}` });
					controller.close();
					return;
				}

				const geminiData = await geminiRes.json();
				const rawText =
					geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

				// Parse sections
				const sections = parseInterleavedResponse(rawText);

				// Stream setiap section
				for (const section of sections) {
					if (section.type === 'text') {
						sendEvent({ type: 'section', section });
					} else if (section.type === 'image') {
						// Kirim placeholder dulu
						sendEvent({ type: 'section', section: { ...section, imageUrl: null } });

						// Generate gambar via internal endpoint
						try {
							const imgRes = await kitFetch('/api/generate-image', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ prompt: section.prompt, type: 'illustration' })
							});

							if (imgRes.ok) {
								const imgData = await imgRes.json();
								const imageUrl = imgData.imageUrl ?? imgData.image ?? null;
								if (imageUrl) {
									sendEvent({ type: 'image_ready', prompt: section.prompt, imageUrl });
								} else {
									sendEvent({ type: 'image_error', prompt: section.prompt });
								}
							} else {
								sendEvent({ type: 'image_error', prompt: section.prompt });
							}
						} catch (imgErr) {
							console.error('[generate-stream] Image gen error:', imgErr);
							sendEvent({ type: 'image_error', prompt: section.prompt });
						}
					}
				}

				sendEvent({ type: 'done' });
			} catch (err) {
				console.error('[generate-stream] Error:', err);
				sendEvent({ type: 'error', message: /** @type {Error} */ (err).message });
			} finally {
				controller.close();
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
}
