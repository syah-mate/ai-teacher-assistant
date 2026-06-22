/**
 * FlexOrchestrator — Agent utama pipeline generasi
 *
 * Tanggung jawab:
 * 1. Baca template dari DB (user_templates)
 * 2. Loop section sequential
 * 3. Sempurnakan prompt tiap field via AI
 * 4. Spawn SectionAgent untuk setiap section
 * 5. Kumpulkan context, hasilkan output final
 */

import { getCollection } from '$lib/server/db.js';
import { ObjectId } from 'mongodb';
import { callGeminiAPI } from '$lib/utils/gemini-client.js';
import { FlexSectionAgent } from './flex-section-agent.js';

export class FlexOrchestrator {
	async generate(templateId, userContext, onProgress) {
		// ── STEP 1: Load template dari DB ────────────────────────────────
		const template = await this._loadTemplate(templateId);
		if (!template) {
			return { success: false, error: `Template tidak ditemukan: ${templateId}` };
		}

		onProgress?.({
			type: 'orchestrator',
			action: 'start',
			message: `Orchestrator → template "${template.name}" (${template.sections.length} section)`
		});

		const accumulatedContext = {}; // { sectionTitle: { fieldKey: content } }
		const sectionResults = [];

		// ── STEP 2: Loop sequential per section ─────────────────────────
		for (let i = 0; i < template.sections.length; i++) {
			const section = template.sections[i];

			onProgress?.({
				type: 'orchestrator',
				action: 'refining_prompts',
				sectionTitle: section.title,
				message: `Orchestrator → menyempurnakan prompt untuk section "${section.title}" (${i + 1}/${template.sections.length})`
			});

			// ── STEP 2a: Sempurnakan prompt setiap field di section ini ───
			const refinedPromptsResult = await this._refineFieldPrompts({
				template,
				section,
				userContext,
				accumulatedContext
			});

			// Jika refinement gagal, gunakan prompt asli dari user
			const refinedPrompts = refinedPromptsResult.success
				? refinedPromptsResult.refined
				: Object.fromEntries(section.fields.map((f) => [f.key, f.fieldPrompt]));

			// ── STEP 2b: Spawn SectionAgent ──────────────────────────────
			const sectionAgent = new FlexSectionAgent(section, refinedPrompts);
			const sectionResult = await sectionAgent.execute(userContext, onProgress);

			sectionResults.push(sectionResult);

			// ── STEP 2c: Simpan ke accumulatedContext ────────────────────
			if (sectionResult.success) {
				accumulatedContext[section.title] = sectionResult.fields;
			}
		}

		// ── STEP 3: Render ke HTML ────────────────────────────────────────
		onProgress?.({
			type: 'orchestrator',
			action: 'rendering',
			message: 'Orchestrator → merender semua section ke HTML...'
		});

		// Import renderer dynamically to avoid client-side bundling issues
		const { renderToHtml } = await import('$lib/utils/html-renderer.js');
		const htmlOutput = renderToHtml(template, sectionResults);

		onProgress?.({
			type: 'orchestrator',
			action: 'done',
			message: 'Orchestrator → selesai ✓'
		});

		return {
			success: true,
			templateName: template.name,
			sections: sectionResults,
			htmlOutput
		};
	}

	/**
	 * Call AI untuk menyempurnakan fieldPrompt setiap field di section ini.
	 */
	async _refineFieldPrompts({ template, section, userContext, accumulatedContext }) {
		const contextSummary = this._summarizeContext(accumulatedContext);
		const fieldList = section.fields
			.map(
				(f, i) =>
					`${i + 1}. key: "${f.key}", label: "${f.label}", type: "${f.type}"\n   Instruksi user: "${f.fieldPrompt}"`
			)
			.join('\n\n');

		const prompt = [
			'Kamu adalah orchestrator yang bertugas menyempurnakan instruksi untuk setiap field dalam satu section dokumen.',
			'',
			'=== KONTEKS TEMPLATE ===',
			template.templatePrompt || '(tidak ada)',
			'',
			'=== KONTEKS DOKUMEN ===',
			this._formatUserContext(userContext),
			'',
			'=== SECTION SAAT INI ===',
			`Judul Section: ${section.title}`,
			`Instruksi Section: ${section.sectionPrompt || '(tidak ada)'}`,
			'',
			'=== HASIL SECTION SEBELUMNYA ===',
			contextSummary,
			'',
			'=== FIELD-FIELD YANG HARUS DISEMPURNAKAN ===',
			fieldList,
			'',
			'=== INSTRUKSI ===',
			'Untuk setiap field di atas, sempurnakan "instruksi user" dengan menambahkan:',
			'1. Detail spesifik dari konteks dokumen (gunakan nilai nyata dari KONTEKS DOKUMEN di atas)',
			'2. Referensi ke hasil section sebelumnya yang relevan (jika ada)',
			'3. Instruksi konsistensi antar field dalam section yang sama',
			'PENTING: Jangan ubah maksud asli instruksi user. Hanya PERKAYA dan SPESIFIKASI.',
			'',
			'OUTPUT: JSON valid saja, tidak ada teks lain.',
			'{ "fieldKey1": "refined prompt...", "fieldKey2": "refined prompt..." }'
		].join('\n');

		const result = await callGeminiAPI(prompt, { timeout: 60000, maxRetries: 2 });
		if (!result.success) return { success: false };

		try {
			const clean = result.data.replace(/```json|```/g, '').trim();
			const refined = JSON.parse(clean);
			return { success: true, refined };
		} catch {
			return { success: false };
		}
	}

	async _loadTemplate(templateId) {
		try {
			const col = await getCollection('user_templates');
			const doc = await col.findOne({ _id: new ObjectId(templateId) });
			if (!doc) return null;
			return { ...doc, _id: doc._id.toString() };
		} catch {
			return null;
		}
	}

	_summarizeContext(accumulatedContext) {
		if (Object.keys(accumulatedContext).length === 0) {
			return 'Ini section pertama — belum ada hasil section sebelumnya.';
		}
		const lines = [];
		for (const [sectionTitle, fields] of Object.entries(accumulatedContext)) {
			lines.push(`\n[${sectionTitle}]`);
			for (const [key, value] of Object.entries(fields)) {
				const preview =
					typeof value === 'string'
						? value.slice(0, 150)
						: JSON.stringify(value).slice(0, 150);
				lines.push(`  ${key}: ${preview}${preview.length >= 150 ? '...' : ''}`);
			}
		}
		return lines.join('\n');
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
}
