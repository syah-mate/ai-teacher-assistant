/**
 * FlexSectionAgent — Agent untuk generate 1 section
 *
 * Menerima section (title + array fields + refinedFieldPrompts),
 * spawn semua FlexFieldAgent secara PARALEL, kumpulkan hasil.
 */

import { FlexFieldAgent } from './flex-field-agent.js';

export class FlexSectionAgent {
	/**
	 * @param {Object} section - { id, title, sectionPrompt, fields: [...] }
	 * @param {Object} refinedPrompts - { [fieldKey]: refinedPrompt }
	 */
	constructor(section, refinedPrompts) {
		this.section = section;
		this.refinedPrompts = refinedPrompts;
	}

	async execute(userContext, onProgress) {
		onProgress?.({
			type: 'section',
			action: 'start',
			sectionTitle: this.section.title,
			message: `Section "${this.section.title}" → spawn ${this.section.fields.length} field agent paralel`
		});

		// Spawn semua FieldAgent secara PARALEL
		const fieldPromises = this.section.fields.map((field) => {
			const refinedPrompt = this.refinedPrompts[field.key] ?? field.fieldPrompt;
			const agent = new FlexFieldAgent(field, refinedPrompt);
			return agent.execute(userContext).then((result) => {
				onProgress?.({
					type: 'field',
					action: result.success ? 'done' : 'error',
					sectionTitle: this.section.title,
					fieldKey: result.fieldKey,
					message: result.success
						? `Field "${field.label}" ✓`
						: `Field "${field.label}" gagal: ${result.error}`
				});
				return result;
			});
		});

		const settled = await Promise.allSettled(fieldPromises);

		// Kumpulkan hasil
		const fields = {};
		for (const s of settled) {
			if (s.status === 'fulfilled' && s.value.success) {
				fields[s.value.fieldKey] = s.value.content;
			}
		}

		onProgress?.({
			type: 'section',
			action: 'done',
			sectionTitle: this.section.title,
			message: `Section "${this.section.title}" selesai (${Object.keys(fields).length}/${this.section.fields.length} field berhasil)`
		});

		return {
			success: Object.keys(fields).length > 0,
			sectionId: this.section.id,
			title: this.section.title,
			fields
		};
	}
}
