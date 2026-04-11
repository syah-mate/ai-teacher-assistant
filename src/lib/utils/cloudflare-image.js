/**
 * Cloudflare Workers AI Image Generator
 * 
 * Calls Cloudflare Workers AI endpoint to generate images
 * using Stable Diffusion XL model
 */

/**
 * Generate educational image using Cloudflare Workers AI
 * 
 * @param {string} prompt - Text prompt for image generation
 * @param {string} apiUrl - Cloudflare Worker URL
 * @param {string} apiKey - API key for authentication
 * @returns {Promise<{success: boolean, imageData?: string, mimeType?: string, error?: string}>}
 */
export async function generateImageCloudflare(prompt, apiUrl, apiKey) {
	try {
		if (!apiUrl || !apiKey) {
			return {
				success: false,
				error: 'Cloudflare API URL atau API Key belum dikonfigurasi. Silakan setup di .env (lihat CLOUDFLARE_IMAGE_SETUP.md)'
			};
		}

		if (!prompt || prompt.trim() === '') {
			return {
				success: false,
				error: 'Prompt tidak boleh kosong'
			};
		}

		// Call Cloudflare Worker endpoint
		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ prompt: prompt.trim() })
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			
			console.error('[Cloudflare Image] API Error:', {
				status: response.status,
				statusText: response.statusText,
				error: errorData
			});

			if (response.status === 401) {
				return {
					success: false,
					error: 'API key tidak valid. Periksa CLOUDFLARE_IMAGE_API_KEY di .env'
				};
			}

			if (response.status === 429) {
				return {
					success: false,
					error: 'Rate limit tercapai. Silakan tunggu sebentar.'
				};
			}

			return {
				success: false,
				error: errorData.error || `API Error: ${response.status} ${response.statusText}`
			};
		}

		// Get image as blob
		const blob = await response.blob();
		
		// Convert blob to base64 for embedding in .docx (browser-compatible)
		const arrayBuffer = await blob.arrayBuffer();
		const bytes = new Uint8Array(arrayBuffer);
		
		// Convert to base64 using browser API
		let binary = '';
		for (let i = 0; i < bytes.length; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		const base64Data = btoa(binary);

		console.log('[Cloudflare Image] Successfully generated image, size:', blob.size, 'bytes');

		return {
			success: true,
			imageData: base64Data,
			mimeType: blob.type || 'image/jpeg',
			size: blob.size
		};

	} catch (error) {
		console.error('[Cloudflare Image] Error:', error);
		return {
			success: false,
			error: error.message || 'Terjadi kesalahan saat generate gambar'
		};
	}
}

/**
 * Build educational prompt for image generation
 * 
 * @param {Object} params - Parameters for prompt building
 * @returns {string} - Optimized prompt for educational content
 */
export function buildEducationalPrompt({ judulModul, mapel, kelas, topik, style = 'educational' }) {
	// Clean and format topic
	const topic = topik || judulModul;
	
	// Build educational prompt with specific style guidance
	const styleGuide = {
		'educational': 'educational illustration, clear and simple, suitable for classroom',
		'realistic': 'realistic photo, high quality, educational context',
		'diagram': 'simple diagram, infographic style, clear labeled parts',
		'illustration': 'colorful illustration, cartoon style, friendly and engaging'
	};

	const selectedStyle = styleGuide[style] || styleGuide['educational'];

	// Construct prompt optimized for Stable Diffusion
	const prompt = `${topic}, ${selectedStyle}, for ${mapel} subject, Indonesian grade ${kelas}, bright lighting, professional quality, no text, clean background`;

	console.log('[Cloudflare Image] Generated prompt:', prompt);

	return prompt;
}

/**
 * Generate multiple images for modul ajar
 * 
 * @param {Object} userInput - User input data
 * @param {Object} state - Current orchestrator state
 * @param {string} apiUrl - Cloudflare Worker URL
 * @param {string} apiKey - API key
 * @param {number} imageCount - Number of images to generate (default: 2)
 * @returns {Promise<Array>} - Array of generated images
 */
