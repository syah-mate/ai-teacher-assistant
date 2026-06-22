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

		const prompt = [
			this.refinedPrompt,
			'',
			'KONTEKS DOKUMEN:',
			this._formatUserContext(userContext),
			'',
			outputInstruction
		].join('\n');

		const result = await callGeminiAPI(prompt, { timeout: 90000, maxRetries: 2 });

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
				if (Array.isArray(v)) return v.length > 0;
				return v !== null && v !== undefined && v !== '';
			})
			.map(([k, v]) => {
				const val = Array.isArray(v) ? v.join(', ') : v;
				return `${k}: ${val}`;
			})
			.join('\n');
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
