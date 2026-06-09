<!-- src/lib/components/TemplateBuilder.svelte -->
<!-- Shared component untuk new & edit template builder -->
<script>
	import { getSectionRegistryList, SECTION_REGISTRY, FALLBACK_CUSTOM_SCHEMA } from '$lib/templates/section-registry.js';

	/** Props */
	let {
		mode = 'create',         // 'create' | 'edit'
		initialName = '',
		initialDescription = '',
		initialSections = [],
		onSave = null,           // async (name, description, sections) => { success: boolean, error?: string }
		onCancel = null
	} = $props();

	let templateName = $state(initialName);
	let templateDesc = $state(initialDescription);
	let sections = $state([...initialSections]);
	let saving = $state(false);
	let isGeneratingSchema = $state(false);
	let errorMsg = $state('');
	let dragIndex = $state(null);

	const availableSections = getSectionRegistryList();

	// ── Canvas drag & drop ────────────────────────────────────────────

	function onDragOver(event) {
		event.preventDefault();
	}

	function onDropOnCanvas(event) {
		event.preventDefault();
		const agentKey = event.dataTransfer?.getData('agentKey');
		if (!agentKey) return;
		const reg = SECTION_REGISTRY[agentKey];
		if (!reg) return;
		// Cek duplikat
		if (sections.find(s => s.agentKey === agentKey)) return;

		sections = [...sections, {
			id: crypto.randomUUID(),
			agentKey: reg.agentKey,
			title: reg.label,
			batch: reg.batch,
			critical: reg.critical,
			promptMode: 'default',
			customInstruksi: '',
			customOutputSchema: '',
			displayType: 'description_bullets'
		}];
	}

	// ── Sidebar: drag start ───────────────────────────────────────────

	function onDragStart(event, section) {
		event.dataTransfer.setData('agentKey', section.agentKey);
		event.dataTransfer.effectAllowed = 'copy';
	}

	// ── Reorder dalam canvas ──────────────────────────────────────────

	function onSectionDragStart(event, index) {
		dragIndex = index;
		event.dataTransfer.effectAllowed = 'move';
	}

	function onSectionDropOnCanvas(event, targetIndex) {
		event.preventDefault();
		if (dragIndex === null || dragIndex === targetIndex) {
			dragIndex = null;
			return;
		}
		const reordered = [...sections];
		const [moved] = reordered.splice(dragIndex, 1);
		reordered.splice(targetIndex, 0, moved);
		sections = reordered;
		dragIndex = null;
	}

	// ── Section actions ───────────────────────────────────────────────

	function hapusSection(index) {
		sections = sections.filter((_, i) => i !== index);
	}

	function updateSectionTitle(index, newTitle) {
		sections[index].title = newTitle;
	}

	function toggleDisplayType(index) {
		const current = sections[index].displayType;
		sections[index].displayType = current === 'table' ? 'description_bullets' : 'table';
	}

	function setPromptMode(index, mode) {
		sections[index].promptMode = mode;
	}

	function tambahSectionKustom() {
		sections = [...sections, {
			id: crypto.randomUUID(),
			agentKey: `custom-${crypto.randomUUID().slice(0, 6)}`,
			title: 'Section Baru',
			batch: 2,
			critical: false,
			promptMode: 'custom',
			customInstruksi: '',
			customOutputSchema: '{\n  "konten": "string"\n}',
			displayType: 'description_bullets'
		}];
	}

	// ── Auto-Generate Schema dari Instruksi Kustom ────────────────────

	/**
	 * Iterasi semua sections, untuk yang promptMode 'custom' dan punya instruksi,
	 * panggil API generate-schema dan isi customOutputSchema hasilnya.
	 * Mutasi array sections secara langsung (by reference index).
	 *
	 * @returns {Promise<void>}
	 */
	async function generateSchemaForSections() {
		for (let i = 0; i < sections.length; i++) {
			const s = sections[i];

			// Skip: bukan custom prompt, atau instruksi kosong
			if (s.promptMode !== 'custom' || !s.customInstruksi?.trim()) {
				continue;
			}

			try {
				const res = await fetch('/api/custom-templates/generate-schema', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ instruksi: s.customInstruksi })
				});

				if (!res.ok) throw new Error(`HTTP ${res.status}`);

				const data = await res.json();

				// Update section dengan schema hasil AI (atau fallback yang dikembalikan API)
				sections[i] = { ...sections[i], customOutputSchema: data.schema };

			} catch (err) {
				// Network error atau API down — pakai fallback lokal
				console.warn(`[simpanTemplate] generate-schema gagal untuk "${s.title}", pakai fallback`, err);
				sections[i] = { ...sections[i], customOutputSchema: FALLBACK_CUSTOM_SCHEMA };
			}
		}
	}

	// ── Submit ────────────────────────────────────────────────────────

	async function handleSave() {
		errorMsg = '';
		if (!templateName.trim()) {
			errorMsg = 'Nama template wajib diisi';
			return;
		}
		if (sections.length === 0) {
			errorMsg = 'Tambahkan minimal 1 section';
			return;
		}

		isGeneratingSchema = true;
		saving = true;

		try {
			// Step 1: Generate schema untuk semua section kustom
			await generateSchemaForSections();

			// Step 2: Simpan template
			const result = await onSave?.(templateName.trim(), templateDesc.trim(), sections);
			if (!result?.success) {
				errorMsg = result?.error || 'Gagal menyimpan template';
			}
		} catch (err) {
			errorMsg = err.message || 'Gagal menyimpan template';
		} finally {
			isGeneratingSchema = false;
			saving = false;
		}
	}
