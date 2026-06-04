// src/routes/api/user/quota/+server.js

import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/server/db.js';

const QUOTA_PER_UPGRADE = 20; // kuota yang ditambahkan per klik "Upgrade ke Pro"

/**
 * GET /api/user/quota
 * Kembalikan sisa kuota user yang sedang login.
 */
export async function GET({ locals }) {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const col = await getCollection('users');
    const userObjectId = locals.user.id;
    const user = await col.findOne({ _id: userObjectId });

    if (!user) {
      return json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const remaining = user.quota_remaining ?? 0;
    const total = user.quota_total ?? 0;

    return json({
      remaining,
      total,
      used: total - remaining < 0 ? 0 : total - remaining
    });
  } catch (err) {
    console.error('[API quota GET] Error:', err);
    return json({ error: 'Gagal mengambil data kuota' }, { status: 500 });
  }
}

/**
 * POST /api/user/quota
 * Tambahkan kuota ke user (dipanggil saat klik "Upgrade ke Pro").
 * Sementara tanpa payment gateway — langsung tambah QUOTA_PER_UPGRADE.
 */
export async function POST({ locals }) {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const col = await getCollection('users');
    const userObjectId = locals.user.id;

    const result = await col.findOneAndUpdate(
      { _id: userObjectId },
      {
        $inc: {
          quota_remaining: QUOTA_PER_UPGRADE,
          quota_total: QUOTA_PER_UPGRADE
        },
        $set: {
          quota_updated_at: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    console.log(`[API quota POST] User ${userObjectId} upgraded: +${QUOTA_PER_UPGRADE}, total remaining=${result.quota_remaining}`);

    return json({
      success: true,
      added: QUOTA_PER_UPGRADE,
      remaining: result.quota_remaining,
      total: result.quota_total,
      message: `${QUOTA_PER_UPGRADE} kuota berhasil ditambahkan!`
    });
  } catch (err) {
    console.error('[API quota POST] Error:', err);
    return json({ error: 'Gagal menambahkan kuota' }, { status: 500 });
  }
}
