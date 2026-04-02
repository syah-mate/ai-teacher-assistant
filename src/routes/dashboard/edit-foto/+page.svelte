<script>
	let form = $state({
		imageUrl: '',
		description: '',
		style: 'profesional',
		filterType: 'brightness',
		intensity: 50,
		action: 'enhance',
		instructions: ''
	});

	let isProcessing = $state(false);
	let output = $state('');
	let copied = $state(false);

	const styleOptions = [
		{ value: 'profesional', label: 'Profesional' },
		{ value: 'casual', label: 'Casual' },
		{ value: 'modern', label: 'Modern' },
		{ value: 'vintage', label: 'Vintage' },
		{ value: 'minimalis', label: 'Minimalis' }
	];

	const filterOptions = [
		{ value: 'brightness', label: 'Kecerahan' },
		{ value: 'contrast', label: 'Kontras' },
		{ value: 'saturation', label: 'Saturasi' },
		{ value: 'blur', label: 'Blur' },
		{ value: 'sharpen', label: 'Ketajaman' }
	];

	const actionOptions = [
		{ value: 'enhance', label: 'Tingkatkan Kualitas' },
		{ value: 'resize', label: 'Ubah Ukuran' },
		{ value: 'crop', label: 'Potong' },
		{ value: 'remove-bg', label: 'Hapus Background' },
		{ value: 'add-text', label: 'Tambah Teks' }
	];

	function generateEditPrompt() {
		const { description, style, filterType, intensity, action, instructions } = form;
		return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  INSTRUKSI EDIT FOTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📸 DESKRIPSI FOTO
${description || 'Foto yang akan diedit'}

🎨 STYLE
${styleOptions.find((s) => s.value === style)?.label || 'Profesional'}

⚙️ PENGATURAN
Aksi           : ${actionOptions.find((a) => a.value === action)?.label || 'Tingkatkan Kualitas'}
Filter         : ${filterOptions.find((f) => f.value === filterType)?.label || 'Kecerahan'}
Intensitas     : ${intensity}%

📝 INSTRUKSI KHUSUS
${instructions || 'Tidak ada instruksi khusus'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REKOMENDASI PENGGUNAAN TOOL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Untuk edit foto, disarankan menggunakan:
• Canva (https://canva.com) - Edit online mudah
• Photopea (https://photopea.com) - Mirip Photoshop, gratis
• Remove.bg (https://remove.bg) - Hapus background otomatis
• TinyPNG (https://tinypng.com) - Kompres ukuran foto
• Photoshop Express - Editor foto mobile

LANGKAH-LANGKAH:
1. Upload foto Anda ke tool pilihan
2. Pilih aksi: ${actionOptions.find((a) => a.value === action)?.label}
3. Terapkan filter: ${filterOptions.find((f) => f.value === filterType)?.label}
4. Atur intensitas sesuai kebutuhan (${intensity}%)
5. Sesuaikan dengan style: ${styleOptions.find((s) => s.value === style)?.label}
6. Download hasil edit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Dibuat dengan Asisten Guru AI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
	}

	async function handleProcess(e) {
		e.preventDefault();
		if (!form.description) return;
		isProcessing = true;
		output = '';
		await new Promise((r) => setTimeout(r, 1500));
		output = generateEditPrompt();
		isProcessing = false;
	}

	async function copyOutput() {
		await navigator.clipboard.writeText(output);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<svelte:head>
	<title>Edit Foto — Asisten Guru AI</title>
</svelte:head>

<div class="p-6">
	<!-- Breadcrumb -->
	<div class="mb-4 flex items-center gap-2 text-sm text-gray-500">
		<a href="/dashboard" class="hover:text-blue-600">Dashboard</a>
		<span>/</span>
		<span class="font-medium text-gray-800">Edit Foto</span>
	</div>

	<!-- Page header -->
	<div class="mb-6 flex items-center gap-4">
		<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100">
			<svg class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
				/>
			</svg>
		</div>
		<div>
			<h1 class="text-2xl font-bold text-gray-800">Edit Foto</h1>
			<p class="text-sm text-gray-500">
				Buat panduan untuk mengedit foto dengan berbagai style dan filter
			</p>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
		<!-- Form -->
		<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
			<h2 class="mb-5 text-base font-semibold text-gray-700">Pengaturan Edit Foto</h2>
			<form onsubmit={handleProcess} class="space-y-4">
				<div>
					<label for="description-input" class="mb-1 block text-sm font-medium text-gray-700"
						>Deskripsi Foto *</label
					>
					<textarea
						id="description-input"
						bind:value={form.description}
						placeholder="Jelaskan foto yang akan diedit, misalnya: Foto profil guru untuk website sekolah"
						rows="3"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
						required
					></textarea>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="style-select" class="mb-1 block text-sm font-medium text-gray-700"
							>Style</label
						>
						<select
							id="style-select"
							bind:value={form.style}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
						>
							{#each styleOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="action-select" class="mb-1 block text-sm font-medium text-gray-700"
							>Aksi</label
						>
						<select
							id="action-select"
							bind:value={form.action}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
						>
							{#each actionOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="filter-select" class="mb-1 block text-sm font-medium text-gray-700"
							>Filter</label
						>
						<select
							id="filter-select"
							bind:value={form.filterType}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
						>
							{#each filterOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="intensity-input" class="mb-1 block text-sm font-medium text-gray-700"
							>Intensitas ({form.intensity}%)</label
						>
						<input
							id="intensity-input"
							type="range"
							bind:value={form.intensity}
							min="0"
							max="100"
							class="w-full"
						/>
					</div>
				</div>

				<div>
					<label for="instructions-input" class="mb-1 block text-sm font-medium text-gray-700"
						>Instruksi Khusus (Opsional)</label
					>
					<textarea
						id="instructions-input"
						bind:value={form.instructions}
						placeholder="Tambahkan instruksi khusus untuk editing, misalnya: Perbaiki pencahayaan, hapus bayangan"
						rows="2"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
					></textarea>
				</div>

				<button
					type="submit"
					disabled={isProcessing}
					class="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if isProcessing}
						<span class="flex items-center justify-center gap-2">
							<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Memproses...
						</span>
					{:else}
						🎨 Generate Panduan Edit
					{/if}
				</button>
			</form>
		</div>

		<!-- Output -->
		<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-base font-semibold text-gray-700">Hasil Panduan</h2>
				{#if output}
					<button
						onclick={copyOutput}
						class="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
					>
						{#if copied}
							<svg class="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							Tersalin!
						{:else}
							<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
								/>
							</svg>
							Salin
						{/if}
					</button>
				{/if}
			</div>
			{#if output}
				<div class="rounded-lg bg-gray-50 p-4">
					<pre class="whitespace-pre-wrap font-mono text-xs leading-relaxed text-gray-700">{output}</pre>
				</div>
			{:else}
				<div class="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-200">
					<div class="text-center">
						<svg
							class="mx-auto mb-3 h-12 w-12 text-gray-300"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						<p class="text-sm text-gray-500">Panduan edit foto akan muncul di sini</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
