/**
 * API Endpoint untuk Generate Image
 *
 * Generate ilustrasi gambar untuk memperkaya konten modul ajar
 */

import { json } from '@sveltejs/kit';

/**
 * POST /api/generate-image
 * Generate image berdasarkan prompt
 */
export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { prompt, type } = body;

		if (!prompt) {
			return json({ error: 'Prompt harus diisi' }, { status: 400 });
		}

		// Generate a placeholder image URL based on prompt keywords
		const imageUrl = buildPlaceholderImageUrl(prompt, type);

		return json({
			success: true,
			imageUrl,
			prompt
		});
	} catch (error) {
		console.error('Generate image error:', error);
		return json({ success: false, error: 'Gagal generate gambar. Silakan coba lagi.' }, { status: 500 });
	}
}

/**
 * Build placeholder image URL using Unsplash Source
 */
function buildPlaceholderImageUrl(prompt, type = 'illustration') {
	const words = prompt
		.toLowerCase()
		.replace(/[^\w\s]/g, '')
		.split(/\s+/)
		.filter((w) => w.length > 3)
		.slice(0, 3);
	const query = words.join(',') || 'education';
	return `https://source.unsplash.com/800x600/?${encodeURIComponent(query)},education`;
}

