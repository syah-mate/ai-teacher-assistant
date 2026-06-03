import { BaseAgent } from './base-agent.js';

export class BaseSubAgent extends BaseAgent {
	constructor(name, role, expertise) {
		super(name, role, expertise);
	}

	/**
	 * Semua sub-agent WAJIB override ini.
	 * Return HARUS { success, schema: Object } — bukan { success, data }
	 *
	 * @param {Object} input    - userInput dari domain agent
	 * @param {Object} context  - hasil sub-agent lain yang sudah selesai (bisa kosong)
	 * @returns {Promise<{ success: boolean, schema: Object, agentName: string }>}
	 */
	async execute(input, context = {}) {
		throw new Error(`execute() harus diimplementasikan oleh ${this.name}`);
	}

	/**
	 * Override buildSystemPrompt — tambahkan instruksi JSON output
	 */
	buildSystemPrompt(taskDescription) {
		const base = super.buildSystemPrompt(taskDescription);
		return `${base}

INSTRUKSI OUTPUT KRITIS:
- Output HARUS berupa JSON valid saja, tidak ada teks lain di luar JSON
- Jangan tambahkan penjelasan, markdown fence, atau komentar apapun
- JSON akan diproses langsung oleh sistem — format salah = pipeline gagal
- Jika tidak yakin dengan suatu nilai, gunakan string kosong "" bukan null`;
	}

	/**
	 * Helper: callAI lalu langsung parse JSON
	 * Gunakan ini di semua sub-agent menggantikan callAI + parseJSON manual
	 */
	async callAndParse(systemPrompt, userPrompt, options = {}) {
		const maxParseAttempts = Number(options.maxParseAttempts || 2);
		let result = await this.callAI(systemPrompt, userPrompt, {
			timeout: 90000,
			...options
		});

		for (let attempt = 1; attempt <= maxParseAttempts; attempt++) {
			if (!result.success) {
				return { success: false, error: result.error };
			}

			const parsed = this.parseJSON(result.data);
			if (!parsed.parseError) {
				return { success: true, schema: parsed };
			}

			const rawPreview = result.data?.slice(0, 220) || '';
			if (attempt >= maxParseAttempts) {
				this.log(`JSON parse gagal (attempt ${attempt}/${maxParseAttempts}). Raw: ${rawPreview}`, 'error');
				return { success: false, error: 'AI menghasilkan format output yang tidak valid' };
			}

			this.log(`JSON parse gagal (attempt ${attempt}/${maxParseAttempts}). Retry generate JSON...`, 'warn');
			result = await this.callAI(
				`${systemPrompt}\n\nRETRY KHUSUS:\n- Ulangi dari awal\n- Keluarkan SATU JSON object lengkap sampai penutup kurung kurawal terakhir\n- Jangan gunakan markdown fence\n- Jangan memotong output di tengah string`,
				`${userPrompt}\n\nUlangi jawaban sekarang dalam JSON valid dari awal hingga akhir.`,
				{
					timeout: 90000,
					maxRetries: 2,
					...options
				}
			);
		}

		return { success: false, error: 'AI menghasilkan format output yang tidak valid' };
	}

	/**
	 * Rakit 3 lapisan prompt menjadi { systemPrompt, userPrompt }.
	 * Layer 1+2: buildSystemPrompt dengan instruksi + outputSchema dari sectionDef.
	 * Layer 3: data form user + context dari batch sebelumnya.
	 */
	buildPromptFromLayers(sectionDef, input, context = {}) {
		// LAYER 1 + LAYER 2 digabung — sectionDef masuk sebagai taskDescription
		const systemPrompt = this.buildSystemPrompt(
			`${sectionDef.instruksi}\n\nOUTPUT FORMAT JSON (ikuti PERSIS struktur ini, tidak ada field tambahan):\n${sectionDef.outputSchema}`
		);

		// LAYER 3 — inputs dari user
		const tujuanList = (context.capaian?.tujuanPembelajaran || [])
			.map((t) => `${t.nomor}. ${t.tujuan}`)
			.join('\n');

		const userPrompt = [
			`Section yang dibuat    : ${sectionDef.namaSection}`,
			`Judul Modul            : ${input.judul}`,
			`Mata Pelajaran         : ${input.mapel}`,
			`Kelas                  : ${input.kelas}`,
			`Fase                   : ${input.fase || '-'}`,
			`Jenjang                : ${input.jenjang || '-'}`,
			`Jumlah Pertemuan       : ${input.jumlahPertemuan || 1}`,
			`Alokasi per Pertemuan  : ${input.alokasiPerPertemuan || '2x45 menit'}`,
			`Metode Pembelajaran    : ${input.metode || 'Problem Based Learning'}`,
			`Nama Guru              : ${input.penulis || 'Guru Mata Pelajaran'}`,
			`Instansi               : ${input.instansi || 'Sekolah'}`,
			tujuanList ? `\nTujuan Pembelajaran (dari batch sebelumnya):\n${tujuanList}` : ''
		]
			.filter(Boolean)
			.join('\n');

		return { systemPrompt, userPrompt };
	}

	/**
	 * Jalankan sub-agent menggunakan template-mode (3 lapisan prompt).
	 * Dipanggil oleh run-sub-agents.tool.js jika sectionDef tersedia.
	 */
	async executeFromTemplate(input, context = {}, sectionDef) {
		this.log(`[template-mode] section: ${sectionDef.namaSection} | judul: ${input.judul}`);

		const { systemPrompt, userPrompt } = this.buildPromptFromLayers(sectionDef, input, context);

		const result = await this.callAndParse(systemPrompt, userPrompt);

		if (!result.success) {
			return { success: false, error: result.error, agentName: this.name };
		}

		return { success: true, schema: result.schema, agentName: this.name };
	}
}
