/**
 * API Endpoint untuk Generate Images Soal dengan Cloudflare Workers AI
 * 
 * Server-side endpoint untuk generate gambar AI menggunakan
 * Cloudflare Workers AI (Stable Diffusion XL) untuk soal/ujian
 */

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { generateSoalImages } from '$lib/utils/cloudflare-image.js';

const CLOUDFLARE_IMAGE_API = env.CLOUDFLARE_IMAGE_API;
const CLOUDFLARE_IMAGE_API_KEY = env.CLOUDFLARE_IMAGE_API_KEY;

/**
 * POST /api/generate-soal-images
 * Generate AI images for soal/ujian using Cloudflare Workers AI
 */
export async function POST({ request, locals }) {
	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { userInput, state } = body;

		if (!userInput) {
			return json({ error: 'Data tidak lengkap' }, { status: 400 });
		}

		// Check if Cloudflare API is configured
		if (!CLOUDFLARE_IMAGE_API || !CLOUDFLARE_IMAGE_API_KEY) {
			console.warn('[Generate Soal Images] Cloudflare API not configured');
			return json({
				success: true,
				images: [],
				count: 0,
				message: 'Image generation skipped - API belum dikonfigurasi. Lihat CLOUDFLARE_IMAGE_SETUP.md'
			});
		}

		// Check if API is still using placeholder values
		if (CLOUDFLARE_IMAGE_API.includes('your-worker-name') || CLOUDFLARE_IMAGE_API_KEY === 'your-secret-api-key') {
			console.warn('[Generate Soal Images] Cloudflare API using placeholder values');
			return json({
				success: true,
				images: [],
				count: 0,
				message: 'Image generation skipped - silakan setup Cloudflare Worker (lihat CLOUDFLARE_IMAGE_SETUP.md)'
			});
		}

		console.log('[Generate Soal Images] Generating images with Cloudflare Workers AI...');
		console.log('[Generate Soal Images] Topic:', userInput.topik);
		console.log('[Generate Soal Images] Image requirements:', state?.soalGeneration?.imageRequirements?.length || 0);

		// Generate images based on image requirements detected in questions
		// (function will check state.soalGeneration.imageRequirements)
		const images = await generateSoalImages(
			userInput,
			state || {},
			CLOUDFLARE_IMAGE_API,
			CLOUDFLARE_IMAGE_API_KEY
		);

		console.log('[Generate Soal Images] Successfully generated', images.length, 'images');

		return json({
			success: true,
			images,
			count: images.length
		});

	} catch (error) {
		console.error('[Generate Soal Images] Error:', error);
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
