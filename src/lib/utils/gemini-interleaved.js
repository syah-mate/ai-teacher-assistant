/**
 * Gemini Interleaved Text + Image API Client
 * 
 * Call Gemini API yang menghasilkan text dan gambar sekaligus
 * menggunakan model gemini-2.5-flash-image dengan responseModalities
 */

/**
 * Call Gemini API dengan output interleaved (text + images)
 * 
 * @param {string} prompt - Prompt untuk generate content
 * @param {string} apiKey - Gemini API key
 * @param {string} modelName - Model name (default: gemini-2.5-flash-image)
 * @returns {Promise<{success: boolean, textBlocks?: string[], images?: Array, error?: string}>}
 */
export async function callGeminiInterleaved(prompt, apiKey, modelName = 'gemini-2.5-flash-image') {
	try {
		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents: [
						{
							role: 'user',
							parts: [{ text: prompt }]
						}
					],
					generationConfig: {
						responseModalities: ['TEXT', 'IMAGE'], // CRITICAL: Enable image output
						temperature: 0.9
					}
				})
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			
			// Log detailed error for debugging
			console.error('[Gemini Interleaved] API Error:', {
				status: response.status,
				statusText: response.statusText,
				errorMessage: errorData.error?.message,
				fullError: errorData
			});
			
			if (response.status === 429) {
				return {
					success: false,
					error: 'Rate limit tercapai. Silakan tunggu sebentar.'
				};
			}
			
			// Check if model/feature not available
			if (response.status === 400 || response.status === 404) {
				return {
					success: false,
					error: `Model ${modelName} dengan image generation tidak tersedia. Error: ${errorData.error?.message || 'Unknown'}`
				};
			}
			
			return {
				success: false,
				error: errorData.error?.message || `API Error: ${response.status} ${response.statusText}`
			};
		}

		const data = await response.json();
		
		// Debug: Log full response
		console.log('[Gemini Interleaved] Full response:', JSON.stringify(data, null, 2));
		
		// Parse response parts (text dan image blocks)
		const parts = data.candidates?.[0]?.content?.parts || [];
		
		console.log('[Gemini Interleaved] Parts count:', parts.length);
		
		const textBlocks = [];
		const images = [];

		for (const part of parts) {
			if (part.text) {
				console.log('[Gemini Interleaved] Found text block, length:', part.text.length);
				textBlocks.push(part.text);
			} else if (part.inlineData) {
				console.log('[Gemini Interleaved] Found image block, mimeType:', part.inlineData.mimeType, 'data length:', part.inlineData.data?.length);
				images.push({
					mimeType: part.inlineData.mimeType,
					data: part.inlineData.data, // base64 string
					dataUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
				});
			}
		}

		console.log('[Gemini Interleaved] Result - Text blocks:', textBlocks.length, 'Images:', images.length);

		return {
			success: true,
			textBlocks,
			images,
			rawParts: parts
		};

	} catch (error) {
		console.error('Gemini Interleaved error:', error);
		return {
			success: false,
			error: error.message || 'Terjadi kesalahan saat memanggil Gemini API'
		};
	}
}

/**
 * Build prompt for interleaved text+image modul ajar
 * 
 * @param {Object} userInput - Data dari user
 * @param {Object} context - Context dari agents sebelumnya
 * @returns {string}
 */
export function buildInterleavedPrompt(userInput, context) {
	const { judulModul, mapel, kelas, jumlahPertemuan, metode } = userInput;
	const pertemuanData = context.kegiatanPembelajaran?.pertemuan || [];

	// Pilih 2 pertemuan untuk dibuatkan gambar
	const pertemuan1 = pertemuanData[0] || {};
	const pertemuanTengah = pertemuanData[Math.floor(pertemuanData.length / 2)] || {};

	return `Create 2 educational illustrations for a learning module about "${judulModul}" for ${mapel} class ${kelas}.

For EACH illustration, follow this exact pattern:

STEP 1 - First Illustration:
1. Write a 2-sentence description in Indonesian explaining what the illustration shows
2. CREATE AN IMAGE: A classroom scene showing students learning ${mapel} using ${metode} method, topic: "${pertemuan1.judulPertemuan || judulModul}", educational style, suitable for Indonesian grade ${kelas}

STEP 2 - Second Illustration:
1. Write a 2-sentence description in Indonesian explaining what the diagram shows
2. CREATE AN IMAGE: An infographic or diagram visualizing key concepts of ${mapel} topic "${pertemuanTengah.judulPertemuan || judulModul}", clear and informative, suitable for grade ${kelas}

IMPORTANT:
- Output MUST alternate: text → image → text → image
- Each image MUST be generated after its description
- Images must be educational, professional, and appropriate for Indonesian schools
- Use modern, clean illustration style

Start now and generate both text descriptions AND images!`;
}
