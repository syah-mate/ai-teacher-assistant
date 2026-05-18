/**
 * generate-image.tool.js — Pure Tool (no LLM)
 * Memanggil Cloudflare Workers AI untuk membuat ilustrasi per pertemuan.
 */

/**
 * @param {{ jenis?: string, userInput: Object, schema: Object }} params
 * @returns {Promise<{ success: boolean, images: Array, error?: string }>}
 */
export async function generateImage({ jenis = 'modul_ajar', userInput, schema }) {
	const endpoint = jenis === 'lkpd' ? '/api/generate-lkpd-images' : '/api/generate-modul-images';
	const imageCount = schema?.kegiatan?.pertemuan?.length || 2;
	try {
		const res = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userInput, state: schema, imageCount })
		});
		if (!res.ok) return { success: false, images: [], error: 'Image generation gagal' };
		const data = await res.json();
		return { success: true, images: data.images || [] };
	} catch (error) {
		return { success: false, images: [], error: error.message };
	}
}
