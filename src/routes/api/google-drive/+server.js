import { json } from '@sveltejs/kit';
import { GOOGLE_DRIVE_API_KEY } from '$env/static/private';

export async function POST({ request, locals }) {
	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { action, fileId, fileName, mimeType, content } = body;

		if (!GOOGLE_DRIVE_API_KEY) {
			return json(
				{ error: 'Google Drive API Key not configured on server' },
				{ status: 500 }
			);
		}

		// Handle different Google Drive actions
		switch (action) {
			case 'upload': {
				// Upload file to Google Drive
				const metadata = {
					name: fileName,
					mimeType: mimeType
				};

				const formData = new FormData();
				formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
				formData.append('file', new Blob([content], { type: mimeType }));

				const response = await fetch(
					`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&key=${GOOGLE_DRIVE_API_KEY}`,
					{
						method: 'POST',
						body: formData
					}
				);

				if (!response.ok) {
					const error = await response.json();
					return json({ error: 'Google Drive upload failed', details: error }, { status: response.status });
				}

				const data = await response.json();
				return json({ success: true, fileId: data.id, webViewLink: data.webViewLink });
			}

			case 'list': {
				// List files from Google Drive
				const response = await fetch(
					`https://www.googleapis.com/drive/v3/files?key=${GOOGLE_DRIVE_API_KEY}`,
					{
						method: 'GET',
						headers: {
							'Content-Type': 'application/json'
						}
					}
				);

				if (!response.ok) {
					const error = await response.json();
					return json({ error: 'Google Drive list failed', details: error }, { status: response.status });
				}

				const data = await response.json();
				return json(data);
			}

			default:
				return json({ error: 'Invalid action' }, { status: 400 });
		}
	} catch (error) {
		console.error('Google Drive API error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