</script>

<!-- ================================================================ -->
<!-- HEADER                                                             -->
<!-- ================================================================ -->
<div class="mb-6 space-y-4">
	<div class="flex items-center gap-3">
		<div class="h-5 w-1 rounded-full bg-purple-600"></div>
		<h2 class="text-base font-bold text-gray-800">
			{mode === 'edit' ? 'Edit Template' : 'Buat Template Baru'}
		</h2>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<div>
			<label class="mb-1.5 block text-xs font-semibold text-gray-500">Nama Template *</label>
			<input
				type="text"
				bind:value={templateName}
				placeholder="Contoh: Modul Ajar Bahasa Indonesia SD"
				class="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400
					focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition"
			/>
		</div>
		<div>
			<label class="mb-1.5 block text-xs font-semibold text-gray-500">Deskripsi</label>
			<input
				type="text"
				bind:value={templateDesc}
				placeholder="Deskripsi singkat template ini..."
				class="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400
					focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition"
			/>
		</div>
	</div>
</div>

<!-- ================================================================ -->
<!-- BUILDER: 3-kolom layout                                           -->
<!-- ================================================================ -->
<div class="flex gap-6">
	<!-- KOLOM KIRI (CANVAS) -->
	<div class="flex-1 min-w-0">
		<div
			class="rounded-2xl border-2 border-dashed p-5 min-h-[400px] transition-colors {dragIndex !== null ? 'border-purple-300 bg-purple-50/20' : 'border-gray-200 bg-gray-50/50'}"
			ondragover={onDragOver}
			ondrop={onDropOnCanvas}
		>
			{#if sections.length === 0}
				<div class="flex flex-col items-center justify-center py-16 text-center">
					<svg class="mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
							d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
					</svg>
					<p class="mb-2 text-sm font-medium text-gray-500">Drag section dari sidebar ke sini</p>
					<p class="text-xs text-gray-400">atau klik "Section Kustom" untuk membuat section sendiri</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each sections as section, i (section.id)}
						<div
							class="section-card group rounded-xl border bg-white shadow-sm transition-all hover:shadow-md"
							class:border-purple-300={dragIndex === i}
							class:border-gray-200={dragIndex !== i}
							class:ring-2={dragIndex === i}
							class:ring-purple-200={dragIndex === i}
							draggable="true"
							ondragstart={(e) => onSectionDragStart(e, i)}
							ondragover={onDragOver}
							ondrop={(e) => onSectionDropOnCanvas(e, i)}
						>
							<!-- Section header -->
							<div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
								<div class="flex items-center gap-3 min-w-0">
									<!-- Drag handle -->
									<svg class="h-4 w-4 shrink-0 cursor-grab text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
									</svg>
									<input
										type="text"
										value={section.title}
										oninput={(e) => updateSectionTitle(i, e.target.value)}
										class="min-w-0 flex-1 border-none bg-transparent text-sm font-semibold text-gray-800 outline-none"
									/>
									<span class="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
										{section.agentKey}
									</span>
								</div>
								<div class="flex items-center gap-1.5 shrink-0">
									<!-- Display type toggle -->
									<button
										onclick={() => toggleDisplayType(i)}
										class="rounded-md border px-2 py-0.5 text-xs font-medium transition"
										class:border-purple-200={section.displayType === 'table'}
										class:bg-purple-50={section.displayType === 'table'}
										class:text-purple-700={section.displayType === 'table'}
										class:border-gray-200={section.displayType !== 'table'}
										class:text-gray-500={section.displayType !== 'table'}
										class:hover:bg-gray-100={section.displayType !== 'table'}
										title="Toggle Bullets / Tabel"
									>
										{section.displayType === 'table' ? '📊 Tabel' : '📝 Bullets'}
									</button>
									<button
										onclick={() => hapusSection(i)}
										class="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
										title="Hapus section"
									>
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
							</div>

							<!-- Section body: prompt settings -->
							<div class="px-4 py-3">
								<details class="text-sm" open={section.promptMode === 'custom'}>
									<summary class="cursor-pointer text-xs font-semibold text-gray-500 hover:text-gray-700 select-none">
										⚙️ Pengaturan Prompt
									</summary>
									<div class="mt-3 space-y-3">
										<div class="flex gap-4">
											<label class="flex items-center gap-2 cursor-pointer">
												<input
													type="radio"
													name="prompt-mode-{section.id}"
													checked={section.promptMode === 'default'}
													onchange={() => setPromptMode(i, 'default')}
													class="text-purple-600"
												/>
												<span class="text-xs text-gray-600">Prompt default</span>
											</label>
											<label class="flex items-center gap-2 cursor-pointer">
												<input
													type="radio"
													name="prompt-mode-{section.id}"
													checked={section.promptMode === 'custom'}
													onchange={() => setPromptMode(i, 'custom')}
													class="text-purple-600"
												/>
												<span class="text-xs text-gray-600">Prompt kustom</span>
											</label>
										</div>

										{#if section.promptMode === 'custom'}
											<div class="space-y-3 mt-3">

												<div>
													<label class="block text-xs font-semibold text-gray-600 mb-1">
														Instruksi Kustom
													</label>
													<textarea
														bind:value={sections[i].customInstruksi}
														rows="4"
														placeholder="Contoh: Buat 3 poin materi utama dan 2 pertanyaan refleksi untuk siswa"
														class="w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-700
															placeholder-gray-400 focus:border-purple-400 focus:outline-none
															focus:ring-2 focus:ring-purple-100 resize-y"
													></textarea>
													<p class="mt-1 text-xs text-gray-400">
														💡 Tulis dalam bahasa Indonesia. Schema JSON akan dibuat otomatis saat template disimpan.
													</p>
												</div>

												<!-- Tidak ada field Output Schema di sini — digenerate otomatis saat simpan -->

											</div>
										{/if}
									</div>
								</details>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- KOLOM KANAN (SIDEBAR) -->
	<div class="w-64 shrink-0">
		<div class="sticky top-24 space-y-4">
			<div>
				<h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Bank Section</h3>
				<div class="space-y-2">
					{#each availableSections as sec (sec.agentKey)}
						{@const alreadyAdded = sections.some(s => s.agentKey === sec.agentKey)}
						<div
							class="rounded-xl border bg-white px-4 py-3 transition-all select-none"
							class:border-gray-200={!alreadyAdded}
							class:opacity-40={alreadyAdded}
							class:cursor-not-allowed={alreadyAdded}
							class:cursor-grab={!alreadyAdded}
							class:hover:border-purple-300={!alreadyAdded}
							class:hover:shadow-sm={!alreadyAdded}
							draggable={!alreadyAdded}
							ondragstart={(e) => !alreadyAdded && onDragStart(e, sec)}
						>
							<p class="text-sm font-semibold text-gray-800">
								{sec.label}
								{#if alreadyAdded}
									<span class="ml-1 text-xs text-gray-400">(sudah ada)</span>
								{/if}
							</p>
							<p class="mt-0.5 text-xs text-gray-500">{sec.description}</p>
							<!-- Schema fields chips -->
							{#if sec.schemaFields?.length}
								<div class="mt-2 flex flex-wrap gap-1">
									{#each sec.schemaFields as field}
										<span class="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 leading-tight">
											{field}
										</span>
									{/each}
								</div>
							{/if}
							<div class="mt-1.5 flex items-center gap-2">
								<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
									Batch {sec.batch}
								</span>
								{#if sec.critical}
									<span class="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">Critical</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="border-t border-gray-200 pt-4">
				<button
					onclick={tambahSectionKustom}
					class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-200
						px-4 py-3 text-sm font-medium text-purple-600 transition hover:border-purple-400 hover:bg-purple-50"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					Section Kustom
				</button>
			</div>
		</div>
	</div>
</div>

<!-- ================================================================ -->
<!-- ERROR & FOOTER                                                     -->
<!-- ================================================================ -->

{#if errorMsg}
	<div class="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
		{errorMsg}
	</div>
{/if}

<div class="mt-6 flex items-center justify-between border-t border-gray-200 pt-5">
	<button
		onclick={() => onCancel?.()}
		class="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
	>
		Batal
	</button>

	<button
		onclick={handleSave}
		disabled={saving}
		class="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white
			shadow-sm transition-all active:scale-95
			{saving
				? 'bg-gray-400 cursor-not-allowed shadow-none'
				: 'bg-purple-600 shadow-purple-200 hover:bg-purple-700 hover:shadow-md'}"
	>
		{#if isGeneratingSchema}
			<!-- Spinner -->
			<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
			</svg>
			Menyiapkan template...
		{:else if saving}
			<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
			</svg>
			Menyimpan...
		{:else}
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
			{mode === 'edit' ? 'Simpan Perubahan' : 'Simpan Template'}
		{/if}
	</button>
</div>
