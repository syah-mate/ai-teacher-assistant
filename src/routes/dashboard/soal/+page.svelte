<script>
	import { Orchestrator } from '$lib/agents/orchestrator.js';
	import { renderMarkdownWithImages } from '$lib/utils/markdown.js';

	let form = $state({
		mapel: '',
		kelas: 'X',
		topik: '',
		kurikulum: 'Kurikulum Merdeka',
		jenis: 'Pilihan Ganda',
		jumlah: 10,
		tingkat: 'Sedang',
		level: 'C2 – Memahami'
	});

	let isGenerating = $state(false);
	let output = $state('');
	let copied = $state(false);
	let error = $state('');

	// Progress tracking for agentic mode
	let progress = $state({
		step: 0,
		total: 4,
		agent: '',
		status: ''
	});

	let qualityScore = $state(0);
	let qualityIndicator = $state(null);
	let validationReport = $state('');
	let rawData = $state(null); // Store raw data including images

	async function handleGenerate(e) {
		e.preventDefault();
		if (!form.mapel || !form.topik) {
			error = 'Harap isi Mata Pelajaran dan Topik/Materi';
			return;
		}

		isGenerating = true;
		output = '';
		error = '';
		qualityScore = 0;
		qualityIndicator = null;
		validationReport = '';
		rawData = null;

		try {
			progress = {
				step: 0,
				total: 4,
				agent: 'Initializing',
				status: '🚀 Memulai Agentic AI System...'
			};

			const orchestrator = new Orchestrator();

			const userInput = {
				jenis: 'soal',
				judul: form.topik,
				mapel: form.mapel,
				kelas: form.kelas,
				jenisSoal: form.jenis,
				jumlahSoal: form.jumlah,
				tingkat: form.tingkat,
				levelBloom: form.level
			};

			const result = await orchestrator.generate(userInput, (progressData) => {
				progress = progressData;
			});

			if (result.success) {
				output = result.dokumen.content;
				qualityScore = result.dokumen.metadata.validation.score;
				qualityIndicator = result.dokumen.qualityIndicator;
				rawData = result.dokumen; // Store the complete data including images

				console.log('[Soal] Generation complete - Images:', rawData?.images?.length || 0);
				if (rawData?.images?.length > 0) {
					console.log('[Soal] First image preview:', {
						caption: rawData.images[0].caption,
						dataLength: rawData.images[0].data?.length,
						mimeType: rawData.images[0].mimeType
					});
				}
				validationReport = result.dokumen.validationReport;

				progress = {
					...progress,
					status: `✅ Soal berhasil dibuat! (Kualitas: ${qualityScore}/100)`
				};

				// Dispatch event to update rate limit indicator
				window.dispatchEvent(new Event('generate-success'));
			} else {
				error = result.error || 'Terjadi kesalahan saat membuat soal';
				progress = {
					...progress,
					status: '❌ ' + error
				};
			}
		} catch (err) {
			console.error('Generation error:', err);
			error = err.message || 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.';
			progress = {
				...progress,
				status: '❌ ' + error
			};
		} finally {
			isGenerating = false;
		}
	}

	async function copyOutput() {
		await navigator.clipboard.writeText(output);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	/**
	 * Render output with embedded images + markdown parsing
	 */
	function renderOutputWithImages() {
		return renderMarkdownWithImages(output, rawData?.images);
	}

	let isDownloading = $state(false);

	async function downloadDocx() {
		if (!output) return;
		
		isDownloading = true;
		try {
			const soalData = {
				judulSoal: `${form.topik || 'Soal'} - ${form.mapel || ''}`,
				mapel: form.mapel,
				kelas: form.kelas,
				topik: form.topik,
				jenis: form.jenis,
				jumlah: form.jumlah,
				tingkat: form.tingkat,
				level: form.level,
				content: output,
				images: rawData?.images || []
			};

			console.log('[Download Soal DOCX] Images count:', soalData.images?.length);
			if (soalData.images?.length > 0) {
				console.log('[Download Soal DOCX] First image data length:', soalData.images[0]?.data?.length);
			}

			const response = await fetch('/api/export-soal-docx', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ soalData })
			});

			if (!response.ok) {
				throw new Error('Gagal export dokumen');
			}

			// Download file
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			const filename = `Soal_${form.mapel}_${form.topik}`.replace(/[^a-z0-9]/gi, '_');
			a.download = `${filename}.docx`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (err) {
			console.error('Download error:', err);
			alert('Gagal download dokumen. Silakan coba lagi.');
		} finally {
			isDownloading = false;
		}
	}
