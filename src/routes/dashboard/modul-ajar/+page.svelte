<script>
	import { getKurikulumMerdekaContext, getModelPembelajaran } from '$lib/prompts/kurikulum-merdeka-base.js';
	import { callGeminiAPI, buildPrompt } from '$lib/utils/gemini-client.js';
	import { ModulAjarOrchestrator } from '$lib/agents/modul-ajar/index.js';

	let form = $state({
		judulModul: '',
		mapel: '',
		kelas: 'X',
		fase: 'Fase E',
		jumlahPertemuan: '4',
		alokasiPerPertemuan: '2x45 menit (2 JP)',
		kurikulum: 'Kurikulum Merdeka',
		metode: 'Problem Based Learning (PBL)',
		modePembelajaran: 'Luring (Tatap Muka)',
		deskripsi: '',
		saranaPrasarana: '',
		prasyarat: '',
		atp: '',
		penulis: '',
		instansi: 'Sekolah'
	});

	let generationMode = $state('agentic'); // 'agentic' or 'single'
	let isGenerating = $state(false);
	let output = $state('');
	let copied = $state(false);
	let error = $state('');
	
	// Progress tracking for agentic mode
	let progress = $state({
		step: 0,
		total: 6,
		phase: '',
		message: '',
		status: 'idle' // idle, running, completed, error
	});
	
	let qualityScore = $state(0);
	let rawData = $state(null); // Store raw data for debugging


	const kelasList = [
		{ val: 'I', fase: 'Fase A' },
		{ val: 'II', fase: 'Fase A' },
		{ val: 'III', fase: 'Fase B' },
		{ val: 'IV', fase: 'Fase B' },
		{ val: 'V', fase: 'Fase C' },
		{ val: 'VI', fase: 'Fase C' },
		{ val: 'VII', fase: 'Fase D' },
		{ val: 'VIII', fase: 'Fase D' },
		{ val: 'IX', fase: 'Fase D' },
		{ val: 'X', fase: 'Fase E' },
		{ val: 'XI', fase: 'Fase F' },
		{ val: 'XII', fase: 'Fase F' }
	];

	function onKelasChange(e) {
		form.kelas = e.target.value;
		const found = kelasList.find((k) => k.val === e.target.value);
		if (found) form.fase = found.fase;
	}

	function buildModulAjarPrompt() {
		const { mapel, kelas, topik, waktu, metode, tujuan } = form;
		
		// Convert Roman numeral to number for fase mapping
		const kelasMap = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };
		const kelasNumber = kelasMap[kelas];
		
		// Get curriculum context
		const systemContext = getKurikulumMerdekaContext(kelasNumber, mapel);
		
		// Get model pembelajaran details
		const modelKey = metode.includes('PBL') ? 'pbl' : 
		                 metode.includes('Discovery') ? 'discoveryLearning' :
		                 metode.includes('Project') ? 'projectBased' : 'pbl';
		const modelDetail = getModelPembelajaran(modelKey);
		
		const outputFormat = `
FORMAT:

━━ MODUL AJAR ${mapel} - ${topik} ━━

A. IDENTITAS
Mapel: ${mapel} | Kelas: ${kelas} (${form.fase}) | Waktu: ${waktu}

B. CP & TUJUAN
${tujuan || '• Buat 4 tujuan spesifik (C1-C6) untuk ' + topik}

C. PPP
• 2-3 dimensi yang dikembangkan

D. PEMANTIK
• 3 pertanyaan menarik

E. PEMBELAJARAN (${metode})
${modelDetail.sintak.map((s, i) => `${i + 1}. ${s}`).join('\n')}
Detail per fase untuk ${topik}

F. ASESMEN
• Diagnostik, Formatif, Sumatif + rubrik

G. MEDIA & PENGAYAAN

Konten spesifik ${topik}, praktis, siap pakai.`;

		const userInput = {
			mataPelajaran: mapel,
			kelas: `${kelas} (${form.fase})`,
			topik: topik,
			alokasiWaktu: waktu,
			metodePembelajaran: `${metode} (${modelDetail.deskripsi})`,
			tujuanKhusus: tujuan || 'Buat tujuan pembelajaran yang sesuai'
		};

		return buildPrompt(systemContext, userInput, outputFormat);
	}

	async function handleGenerate(e) {
		e.preventDefault();
		if (!form.mapel || !form.judulModul) return;
		
		isGenerating = true;
		output = '';
		error = '';
		qualityScore = 0;
		rawData = null;
		
		if (generationMode === 'agentic') {
			await generateWithAgenticAI();
		} else {
			await generateWithSinglePrompt();
		}
	}
	
	/**
	 * Generate using Agentic AI System (multi-step with specialized agents)
	 */
	async function generateWithAgenticAI() {
		try {
			progress = {
				step: 0,
				total: 6,
				phase: 'starting',
				message: '🚀 Memulai sistem Agentic AI...',
				status: 'running'
			};
			
			const orchestrator = new ModulAjarOrchestrator();
			
			const userInput = {
				judulModul: form.judulModul,
				mapel: form.mapel,
				kelas: form.kelas,
				jenjang: getJenjangFromKelas(form.kelas),
				jumlahPertemuan: form.jumlahPertemuan,
				alokasiPerPertemuan: form.alokasiPerPertemuan,
				metode: form.metode,
				modePembelajaran: form.modePembelajaran,
				penulis: form.penulis || 'Guru Mata Pelajaran',
				instansi: form.instansi || 'Sekolah'
			};
			
			const result = await orchestrator.generateModulAjar(userInput, (progressData) => {
				progress = progressData;
			});
			
			if (result.success) {
				output = result.modulAjar;
				qualityScore = result.metadata.qualityScore;
				rawData = result.rawData;
				
				progress = {
					...progress,
					status: 'completed',
					message: `✅ Modul Ajar berhasil dibuat! (Quality Score: ${result.metadata.qualityScore}/100)`
				};

				// Dispatch event to update rate limit indicator
				window.dispatchEvent(new Event('generate-success'));
			} else {
				error = result.error;
				progress = {
					...progress,
					status: 'error',
					message: '❌ ' + result.error
				};
			}
		} catch (err) {
			error = 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.';
			console.error('Agentic AI error:', err);
			progress = {
				...progress,
				status: 'error',
				message: '❌ ' + err.message
			};
		} finally {
			isGenerating = false;
		}
	}
	
	/**
	 * Generate using Single Prompt (traditional method)
	 */
	async function generateWithSinglePrompt() {
		try {
			const prompt = buildModulAjarPrompt();
			const result = await callGeminiAPI(prompt, {
				maxRetries: 3,
				timeout: 60000
			});
			
			if (result.success) {
				output = result.data;
			} else {
				error = result.error;
			}
		} catch (err) {
			error = 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.';
			console.error('Generate error:', err);
		} finally {
			isGenerating = false;
		}
	}
	
	function getJenjangFromKelas(kelas) {
		const kelasMap = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };
		const num = kelasMap[kelas] || 10;
		if (num <= 6) return 'SD';
		if (num <= 9) return 'SMP';
		return 'SMA';
	}

	async function copyOutput() {
		await navigator.clipboard.writeText(output);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<svelte:head>
	<title>Modul Ajar / RPP — Asisten Guru AI</title>
</svelte:head>

<div class="p-6">
	<!-- Breadcrumb -->
	<div class="mb-4 flex items-center gap-2 text-sm text-gray-500">
		<a href="/dashboard" class="hover:text-blue-600">Dashboard</a>
		<span>/</span>
		<span class="font-medium text-gray-800">RPP / Modul Ajar Generator</span>
	</div>

	<!-- Page header -->
	<div class="mb-6 flex items-center gap-4">
		<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100">
			<svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
				/>
			</svg>
		</div>
		<div>
			<h1 class="text-2xl font-bold text-gray-800">Modul Ajar Generator</h1>
			<p class="text-sm text-gray-500">
				Buat Modul Ajar Kurikulum Merdeka sesuai Standar Nasional (multi pertemuan)
			</p>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
		<!-- Form -->
		<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
			<h2 class="mb-5 text-base font-semibold text-gray-700">Data Modul Ajar</h2>
			<form onsubmit={handleGenerate} class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="col-span-2">
						<label for="judul-input" class="mb-1 block text-sm font-medium text-gray-700">Judul Modul Ajar *</label>
						<input
							id="judul-input"
							type="text"
							bind:value={form.judulModul}
							placeholder="cth: Sistem Persamaan Linear, Teks Eksposisi, Sistem Pencernaan..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
							required
						/>
						<p class="mt-1 text-xs text-gray-500">Judul modul mencakup topik besar untuk beberapa pertemuan</p>
					</div>
					
					<div class="col-span-2">
						<label for="mapel-input" class="mb-1 block text-sm font-medium text-gray-700">Mata Pelajaran *</label>
						<input
							id="mapel-input"
							type="text"
							bind:value={form.mapel}
							placeholder="cth: Matematika, Bahasa Indonesia, IPA..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
							required
						/>
					</div>
					
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Kelas</label>
						<select
							onchange={onKelasChange}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
						>
							{#each kelasList as k}
								<option value={k.val} selected={form.kelas === k.val}>Kelas {k.val}</option>
							{/each}
						</select>
					</div>
					
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Fase</label>
						<input
							type="text"
							bind:value={form.fase}
							readonly
							class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
						/>
					</div>
					
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Jumlah Pertemuan</label>
						<select
							bind:value={form.jumlahPertemuan}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
						>
							<option value="2">2 Pertemuan</option>
							<option value="3">3 Pertemuan</option>
							<option value="4">4 Pertemuan</option>
							<option value="5">5 Pertemuan</option>
							<option value="6">6 Pertemuan</option>
						</select>
					</div>
					
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Alokasi per Pertemuan</label>
						<select
							bind:value={form.alokasiPerPertemuan}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
						>
							<option>1x40 menit (1 JP)</option>
							<option>2x40 menit (2 JP)</option>
							<option>1x45 menit (1 JP)</option>
							<option>2x45 menit (2 JP)</option>
							<option>3x45 menit (3 JP)</option>
						</select>
					</div>
					
					<div class="col-span-2">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Model Pembelajaran</label>
						<select
							bind:value={form.metode}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
						>
							<option>Problem Based Learning (PBL)</option>
							<option>Project Based Learning (PJBL)</option>
							<option>Discovery Learning</option>
							<option>Inquiry Learning</option>
							<option>Cooperative Learning</option>
						</select>
					</div>
					
					<div class="col-span-2">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Mode Pembelajaran</label>
						<select
							bind:value={form.modePembelajaran}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
						>
							<option>Luring (Tatap Muka)</option>
							<option>Daring (Online)</option>
							<option>Campuran (Hybrid)</option>
						</select>
					</div>
					
					<div class="col-span-2">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Deskripsi Umum Modul <span class="text-gray-400">(opsional)</span></label>
						<textarea
							bind:value={form.deskripsi}
							rows="2"
							placeholder="Gambaran umum modul (kosongkan untuk dibuat AI)..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
						></textarea>
					</div>
					
					<div class="col-span-2">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Alur Tujuan Pembelajaran (ATP) <span class="text-gray-400">(opsional)</span></label>
						<textarea
							bind:value={form.atp}
							rows="2"
							placeholder="Alur pencapaian tujuan dari pertemuan 1-{form.jumlahPertemuan} (kosongkan untuk dibuat AI)..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
						></textarea>
					</div>
					
					<div class="col-span-2">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Sarana & Prasarana <span class="text-gray-400">(opsional)</span></label>
						<textarea
							bind:value={form.saranaPrasarana}
							rows="2"
							placeholder="Media, alat, bahan yang dibutuhkan (kosongkan untuk dibuat AI)..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
						></textarea>
					</div>
					
					<div class="col-span-2">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Prasyarat Kompetensi <span class="text-gray-400">(opsional)</span></label>
						<textarea
							bind:value={form.prasyarat}
							rows="2"
							placeholder="Kompetensi yang harus sudah dikuasai siswa (kosongkan untuk dibuat AI)..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
						></textarea>
					</div>
					
					<!-- Mode Selection -->
					<div class="col-span-2 rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-2 block text-sm font-bold text-purple-900">🤖 Mode Generasi AI</label>
						<div class="space-y-2">
							<label class="flex cursor-pointer items-start gap-3 rounded-lg border-2 border-purple-300 bg-white p-3 transition hover:border-purple-500">
								<input
									type="radio"
									name="mode"
									value="agentic"
									bind:group={generationMode}
									class="mt-1"
								/>
								<div class="flex-1">
									<div class="font-semibold text-purple-900">Agentic AI (Recommended) ⭐</div>
									<div class="text-xs text-gray-600">
										Multi-step AI dengan specialized agents. Lebih lengkap, terstruktur, dan berkualitas tinggi. Proses lebih lama (~2-3 menit).
									</div>
								</div>
							</label>
							
							<label class="flex cursor-pointer items-start gap-3 rounded-lg border-2 border-gray-200 bg-white p-3 transition hover:border-gray-400">
								<input
									type="radio"
									name="mode"
									value="single"
									bind:group={generationMode}
									class="mt-1"
								/>
								<div class="flex-1">
									<div class="font-semibold text-gray-900">Single Prompt (Classic)</div>
									<div class="text-xs text-gray-600">
										Satu kali panggilan AI. Lebih cepat (~30 detik) tapi hasil mungkin kurang detail.
									</div>
								</div>
							</label>
						</div>
					</div>
				</div>
				
				<!-- Progress Indicator (Agentic Mode) -->
				{#if isGenerating && generationMode === 'agentic' && progress.status === 'running'}
					<div class="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
						<div class="mb-2 flex items-center justify-between text-sm">
							<span class="font-semibold text-blue-900">{progress.message}</span>
							<span class="text-blue-700">{progress.step}/{progress.total}</span>
						</div>
						
						<!-- Progress Bar -->
						<div class="h-2 w-full overflow-hidden rounded-full bg-blue-200">
							<div 
								class="h-full bg-blue-600 transition-all duration-500"
								style="width: {(progress.step / progress.total) * 100}%"
							></div>
						</div>
						
						<!-- Phase indicator -->
						<div class="mt-2 flex items-center gap-2 text-xs text-blue-700">
							<svg class="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							<span>Phase: {progress.phase || 'processing'}</span>
						</div>
					</div>
				{/if}

				<button
					type="submit"
					disabled={isGenerating}
					class="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
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
						Sedang Membuat Modul Ajar...
					{:else}
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
						Generate Modul Ajar
					{/if}
				</button>
			</form>
		</div>

		<!-- Output -->
		<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-base font-semibold text-gray-700">Hasil Generate</h2>
				{#if output}
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
				{/if}
			</div>
			
			<!-- Quality Score Indicator (Agentic Mode) -->
			{#if qualityScore > 0 && generationMode === 'agentic'}
				<div class="mb-4 rounded-lg border-2 {qualityScore >= 80 ? 'border-green-200 bg-green-50' : qualityScore >= 60 ? 'border-yellow-200 bg-yellow-50' : 'border-orange-200 bg-orange-50'} p-4">
					<div class="mb-2 flex items-center justify-between">
						<span class="text-sm font-bold {qualityScore >= 80 ? 'text-green-900' : qualityScore >= 60 ? 'text-yellow-900' : 'text-orange-900'}">
							Quality Score
						</span>
						<span class="text-2xl font-bold {qualityScore >= 80 ? 'text-green-600' : qualityScore >= 60 ? 'text-yellow-600' : 'text-orange-600'}">
							{qualityScore}/100
						</span>
					</div>
					
					<div class="h-2 w-full overflow-hidden rounded-full {qualityScore >= 80 ? 'bg-green-200' : qualityScore >= 60 ? 'bg-yellow-200' : 'bg-orange-200'}">
						<div 
							class="h-full {qualityScore >= 80 ? 'bg-green-600' : qualityScore >= 60 ? 'bg-yellow-600' : 'bg-orange-600'} transition-all duration-1000"
							style="width: {qualityScore}%"
						></div>
					</div>
					
					<div class="mt-2 text-xs {qualityScore >= 80 ? 'text-green-700' : qualityScore >= 60 ? 'text-yellow-700' : 'text-orange-700'}">
						{#if qualityScore >= 80}
							✅ Modul ajar berkualitas tinggi dan lengkap!
						{:else if qualityScore >= 60}
							⚠️ Modul ajar cukup baik, beberapa bagian bisa diperkaya.
						{:else}
							⚠️ Modul ajar perlu review dan perbaikan.
						{/if}
					</div>
				</div>
			{/if}

			{#if isGenerating}
				<div class="flex flex-col items-center justify-center py-20 text-gray-400">
					<svg class="mb-3 h-8 w-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<p class="text-sm">
						{#if generationMode === 'agentic'}
							🤖 Agentic AI sedang bekerja...
						{:else}
							AI sedang menyusun Modul Ajar...
						{/if}
					</p>
					<p class="mt-1 text-xs text-gray-400">
						{#if generationMode === 'agentic'}
							Estimasi 2-3 menit (multi-step AI)
						{:else}
							Mohon tunggu 30-60 detik
						{/if}
					</p>
				</div>
			{:else if error}
				<div class="flex flex-col items-center justify-center rounded-xl bg-red-50 px-6 py-16 text-center">
					<svg class="mb-3 h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
					<p class="mb-2 font-medium text-red-800">Gagal Generate Modul Ajar</p>
					<p class="text-sm text-red-600">{error}</p>
					<button
						onclick={() => { error = ''; handleGenerate(new Event('submit')); }}
						class="mt-4 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
					>
						Coba Lagi
					</button>
				</div>
			{:else if output}
				<pre
					class="max-h-150 overflow-y-auto whitespace-pre-wrap rounded-xl bg-gray-50 p-5 font-mono text-xs leading-relaxed text-gray-700">{output}</pre>
			{:else}
				<div class="flex flex-col items-center justify-center py-20 text-gray-300">
					<svg class="mb-3 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					<p class="text-sm">Hasil Modul Ajar akan muncul di sini</p>
					<p class="mt-1 text-xs">Isi form dan klik Generate</p>
				</div>
			{/if}
		</div>
	</div>
</div>
