/**
 * Parse response dari Gemini yang berformat JSON array sections.
 * Fallback ke plain text jika bukan JSON valid.
 *
 * @param {string} rawResponse - Raw string dari Gemini
 * @returns {Array<{type: 'text'|'image', content?: string, prompt?: string}>}
 */
export function parseInterleavedResponse(rawResponse) {
	if (!rawResponse) return [];

	// Bersihkan backtick markdown code block jika ada
	const cleaned = rawResponse
		.replace(/^```json\s*/i, '')
		.replace(/^```\s*/i, '')
		.replace(/```\s*$/i, '')
		.trim();

	try {
		const parsed = JSON.parse(cleaned);
		if (Array.isArray(parsed)) {
			return parsed.filter(
				(section) =>
					section &&
					typeof section === 'object' &&
					(section.type === 'text' || section.type === 'image')
			);
		}
	} catch (e) {
		// Bukan JSON — fallback ke plain text section
		console.warn('[parseInterleavedResponse] Response bukan JSON, fallback ke text:', e.message);
	}

	// Fallback: wrap sebagai satu text section
	return [{ type: 'text', content: rawResponse }];
}
