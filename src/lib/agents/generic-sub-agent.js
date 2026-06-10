// src/lib/agents/generic-sub-agent.js
//
// Satu class universal menggantikan semua sub-agent spesifik.
// Dikonfigurasi sepenuhnya dari luar — tidak ada hardcode nama, role, expertise, atau prompt.
// Brief (name, role, expertise, taskPrompt, outputSchema) di-generate oleh OrchestratorAI.

import { BaseSubAgent } from './base-sub-agent.js';

export class GenericSubAgent extends BaseSubAgent {
  /**
   * @param {string} name         - Nama agent (di-generate AI oleh orchestrator)
   * @param {string} role         - Role agent (di-generate AI)
   * @param {string} expertise    - Expertise agent (di-generate AI)
   * @param {string} taskPrompt   - Prompt tugas spesifik (di-generate AI, konteks-aware)
   * @param {string} outputSchema - JSON schema string dari SECTION_SCHEMAS[key].outputSchema
   */
  constructor(name, role, expertise, taskPrompt, outputSchema) {
    super(name, role, expertise);
    this.taskPrompt = taskPrompt;
    this.outputSchema = outputSchema;
  }

  async execute(input, context = {}) {
    this.log(`Starting: ${this.name}`);

    // System prompt: identitas agent (dari base) + schema output yang WAJIB diikuti
    const systemPrompt = this.buildSystemPrompt(
      `${this.taskPrompt}\n\nOUTPUT FORMAT JSON (ikuti PERSIS, tidak ada field tambahan):\n${this.outputSchema}`
    );

    // User prompt: data form user saja — context sudah di-embed di taskPrompt oleh orchestrator
    const userPrompt = this._buildUserPrompt(input);

    const result = await this.callAndParse(systemPrompt, userPrompt);

    if (!result.success) {
      return { success: false, error: result.error, agentName: this.name };
    }

    return { success: true, schema: result.schema, agentName: this.name };
  }

  /**
   * Build user prompt standar dari input form user.
   * Context TIDAK dimasukkan di sini — sudah di-inject orchestrator ke taskPrompt.
   */
  _buildUserPrompt(input) {
    return [
      `Judul Modul            : ${input.judul}`,
      `Mata Pelajaran         : ${input.mapel}`,
      `Kelas                  : ${input.kelas}`,
      `Fase                   : ${input.fase || '-'}`,
      `Jenjang                : ${input.jenjang || '-'}`,
      input.jumlahPertemuan != null ? `Jumlah Pertemuan       : ${input.jumlahPertemuan}` : '',
      input.alokasiPerPertemuan ? `Alokasi per Pertemuan  : ${input.alokasiPerPertemuan}` : (input.alokasiWaktu ? `Alokasi Waktu           : ${input.alokasiWaktu}` : ''),
      `Metode Pembelajaran    : ${input.metode || 'Problem Based Learning'}`,
      `Nama Guru              : ${input.penulis || 'Guru Mata Pelajaran'}`,
      `Instansi               : ${input.instansi || 'Sekolah'}`,
      // Field spesifik LKPD
      input.alokasiWaktu && !input.alokasiPerPertemuan ? '' : `Alokasi Waktu           : ${input.alokasiWaktu || '-'}`,
      input.jenisKegiatan ? `Jenis Kegiatan          : ${Array.isArray(input.jenisKegiatan) ? input.jenisKegiatan.join(', ') : input.jenisKegiatan}` : '',
      input.polaBelajar ? `Pola Belajar            : ${input.polaBelajar}` : '',
      // Field spesifik Soal
      input.jenisSoal ? `Jenis Soal              : ${input.jenisSoal}` : '',
      input.jumlahSoal != null ? `Jumlah Soal             : ${input.jumlahSoal}` : '',
      input.tingkat ? `Tingkat Kesulitan       : ${input.tingkat}` : '',
      input.levelBloom ? `Level Kognitif Bloom    : ${input.levelBloom}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }
}
