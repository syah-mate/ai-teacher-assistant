<script>
	import { get } from 'svelte/store';
	import { selectedModel, selectedThinking } from '$lib/stores/modelStore.js';

	let { template, onClose, onSuccess } = $props();

	let isGenerating = $state(false);
	let error = $state('');

	// Build userContext dari inputSchema (jika ada), atau fallback ke field bebas
	let userContext = $state(
		Object.fromEntries(
			(template.inputSchema ?? []).map((f) => [
				f.key,
				f.type === 'multiselect' ? [] : f.type === 'number' ? '' : ''
			])
		)
	);

	// Auto-compute canSubmit: semua required field harus terisi
	const hasInputSchema = $derived((template.inputSchema ?? []).length > 0);
	const canSubmit = $derived(() => {
		if (isGenerating) return false;
		if (!hasInputSchema) return true; // fallback: no schema = always submittable
		const schema = template.inputSchema ?? [];
		for (const field of schema) {
			if (!field.required) continue;
			const val = userContext[field.key];
			const isEmpty = Array.isArray(val)
				? val.length === 0
				: val === '' || val === null || val === undefined || !val.toString().trim();
			if (isEmpty) return false;
		}
		return true;
	});

	async function handleGenerate() {
		const schema = template.inputSchema ?? [];

		// Validasi required fields
		const errors = [];
		for (const field of schema) {
			if (!field.required) continue;
			const val = userContext[field.key];
			const isEmpty = Array.isArray(val)
				? val.length === 0
				: val === '' || val === null || val === undefined || !val.toString().trim();
			if (isEmpty) errors.push(field.label);
		}
		if (errors.length > 0) {
			error = `Field berikut wajib diisi: ${errors.join(', ')}`;
			return;
		}

		isGenerating = true;
		error = '';

		// Clean userContext: number → actual number, remove empty
		const cleanContext = {};
		for (const field of schema) {
			const val = userContext[field.key];
			if (Array.isArray(val)) {
				if (val.length > 0) cleanContext[field.key] = val;
			} else if (field.type === 'number') {
				const num = Number(val);
				if (!isNaN(num)) cleanContext[field.key] = num;
				else if (field.required) cleanContext[field.key] = 0;
			} else {
				const str = val?.toString().trim();
				if (str) cleanContext[field.key] = str;
			}
		}

		try {
			const model = get(selectedModel);
			const thinkingEffort = get(selectedThinking);

			const res = await fetch('/api/generate-async', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ templateId: template._id, userContext: cleanContext, model, thinkingEffort })
			});

			const data = await res.json().catch(() => ({}));

			if (!res.ok) {
				if (res.status === 402) {
					throw new Error(data.error || 'Kuota generate Anda sudah habis.');
				}
				throw new Error(data.error || 'Gagal memulai generate');
			}

			onSuccess?.(data.jobId);
		} catch (err) {
			isGenerating = false;
			error = err.message || 'Terjadi kesalahan.';
		}
	}
</script>

<!-- Overlay -->
<div
	role="button"
	tabindex="0"
	aria-label="Tutup modal"
	class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
	onclick={() => {
		if (!isGenerating) onClose?.();
	}}
	onkeydown={(e) => {
		if ((e.key === 'Enter' || e.key === 'Escape') && !isGenerating) onClose?.();
	}}
></div>

<!-- Modal -->
<div
	class="fixed inset-x-4 top-1/2 z-50 mx-auto max-h-[92vh] max-w-xl -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-2xl"
>
	<!-- Header -->
	<div
		class="relative overflow-hidden rounded-t-2xl bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white"
	>
		<div
			class="absolute top-0 right-0 h-32 w-32 translate-x-1/4 -translate-y-1/3 rounded-full bg-white/10"
		></div>
		<div class="relative flex items-start justify-between gap-3">
			<div>
				<p class="mb-0.5 text-xs font-semibold tracking-wider text-blue-200 uppercase">
					{template.name || 'Template'}
				</p>
				<h2 class="text-lg font-bold">Generate Dokumen</h2>
				<p class="mt-1 text-xs text-blue-100">Isi detail untuk memulai generate</p>
			</div>
			<button
				onclick={onClose}
				disabled={isGenerating}
				aria-label="Tutup"
				class="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white/80 transition-colors hover:bg-white/25 disabled:opacity-30"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	</div>

	<!-- Body -->
	<div class="p-6">
		{#if error}
			<div class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
				{error}
			</div>
		{/if}

		{#if hasInputSchema}
			<div class="space-y-4">
				{#each template.inputSchema as field (field.id)}
					<div>
						<label for="input-{field.key}" class="mb-1.5 block text-sm font-medium text-gray-700">
							{field.label}
							{#if field.required}<span class="text-red-400"> *</span>{/if}
						</label>

						{#if field.type === 'text'}
							<input
								id="input-{field.key}"
								type="text"
								bind:value={userContext[field.key]}
								placeholder={field.placeholder || ''}
								class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
							/>

						{:else if field.type === 'textarea'}
							<textarea
								id="input-{field.key}"
								bind:value={userContext[field.key]}
								placeholder={field.placeholder || ''}
								rows="3"
								class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
							></textarea>

						{:else if field.type === 'number'}
							<input
								id="input-{field.key}"
								type="number"
								bind:value={userContext[field.key]}
								placeholder={field.placeholder || ''}
								class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
							/>

						{:else if field.type === 'select'}
							<select
								id="input-{field.key}"
								bind:value={userContext[field.key]}
								class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
							>
								<option value="">-- Pilih --</option>
								{#each field.options as opt}
									<option value={opt}>{opt}</option>
								{/each}
							</select>

						{:else if field.type === 'multiselect'}
							<div class="space-y-1.5 rounded-xl border border-gray-200 bg-gray-50 p-3">
								{#each field.options as opt}
									<label class="flex items-center gap-2.5 py-1 text-sm text-gray-700 cursor-pointer hover:text-gray-900">
										<input
											type="checkbox"
											checked={userContext[field.key].includes(opt)}
											onchange={(e) => {
												if (e.target.checked) {
													userContext[field.key] = [...userContext[field.key], opt];
												} else {
													userContext[field.key] = userContext[field.key].filter((o) => o !== opt);
												}
											}}
											class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
										/>
										{opt}
									</label>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
				Template ini belum memiliki form input. Silakan edit template untuk menambahkan field input.
			</div>
		{/if}

		<!-- Action -->
		<div class="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
			<button
				onclick={onClose}
				disabled={isGenerating}
				class="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
			>
				Batal
			</button>
			<button
				onclick={handleGenerate}
				disabled={!canSubmit() || isGenerating}
				class="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if isGenerating}
					<span class="flex items-center gap-2">
						<span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
						Memproses...
					</span>
				{:else}
					Generate
				{/if}
			</button>
		</div>
	</div>
</div>
