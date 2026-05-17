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
		const result = await this.callAI(systemPrompt, userPrompt, {
			timeout: 90000,
			...options
		});

		if (!result.success) {
			return { success: false, error: result.error };
		}

		const parsed = this.parseJSON(result.data);

		if (parsed.parseError) {
			this.log(`JSON parse gagal. Raw: ${result.data?.slice(0, 200)}`, 'error');
			return { success: false, error: 'AI menghasilkan format output yang tidak valid' };
		}

		return { success: true, schema: parsed };
	}
}
