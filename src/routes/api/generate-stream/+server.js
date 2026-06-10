/**
 * Generate Stream API — SSE endpoint voor streaming interleaved text+image sections
 *
 * Flow:
 * 1. Terima prompt dari client
 * 2. Panggil OpenRouter AI
 * 3. Parse response sebagai JSON array sections
 * 4. Stream setiap section via SSE — text langsung, image via generate-image endpoint
 */

import { env } from '$env/dynamic/private';
import { parseInterleavedResponse } from '$lib/utils/parseInterleavedResponse.js';
import { ALLOWED_MODELS, DEFAULT_MODEL } from '$lib/server/model-config.js';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const HTTP_REFERER = env.VITE_APP_URL || 'https://asisten-guru-ai.app';

/** @param {import('@sveltejs/kit').RequestEvent} event */
export async function POST({ request, locals, fetch: kitFetch }) {
	if (!locals.user) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
	}

	const { prompt, context = '', model: requestedModel } = await request.json();

	if (!prompt || typeof prompt !== 'string') {
		return new Response(JSON.stringify({ error: 'Prompt is required' }), { status: 400 });
	}

	const model = ALLOWED_MODELS.includes(requestedModel) ? requestedModel : DEFAULT_MODEL;

	const stream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();

			/** @param {object} data */
			function sendEvent(data) {
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
			}

			try {
				sendEvent({ type: 'status', message: 'Membuat konten...' });

				const apiKey = env.OPENROUTER_API_KEY;
				if (!apiKey) {
					sendEvent({ type: 'error', message: 'OpenRouter API key belum dikonfigurasi.' });
					controller.close();
					return;
				}

				// Bangun full prompt dengan context
				const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

				// Panggil OpenRouter
				const aiRes = await fetch(OPENROUTER_BASE_URL, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${apiKey}`,
						'HTTP-Referer': HTTP_REFERER,
						'X-Title': 'Asisten Guru AI'
					},
					body: JSON.stringify({
						model,
						messages: [{ role: 'user', content: fullPrompt }]
					})
				});

				if (!aiRes.ok) {
					sendEvent({ type: 'error', message: `AI error: ${aiRes.status}` });
					controller.close();
					return;
				}

				const aiData = await aiRes.json();
				const rawText = aiData?.choices?.[0]?.message?.content ?? '';

				// Parse sections
				const sections = parseInterleavedResponse(rawText);

				// Stream setiap section
				for (const section of sections) {
					if (section.type === 'text') {
						sendEvent({ type: 'section', section });
					} else if (section.type === 'image') {
						sendEvent({ type: 'section', section: { ...section, imageUrl: null } });

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
