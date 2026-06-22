<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	const FIELD_TYPES = [
		{ value: 'text', label: 'Text' },
		{ value: 'array', label: 'Array (List)' },
		{ value: 'array-object', label: 'Array of Objects (Tabel)' },
		{ value: 'richtext', label: 'Rich Text (HTML)' },
		{ value: 'number', label: 'Number' }
	];

	const INPUT_FIELD_TYPES = [
		{ value: 'text', label: 'Text (Input pendek)' },
		{ value: 'textarea', label: 'Textarea (Paragraf)' },
		{ value: 'number', label: 'Number (Angka)' },
		{ value: 'select', label: 'Pilihan Tunggal (Dropdown)' },
		{ value: 'multiselect', label: 'Pilihan Ganda (Checkbox)' }
	];

	let template = $state({
		name: '',
		description: '',
		templatePrompt: '',
		kategoriId: '',
		inputSchema: [],
		sections: []
	});

	let kategoriList = $state([]);
	let saving = $state(false);
	let error = $state('');
	let success = $state('');
	let isNew = $state(false);
	let templateId = $state(null);
	let loaded = $state(false);

	$effect(() => {
		const pathId = $page.params.id;
		isNew = !pathId || pathId === 'new';
		templateId = isNew ? null : pathId;
	});

	onMount(async () => {
		// Load kategori list
		try {
			const katRes = await fetch('/api/kategori');
			if (katRes.ok) {
				const katData = await katRes.json();
				kategoriList = katData.kategori || [];
			}
		} catch { /* silent */ }

		if (!isNew && templateId) {
			try {
				const res = await fetch(`/api/user-templates/${templateId}`);
				if (res.ok) {
					const data = await res.json();
					template = {
						name: data.template.name || '',
						description: data.template.description || '',
						templatePrompt: data.template.templatePrompt || '',
						kategoriId: data.template.kategoriId || '',
						inputSchema: (data.template.inputSchema || []).map((f) => ({
							id: f.id,
							key: f.key || '',
							label: f.label || '',
							type: f.type || 'text',
							placeholder: f.placeholder || '',
							required: f.required !== false,
							options: f.options || []
						})),
						sections: (data.template.sections || []).map((s) => ({
							id: s.id,
							title: s.title || '',
							sectionPrompt: s.sectionPrompt || '',
							fields: (s.fields || []).map((f) => ({
								id: f.id,
								key: f.key || '',
								label: f.label || '',
								type: f.type || 'text',
								fieldPrompt: f.fieldPrompt || ''
							}))
						}))
					};
				} else {
					error = 'Gagal memuat template';
				}
			} catch {
				error = 'Gagal terhubung ke server';
			}
		}
		loaded = true;
	});

	function addSection() {
		template.sections = [
			...template.sections,
			{
				id: crypto.randomUUID(),
				title: '',
				sectionPrompt: '',
				fields: []
			}
		];
	}

	function removeSection(index) {
		template.sections = template.sections.filter((_, i) => i !== index);
	}

	function addField(sectionIndex) {
		template.sections = template.sections.map((s, si) => {
			if (si !== sectionIndex) return s;
			return {
				...s,
				fields: [
					...s.fields,
					{
						id: crypto.randomUUID(),
						key: '',
						label: '',
						type: 'text',
						fieldPrompt: ''
					}
				]
			};
		});
	}

	function removeField(sectionIndex, fieldIndex) {
		template.sections = template.sections.map((s, si) => {
			if (si !== sectionIndex) return s;
			return {
				...s,
				fields: s.fields.filter((_, fi) => fi !== fieldIndex)
			};
		});
	}

	function updateSection(sectionIndex, field, value) {
		template.sections = template.sections.map((s, si) => {
			if (si !== sectionIndex) return s;
			return { ...s, [field]: value };
		});
	}

	function updateField(sectionIndex, fieldIndex, prop, value) {
		template.sections = template.sections.map((s, si) => {
			if (si !== sectionIndex) return s;
			return {
				...s,
				fields: s.fields.map((f, fi) => {
					if (fi !== fieldIndex) return f;
					const updated = { ...f, [prop]: value };
					// Auto-generate key from label
					if (prop === 'label') {
						updated.key = value
							.toLowerCase()
							.replace(/[^a-z0-9\s]/g, '')
							.replace(/\s+/g, '_')
							.slice(0, 40);
					}
					return updated;
				})
			};
		});
	}

	// ── inputSchema helpers ────────────────────────────────────────────

	function addInputField() {
		template.inputSchema = [
			...template.inputSchema,
			{
				id: crypto.randomUUID(),
				key: '',
				label: '',
				type: 'text',
				placeholder: '',
				required: true,
				options: []
			}
		];
	}

	function removeInputField(index) {
		template.inputSchema = template.inputSchema.filter((_, i) => i !== index);
	}

	function updateInputField(index, prop, value) {
		template.inputSchema = template.inputSchema.map((f, i) => {
			if (i !== index) return f;
			const updated = { ...f, [prop]: value };
			// Auto-generate key from label
			if (prop === 'label') {
				updated.key = value
					.toLowerCase()
					.replace(/[^a-z0-9\s]/g, '')
					.replace(/\s+/g, '_')
					.slice(0, 40);
			}
			// Reset options when switching away from select/multiselect
			if (prop === 'type' && !['select', 'multiselect'].includes(value)) {
				updated.options = [];
			}
			return updated;
		});
	}

	function addInputOption(index) {
		template.inputSchema = template.inputSchema.map((f, i) => {
			if (i !== index) return f;
			return { ...f, options: [...f.options, ''] };
		});
	}

	function updateInputOption(fieldIndex, optionIndex, value) {
		template.inputSchema = template.inputSchema.map((f, i) => {
			if (i !== fieldIndex) return f;
			return {
				...f,
				options: f.options.map((o, oi) => (oi === optionIndex ? value : o))
			};
		});
	}

	function removeInputOption(fieldIndex, optionIndex) {
		template.inputSchema = template.inputSchema.map((f, i) => {
			if (i !== fieldIndex) return f;
			return { ...f, options: f.options.filter((_, oi) => oi !== optionIndex) };
		});
	}

	async function handleSave() {
		error = '';
		success = '';

		// Validasi client-side
		if (!template.name.trim()) {
			error = 'Nama template wajib diisi';
			return;
		}

		if (template.sections.length === 0) {
			error = 'Minimal 1 section diperlukan';
			return;
		}

		for (let si = 0; si < template.sections.length; si++) {
			const s = template.sections[si];
			if (!s.title.trim()) {
				error = `Section #${si + 1}: title wajib diisi`;
				return;
			}
			if (s.fields.length === 0) {
				error = `Section "${s.title}": minimal 1 field`;
				return;
			}

			const keys = new Set();
			for (let fi = 0; fi < s.fields.length; fi++) {
				const f = s.fields[fi];
				if (!f.key.trim()) {
					error = `Section "${s.title}", field #${fi + 1}: key wajib diisi`;
					return;
				}
				if (!/^[a-z0-9_]+$/.test(f.key.trim())) {
					error = `Section "${s.title}", field "${f.key}": key hanya boleh huruf kecil, angka, underscore`;
					return;
				}
				if (keys.has(f.key.trim())) {
					error = `Section "${s.title}": key "${f.key}" duplikat`;
					return;
				}
				keys.add(f.key.trim());
				if (!f.label.trim()) {
					error = `Section "${s.title}", field "${f.key}": label wajib diisi`;
					return;
				}
			}
		}

		saving = true;
		try {
			const body = {
				name: template.name.trim(),
				description: template.description.trim(),
				templatePrompt: template.templatePrompt.trim(),
				kategoriId: template.kategoriId || null,
				inputSchema: template.inputSchema
					.filter((f) => f.key.trim() && f.label.trim())
					.map((f) => ({
						id: f.id,
						key: f.key.trim(),
						label: f.label.trim(),
						type: f.type,
						placeholder: f.placeholder.trim(),
						required: f.required,
						options: f.options.filter((o) => o.trim())
					})),
				sections: template.sections.map((s) => ({
					id: s.id,
					title: s.title.trim(),
					sectionPrompt: s.sectionPrompt.trim(),
					fields: s.fields.map((f) => ({
						id: f.id,
						key: f.key.trim(),
						label: f.label.trim(),
						type: f.type,
						fieldPrompt: f.fieldPrompt.trim()
					}))
				}))
			};

			let res;
			if (isNew) {
				res = await fetch('/api/user-templates', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body)
				});
			} else {
				res = await fetch(`/api/user-templates/${templateId}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body)
				});
			}

			const data = await res.json();
			if (res.ok) {
				success = 'Template berhasil disimpan!';
				if (isNew && data._id) {
					// Redirect to edit page with new ID
					goto(`/dashboard/template-builder/${data._id}`);
				}
			} else {
				error = data.error || 'Gagal menyimpan';
			}
		} catch {
			error = 'Gagal terhubung ke server';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>{isNew ? 'Buat Template' : 'Edit Template'} — Asisten Guru AI</title>
</svelte:head>

{#if !loaded}
	<div class="flex items-center justify-center py-20">
		<div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
	</div>
{:else}
	<div class="mx-auto max-w-3xl p-6">
		<!-- Header -->
		<div class="mb-6">
			<button
				onclick={() => goto('/dashboard/template-builder')}
				class="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Kembali ke daftar
			</button>
			<h1 class="text-2xl font-bold text-gray-800">
				{isNew ? 'Buat Template Baru' : 'Edit Template'}
			</h1>
		</div>

		<!-- Messages -->
		{#if error}
			<div class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
		{/if}
		{#if success}
			<div class="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">{success}</div>
		{/if}

		<!-- Template Info -->
		<div class="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
			<h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Informasi Template</h2>

			<div class="mb-4">
				<label class="mb-1.5 block text-sm font-medium text-gray-700">Nama Template *</label>
				<input
					type="text"
					bind:value={template.name}
					placeholder="Contoh: Modul Ajar Kurikulum Merdeka"
					class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				/>
			</div>

			<div class="mb-4">
				<label class="mb-1.5 block text-sm font-medium text-gray-700">Deskripsi</label>
				<input
					type="text"
					bind:value={template.description}
					placeholder="Deskripsi singkat template ini"
					class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				/>
			</div>

			<div class="mb-4">
				<label class="mb-1.5 block text-sm font-medium text-gray-700">Kategori</label>
				<select
					bind:value={template.kategoriId}
					class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				>
					<option value="">-- Tanpa Kategori --</option>
					{#each kategoriList as kat}
						<option value={kat._id}>{kat.nama}</option>
					{/each}
				</select>
				<p class="mt-1 text-xs text-gray-400">
					<a href="/dashboard/data-master/kategori" class="text-blue-600 hover:underline">Kelola kategori</a> untuk mengelompokkan template
				</p>
			</div>

			<div>
				<label class="mb-1.5 block text-sm font-medium text-gray-700">Prompt Global Template</label>
				<textarea
					bind:value={template.templatePrompt}
					rows="4"
					placeholder="Jelaskan konteks umum template ini. Misal: Template ini untuk membuat Modul Ajar berbasis Kurikulum Merdeka..."
					class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				></textarea>
				<p class="mt-1 text-xs text-gray-400">Prompt ini digunakan sebagai konteks global saat AI menyempurnakan prompt setiap field.</p>
			</div>
		</div>

		<!-- Form Input Generate (inputSchema) -->
		<div class="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
			<div class="mb-4 flex items-start justify-between">
				<div>
					<h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400">Form Input Generate</h2>
					<p class="mt-1 text-xs text-gray-400">
						Tentukan data apa yang perlu diisi enduser sebelum generate. Data ini akan menjadi acuan AI saat mengisi seluruh konten dokumen.
					</p>
				</div>
				<span class="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
					{template.inputSchema.length} field
				</span>
			</div>

			<div class="space-y-3">
				{#each template.inputSchema as field, fi (field.id)}
					<div class="rounded-lg border border-gray-100 bg-gray-50 p-4">
						<div class="mb-3 flex items-start justify-between">
							<span class="text-xs font-semibold text-gray-500">Input #{fi + 1}</span>
							<button
								onclick={() => removeInputField(fi)}
								class="rounded px-2 py-0.5 text-xs text-red-500 hover:bg-red-50"
							>
								Hapus
							</button>
						</div>

						<div class="grid grid-cols-2 gap-3">
							<div>
								<label class="mb-1 block text-xs font-medium text-gray-600">Label</label>
								<input
									type="text"
									value={field.label}
									oninput={(e) => updateInputField(fi, 'label', e.target.value)}
									placeholder="Contoh: Mata Pelajaran"
									class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								/>
							</div>
							<div>
								<label class="mb-1 block text-xs font-medium text-gray-600">Key</label>
								<input
									type="text"
									value={field.key}
									oninput={(e) => updateInputField(fi, 'key', e.target.value)}
									placeholder="mapel"
									class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								/>
							</div>
						</div>

						<div class="mt-3 grid grid-cols-3 gap-3">
							<div>
								<label class="mb-1 block text-xs font-medium text-gray-600">Tipe</label>
								<select
									value={field.type}
									onchange={(e) => updateInputField(fi, 'type', e.target.value)}
									class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								>
									{#each INPUT_FIELD_TYPES as ft}
										<option value={ft.value}>{ft.label}</option>
									{/each}
								</select>
							</div>
							<div>
								<label class="mb-1 block text-xs font-medium text-gray-600">Placeholder</label>
								<input
									type="text"
									value={field.placeholder}
									oninput={(e) => updateInputField(fi, 'placeholder', e.target.value)}
									placeholder="Hint untuk user..."
									class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								/>
							</div>
							<div class="flex items-end pb-2">
								<label class="flex items-center gap-2 text-sm cursor-pointer">
									<input
										type="checkbox"
										checked={field.required}
										onchange={(e) => updateInputField(fi, 'required', e.target.checked)}
										class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
									/>
									<span class="text-xs text-gray-600">Wajib diisi</span>
								</label>
							</div>
						</div>

						<!-- Options editor (select / multiselect only) -->
						{#if field.type === 'select' || field.type === 'multiselect'}
							<div class="mt-3 border-t border-gray-200 pt-3">
								<p class="mb-2 text-xs font-medium text-gray-500">Opsi Pilihan</p>
								<div class="space-y-1.5">
									{#each field.options as opt, oi}
										<div class="flex items-center gap-2">
											<input
												type="text"
												value={opt}
												oninput={(e) => updateInputOption(fi, oi, e.target.value)}
												placeholder={`Opsi ${oi + 1}`}
												class="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
											/>
											<button
												onclick={() => removeInputOption(fi, oi)}
												class="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
											>
												<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
												</svg>
											</button>
										</div>
									{/each}
								</div>
								<button
									onclick={() => addInputOption(fi)}
									class="mt-2 rounded border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600"
								>
									+ Tambah Opsi
								</button>
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<button
				onclick={addInputField}
				class="mt-4 w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
			>
				+ Tambah Field Input
			</button>
		</div>

		<!-- Sections -->
		<div class="mb-6">
			<h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
				Section ({template.sections.length})
			</h2>

			<div class="space-y-4">
				{#each template.sections as section, si (section.id)}
					<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
						<div class="mb-4 flex items-start justify-between">
							<h3 class="text-base font-bold text-gray-700">Section #{si + 1}</h3>
							<button
								onclick={() => removeSection(si)}
								class="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50"
							>
								Hapus Section
							</button>
						</div>

						<div class="mb-4">
							<label class="mb-1.5 block text-sm font-medium text-gray-700">Judul Section *</label>
							<input
								type="text"
								value={section.title}
								oninput={(e) => updateSection(si, 'title', e.target.value)}
								placeholder="Contoh: Identitas Modul, Kompetensi Dasar, ..."
								class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>

						<div class="mb-4">
							<label class="mb-1.5 block text-sm font-medium text-gray-700">Prompt Section</label>
							<textarea
								value={section.sectionPrompt}
								oninput={(e) => updateSection(si, 'sectionPrompt', e.target.value)}
								rows="2"
								placeholder="Instruksi spesifik untuk section ini..."
								class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							></textarea>
						</div>

						<!-- Fields -->
						<div class="ml-4 border-l-2 border-blue-100 pl-4">
							<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
								Field ({section.fields.length})
							</p>

							<div class="space-y-3">
								{#each section.fields as field, fi (field.id)}
									<div class="rounded-lg border border-gray-100 bg-gray-50 p-3">
										<div class="mb-3 flex items-start justify-between">
											<span class="text-xs font-semibold text-gray-500">Field #{fi + 1}</span>
											<button
												onclick={() => removeField(si, fi)}
												class="rounded px-2 py-0.5 text-xs text-red-500 hover:bg-red-50"
											>
												Hapus
											</button>
										</div>

										<div class="grid grid-cols-2 gap-3">
											<div>
												<label class="mb-1 block text-xs font-medium text-gray-600">Label *</label>
												<input
													type="text"
													value={field.label}
													oninput={(e) => updateField(si, fi, 'label', e.target.value)}
													placeholder="Contoh: Tujuan Pembelajaran"
													class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
												/>
											</div>
											<div>
												<label class="mb-1 block text-xs font-medium text-gray-600">Key *</label>
												<input
													type="text"
													value={field.key}
													oninput={(e) => updateField(si, fi, 'key', e.target.value)}
													placeholder="tujuan_pembelajaran"
													class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
												/>
											</div>
										</div>

										<div class="mt-3">
											<label class="mb-1 block text-xs font-medium text-gray-600">Tipe</label>
											<select
												value={field.type}
												onchange={(e) => updateField(si, fi, 'type', e.target.value)}
												class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
											>
												{#each FIELD_TYPES as ft}
													<option value={ft.value}>{ft.label}</option>
												{/each}
											</select>
										</div>

										<div class="mt-3">
											<label class="mb-1 block text-xs font-medium text-gray-600">Prompt Field</label>
											<textarea
												value={field.fieldPrompt}
												oninput={(e) => updateField(si, fi, 'fieldPrompt', e.target.value)}
												rows="2"
												placeholder="Instruksi spesifik untuk field ini..."
												class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
											></textarea>
										</div>
									</div>
								{/each}
							</div>

							<button
								onclick={() => addField(si)}
								class="mt-3 rounded-lg border border-dashed border-blue-300 px-4 py-2 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50"
							>
								+ Tambah Field
							</button>
						</div>
					</div>
				{/each}
			</div>

			<button
				onclick={addSection}
				class="mt-4 w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-semibold text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
			>
				+ Tambah Section
			</button>
		</div>

		<!-- Save button -->
		<div class="flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
			<button
				onclick={() => goto('/dashboard/template-builder')}
				class="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
			>
				Batal
			</button>
			<button
				onclick={handleSave}
				disabled={saving}
				class="rounded-lg bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{saving ? 'Menyimpan...' : isNew ? 'Simpan Template' : 'Update Template'}
			</button>
		</div>
	</div>
{/if}
