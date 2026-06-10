import { BaseAgent } from '../base-agent.js';
import { runSubAgents } from '../../tools/run-sub-agents.tool.js';
import { generateDocx } from '../../tools/generate-docx.tool.js';
import { writeDB } from '../../tools/write-db.tool.js';
import { lkpdStandarTemplate } from '../../templates/lkpd-standar.template.js';
import { lkpdTabelTemplate } from '../../templates/lkpd-tabel.template.js';
import { getSectionDef, SECTION_REGISTRY } from '../../templates/section-registry.js';

const TEMPLATE_REGISTRY = {
	'lkpd-standar': lkpdStandarTemplate,
	'lkpd-tabel':   lkpdTabelTemplate
};

/**
 * Resolve sectionDefs dari template LKPD.
 * Logika identik dengan modul-ajar.agent.js — jangan ubah polanya.
 */
function resolveSectionDefs(template) {
	if (!template.templateId?.startsWith('custom-')) {
		return Object.fromEntries(
			template.sections.map(s => [s.agentKey, s.sectionDef])
		);
	}

	return Object.fromEntries(
		template.sections.map(s => {
			const defaultDef = getSectionDef(s.agentKey);

			if (s.promptMode !== 'custom' || !defaultDef) {
				return [s.agentKey, defaultDef ?? {
					namaSection: s.title,
					instruksi: `Hasilkan konten untuk bagian ${s.title} dalam konteks LKPD.`,
					outputSchema: '{ "konten": "string" }'
				}];
			}

			const customFieldInstruksi = s.customFieldInstruksi ?? {};
			const registryFields = SECTION_REGISTRY[s.agentKey]?.customPromptFields ?? [];

			const fieldOverrides = registryFields
				.filter(f => customFieldInstruksi[f.key]?.trim())
				.map(f => `- ${f.label}: ${customFieldInstruksi[f.key].trim()}`)
				.join('\n');

			const instruksiFinal = fieldOverrides
				? `${defaultDef.instruksi}\n\nINSTRUKSI KHUSUS DARI GURU:\n${fieldOverrides}`
				: defaultDef.instruksi;

			return [s.agentKey, {
				namaSection: defaultDef.namaSection,
				instruksi: instruksiFinal,
				outputSchema: defaultDef.outputSchema
			}];
		})
	);
}

export class LKPDAgent extends BaseAgent {
	constructor() {
		super('LKPDAgent', 'Koordinator LKPD', 'End-to-end pembuatan Lembar Kerja Peserta Didik');
	}

	buildIdentitasFromInput(input) {
		const kelasToFase = {
			I: 'Fase A', II: 'Fase A', III: 'Fase B', IV: 'Fase B', V: 'Fase C', VI: 'Fase C',
			VII: 'Fase D', VIII: 'Fase D', IX: 'Fase D', X: 'Fase E', XI: 'Fase F', XII: 'Fase F'
		};
		const fase = input.fase || kelasToFase[input.kelas] || '';

		return {
			judul: input.judul,
			identitas: {
				satuan: input.jenjang,
				fase,
				kelas: `Kelas ${input.kelas}`,
				mataPelajaran: input.mapel,
				penulis: input.penulis || 'Guru Mata Pelajaran',
				instansi: input.instansi || 'Sekolah'
			},
			alokasiWaktu: input.alokasiWaktu || input.alokasiPerPertemuan || '2x40 menit',
			jenisKegiatan: Array.isArray(input.jenisKegiatan)
				? input.jenisKegiatan.join(', ')
				: (input.jenisKegiatan || ''),
			polaBelajar: input.polaBelajar || 'berkelompok',
			deskripsiUmum: ''
		};
	}

