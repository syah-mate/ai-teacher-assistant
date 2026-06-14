// src/lib/agents/section-agent.js
//
// Agent level 2 — menjembatani Orchestrator dan SchemaSubAgent.
//
// Tanggung jawab:
// 1. Terima brief (name, role, expertise, prompt) dari Orchestrator
// 2. Parse outputSchema section → extract per-field schema
// 3. Call AI → generate N brief SchemaSubAgent (1 per field)
//    Brief HARUS embed context accumulated agar output saling relate
// 4. Spawn semua SchemaSubAgent secara PARALEL
// 5. Collect semua hasil → call AI untuk merge menjadi JSON valid sesuai outputSchema
// 6. Return { sectionKey, schema } ke Orchestrator

import { BaseAgent } from './base-agent.js';
import { SchemaSubAgent } from './schema-sub-agent.js';
import { callGeminiAPI } from '../utils/gemini-client.js';

export class SectionAgent extends BaseAgent {
  /**
   * @param {string} name          - Nama agent (dari brief Orchestrator)
   * @param {string} role          - Role agent
   * @param {string} expertise     - Expertise agent
   * @param {string} sectionPrompt - Prompt dari Orchestrator (context-aware)
   * @param {Object} sectionSchema - Object dari SECTION_SCHEMAS[key]
   */
  constructor(name, role, expertise, sectionPrompt, sectionSchema) {
    super(name, role, expertise);
    this.sectionPrompt  = sectionPrompt;
    this.sectionSchema  = sectionSchema; // { key, label, outputSchema, contextHint }
  }

  /**
   * @param {Object} userInput         - Input form user
   * @param {Object} accumulatedContext - Hasil semua section sebelumnya (mergedContext)
   * @param {Function} onProgress      - SSE callback
   * @returns {Promise<{ success, schema, tokenUsage }>}
   */
  async execute(userInput, accumulatedContext = {}, onProgress) {
    console.log(`%cAgent ${this.name} start`, 'color: purple;');

    const totalTokenUsage = { input: 0, cached: 0, output: 0 };

    // ── STEP 1: Parse outputSchema → extract field-level schemas ──────────
    const fieldSchemas = this._parseOutputSchema(this.sectionSchema.outputSchema);

    onProgress?.({
      type: 'section-agent',
      name: this.name,
      action: 'briefing_schemas',
      section: this.sectionSchema.key,
      message: `${this.name} → generate brief untuk ${fieldSchemas.length} field schema`
    });

    // ── STEP 2: Call AI → generate brief per field ────────────────────────
    const briefsResult = await this._generateSchemaBriefs(fieldSchemas, userInput, accumulatedContext);

    if (!briefsResult.success) {
      console.log(`%cAgent ${this.name} finished (error)`, 'color: red;');
      return { success: false, error: briefsResult.error, tokenUsage: totalTokenUsage };
    }

    if (briefsResult.tokenUsage) {
      totalTokenUsage.input  += briefsResult.tokenUsage.input  || 0;
      totalTokenUsage.output += briefsResult.tokenUsage.output || 0;
    }

    const schemaBriefs = briefsResult.briefs; // Array<{ fieldKey, name, role, expertise, prompt }>

    // Log setiap brief prompt ke console monitor
    for (const brief of schemaBriefs) {
      onProgress?.({
        type: 'sub-agent',
        action: 'brief_prompt',
        section: this.sectionSchema.key,
        agentName: brief.name,
        fieldKey: brief.fieldKey,
        message: `${this.name} → brief prompt untuk ${brief.name} (field: ${brief.fieldKey}):\n\n${brief.prompt}`
      });
    }

    onProgress?.({
      type: 'section-agent',
      name: this.name,
      action: 'spawning_sub_agents',
      section: this.sectionSchema.key,
      message: `${this.name} → spawn ${schemaBriefs.length} SchemaSubAgent secara paralel`
    });

    // ── STEP 3: Spawn semua SchemaSubAgent PARALEL ─────────────────────────
    console.log(`%cAgent ${this.name} spawn ${schemaBriefs.map(b => b.name).join(', ')}`, 'color: purple;');
    const subAgentPromises = schemaBriefs.map(brief => {
      const fieldSchema = fieldSchemas.find(f => f.key === brief.fieldKey);
      const agent = new SchemaSubAgent(
        brief.name,
        brief.role,
        brief.expertise,
        brief.prompt,
        brief.fieldKey,
        fieldSchema?.schema || 'string'
      );
      return agent.execute(userInput).then(result => ({ ...result, agentName: brief.name }));
    });

    const settledResults = await Promise.allSettled(subAgentPromises);

    // ── STEP 4: Collect hasil ──────────────────────────────────────────────
    const collectedFields = {}; // { fieldKey: content }
    const failedFields    = [];

    for (const settled of settledResults) {
      if (settled.status === 'fulfilled' && settled.value.success) {
        collectedFields[settled.value.fieldKey] = settled.value.content;
        onProgress?.({
          type: 'schema-sub-agent',
          name: settled.value.agentName,
          action: 'done',
          field: settled.value.fieldKey,
          message: `${settled.value.agentName} → field "${settled.value.fieldKey}" selesai`
        });
      } else {
        const err = settled.status === 'rejected' ? settled.reason?.message : settled.value?.error;
        const fieldKey = settled.value?.fieldKey || '?';
        failedFields.push(fieldKey);
        onProgress?.({
          type: 'schema-sub-agent',
          action: 'error',
          field: fieldKey,
          message: `SchemaSubAgent "${fieldKey}" gagal: ${err}`
        });
      }
    }

    if (Object.keys(collectedFields).length === 0) {
      console.log(`%cAgent ${this.name} finished (error)`, 'color: red;');
      return { success: false, error: 'Semua SchemaSubAgent gagal menghasilkan konten', tokenUsage: totalTokenUsage };
    }

    onProgress?.({
      type: 'section-agent',
      name: this.name,
      action: 'merging',
      section: this.sectionSchema.key,
      message: `${this.name} → merge ${Object.keys(collectedFields).length} field menjadi JSON valid`
    });

    // ── STEP 5: Merge semua field → JSON valid sesuai outputSchema ─────────
    const mergeResult = await this._mergeFieldsToSchema(collectedFields, failedFields);

    if (!mergeResult.success) {
      console.log(`%cAgent ${this.name} finished (error)`, 'color: red;');
      return { success: false, error: mergeResult.error, tokenUsage: totalTokenUsage };
    }

    if (mergeResult.tokenUsage) {
      totalTokenUsage.input  += mergeResult.tokenUsage.input  || 0;
      totalTokenUsage.output += mergeResult.tokenUsage.output || 0;
    }

    console.log(`%cAgent ${this.name} finished`, 'color: purple;');
    return { success: true, schema: mergeResult.schema, tokenUsage: totalTokenUsage };
  }

