/**
 * generate-image.tool.js — Pure Tool (no LLM)
 * Memanggil endpoint generate-image untuk membuat ilustrasi AI.
 */

export async function generateImage({ prompt }) {
	try {
		const res = await fetch('/api/generate-image', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ prompt })
		});
		if (!res.ok) return { success: false, error: 'Image generation gagal' };
		const data = await res.json();
		return { success: true, url: data.url };
	} catch (error) {
		return { success: false, error: error.message };
	}
}
