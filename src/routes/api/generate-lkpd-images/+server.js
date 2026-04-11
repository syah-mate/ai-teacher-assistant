/**
 * API Endpoint untuk Generate Images LKPD dengan Cloudflare Workers AI
 * 
 * Server-side endpoint untuk generate gambar AI menggunakan
 * Cloudflare Workers AI (Stable Diffusion XL) untuk LKPD
 */

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { generateLKPDImages } from '$lib/utils/cloudflare-image.js';

const CLOUDFLARE_IMAGE_API = env.CLOUDFLARE_IMAGE_API;
const CLOUDFLARE_IMAGE_API_KEY = env.CLOUDFLARE_IMAGE_API_KEY;

/**
 * POST /api/generate-lkpd-images
 * Generate AI images for LKPD using Cloudflare Workers AI
 */
export async function POST({ request, locals }) {
	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { userInput, state } = body;

		if (!userInput || !state) {
			return json({ error: 'Data tidak lengkap' }, { status: 400 });
		}

		// Check if Cloudflare API is configured
		if (!CLOUDFLARE_IMAGE_API || !CLOUDFLARE_IMAGE_API_KEY) {
			console.warn('[Generate LKPD Images] Cloudflare API not configured');
			return json({
				success: true,
				images: [],
				count: 0,
				message: 'Image generation skipped - API belum dikonfigurasi. Lihat CLOUDFLARE_IMAGE_SETUP.md'
			});
		}

		// Check if API is still using placeholder values
		if (CLOUDFLARE_IMAGE_API.includes('your-worker-name') || CLOUDFLARE_IMAGE_API_KEY === 'your-secret-api-key') {
			console.warn('[Generate LKPD Images] Cloudflare API using placeholder values');
			return json({
				success: true,
				images: [],
				count: 0,
				message: 'Image generation skipped - silakan setup Cloudflare Worker (lihat CLOUDFLARE_IMAGE_SETUP.md)'
			});
		}

		console.log('[Generate LKPD Images] Generating images with Cloudflare Workers AI...');
		console.log('[Generate LKPD Images] Topic:', userInput.topikMateri || userInput.judulLKPD);

		// Generate 2-3 images by default (randomize for variety)
		const imageCount = Math.floor(Math.random() * 2) + 2; // 2 or 3 images
		
		const images = await generateLKPDImages(
			userInput,
			state,
			CLOUDFLARE_IMAGE_API,
			CLOUDFLARE_IMAGE_API_KEY,
			imageCount
		);

		console.log('[Generate LKPD Images] Successfully generated', images.length, 'images');

		return json({
			success: true,
			images,
			count: images.length
		});

	} catch (error) {
		console.error('[Generate LKPD Images] Error:', error);
		return json(
			{
				success: true, // Return success to not break the flow
				images: [],
				count: 0,
				error: error.message
			},
			{ status: 200 } // Return 200 so orchestrator doesn't fail
		);
	}
}
