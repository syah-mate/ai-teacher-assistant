/**
 * Base Agent Class
 * 
 * Foundational class untuk semua specialized agents dalam Agentic AI System
 */

import { callGeminiAPI } from '$lib/utils/gemini-client.js';

export class BaseAgent {
	/**
	 * @param {string} name - Nama agent
	 * @param {string} role - Role/peran agent
	 * @param {string} expertise - Area keahlian agent
	 */
	constructor(name, role, expertise) {
		this.name = name;
		this.role = role;
		this.expertise = expertise;
		this.executionCount = 0;
		this.lastExecutionTime = null;
	}

	/**
	 * Template method untuk eksekusi agent
	 * Subclass harus override method ini
	 * 
	 * @param {Object} input - Input data untuk agent
	 * @param {Object} context - Konteks dari agents sebelumnya
	 * @returns {Promise<Object>} Result dengan format { success, data, error, metadata }
	 */
	async execute(input, context = {}) {
		throw new Error(`execute() method must be implemented by ${this.name}`);
	}

	/**
	 * Build system prompt untuk agent
	 * 
	 * @param {string} taskDescription - Deskripsi task spesifik
	 * @returns {string} System prompt lengkap
	 */
	buildSystemPrompt(taskDescription) {
		return `
IDENTITAS AGENT:
Nama: ${this.name}
Role: ${this.role}
Expertise: ${this.expertise}

KONTEKS KURIKULUM:
Anda adalah agent AI yang ahli dalam menyusun Modul Ajar Kurikulum Merdeka.
Anda harus mengikuti standar resmi Kemendikbudristek dan prinsip pembelajaran modern.

TUGAS ANDA:
${taskDescription}

PRINSIP KERJA:
1. ESENSIAL - Fokus pada konsep kunci yang penting
2. MENARIK - Gunakan pendekatan yang engaging dan bermakna
3. RELEVAN - Sesuai dengan konteks dan pengalaman siswa
4. BERKESINAMBUNGAN - Alur yang logis dan terstruktur
5. JELAS - Bahasa yang mudah dipahami guru

OUTPUT REQUIREMENTS:
- Format output harus valid JSON
- Lengkap dan terstruktur sesuai komponen yang diminta
- Praktis dan siap pakai oleh guru
- Sesuai dengan fase dan karakteristik siswa
`.trim();
	}

	/**
	 * Call Gemini API dengan error handling
	 * 
	 * @param {string} systemPrompt - System/instruction prompt
	 * @param {string} userPrompt - User input prompt
	 * @param {Object} options - Options untuk API call
	 * @returns {Promise<Object>} API result
	 */
	async callAI(systemPrompt, userPrompt, options = {}) {
		const startTime = Date.now();
		
		try {
			const fullPrompt = `${systemPrompt}\n\n━━━━━━━━━━━━━━━━━━━━\n\n${userPrompt}`;
			
			const result = await callGeminiAPI(fullPrompt, {
				timeout: 60000,
				maxRetries: 3,
				...options
			});

			this.executionCount++;
			this.lastExecutionTime = Date.now() - startTime;

			return result;
		} catch (error) {
			console.error(`[${this.name}] Error:`, error);
			return {
				success: false,
				error: error.message || 'Terjadi kesalahan saat memanggil AI'
			};
		}
	}

	/**
	 * Parse JSON response dari AI dengan fallback handling
	 * 
	 * @param {string} text - Raw text response
	 * @returns {Object} Parsed JSON object
	 */
	parseJSON(text) {
		try {
			// Remove markdown code blocks if present
			let cleaned = text.trim();
			
			// Check for JSON code block
			const jsonBlockMatch = cleaned.match(/```json\s*([\s\S]*?)\s*```/);
			if (jsonBlockMatch) {
				cleaned = jsonBlockMatch[1];
			} else {
				// Check for generic code block
				const codeBlockMatch = cleaned.match(/```\s*([\s\S]*?)\s*```/);
				if (codeBlockMatch) {
					cleaned = codeBlockMatch[1];
				}
			}

			return JSON.parse(cleaned);
		} catch (error) {
			console.warn(`[${this.name}] JSON parse error, returning raw text:`, error.message);
			// Fallback: return as object with raw property
			return { raw: text, parseError: true };
		}
	}

	/**
	 * Validate output structure
	 * Subclass can override untuk validasi spesifik
	 * 
	 * @param {Object} output - Output untuk divalidasi
	 * @returns {Object} { isValid, errors }
	 */
	validate(output) {
		if (!output) {
			return { isValid: false, errors: ['Output is empty'] };
		}

		if (output.parseError) {
			return { isValid: false, errors: ['Failed to parse JSON response'] };
		}

		return { isValid: true, errors: [] };
	}

	/**
	 * Get agent metadata untuk tracking
	 * 
	 * @returns {Object} Metadata object
	 */
	getMetadata() {
		return {
			name: this.name,
			role: this.role,
			expertise: this.expertise,
			executionCount: this.executionCount,
			lastExecutionTime: this.lastExecutionTime
		};
	}

	/**
	 * Log aktivitas agent
	 * 
	 * @param {string} message - Log message
	 * @param {string} level - Log level (info, warn, error)
	 */
	log(message, level = 'info') {
		const timestamp = new Date().toISOString();
		const prefix = `[${timestamp}] [${this.name}]`;
		
		switch (level) {
			case 'error':
				console.error(`${prefix} ❌`, message);
				break;
			case 'warn':
				console.warn(`${prefix} ⚠️`, message);
				break;
			default:
				console.log(`${prefix} ℹ️`, message);
		}
	}
}
