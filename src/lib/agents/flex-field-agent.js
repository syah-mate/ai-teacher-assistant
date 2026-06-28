/**
 * FlexFieldAgent — Agent untuk generate 1 field
 *
 * Menerima 1 field (key, label, type, refinedPrompt) + context, call AI 1x, return konten.
 */

import { callGeminiAPI } from '$lib/utils/gemini-client.js';

export class FlexFieldAgent {
	/**
	 * @param {Object} field - { id, key, label, type, fieldPrompt }
	 * @param {string} refinedPrompt - Prompt yang sudah disempurnakan oleh Orchestrator
	 */
	constructor(field, refinedPrompt) {
		this.field = field;
		this.refinedPrompt = refinedPrompt;
	}

	async execute(userContext) {
		const outputInstruction = this._buildOutputInstruction();

		const promptText = [
			this.refinedPrompt,
			'',
			'KONTEKS DOKUMEN:',
			this._formatUserContext(userContext),
			'',
			outputInstruction
		].join('\n');

		// Cek apakah ada gambar di userContext (field tipe 'file')
		const images = this._extractImages(userContext);

		// Jika ada gambar, bangun content array untuk vision API
		// Jika tidak ada, kirim string biasa seperti sebelumnya
		const content =
			images.length > 0
				? [
						{ type: 'text', text: promptText },
						...images.map((url) => ({ type: 'image_url', image_url: { url } }))
					]
				: promptText;

		const result = await callGeminiAPI(content, { timeout: 120000, maxRetries: 3 });

		if (!result.success) {
			return { success: false, error: result.error, fieldKey: this.field.key };
		}

		const parsed = this._parseResult(result.data);
		return { success: true, fieldKey: this.field.key, content: parsed };
	}

	_buildOutputInstruction() {
		const key = this.field.key;
		switch (this.field.type) {
			case 'array':
				return `OUTPUT: JSON valid saja, format: { "${key}": ["string", "string", ...] }`;
			case 'array-object':
				return `OUTPUT: JSON valid saja, format: { "${key}": [{ ... }, { ... }] } — struktur object sesuai instruksi di atas`;
			case 'keyvalue':
				return `OUTPUT: JSON valid saja, format: { "${key}": [{"nama": "...", "value": "..."}, ...] } — array of object dengan 2 key: "nama" (nama field/baris) dan "value" (nilainya). Jumlah baris fleksibel sesuai kebutuhan.`;
			case 'richtext':
				return `OUTPUT: JSON valid saja, format: { "${key}": "<p>HTML string...</p>" }`;
			case 'number':
				return `OUTPUT: JSON valid saja, format: { "${key}": 42 }`;
			default: // text
				return `OUTPUT: JSON valid saja, format: { "${key}": "string konten..." }`;
		}
	}

	_formatUserContext(ctx) {
		return Object.entries(ctx)
			.filter(([, v]) => {
				if (Array.isArray(v)) {
					// Skip jika semua element adalah base64 images
					if (v.length > 0 && typeof v[0] === 'string' && v[0].startsWith('data:image/')) return false;
					return v.length > 0;
				}
				if (typeof v === 'string' && v.startsWith('data:image/')) return false; // skip gambar
				return v !== null && v !== undefined && v !== '';
			})
			.map(([k, v]) => {
				const val = Array.isArray(v) ? v.join(', ') : v;
				return `${k}: ${val}`;
			})
			.join('\n');
	}

	/**
	 * Ekstrak semua value dari userContext yang merupakan base64 image dataURL.
	 * Ini adalah field bertipe 'file' yang sudah dikonversi di browser.
	 * @param {Object} ctx
	 * @returns {string[]} array base64 dataURL
	 */
	_extractImages(ctx) {
		const images = [];
		for (const v of Object.values(ctx)) {
			if (typeof v === 'string' && v.startsWith('data:image/')) {
				images.push(v);
			} else if (Array.isArray(v)) {
				// multi-page PDF yang disimpan sebagai array
				for (const item of v) {
					if (typeof item === 'string' && item.startsWith('data:image/')) {
						images.push(item);
					}
				}
			}
		}
		return images;
	}

	_parseResult(rawText) {
		try {
			const clean = rawText.replace(/```json|```/g, '').trim();
			const parsed = JSON.parse(clean);
			return parsed[this.field.key] ?? parsed;
		} catch {
			return rawText.trim();
		}
	}
}