export async function generateModulImages(userInput, state, apiUrl, apiKey, imageCount = 2) {
	const images = [];
	const { judulModul, mapel, kelas } = userInput;
	const pertemuan = state.kegiatanPembelajaran?.pertemuan || [];

	// Generate prompts for different sections
	const prompts = [];
	
	if (pertemuan.length > 0) {
		// First image: from first meeting
		const topik1 = pertemuan[0].judulPertemuan || judulModul;
		prompts.push({
			prompt: buildEducationalPrompt({ judulModul, mapel, kelas, topik: topik1, style: 'educational' }),
			caption: topik1,
			position: 'pertemuan-1',
			description: `Ilustrasi pembelajaran untuk ${topik1}`
		});

		// Second image: from middle/last meeting (if exists)
		if (pertemuan.length > 1 && imageCount > 1) {
			const midIdx = Math.floor(pertemuan.length / 2);
			const topik2 = pertemuan[midIdx].judulPertemuan || judulModul;
			prompts.push({
				prompt: buildEducationalPrompt({ judulModul, mapel, kelas, topik: topik2, style: 'realistic' }),
				caption: topik2,
				position: `pertemuan-${midIdx + 1}`,
				description: `Ilustrasi pembelajaran untuk ${topik2}`
			});
		}
	} else {
		// Fallback: generate generic educational images
		prompts.push({
			prompt: buildEducationalPrompt({ judulModul, mapel, kelas, style: 'educational' }),
			caption: judulModul,
			position: 'general',
			description: `Ilustrasi pembelajaran untuk ${judulModul}`
		});
	}

	// Generate images sequentially (to avoid rate limits)
	for (let i = 0; i < Math.min(prompts.length, imageCount); i++) {
		const promptData = prompts[i];
		
		console.log(`[Cloudflare Image] Generating image ${i + 1}/${imageCount}...`);
		
		const result = await generateImageCloudflare(promptData.prompt, apiUrl, apiKey);
		
		if (result.success) {
			images.push({
				data: result.imageData,
				mimeType: result.mimeType,
				caption: promptData.caption,
				description: promptData.description,
				position: promptData.position,
				size: result.size
			});
		} else {
			console.warn(`[Cloudflare Image] Failed to generate image ${i + 1}:`, result.error);
			// Continue with other images even if one fails
		}

		// Small delay between requests (100ms) to be respectful
		if (i < prompts.length - 1) {
			await new Promise(resolve => setTimeout(resolve, 100));
		}
	}

	return images;
}

/**
 * Generate multiple images for LKPD
 * 
 * @param {Object} userInput - User input data
 * @param {Object} state - Current orchestrator state
 * @param {string} apiUrl - Cloudflare Worker URL
 * @param {string} apiKey - API key
 * @param {number} imageCount - Number of images to generate (min: 1, max: 5)
 * @returns {Promise<Array>} - Array of generated images
 */
export async function generateLKPDImages(userInput, state, apiUrl, apiKey, imageCount = 2) {
	const images = [];
	const { judulLKPD, topikMateri, mapel, kelas, jenisKegiatan } = userInput;
	
	// Ensure imageCount is between 1 and 5
	const count = Math.max(1, Math.min(5, imageCount));

	// Generate prompts for different sections
	const prompts = [];
	
	// Image 1: Main topic illustration
	const mainTopic = topikMateri || judulLKPD;
	prompts.push({
		prompt: buildEducationalPrompt({ judulModul: mainTopic, mapel, kelas, topik: mainTopic, style: 'educational' }),
		caption: `Ilustrasi ${mainTopic}`,
		position: 'main',
		description: `Ilustrasi utama untuk topik ${mainTopic}`
	});
	
	// Image 2: Activity-based illustration
	if (count > 1) {
		const activityPrompt = buildActivityPrompt({ topik: mainTopic, mapel, kelas, jenisKegiatan });
		prompts.push({
			prompt: activityPrompt,
			caption: `Kegiatan ${jenisKegiatan || 'pembelajaran'}`,
			position: 'activity',
			description: `Ilustrasi kegiatan ${jenisKegiatan || 'pembelajaran'}`
		});
	}
	
	// Image 3: Concept illustration (if material exists)
	if (count > 2 && state.materiPendukung?.ringkasanMateri?.konsepKunci) {
		const konsep = state.materiPendukung.ringkasanMateri.konsepKunci[0];
		if (konsep) {
			prompts.push({
				prompt: buildEducationalPrompt({ judulModul: konsep.nama, mapel, kelas, topik: konsep.nama, style: 'diagram' }),
				caption: konsep.nama,
				position: 'concept',
				description: `Ilustrasi konsep: ${konsep.nama}`
			});
		}
	}
	
	// Image 4: Worksheet activity
	if (count > 3) {
		prompts.push({
			prompt: buildEducationalPrompt({ judulModul: `${mainTopic} worksheet`, mapel, kelas, topik: `${mainTopic} hands-on activity`, style: 'illustration' }),
			caption: 'Aktivitas Belajar',
			position: 'worksheet',
			description: 'Ilustrasi aktivitas worksheet'
		});
	}
	
	// Image 5: Evaluation/reflection
	if (count > 4) {
		prompts.push({
			prompt: buildEducationalPrompt({ judulModul: `${mainTopic} evaluation`, mapel, kelas, topik: `students evaluating ${mainTopic}`, style: 'realistic' }),
			caption: 'Evaluasi Pembelajaran',
			position: 'evaluation',
			description: 'Ilustrasi evaluasi pembelajaran'
		});
	}

	// Generate images sequentially
	for (let i = 0; i < Math.min(prompts.length, count); i++) {
		const promptData = prompts[i];
		
		console.log(`[Cloudflare Image LKPD] Generating image ${i + 1}/${count}...`);
		
		const result = await generateImageCloudflare(promptData.prompt, apiUrl, apiKey);
		
		if (result.success) {
			images.push({
				data: result.imageData,
				mimeType: result.mimeType,
				caption: promptData.caption,
				description: promptData.description,
				position: promptData.position,
				size: result.size
			});
		} else {
			console.warn(`[Cloudflare Image LKPD] Failed to generate image ${i + 1}:`, result.error);
		}

		// Small delay between requests
		if (i < prompts.length - 1) {
			await new Promise(resolve => setTimeout(resolve, 100));
		}
	}

	return images;
}

