/**
 * generate-html.tool.js — Pure Tool (no LLM)
 * Generate preview HTML dari schema dokumen pembelajaran.
 */

export async function generateHTML({ jenis, schema }) {
	try {
		const res = await fetch('/api/export-html', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ jenis, schema })
		});
		if (!res.ok) return { success: false, error: 'HTML generation gagal' };
		const { html } = await res.json();
		return { success: true, html };
	} catch (error) {
		return { success: false, error: error.message };
	}
}
