/**
 * Orchestrator — Agentic AI System
 *
 * Tugasnya HANYA:
 * 1. Cek rate limit (startSession)
 * 2. Pilih domain agent berdasarkan userInput.jenis
 * 3. Panggil agent.run()
 * 4. Hitung quota (completeSession) jika sukses
 * 5. Return AgentResult ke frontend
 *
 * Orchestrator TIDAK tahu tentang sub-agent, schema, atau tools.
 * Semua itu urusan domain agent masing-masing.
 */

import { ModulAjarAgent } from './domain/modul-ajar.agent.js';
import { LKPDAgent } from './domain/lkpd.agent.js';
import { SoalAgent } from './domain/soal.agent.js';

const DOMAIN_AGENTS = {
modul_ajar: () => new ModulAjarAgent(),
lkpd:       () => new LKPDAgent(),
soal:       () => new SoalAgent()
};

export class Orchestrator {
async generate(userInput, onProgress) {
const agentFactory = DOMAIN_AGENTS[userInput.jenis];
if (!agentFactory) {
return {
success: false,
error: `Jenis tidak dikenal: "${userInput.jenis}". Pilih: modul_ajar, lkpd, soal.`
};
}

const session = await this.startSession();
if (!session.ok) return { success: false, error: session.error };

const agent = agentFactory();
const agentName = agent.constructor.name;
onProgress?.({ type: 'orchestrator', action: 'delegating', name: agentName, message: `Orchestrator → mendelegasikan ke ${agentName}` });

const result = await agent.run(userInput, onProgress);

if (result.success) await this.completeSession();

return result;
}

async startSession() {
try {
const res = await fetch('/api/generate-session/start', {
method: 'POST',
headers: { 'Content-Type': 'application/json' }
});
if (!res.ok) {
const data = await res.json().catch(() => ({}));
return { ok: false, error: data.error || 'Gagal memulai sesi' };
}
return { ok: true };
} catch (err) {
return { ok: false, error: 'Gagal terhubung ke server: ' + err.message };
}
}

async completeSession() {
await fetch('/api/generate-session/complete', {
method: 'POST',
headers: { 'Content-Type': 'application/json' }
}).catch(() => {});
}

log(message, level = 'info') {
const prefix = `[${new Date().toISOString()}] [Orchestrator]`;
if (level === 'error') console.error(prefix, '❌', message);
else if (level === 'warn') console.warn(prefix, '⚠️', message);
else console.log(prefix, 'ℹ️', message);
}
}
