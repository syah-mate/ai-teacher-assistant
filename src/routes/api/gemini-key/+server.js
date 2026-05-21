/**
 * API Endpoint: /api/gemini-key
 * Legacy endpoint — no longer provides per-key access.
 * OpenRouter is now used server-side with a single OPENROUTER_API_KEY.
 */

import { json } from '@sveltejs/kit';

export async function GET({ locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	return json({ error: 'API key management is no longer available. The system uses OpenRouter.' }, { status: 410 });
}

