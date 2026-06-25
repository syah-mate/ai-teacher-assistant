/**
 * POST /api/generate-image
 * Generate worksheet image via OpenRouter image model.
 * Body: { templateId, userContext }
 * Response: { success, imageUrl, imageBase64? }
 */

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getCollection } from '$lib/server/db.js';
import { ALLOWED_IMAGE_MODELS, DEFAULT_IMAGE_MODEL } from '$lib/server/model-config.js';

const OPENROUTER_IMAGE_URL = 'https://openrouter.ai/api/v1/images/generations';
const HTTP_REFERER = env.VITE_APP_URL || 'https://asisten-guru-ai.app';

/**
 * Ambil image model dari app_config global, fallback ke null jika tidak ada.
 */
async function getImageModelFromConfig() {
  try {
    const col = await getCollection('app_config');
    const config = await col.findOne({ _id: 'ai_model_config' });
    return config?.imageModel || null;
  } catch {
    return null;
  }
}

export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Request body tidak valid' }, { status: 400 });
	}

	const { templateId, userContext } = body;

	if (!templateId) {
		return json({ error: 'templateId wajib diisi' }, { status: 400 });
	}

	// Ambil template dari DB
	let template;
	try {
		const col = await getCollection('user_templates');
		const { ObjectId } = await import('mongodb');
		template = await col.findOne({ _id: new ObjectId(templateId) });
	} catch {
		return json({ error: 'Template tidak ditemukan' }, { status: 404 });
	}

	if (!template) {
		return json({ error: 'Template tidak ditemukan' }, { status: 404 });
	}

	if (template.type !== 'image') {
		return json({ error: 'Template ini bukan tipe image' }, { status: 400 });
	}

	// Interpolasi {{variable}} di promptTemplate dengan userContext
	let finalPrompt = template.templatePrompt || '';
	const ctx = userContext || {};
	finalPrompt = finalPrompt.replace(/\{\{(\w+)\}\}/g, (_, key) => ctx[key] ?? '');

	// Gabungkan context + finalPrompt sebagai prompt lengkap
	const fullPrompt = [template.context?.trim(), finalPrompt.trim()].filter(Boolean).join('\n\n');

	if (!fullPrompt.trim()) {
		return json({ error: 'Prompt kosong setelah interpolasi' }, { status: 400 });
	}

	// Resolusi model — prioritas: config global DB > template.imageModel > DEFAULT_IMAGE_MODEL
	const configModel = await getImageModelFromConfig();
	const modelId = ALLOWED_IMAGE_MODELS.includes(configModel)
		? configModel
		: ALLOWED_IMAGE_MODELS.includes(template.imageModel)
			? template.imageModel
			: DEFAULT_IMAGE_MODEL;

	// Panggil OpenRouter image generation
	const apiKey = env.OPENROUTER_API_KEY?.trim();
	if (!apiKey) {
		return json({ error: 'OPENROUTER_API_KEY tidak dikonfigurasi' }, { status: 500 });
	}

	try {
		const response = await fetch(OPENROUTER_IMAGE_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
				'HTTP-Referer': HTTP_REFERER,
				'X-Title': 'Asisten Guru AI'
			},
			body: JSON.stringify({
				model: modelId,
				prompt: fullPrompt,
				n: 1,
				size: '1024x1024'
			})
		});

		if (!response.ok) {
			const errData = await response.json().catch(() => ({}));
			const errMsg = errData.error?.message || `OpenRouter error ${response.status}`;
			console.error('[generate-image] OpenRouter error:', errMsg);
			return json({ error: `Gagal generate gambar: ${errMsg}` }, { status: 500 });
		}

		const data = await response.json();
		// OpenRouter image response: { data: [{ url, b64_json }] }
		const imageUrl = data.data?.[0]?.url || null;
		const imageBase64 = data.data?.[0]?.b64_json || null;

		if (!imageUrl && !imageBase64) {
			return json({ error: 'Tidak ada gambar yang dihasilkan' }, { status: 500 });
		}

		return json({ success: true, imageUrl, imageBase64, model: modelId, prompt: fullPrompt });

	} catch (err) {
		console.error('[generate-image] Unexpected error:', err);
		return json({ error: 'Terjadi kesalahan saat generate gambar' }, { status: 500 });
	}
}