	async run(userInput, onProgress) {
		this.log(`Starting: "${userInput.judul}"`);
		onProgress?.({ type: 'agent', name: 'LKPDAgent', action: 'start',
			message: `LKPDAgent → memulai "${userInput.judul}"` });

		// ── 1. Load template ──
		let template = TEMPLATE_REGISTRY[userInput.templateId] ?? lkpdStandarTemplate;

		if (userInput.templateId?.startsWith('custom-') && userInput.customSections?.length > 0) {
			template = {
				templateId: userInput.templateId,
				jenis: 'lkpd',
				isSystemTemplate: false,
				sections: userInput.customSections
			};
		}
		this.log(`Template: ${template.templateId}`);

		// ── 2. Build identitas ──
		onProgress?.({ type: 'agent', name: 'LKPDAgent', action: 'info',
			message: 'LKPDAgent → membangun identitas dari userInput (no AI call)' });
		const identitasSchema = this.buildIdentitasFromInput(userInput);

		// ── 3. Group sections per batch ──
		const batchMap = {};
		for (const section of template.sections) {
			if (!batchMap[section.batch]) batchMap[section.batch] = [];
			batchMap[section.batch].push(section);
		}
		const batchNumbers = Object.keys(batchMap).map(Number).sort((a, b) => a - b);

		// ── 4. Akumulasi context & token ──
		let mergedContext = { identitas: identitasSchema };
		const totalTokenUsage = { input: 0, cached: 0, output: 0 };

		// ── 5. Jalankan tiap batch sequential ──
		for (const batchNum of batchNumbers) {
			const sectionsInBatch = batchMap[batchNum];
			const agentKeys = sectionsInBatch.map((s) => s.agentKey);
			const criticalKeys = sectionsInBatch.filter((s) => s.critical).map((s) => s.agentKey);

			const sectionDefs = resolveSectionDefs(template);
			const batchSectionDefs = {};
			for (const section of sectionsInBatch) {
				if (sectionDefs[section.agentKey]) {
					batchSectionDefs[section.agentKey] = sectionDefs[section.agentKey];
				}
			}

			onProgress?.({ type: 'agent', name: 'LKPDAgent', action: 'batch_start',
				batch: batchNum, agents: agentKeys,
				message: `Batch ${batchNum} → ${agentKeys.join(', ')}` });

			const batchResult = await runSubAgents({
				agents: agentKeys,
				input: userInput,
				context: mergedContext,
				critical: criticalKeys,
				sectionDefs: batchSectionDefs,
				onProgress
			});

			if (!batchResult.success) {
				return this.fail(`Batch ${batchNum} gagal: ${Object.values(batchResult.errors).join(', ')}`);
			}

			mergedContext = { ...mergedContext, ...batchResult.merged };

			if (batchResult.tokenUsage) {
				totalTokenUsage.input  += batchResult.tokenUsage.input  || 0;
				totalTokenUsage.cached += batchResult.tokenUsage.cached || 0;
				totalTokenUsage.output += batchResult.tokenUsage.output || 0;
			}

			onProgress?.({ type: 'agent', name: 'LKPDAgent', action: 'batch_done',
				batch: batchNum, message: `Batch ${batchNum} selesai ✓` });
		}

		// ── 6. Build fullSchema ──
		const { identitas: _dup, ...restContext } = mergedContext;
		const fullSchema = { identitas: identitasSchema, ...restContext };

		// ── 7. Generate DOCX ──
		onProgress?.({ type: 'tool', name: 'generate-docx', action: 'start',
			message: 'generate-docx → membuat file .docx LKPD...' });
		const docxResult = await generateDocx({ jenis: 'lkpd', schema: fullSchema, input: userInput });

		if (!docxResult.success) {
			onProgress?.({ type: 'tool', name: 'generate-docx', action: 'error',
				message: 'generate-docx → gagal ✗' });
			return this.fail('Gagal generate dokumen DOCX');
		}
		onProgress?.({ type: 'tool', name: 'generate-docx', action: 'done',
			message: 'generate-docx → selesai ✓' });

		// ── 8. Simpan ke DB ──
		onProgress?.({ type: 'tool', name: 'write-db', action: 'start',
			message: 'write-db → menyimpan ke database...' });

		const dbRecord = {
			userId: userInput.userId,
			judul: userInput.judul,
			mapel: userInput.mapel,
			kelas: userInput.kelas,
			jenjang: userInput.jenjang,
			alokasiWaktu: userInput.alokasiWaktu,
			jenisKegiatan: userInput.jenisKegiatan,
			polaBelajar: userInput.polaBelajar,
			templateId: userInput.templateId || 'lkpd-standar',
			schema: fullSchema
		};

		if (template.templateId?.startsWith('custom-')) {
			dbRecord.templateSections = template.sections;
		}

		writeDB('lkpd', dbRecord)
			.then(() => onProgress?.({ type: 'tool', name: 'write-db', action: 'done',
				message: 'write-db → tersimpan ✓' }))
			.catch(() => {});

		onProgress?.({ type: 'agent', name: 'LKPDAgent', action: 'completed',
			message: 'LKPDAgent → selesai ✓' });

		return {
			success: true,
			schema: fullSchema,
			fileBuffer: docxResult.buffer,
			fileName: `LKPD_${userInput.judul}.docx`,
			qualityScore: null,
			tokenUsage: totalTokenUsage,
			metadata: this.getMetadata()
		};
	}

	fail(error) {
		this.log(error, 'error');
		return { success: false, error };
	}
}
