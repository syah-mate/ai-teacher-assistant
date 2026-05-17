/**
 * run-sub-agents.tool.js — Pure Tool (no LLM)
 *
 * Menerima daftar sub-agent yang harus dijalankan,
 * menjalankannya secara PARALEL dengan Promise.allSettled,
 * mengembalikan semua schema hasil dalam satu object.
 *
 * Domain agent yang memutuskan sub-agent mana yang dipanggil.
 * Tool ini hanya eksekutor — tidak ada decision-making di sini.
 */

// Registry semua sub-agent yang tersedia — universal, bisa dipanggil siapapun
import { IdentitasSubAgent } from '../agents/sub-agents/identitas.sub-agent.js';
import { CapaianSubAgent } from '../agents/sub-agents/capaian.sub-agent.js';
import { KegiatanSubAgent } from '../agents/sub-agents/kegiatan.sub-agent.js';
import { AsesmenSubAgent } from '../agents/sub-agents/asesmen.sub-agent.js';
import { MateriSubAgent } from '../agents/sub-agents/materi.sub-agent.js';
import { LangkahSubAgent } from '../agents/sub-agents/langkah.sub-agent.js';
import { EvaluasiSubAgent } from '../agents/sub-agents/evaluasi.sub-agent.js';
import { ValidatorSubAgent } from '../agents/sub-agents/validator.sub-agent.js';
import { SoalPGSubAgent } from '../agents/sub-agents/soal-pg.sub-agent.js';
import { SoalEsaiSubAgent } from '../agents/sub-agents/soal-esai.sub-agent.js';

const SUB_AGENT_REGISTRY = {
	identitas: () => new IdentitasSubAgent(),
	capaian: () => new CapaianSubAgent(),
	kegiatan: () => new KegiatanSubAgent(),
	asesmen: () => new AsesmenSubAgent(),
	materi: () => new MateriSubAgent(),
	langkah: () => new LangkahSubAgent(),
	evaluasi: () => new EvaluasiSubAgent(),
	validator: () => new ValidatorSubAgent(),
	'soal-pg': () => new SoalPGSubAgent(),
	'soal-esai': () => new SoalEsaiSubAgent()
};

/**
 * Jalankan sub-agents secara paralel dalam satu batch.
 *
 * @param {Object} params
 * @param {string[]} params.agents  - Nama sub-agent yang dijalankan ['identitas', 'capaian', ...]
 * @param {Object}   params.input   - userInput dari domain agent
 * @param {Object}   [params.context] - Schema dari batch sebelumnya (default: {})
 * @param {string[]} [params.critical] - Sub-agent yang jika gagal = batalkan semua (default: semua)
 *
 * @returns {Promise<{
 *   success: boolean,
 *   schemas: { [agentName]: Object },
 *   errors:  { [agentName]: string },
 *   failed:  string[],
 *   merged:  { [agentName]: Object }
 * }>}
 */
export async function runSubAgents({ agents, input, context = {}, critical, onProgress }) {
	// Default: semua agent dianggap critical kecuali dideklarasikan
	const criticalSet = new Set(critical ?? agents);

	// Validasi: semua agent yang diminta harus terdaftar
	const unknown = agents.filter((name) => !SUB_AGENT_REGISTRY[name]);
	if (unknown.length > 0) {
		return {
			success: false,
			schemas: {},
			errors: { _registry: `Sub-agent tidak dikenal: ${unknown.join(', ')}` },
			failed: unknown,
			merged: {}
		};
	}

	// Jalankan semua PARALEL — tidak ada await satu per satu
	const results = await Promise.allSettled(
		agents.map(async (name) => {
			const startTime = Date.now();
			onProgress?.({ type: 'sub-agent', name, action: 'start', message: `${name} → memulai...` });
			const agent = SUB_AGENT_REGISTRY[name]();
			const result = await agent.execute(input, context);
			const duration = ((Date.now() - startTime) / 1000).toFixed(1);
			if (result.success) {
				onProgress?.({ type: 'sub-agent', name, action: 'done', message: `${name} → selesai (${duration}s)` });
			} else {
				onProgress?.({ type: 'sub-agent', name, action: 'error', message: `${name} → gagal: ${result.error}` });
			}
			return { name, result };
		})
	);

	const schemas = {};
	const errors = {};
	const failed = [];

	for (const settled of results) {
		if (settled.status === 'rejected') {
			const name = 'unknown';
			errors[name] = settled.reason?.message || 'Unexpected rejection';
			failed.push(name);
			continue;
		}

		const { name, result } = settled.value;

		if (result.success) {
			schemas[name] = result.schema;
		} else {
			errors[name] = result.error;
			failed.push(name);
		}
	}

	// Cek apakah ada critical agent yang gagal
	const criticalFailures = failed.filter((name) => criticalSet.has(name));

	return {
		success: criticalFailures.length === 0,
		schemas,
		errors,
		failed,
		merged: schemas
	};
}
