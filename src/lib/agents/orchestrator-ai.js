// src/lib/agents/orchestrator-ai.js
//
// Orchestrator AI-driven — sequential pipeline dengan AI-generated agent briefs.
//
// Alur:
// 1. Baca sections dari template
// 2. Loop sequential per section
// 3. Sebelum spawn tiap agent → panggil AI untuk generate brief agent tersebut
// 4. Spawn GenericSubAgent dengan brief itu
// 5. Jalankan, simpan hasil ke context
// 6. Lanjut ke section berikutnya

import { BaseAgent } from './base-agent.js';
import { GenericSubAgent } from './generic-sub-agent.js';
import { getSectionSchema } from '../templates/section-schema.js';
import { callGeminiAPI } from '../utils/gemini-client.js';

export class OrchestratorAI extends BaseAgent {
  constructor() {
    super(
      'OrchestratorAI',
      'Dynamic Agent Orchestrator',
      'Mengkoordinasikan pipeline sub-agent secara sequential dan context-aware'
    );
  }

  /**
   * Jalankan pipeline sequential untuk semua sections di template.
   *
   * @param {Object}   template    - Template object dengan array sections
   * @param {Object}   userInput   - Input dari form user
   * @param {Function} onProgress  - SSE progress callback
   * @returns {Promise<{ success: boolean, merged: Object, tokenUsage: Object }>}
   */
  async runPipeline(template, userInput, onProgress) {
    const sections = template.sections; // array of { key, label, ... }
    const mergedContext = {};
    const totalTokenUsage = { input: 0, cached: 0, output: 0 };

    this.log(`Pipeline dimulai: ${sections.length} sections`);
    onProgress?.({
      type: 'orchestrator-ai',
      action: 'pipeline_start',
      message: `OrchestratorAI → pipeline ${sections.length} section dimulai`
    });

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionSchema = getSectionSchema(section.key);

      if (!sectionSchema) {
        this.log(`Section key tidak dikenal: ${section.key}`, 'warn');
        onProgress?.({
          type: 'orchestrator-ai',
          action: 'warn',
          message: `OrchestratorAI → section "${section.key}" tidak dikenal, skip`
        });
        continue;
      }

      onProgress?.({
        type: 'orchestrator-ai',
        action: 'briefing',
        section: section.key,
        message: `OrchestratorAI → membuat brief untuk section "${section.label}" (${i + 1}/${sections.length})`
      });

      // ── STEP A: AI generate brief untuk agent ini ──────────────────────
      // Jika user mengaktifkan promptMode='custom' dan mengisi customFieldInstruksi,
      // teruskan sebagai constraint tambahan ke brief generator
      const customConstraints =
        section.promptMode === 'custom' &&
        section.customFieldInstruksi &&
        Object.keys(section.customFieldInstruksi).length > 0
          ? section.customFieldInstruksi
          : null;

      const briefResult = await this._generateAgentBrief({
        section: sectionSchema,
        userInput,
        contextSoFar: mergedContext,
        completedSections: sections.slice(0, i).map(s => s.key),
        customConstraints
      });

      if (!briefResult.success) {
        if (section.critical !== false) {
          return {
            success: false,
            error: `Gagal generate brief untuk section "${section.key}": ${briefResult.error}`,
            merged: mergedContext,
            tokenUsage: totalTokenUsage
          };
        }
        this.log(`Brief gagal untuk ${section.key} (non-critical), skip`, 'warn');
        continue;
      }

      const { name, role, expertise, prompt } = briefResult.brief;

      // Akumulasi token dari brief generation
      if (briefResult.tokenUsage) {
        totalTokenUsage.input  += briefResult.tokenUsage.input  || 0;
        totalTokenUsage.output += briefResult.tokenUsage.output || 0;
      }

      onProgress?.({
        type: 'orchestrator-ai',
        action: 'spawning',
        section: section.key,
        agentName: name,
        message: `OrchestratorAI → spawn ${name} untuk "${section.label}"`
      });

      // ── STEP B: Spawn GenericSubAgent dengan brief ──────────────────────
      const agent = new GenericSubAgent(name, role, expertise, prompt, sectionSchema.outputSchema);

      onProgress?.({
        type: 'sub-agent',
        name,
        action: 'start',
        message: `${name} → memulai section "${section.label}"...`
      });

      const startTime = Date.now();
      const result = await agent.execute(userInput, mergedContext);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      // Akumulasi token dari sub-agent
      const agentTokens = agent.getTokenUsage();
      totalTokenUsage.input  += agentTokens.input  || 0;
      totalTokenUsage.cached += agentTokens.cached || 0;
      totalTokenUsage.output += agentTokens.output || 0;

      if (!result.success) {
        onProgress?.({
          type: 'sub-agent',
          name,
          action: 'error',
          message: `${name} → gagal: ${result.error}`
        });

        if (section.critical !== false) {
          return {
            success: false,
            error: `Section "${section.key}" gagal: ${result.error}`,
            merged: mergedContext,
            tokenUsage: totalTokenUsage
          };
        }

        this.log(`Section ${section.key} gagal (non-critical), lanjut`, 'warn');
        continue;
      }

      onProgress?.({
        type: 'sub-agent',
        name,
        action: 'done',
        message: `${name} → selesai (${duration}s)`
      });

      // ── STEP C: Simpan hasil ke context untuk section berikutnya ────────
      mergedContext[section.key] = result.schema;

      onProgress?.({
        type: 'orchestrator-ai',
        action: 'section_done',
        section: section.key,
        message: `Section "${section.label}" selesai — context di-update untuk section berikutnya`
      });
    }

