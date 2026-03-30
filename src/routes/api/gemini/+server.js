import { json } from '@sveltejs/kit';
import { GEMINI_API_KEY } from '$env/static/private';

export async function POST({ request, locals }) {
	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { prompt, model = 'gemini-pro' } = body;

		if (!prompt) {
			return json({ error: 'Prompt is required' }, { status: 400 });
		}

		if (!GEMINI_API_KEY) {
			return json(
				{ error: 'Gemini API Key not configured on server' },
				{ status: 500 }
			);
		}

		// Call Gemini API with server-side API key
		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					contents: [{ parts: [{ text: prompt }] }]
				})
			}
		);

		if (!response.ok) {
			const error = await response.json();
			return json({ error: 'Gemini API error', details: error }, { status: response.status });
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('Gemini API error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
