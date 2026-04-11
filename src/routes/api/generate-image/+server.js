/**
 * API Endpoint untuk Generate Image dengan Gemini
 * 
 * Generate ilustrasi gambar untuk memperkaya konten modul ajar
 */

import { json } from '@sveltejs/kit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';
import { keyPool } from '$lib/server/key-pool.js';

const GEMINI_MODEL_IMAGE = env.GEMINI_MODEL_IMAGE || 'gemini-2.0-flash-thinking-exp';

/**
 * POST /api/generate-image
 * Generate image berdasarkan prompt
 */
export async function POST({ request, locals }) {
	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { prompt, type } = body;

		if (!prompt) {
			return json({ error: 'Prompt harus diisi' }, { status: 400 });
		}

		// Get API key (prioritize user key, fallback to pool)
		let apiKey = locals.user.geminiApiKey;
		let poolKeyObj = null;

		if (!apiKey) {
			poolKeyObj = keyPool.getAvailableKey();
			if (!poolKeyObj) {
				const waitSeconds = keyPool.getWaitTimeSeconds();
				return json(
					{
						error: `Semua API key sedang penuh. Silakan tunggu ${waitSeconds} detik atau tambahkan API key pribadi di Pengaturan > Integrasi.`
					},
					{ status: 503 }
				);
			}
			apiKey = poolKeyObj.key;
			keyPool.markUsed(poolKeyObj);
		}

		// Initialize Gemini with image generation model
		const genAI = new GoogleGenerativeAI(apiKey);
		const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_IMAGE });

		// Build better prompt for image generation
		const enhancedPrompt = buildImagePrompt(prompt, type);

		// Generate image description/concept
		const result = await model.generateContent(enhancedPrompt);
		const response = await result.response;
		const imageDescription = response.text();

		// Note: Gemini doesn't directly generate images, it creates descriptions
		// For actual image generation, you'd need to use:
		// 1. Google's Imagen API (text-to-image)
		// 2. Stock photo APIs with the description
		// 3. AI image generators like DALL-E, Midjourney, etc.
		
		// For now, we'll return a placeholder image URL based on the description
		// In production, you'd integrate with actual image generation service
		const imageUrl = await getPlaceholderImage(imageDescription, type);

		return json({
			success: true,
			imageUrl,
			description: imageDescription,
			prompt: enhancedPrompt
		});

	} catch (error) {
		console.error('Generate image error:', error);
		return json(
			{
				success: false,
				error: 'Gagal generate gambar. Silakan coba lagi.'
			},
			{ status: 500 }
		);
	}
}

/**
 * Build enhanced prompt untuk image generation
 */
function buildImagePrompt(userPrompt, type = 'illustration') {
	const typeInstructions = {
		diagram: 'Buatlah deskripsi diagram yang jelas dan informatif untuk: ',
		illustration: 'Buatlah deskripsi ilustrasi edukatif yang menarik untuk: ',
		infographic: 'Buatlah deskripsi infografis yang informatif untuk: ',
		concept: 'Buatlah deskripsi visual konsep pembelajaran untuk: '
	};

	const instruction = typeInstructions[type] || typeInstructions.illustration;

	return `${instruction}${userPrompt}

Berikan deskripsi visual yang:
1. Cocok untuk konten edukatif tingkat sekolah
2. Sederhana tapi informatif
3. Menarik dan mudah dipahami
4. Sesuai konteks pembelajaran di Indonesia
5. Profesional dan sesuai untuk dokumen resmi

Format output: Berikan deskripsi singkat (2-3 kalimat) yang bisa digunakan untuk mencari atau membuat gambar.`;
}

/**
 * Get placeholder image URL
 * In production, integrate with actual image generation or stock photo API
 */
async function getPlaceholderImage(description, type) {
	// For now, use Unsplash's random image API with relevant keywords
	// Extract keywords from description
	const keywords = extractKeywords(description);
	const query = keywords.join(',');
	
	// Using Unsplash Source API for placeholder (free, no API key needed)
	// In production, replace with actual image generation service
	return `https://source.unsplash.com/800x600/?${encodeURIComponent(query)},education`;
}

/**
 * Extract relevant keywords from description
 */
function extractKeywords(description) {
	// Simple keyword extraction
	// In production, use NLP for better results
	const words = description
		.toLowerCase()
		.replace(/[^\w\s]/g, '')
		.split(/\s+/)
		.filter(word => word.length > 3);
	
	return words.slice(0, 3); // Take first 3 meaningful words
}