</script>

<svelte:head>
	<title>Generator Soal — Asisten Guru AI</title>
</svelte:head>

<div class="p-6">
	<!-- Breadcrumb -->
	<div class="mb-4 flex items-center gap-2 text-sm text-gray-500">
		<a href="/dashboard" class="hover:text-violet-600">Dashboard</a>
		<span>/</span>
		<span class="font-medium text-gray-800">Generator Soal Otomatis</span>
	</div>

	<!-- Page header -->
	<div class="mb-6 flex items-center gap-4">
		<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100">
			<svg class="h-6 w-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		</div>
		<div>
			<h1 class="text-2xl font-bold text-gray-800">Generator Soal Otomatis</h1>
			<p class="text-sm text-gray-500">
				Buat soal ujian pilihan ganda, esai, atau campuran secara otomatis
			</p>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
		<!-- Form -->
		<div class="space-y-4">
			<!-- Info Card -->
			<div class="rounded-xl border border-violet-100 bg-violet-50 p-4">
				<div class="mb-2 flex items-center gap-2">
					<svg
						class="h-5 w-5 text-violet-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/>
					</svg>
					<h3 class="font-semibold text-violet-900">Fitur AI Powered</h3>
				</div>
				<p class="text-xs leading-relaxed text-violet-700">
					Generator soal ini menggunakan <strong>Agentic AI System</strong> dengan 2 specialized agents:
					<br />
					🤖 <strong>Soal Generator Agent</strong> - Menyusun soal sesuai standar
					<br />
					✅ <strong>Validator Agent</strong> - Memvalidasi kualitas soal
					<br />
					<span class="mt-2 inline-block text-violet-600"
						>Soal berkualitas tinggi dengan validasi otomatis!</span
					>
				</p>
			</div>

			<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
				<h2 class="mb-5 text-base font-semibold text-gray-700">Konfigurasi Soal</h2>
			<form onsubmit={handleGenerate} class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="col-span-2">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Mata Pelajaran *</label>
						<input
							type="text"
							bind:value={form.mapel}
							placeholder="cth: Biologi, Sejarah Indonesia..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-violet-500 focus:outline-none"
							required
						/>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Kelas</label>
						<select
							bind:value={form.kelas}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-violet-500 focus:outline-none"
						>
							{#each ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'] as k}
								<option value={k} selected={form.kelas === k}>{k}</option>
							{/each}
						</select>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Kurikulum</label>
						<select
							bind:value={form.kurikulum}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-violet-500 focus:outline-none"
						>
							<option>Kurikulum Merdeka</option>
							<option>Kurikulum 2013 (K13)</option>
						</select>
					</div>
					<div class="col-span-2">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Topik / Materi *</label>
						<input
							type="text"
							bind:value={form.topik}
							placeholder="cth: Sel dan Organel, Reformasi 1998..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-violet-500 focus:outline-none"
							required
						/>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Jenis Soal</label>
						<select
							bind:value={form.jenis}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-violet-500 focus:outline-none"
						>
							<option>Pilihan Ganda</option>
							<option>Esai</option>
							<option>Campuran</option>
						</select>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700"
							>Jumlah Soal ({form.jumlah})</label
						>
						<input
							type="range"
							bind:value={form.jumlah}
							min="5"
							max="30"
							step="5"
							class="w-full accent-violet-600"
						/>
						<div class="mt-1 flex justify-between text-xs text-gray-400">
							<span>5</span><span>15</span><span>25</span><span>30</span>
						</div>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Tingkat Kesulitan</label>
						<div class="flex gap-2">
							{#each ['Mudah', 'Sedang', 'Sulit'] as t}
								<button
									type="button"
									onclick={() => (form.tingkat = t)}
									class="flex-1 rounded-lg border py-2 text-xs font-medium transition-colors {form.tingkat ===
									t
										? 'border-violet-600 bg-violet-600 text-white'
										: 'border-gray-200 text-gray-600 hover:border-violet-300'}"
								>
									{t}
								</button>
							{/each}
						</div>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Level Kognitif (Bloom)</label>
						<select
							bind:value={form.level}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-violet-500 focus:outline-none"
						>
							<option>C1 – Mengingat</option>
							<option>C2 – Memahami</option>
							<option>C3 – Mengaplikasikan</option>
							<option>C4 – Menganalisis</option>
							<option>C5 – Mengevaluasi</option>
							<option>C6 – Mencipta</option>
						</select>
					</div>
				</div>

				<button
					type="submit"
					disabled={isGenerating}
					class="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-3 font-semibold text-white transition-colors hover:bg-violet-700 disabled:bg-violet-400"
				>
					{#if isGenerating}
						<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Sedang Membuat Soal...
					{:else}
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
						Generate Soal (AI Powered)
					{/if}
				</button>

				<!-- Progress indicator -->
				{#if isGenerating}
					<div class="mt-4 rounded-lg border border-violet-200 bg-violet-50 p-4">
						<div class="mb-2 flex items-center justify-between text-sm">
							<span class="font-medium text-violet-700">{progress.agent}</span>
							<span class="text-violet-600">Step {progress.step}/{progress.total}</span>
						</div>
						<div class="mb-2 h-2 overflow-hidden rounded-full bg-violet-200">
							<div
								class="h-full bg-violet-600 transition-all duration-300"
								style="width: {(progress.step / progress.total) * 100}%"
							></div>
						</div>
						<p class="text-xs text-violet-600">{progress.status}</p>
					</div>
				{/if}

				<!-- Error message -->
				{#if error}
					<div class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
						<p class="text-sm text-red-700">❌ {error}</p>
					</div>
				{/if}
			</form>
		</div>
	</div>

		<!-- Output -->
		<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<h2 class="text-base font-semibold text-gray-700">Hasil Generate</h2>
					{#if qualityIndicator && qualityScore > 0}
						<span
							class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium
							{qualityIndicator.color === 'emerald'
								? 'bg-emerald-100 text-emerald-700'
								: qualityIndicator.color === 'green'
									? 'bg-green-100 text-green-700'
									: qualityIndicator.color === 'yellow'
										? 'bg-yellow-100 text-yellow-700'
										: 'bg-red-100 text-red-700'}"
						>
							{qualityIndicator.icon}
							{qualityIndicator.label} ({qualityScore})
						</span>
					{/if}
				</div>
				{#if output}
					<div class="flex gap-2">
						{#if validationReport}
							<button
								onclick={() => alert(validationReport)}
								class="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
								title="Lihat laporan validasi AI"
							>
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								Validasi
							</button>
						{/if}
						<button
							onclick={downloadDocx}
							disabled={isDownloading}
							class="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-50"
						>
							{#if isDownloading}
								<svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							{:else}
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
							{/if}
							Download .docx
						</button>
						<button
							onclick={copyOutput}
							class="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
						>
							{#if copied}
								<svg class="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
								Salin Teks
							{/if}
						</button>
					</div>
				{/if}
			</div>

			{#if isGenerating}
				<div class="flex flex-col items-center justify-center py-20 text-gray-400">
					<svg class="mb-3 h-8 w-8 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<p class="text-sm font-medium text-violet-600">{progress.status}</p>
					<p class="mt-1 text-xs text-gray-400">AI sedang menyusun soal berkualitas...</p>
				</div>
			{:else if output}
				<div
					class="max-h-150 overflow-y-auto rounded-xl bg-white p-5 text-sm leading-relaxed text-gray-800">
					{@html renderOutputWithImages()}
				</div>
				
				<!-- Info box if images are embedded -->
				{#if rawData?.images && rawData.images.length > 0}
					<div class="mt-4 rounded-lg border border-violet-200 bg-violet-50 p-3">
						<p class="text-xs text-violet-700">
							✅ <strong>{rawData.images.length} gambar</strong> telah diintegrasikan dalam soal bergambar. Gambar akan otomatis muncul di dokumen .docx.
						</p>
					</div>
				{/if}
			{:else}
				<div class="flex flex-col items-center justify-center py-20 text-gray-300">
					<svg class="mb-3 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<p class="text-sm font-medium text-gray-400">Kumpulan soal akan muncul di sini</p>
					<p class="mt-1 text-xs text-gray-400">Isi form dan klik Generate</p>
				</div>
			{/if}
		</div>
	</div>
</div>
