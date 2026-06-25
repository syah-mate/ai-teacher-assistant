/**
 * GET  /api/config/ai-model  → ambil config AI model saat ini
 * POST /api/config/ai-model  → simpan config AI model (admin only)
 */

import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/server/db.js';
import {
  ALLOWED_MODELS,
  DEFAULT_MODEL,
  ALLOWED_THINKING_EFFORTS,
  ALLOWED_IMAGE_MODELS,
  DEFAULT_IMAGE_MODEL
} from '$lib/server/model-config.js';

const CONFIG_ID = 'ai_model_config';

export async function GET({ locals }) {
  // Config bisa dibaca siapa saja yang sudah login (untuk dipakai job-runner)
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const col = await getCollection('app_config');
    const config = await col.findOne({ _id: CONFIG_ID });

    return json({
      textModel: config?.textModel || DEFAULT_MODEL,
      thinkingEffort: config?.thinkingEffort || 'medium',
      imageModel: config?.imageModel || DEFAULT_IMAGE_MODEL,
      updatedAt: config?.updatedAt || null,
      updatedBy: config?.updatedBy || null
    });
  } catch (err) {
    console.error('[config/ai-model] GET error:', err);
    return json({ error: 'Gagal membaca config' }, { status: 500 });
  }
}

export async function POST({ request, locals }) {
  // Hanya admin yang bisa mengubah config
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (locals.user.role !== 'admin') {
    return json({ error: 'Forbidden: hanya admin yang dapat mengubah config' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Request body tidak valid' }, { status: 400 });
  }

  const { textModel, thinkingEffort, imageModel } = body;

  // Validasi
  if (textModel && !ALLOWED_MODELS.includes(textModel)) {
    return json({ error: `textModel tidak valid. Pilihan: ${ALLOWED_MODELS.join(', ')}` }, { status: 400 });
  }
  if (thinkingEffort && !ALLOWED_THINKING_EFFORTS.has(thinkingEffort)) {
    return json({ error: `thinkingEffort tidak valid. Pilihan: low, medium, high` }, { status: 400 });
  }
  if (imageModel && !ALLOWED_IMAGE_MODELS.includes(imageModel)) {
    return json({ error: `imageModel tidak valid. Pilihan: ${ALLOWED_IMAGE_MODELS.join(', ')}` }, { status: 400 });
  }

  try {
    const col = await getCollection('app_config');
    const userId = locals.user.id || locals.user._id?.toString();

    await col.updateOne(
      { _id: CONFIG_ID },
      {
        $set: {
          ...(textModel && { textModel }),
          ...(thinkingEffort && { thinkingEffort }),
          ...(imageModel && { imageModel }),
          updatedAt: new Date(),
          updatedBy: userId
        }
      },
      { upsert: true }
    );

    // Ambil config terbaru untuk dikembalikan ke client
    const updated = await col.findOne({ _id: CONFIG_ID });

    return json({
      success: true,
      config: {
        textModel: updated.textModel,
        thinkingEffort: updated.thinkingEffort,
        imageModel: updated.imageModel,
        updatedAt: updated.updatedAt
      }
    });
  } catch (err) {
    console.error('[config/ai-model] POST error:', err);
    return json({ error: 'Gagal menyimpan config' }, { status: 500 });
  }
}
