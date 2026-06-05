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

// Quota sudah di-reserve secara atomic di POST /api/generate-async sebelum job dibuat.
const session = await this.checkQuota();
if (!session.ok) return { success: false, error: session.error };

const agent = agentFactory();
const agentName = agent.constructor.name;
onProgress?.({ type: 'orchestrator', action: 'delegating', name: agentName, message: `Orchestrator → mendelegasikan ke ${agentName}` });

const result = await agent.run(userInput, onProgress);

if (result.success) await this.consumeQuota();

return result;
}

async checkQuota() {
// Jika berjalan di background job, gunakan quota fns dari job-runner
const serverFns = typeof globalThis !== 'undefined' && globalThis.__getJobQuotaFns?.();
if (serverFns) return serverFns.checkQuota();

// Fallback: fetch dari API (jika dipakai di luar background job)
try {
const res = await fetch('/api/user/quota');
if (!res.ok) {
const data = await res.json().catch(() => ({}));
return { ok: false, error: data.error || 'Gagal memeriksa kuota' };
}
const data = await res.json();
if (data.remaining <= 0) {
return {
ok: false,
error: 'Kuota generate Anda sudah habis. Silakan upgrade Plan untuk mendapatkan kuota tambahan.'
};
}
return { ok: true, remaining: data.remaining };
} catch (err) {
return { ok: false, error: 'Gagal terhubung ke server: ' + err.message };
}
}

async consumeQuota() {
const serverFns = typeof globalThis !== 'undefined' && globalThis.__getJobQuotaFns?.();
if (serverFns) return serverFns.consumeQuota();

// consumeQuota selalu dipanggil dari background job
console.warn('[Orchestrator] consumeQuota called outside job context');
}

log(message, level = 'info') {
const prefix = `[${new Date().toISOString()}] [Orchestrator]`;
if (level === 'error') console.error(prefix, '❌', message);
else if (level === 'warn') console.warn(prefix, '⚠️', message);
else console.log(prefix, 'ℹ️', message);
}
}
