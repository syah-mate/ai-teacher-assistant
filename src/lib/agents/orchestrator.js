/**
 * Orchestrator — Wrapper untuk FlexOrchestrator
 *
 * Dipanggil oleh job-runner.js.
 * Thin wrapper yang mendelegasikan semua kerja ke FlexOrchestrator.
 */

import { FlexOrchestrator } from './flex-orchestrator.js';

export class Orchestrator {
	async generate(templateId, userContext, onProgress) {
		const flex = new FlexOrchestrator();
		return flex.generate(templateId, userContext, onProgress);
	}

	async checkQuota() {
		const serverFns = typeof globalThis !== 'undefined' && globalThis.__getJobQuotaFns?.();
		if (serverFns) return serverFns.checkQuota();
		return { ok: true };
	}

	async consumeQuota() {
		const serverFns = typeof globalThis !== 'undefined' && globalThis.__getJobQuotaFns?.();
		if (serverFns) return serverFns.consumeQuota();
	}
}
