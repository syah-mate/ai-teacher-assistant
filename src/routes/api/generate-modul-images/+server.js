/**
 * API Endpoint untuk Generate Images dengan Cloudflare Workers AI
 * 
 * Server-side endpoint untuk generate gambar AI menggunakan
 * Cloudflare Workers AI (Stable Diffusion XL)
 */

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { generateModulImages } from '$lib/utils/cloudflare-image.js';

const CLOUDFLARE_IMAGE_API = env.CLOUDFLARE_IMAGE_API;
const CLOUDFLARE_IMAGE_API_KEY = env.CLOUDFLARE_IMAGE_API_KEY;

/**
 * POST /api/generate-modul-images
 * Generate AI images for modul ajar using Cloudflare Workers AI
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
			console.warn('[Generate Modul Images] Cloudflare API not configured');
			return json({
				success: true,
				images: [],
				count: 0,
				message: 'Image generation skipped - API belum dikonfigurasi. Lihat CLOUDFLARE_IMAGE_SETUP.md'
			});
		}

		// Check if API is still using placeholder values
		if (CLOUDFLARE_IMAGE_API.includes('your-worker-name') || CLOUDFLARE_IMAGE_API_KEY === 'your-secret-api-key') {
			console.warn('[Generate Modul Images] Cloudflare API using placeholder values');
			return json({
				success: true,
				images: [],
				count: 0,
				message: 'Image generation skipped - silakan setup Cloudflare Worker (lihat CLOUDFLARE_IMAGE_SETUP.md)'
			});
		}

		console.log('[Generate Modul Images] Generating images with Cloudflare Workers AI...');
		console.log('[Generate Modul Images] Topic:', userInput.judul || userInput.judulModul);

		// Generate images (2 images by default)
		const images = await generateModulImages(
			userInput,
			state,
			CLOUDFLARE_IMAGE_API,
			CLOUDFLARE_IMAGE_API_KEY,
			2 // Generate 2 images
		);

		console.log('[Generate Modul Images] Successfully generated', images.length, 'images');

		return json({
			success: true,
			images,
			count: images.length
		});

	} catch (error) {
		console.error('[Generate Modul Images] Error:', error);
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
