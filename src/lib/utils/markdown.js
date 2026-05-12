import { marked } from 'marked';

// Konfigurasi marked
marked.setOptions({
	breaks: true,
	gfm: true
});

/**
 * Parse markdown string → HTML string
 * @param {string} text
 * @returns {string} HTML
 */
export function renderMarkdown(text) {
	if (!text) return '';
	return marked.parse(text);
}

/**
 * Render markdown + ganti image placeholders dengan <img> tag
 * Digunakan di halaman soal, lkpd, modul-ajar
 *
 * @param {string} text - Teks output dari AI (markdown)
 * @param {Array<{data: string, mimeType: string, caption?: string, description?: string}>} [images]
 * @returns {string} HTML siap render
 */
export function renderMarkdownWithImages(text, images) {
	if (!text) return '';
	if (!images || images.length === 0) return marked.parse(text);

	// Ganti placeholder dengan token unik sebelum markdown parse
	// agar tidak terganggu oleh markdown renderer
	const PLACEHOLDER = '[Image embedded - visible in .docx download]';
	const tokens = [];
	let processed = text;
	let imageIndex = 0;

	processed = processed.replace(new RegExp(escapeRegex(PLACEHOLDER), 'g'), () => {
		const token = `<!--IMG_TOKEN_${imageIndex}-->`;
		if (imageIndex < images.length) {
			const img = images[imageIndex];
			tokens.push(
				`<figure class="my-4" style="text-align:center;"><img src="data:${img.mimeType};base64,${img.data}" alt="${img.caption || `Ilustrasi ${imageIndex + 1}`}" style="width:600px;max-width:100%;height:300px;object-fit:cover;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1);display:inline-block;" />${img.caption ? `<figcaption style="font-size:.8rem;color:#6b7280;text-align:center;margin-top:.25rem;font-style:italic;">${img.caption}</figcaption>` : ''}</figure>`
			);
		} else {
			tokens.push('');
		}
		imageIndex++;
		return token;
	});

	// Parse markdown
	let html = marked.parse(processed);

	// Kembalikan token dengan tag gambar
	tokens.forEach((imgHtml, i) => {
		html = html.replace(`<!--IMG_TOKEN_${i}-->`, imgHtml);
	});

	return html;
}

/**
 * Escape string untuk digunakan dalam RegExp
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