  /**
   * Parse outputSchema string → array of { key, schema }
   * Ekstrak setiap top-level field dan schema-nya.
   *
   * Prioritas: gunakan fields metadata dari sectionSchema jika tersedia.
   * Fallback: regex parse dari outputSchema string.
   */
  _parseOutputSchema(outputSchemaStr) {
    // Prioritas: gunakan fields metadata jika tersedia
    if (this.sectionSchema.fields?.length > 0) {
      return this.sectionSchema.fields; // Array<{ key, schema }>
    }

    // Fallback: parse dari outputSchema string
    try {
      const fields = [];

      // Match pattern: "fieldName": value (di level root object)
      const lines = outputSchemaStr.split('\n');
      const rootKeyRegex = /^\s{2}"([^"]+)"\s*:/; // 2 space indent = root level

      for (const line of lines) {
        const match = line.match(rootKeyRegex);
        if (match) {
          fields.push({ key: match[1], schema: '...' });
        }
      }

      // Fallback: jika parsing gagal, kembalikan 1 field untuk seluruh schema
      if (fields.length === 0) {
        return [{ key: '_all', schema: outputSchemaStr }];
      }

      return fields;
    } catch {
      return [{ key: '_all', schema: outputSchemaStr }];
    }
  }

  /**
   * Call AI untuk generate brief SchemaSubAgent per field.
   * Brief HARUS embed context accumulated agar output saling relate.
   *
   * @param {Array<{key, schema}>} fieldSchemas
   * @param {Object} userInput
   * @param {Object} accumulatedContext - Hasil section sebelumnya
   * @returns {Promise<{ success, briefs, tokenUsage }>}
   */
  async _generateSchemaBriefs(fieldSchemas, userInput, accumulatedContext) {
    const contextSummary = this._summarizeContext(accumulatedContext);

    const fieldList = fieldSchemas
      .map((f, i) => `${i + 1}. fieldKey: "${f.key}"`)
      .join('\n');

    const briefPrompt = `
Kamu adalah koordinator yang bertugas membuat brief untuk sekelompok AI sub-agent.
Setiap sub-agent akan mengisi 1 field dari section "${this.sectionSchema.label}".

KONTEKS DOKUMEN:
- Judul: ${userInput.judul}
- Mata Pelajaran: ${userInput.mapel}
- Kelas: ${userInput.kelas} / Fase: ${userInput.fase || '-'}
- Jenjang: ${userInput.jenjang || '-'}
- Metode: ${userInput.metode || 'Problem Based Learning'}
${userInput.jenisSoal ? `- Jenis Soal: ${userInput.jenisSoal}` : ''}
${userInput.jumlahSoal != null ? `- Jumlah Soal: ${userInput.jumlahSoal}` : ''}
${userInput.jumlahSoalPg != null ? `- Jumlah Soal PG: ${userInput.jumlahSoalPg}` : ''}
${userInput.jumlahSoalEsai != null ? `- Jumlah Soal Esai: ${userInput.jumlahSoalEsai}` : ''}
${userInput.levelBloom ? `- Level Kognitif Bloom: ${userInput.levelBloom}` : ''}
${userInput.tingkat ? `- Tingkat Kesulitan: ${userInput.tingkat}` : ''}
${userInput.materiText ? `\nMATERI REFERENSI:\n${userInput.materiText.substring(0, 800)}${userInput.materiText.length > 800 ? '\n... (dipotong)' : ''}` : ''}

INSTRUKSI SECTION DARI ORCHESTRATOR:
${this.sectionPrompt}

OUTPUT SCHEMA SECTION INI:
${this.sectionSchema.outputSchema}

CONTEXT DARI SECTION SEBELUMNYA:
${contextSummary}

FIELD-FIELD YANG HARUS DIISI:
${fieldList}

INSTRUKSI:
Buat brief untuk SETIAP field di atas. Setiap brief harus:
- name: nama pendek agent (contoh: "TujuanPembelajaranAgent")
- role: peran spesifik dalam 3-5 kata
- expertise: keahlian teknis dalam 5-10 kata  
- prompt: instruksi LENGKAP untuk sub-agent ini. Prompt WAJIB:
  * Menjelaskan PERSIS konten yang harus dihasilkan untuk field ini
  * ${userInput.jumlahSoalPg != null || userInput.jumlahSoalEsai != null || userInput.jumlahSoal != null ? `* MENYEBUTKAN JUMLAH ITEM YANG HARUS DIHASILKAN (WAJIB exact count)` : ''}
  * Menyebut relasi/konsistensi dengan field lain dalam section yang sama
  * Menyebut context dari section sebelumnya yang relevan (jika ada)
  * Menggunakan terminologi Kurikulum Merdeka Indonesia yang tepat
  * TIDAK menyebut format JSON (itu dihandle sistem)

${userInput.jumlahSoalPg != null ? `PENTING: Field "soalPilihanGanda" WAJIB menghasilkan EXACT ${userInput.jumlahSoalPg} soal pilihan ganda.` : ''}
${userInput.jumlahSoalEsai != null ? `PENTING: Field "soalEsai" WAJIB menghasilkan EXACT ${userInput.jumlahSoalEsai} soal esai.` : ''}
${userInput.jumlahSoal != null && userInput.jumlahSoalPg == null && userInput.jumlahSoalEsai == null ? `PENTING: Setiap field soal WAJIB menghasilkan EXACT ${userInput.jumlahSoal} soal.` : ''}

KRITIS: Semua brief HARUS saling relate — output setiap field harus konsisten dengan field lain
dalam section yang sama. Embed informasi lintas-field dalam setiap prompt agar hasilnya kohesif.

OUTPUT: JSON array valid saja, tidak ada teks lain.
[
  {
    "fieldKey": "string (harus sama persis dengan fieldKey di atas)",
    "name": "string",
    "role": "string",
    "expertise": "string",
    "prompt": "string (instruksi lengkap, multi-paragraf OK)"
  }
]
`.trim();

    const t0 = Date.now();
    const result = await callGeminiAPI(briefPrompt, { timeout: 90000, maxRetries: 3 });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const parsed = this.parseJSON(result.data);

    // Handle jika AI return object dengan wrapper key (misal { briefs: [...] })
    const briefs = Array.isArray(parsed) ? parsed
                 : Array.isArray(parsed?.briefs) ? parsed.briefs
                 : null;

    if (!briefs || briefs.length === 0) {
      return { success: false, error: 'AI gagal generate brief schema sub-agents yang valid' };
    }

    // Validasi: pastikan semua fieldKey ada
    const validBriefs = briefs.filter(b => b.fieldKey && b.name && b.prompt);

    const tokenUsage = result.usage
      ? { input: result.usage.promptTokenCount || 0, output: result.usage.candidatesTokenCount || 0 }
      : null;

    const subAgentNames = validBriefs.map(b => b.name).join(', ');
    console.log(`%cAgent ${this.name} get prompt for ${subAgentNames}`, 'color: purple;');

    return { success: true, briefs: validBriefs, tokenUsage };
  }

  /**
   * Call AI untuk merge semua collected fields → JSON valid sesuai outputSchema.
   * Ini step terakhir di SectionAgent sebelum return ke Orchestrator.
   */
  async _mergeFieldsToSchema(collectedFields, failedFields) {
    const collectedSummary = Object.entries(collectedFields)
      .map(([key, value]) => `"${key}": ${JSON.stringify(value)}`)
      .join(',\n');

    const mergePrompt = `
Kamu adalah validator JSON. Tugasmu: gabungkan field-field berikut menjadi 1 JSON valid
yang sesuai dengan outputSchema yang diberikan.

OUTPUT SCHEMA YANG HARUS DIIKUTI:
${this.sectionSchema.outputSchema}

FIELD-FIELD YANG SUDAH DI-GENERATE (gabungkan ini):
{
${collectedSummary}
}

${failedFields.length > 0 ? `FIELD YANG GAGAL (isi dengan nilai default kosong): ${failedFields.join(', ')}` : ''}

INSTRUKSI:
1. Gabungkan semua field di atas menjadi 1 JSON object
2. Ikuti PERSIS struktur outputSchema
3. Jika ada field yang gagal, isi dengan nilai default (string kosong atau array kosong)
4. Jangan tambah atau hapus field dari schema
5. Output HANYA JSON valid, tidak ada teks lain

OUTPUT: JSON valid saja.
`.trim();

    const t0 = Date.now();
    const result = await callGeminiAPI(mergePrompt, { timeout: 60000, maxRetries: 3 });

    if (!result.success) {
      // Fallback: coba construct manual tanpa AI
      try {
        const merged = {};
        for (const [key, value] of Object.entries(collectedFields)) {
          merged[key] = value;
        }
        return { success: true, schema: merged, tokenUsage: null };
      } catch {
        return { success: false, error: `Merge gagal: ${result.error}` };
      }
    }

    const parsed = this.parseJSON(result.data);
    if (parsed.parseError) {
      return { success: false, error: 'Merge AI menghasilkan JSON tidak valid' };
    }

    const tokenUsage = result.usage
      ? { input: result.usage.promptTokenCount || 0, output: result.usage.candidatesTokenCount || 0 }
      : null;

    return { success: true, schema: parsed, tokenUsage };
  }

  /**
   * Ringkas accumulatedContext untuk di-pass ke brief generator.
   */
  _summarizeContext(accumulatedContext) {
    if (!accumulatedContext || Object.keys(accumulatedContext).length === 0) {
      return 'Ini section pertama — belum ada context sebelumnya.';
    }

    const lines = [];
    for (const [sectionKey, data] of Object.entries(accumulatedContext)) {
      lines.push(`\n[Section: ${sectionKey}]`);
      for (const [field, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          const preview = value.slice(0, 2).map(item =>
            typeof item === 'object' ? JSON.stringify(item).slice(0, 100) : String(item).slice(0, 100)
          );
          lines.push(`  ${field}: [${preview.join(', ')}${value.length > 2 ? ', ...' : ''}]`);
        } else if (typeof value === 'string') {
          lines.push(`  ${field}: "${value.slice(0, 150)}${value.length > 150 ? '...' : ''}"`);
        } else if (typeof value === 'object' && value !== null) {
          lines.push(`  ${field}: ${JSON.stringify(value).slice(0, 120)}...`);
        }
      }
    }
    return lines.join('\n');
  }
}