/**
 * Generate images for Soal based on detected image requirements
 * Only generates images if questions explicitly need them (soal bergambar)
 * 
 * @param {Object} userInput - User input data
 * @param {Object} state - Current orchestrator state (optional)
 * @param {string} apiUrl - Cloudflare Worker URL
 * @param {string} apiKey - API key
 * @param {number} imageCount - Number of images to generate (min: 1, max: 5)
 * @returns {Promise<Array>} - Array of generated images
 */
export async function generateSoalImages(userInput, state, apiUrl, apiKey, imageCount = 2) {
	const images = [];
	const { topik, mapel, kelas, jenis } = userInput;
	
	// Get image requirements from state (if available)
	const imageRequirements = state?.soalGeneration?.imageRequirements || [];
	
	// If no image requirements detected, return empty array
	if (imageRequirements.length === 0) {
		console.log('[Cloudflare Image Soal] No image requirements detected, skipping image generation');
		return images;
	}
	
	console.log(`[Cloudflare Image Soal] Found ${imageRequirements.length} soal bergambar, generating images...`);
	
	// Generate images based on requirements (max 5)
	const count = Math.min(imageRequirements.length, 5);

	// Generate images sequentially based on requirements
	for (let i = 0; i < count; i++) {
		const requirement = imageRequirements[i];
		const description = requirement.description;
		
		console.log(`[Cloudflare Image Soal] Generating image ${i + 1}/${count}: ${description}`);
		
		// Build prompt from requirement description
		const prompt = buildEducationalPrompt({ 
			judulModul: topik, 
			mapel, 
			kelas, 
			topik: description, 
			style: 'educational' 
		});
		
		const result = await generateImageCloudflare(prompt, apiUrl, apiKey);
		
		if (result.success) {
			images.push({
				data: result.imageData,
				mimeType: result.mimeType,
				caption: description,
				description: description,
				position: `soal-${i + 1}`,
				size: result.size
			});
		} else {
			console.warn(`[Cloudflare Image Soal] Failed to generate image ${i + 1}:`, result.error);
		}

		// Small delay between requests
		if (i < count - 1) {
			await new Promise(resolve => setTimeout(resolve, 100));
		}
	}

	return images;
}

/**
 * Build activity-based prompt for LKPD
 * 
 * @param {Object} params - Parameters
 * @returns {string} - Activity-focused prompt
 */
function buildActivityPrompt({ topik, mapel, kelas, jenisKegiatan }) {
	const activityType = jenisKegiatan || 'pembelajaran umum';
	
	const activityStyles = {
		'eksperimen': 'students conducting experiment',
		'observasi': 'students observing and taking notes',
		'diskusi': 'students in group discussion',
		'latihan': 'students practicing exercises',
		'pembelajaran umum': 'students learning actively'
	};
	
	const activity = activityStyles[activityType] || activityStyles['pembelajaran umum'];
	
	const prompt = `${activity} about ${topik}, ${mapel} subject, Indonesian grade ${kelas}, classroom setting, educational illustration, bright and engaging, professional quality, no text`;
	
	console.log('[Cloudflare Image] Generated activity prompt:', prompt);
	
	return prompt;
}
