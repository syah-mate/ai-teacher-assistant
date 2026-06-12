// src/lib/agents/schema-sub-agent.js
//
// Agent level 3 — paling kecil, paling spesifik.
// Setiap instance hanya bertanggung jawab untuk 1 field dari outputSchema section.
// Brief (name, role, expertise, prompt) di-generate oleh SectionAgent.
// Context dari section sebelumnya sudah di-embed dalam prompt oleh SectionAgent.

import { BaseSubAgent } from './base-sub-agent.js';

export class SchemaSubAgent extends BaseSubAgent {
  /**
   * @param {string} name         - Nama agent (di-generate AI oleh SectionAgent)
   * @param {string} role         - Role agent
   * @param {string} expertise    - Expertise agent
   * @param {string} taskPrompt   - Prompt tugas spesifik (sudah berisi context)
   * @param {string} fieldKey     - Key field schema yang harus dihasilkan (misal: "tujuanPembelajaran")
   * @param {string} fieldSchema  - Schema string untuk field ini saja
   */
  constructor(name, role, expertise, taskPrompt, fieldKey, fieldSchema) {
    super(name, role, expertise);
    this.taskPrompt = taskPrompt;
    this.fieldKey   = fieldKey;
    this.fieldSchema = fieldSchema;
  }

  async execute(userInput) {

    console.log(`%cSub-Agent ${this.name} start`, 'color: green;');

    const systemPrompt = this.buildSystemPrompt(
      `${this.taskPrompt}\n\nOUTPUT FORMAT JSON (field "${this.fieldKey}" saja):\n{ "${this.fieldKey}": ${this.fieldSchema} }\n\nOutput HANYA JSON valid dengan 1 key "${this.fieldKey}". Tidak ada field lain.`
    );

    const userPrompt = this._buildUserPrompt(userInput);
    const result     = await this.callAndParse(systemPrompt, userPrompt);

    if (!result.success) {
      console.log(`%cSub-Agent ${this.name} finished (error)`, 'color: red;');
      return { success: false, error: result.error, fieldKey: this.fieldKey };
    }

    // Pastikan field yang diminta ada di hasil
    if (!(this.fieldKey in result.schema)) {
      // Coba ambil apapun yang ada di root jika field key tidak match
      const keys    = Object.keys(result.schema);
      const content = keys.length > 0 ? result.schema[keys[0]] : null;
      if (!content) {
        console.log(`%cSub-Agent ${this.name} finished (error)`, 'color: red;');
        return { success: false, error: `Field "${this.fieldKey}" tidak ada di output AI`, fieldKey: this.fieldKey };
      }
      console.log(`%cSub-Agent ${this.name} finished`, 'color: green;');
      return { success: true, fieldKey: this.fieldKey, content };
    }

    console.log(`%cSub-Agent ${this.name} finished`, 'color: green;');

    return { success: true, fieldKey: this.fieldKey, content: result.schema[this.fieldKey] };
  }

  _buildUserPrompt(input) {
    return [
      `Judul Modul            : ${input.judul}`,
      `Mata Pelajaran         : ${input.mapel}`,
      `Kelas                  : ${input.kelas}`,
      `Fase                   : ${input.fase || '-'}`,
      `Jenjang                : ${input.jenjang || '-'}`,
      input.jumlahPertemuan   != null ? `Jumlah Pertemuan       : ${input.jumlahPertemuan}` : '',
      input.alokasiPerPertemuan ? `Alokasi per Pertemuan  : ${input.alokasiPerPertemuan}` : (input.alokasiWaktu ? `Alokasi Waktu          : ${input.alokasiWaktu}` : ''),
      `Metode Pembelajaran    : ${input.metode || 'Problem Based Learning'}`,
      `Nama Guru              : ${input.penulis || 'Guru Mata Pelajaran'}`,
      `Instansi               : ${input.instansi || 'Sekolah'}`,
      input.jenisKegiatan ? `Jenis Kegiatan         : ${Array.isArray(input.jenisKegiatan) ? input.jenisKegiatan.join(', ') : input.jenisKegiatan}` : '',
      input.polaBelajar   ? `Pola Belajar           : ${input.polaBelajar}` : '',
      input.jenisSoal     ? `Jenis Soal             : ${input.jenisSoal}` : '',
      input.jumlahSoal    != null ? `Jumlah Soal            : ${input.jumlahSoal}` : '',
      input.tingkat       ? `Tingkat Kesulitan      : ${input.tingkat}` : '',
      input.levelBloom    ? `Level Kognitif Bloom   : ${input.levelBloom}` : '',
    ].filter(Boolean).join('\n');
  }
}