    onProgress?.({
      type: 'orchestrator-ai',
      action: 'pipeline_done',
      message: `OrchestratorAI → semua ${sections.length} section selesai ✓`
    });

    return { success: true, merged: mergedContext, tokenUsage: totalTokenUsage };
  }

  /**
   * Panggil AI untuk generate brief agent: { name, role, expertise, prompt }.
   *
   * Prompt ke AI berisi:
   * - Deskripsi section yang harus dibuat (label + schema)
   * - Ringkasan hasil section-section sebelumnya (context)
   * - Instruksi agar prompt yang dihasilkan context-aware
   *
   * @param {Object} params
   * @param {Object} params.section             - sectionSchema dari SECTION_SCHEMAS
   * @param {Object} params.userInput           - input dari form user
   * @param {Object} params.contextSoFar        - hasil section-section sebelumnya
   * @param {string[]} params.completedSections - keys section yang sudah selesai
   * @returns {Promise<{ success: boolean, brief?: Object, tokenUsage?: Object, error?: string }>}
   */
  async _generateAgentBrief({ section, userInput, contextSoFar, completedSections, customConstraints = null }) {
    const hasContext = completedSections.length > 0;

    // Ringkas context agar tidak terlalu panjang
    const contextSummary = hasContext
      ? this._summarizeContext(contextSoFar, completedSections)
      : 'Ini adalah section pertama — belum ada context sebelumnya.';

    // Format kustom prompt user sebagai constraint tambahan
    let customConstraintsBlock = '';
    if (customConstraints && Object.keys(customConstraints).length > 0) {
      const entries = Object.entries(customConstraints)
        .filter(([_, v]) => typeof v === 'string' && v.trim().length > 0)
        .map(([key, value]) => `  - ${key}: ${value.trim()}`);

      if (entries.length > 0) {
        customConstraintsBlock = `

KONSTRAIN TAMBAHAN DARI PENGGUNA:
Pengguna memberikan instruksi spesifik untuk field-field tertentu di section ini.
Instruksi ini WAJIB diakomodasi dalam prompt yang kamu buat — jadikan sebagai
panduan prioritas, bukan menggantikan keseluruhan instruksi section:

${entries.join('\n')}

Pastikan prompt yang kamu hasilkan merefleksikan semua constraint pengguna di atas.`;
      }
    }

    const briefPrompt = `
Kamu adalah meta-orchestrator yang bertugas membuat brief untuk seorang AI agent spesialis.

TUGAS:
Buat brief untuk agent yang akan membuat section "${section.label}" dari sebuah dokumen pembelajaran.

INFORMASI DOKUMEN:
- Judul: ${userInput.judul}
- Mata Pelajaran: ${userInput.mapel}
- Kelas: ${userInput.kelas}
- Fase: ${userInput.fase || '-'}
- Jenjang: ${userInput.jenjang || '-'}
- Jenis Dokumen: ${userInput.jenis || 'modul_ajar'}
- Jumlah Pertemuan: ${userInput.jumlahPertemuan || 1}
- Alokasi Waktu: ${userInput.alokasiPerPertemuan || userInput.alokasiWaktu || '2x45 menit'}
- Metode: ${userInput.metode || 'Problem Based Learning'}

OUTPUT SCHEMA YANG HARUS DIHASILKAN AGENT:
${section.outputSchema}

CONTEXT DARI SECTION SEBELUMNYA:
${contextSummary}${customConstraintsBlock}

INSTRUKSI:
Buat brief untuk agent ini dalam JSON. Brief harus:
- name: nama pendek agent (contoh: "CapaianAgent")  
- role: peran spesifik agent dalam 3-5 kata
- expertise: keahlian teknis agent dalam 5-10 kata
- prompt: instruksi LENGKAP untuk agent ini. Prompt HARUS:
  * Menjelaskan apa yang harus dibuat untuk section "${section.label}"
  * Mereferensikan hasil section sebelumnya yang relevan (jika ada) secara eksplisit
  * Memastikan output konsisten dan berkesinambungan dengan section yang sudah ada
  * Spesifik untuk konteks Kurikulum Merdeka Indonesia
  * Tidak menyebutkan format JSON — itu sudah dihandle sistem

OUTPUT: JSON valid saja, tidak ada teks lain.
{
  "name": "string",
  "role": "string", 
  "expertise": "string",
  "prompt": "string (instruksi lengkap, bisa multi-paragraf)"
}
`.trim();

    const result = await callGeminiAPI(briefPrompt, { timeout: 60000, maxRetries: 2 });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const brief = this.parseJSON(result.data);
    if (brief.parseError || !brief.name || !brief.prompt) {
      return { success: false, error: 'AI gagal generate brief yang valid' };
    }

    const tokenUsage = result.usage
      ? { input: result.usage.promptTokenCount || 0, output: result.usage.candidatesTokenCount || 0 }
      : null;

    return { success: true, brief, tokenUsage };
  }

  /**
   * Buat ringkasan context yang relevan untuk di-pass ke brief generator.
   * Hanya ambil field yang paling informatif dari setiap section.
   */
  _summarizeContext(contextSoFar, completedSections) {
    const lines = [];

    for (const key of completedSections) {
      const data = contextSoFar[key];
      if (!data) continue;

      const schema = getSectionSchema(key);
      lines.push(`\n[Section: ${schema?.label || key}]`);

      // Ringkas per field — ambil preview, bukan full data
      for (const [field, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          // Array: ambil max 3 item pertama sebagai preview
          const preview = value.slice(0, 3).map(item =>
            typeof item === 'object' ? JSON.stringify(item).slice(0, 80) : String(item).slice(0, 80)
          );
          lines.push(`  ${field}: [${preview.join(', ')}${value.length > 3 ? ', ...' : ''}]`);
        } else if (typeof value === 'string') {
          lines.push(`  ${field}: "${value.slice(0, 120)}${value.length > 120 ? '...' : ''}"`);
        } else if (typeof value === 'object' && value !== null) {
          lines.push(`  ${field}: ${JSON.stringify(value).slice(0, 100)}...`);
        }
      }
    }

    return lines.join('\n') || 'Belum ada context.';
  }
}
