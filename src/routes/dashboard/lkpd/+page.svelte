<script>
	import { getKurikulumMerdekaContext, getModelPembelajaran } from '$lib/prompts/kurikulum-merdeka-base.js';
	import { callGeminiAPI, buildPrompt } from '$lib/utils/gemini-client.js';

	let form = $state({
		sekolah: '',
		mapel: '',
		kelas: 'VII',
		semester: '1',
		topik: '',
		tujuan: '',
		model: 'Discovery Learning',
		waktu: '2x40 menit'
	});

	let isGenerating = $state(false);
	let output = $state('');
	let copied = $state(false);
	let error = $state('');

	function buildLKPDPrompt() {
		const { sekolah, mapel, kelas, topik, tujuan, model, waktu, semester } = form;
		
		// Convert Roman numeral to number
		const kelasMap = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };
		const kelasNumber = kelasMap[kelas];
		
		// Get curriculum context
		const systemContext = getKurikulumMerdekaContext(kelasNumber, mapel);
		
		// Get model pembelajaran details
		const modelKey = model.includes('Discovery') ? 'discoveryLearning' : 
		                 model.includes('Problem') ? 'pbl' :
		                 model.includes('Project') ? 'projectBased' : 
		                 model.includes('Inquiry') ? 'inquiryLearning' : 'discoveryLearning';
		const modelDetail = getModelPembelajaran(modelKey);

		const outputFormat = `
FORMAT:

━━ LKPD ${topik} ━━

Sekolah: ${sekolah || '___'} | ${mapel} | Kls ${kelas}/${semester} | ${waktu}
Nama: _____ No: _____ Tgl: _____

A. TUJUAN
${tujuan || '• 3 tujuan untuk ' + topik}

B. KEGIATAN (${model})
${modelDetail.sintak.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Detail: stimulus menarik, pertanyaan bertingkat, aktivitas hands-on, tempat jawaban.

C. EVALUASI
4-5 soal: 2 soal C1-C2, 2 soal C3-C4, 1 soal C5-C6 (jika sesuai kelas)

D. REFLEKSI
[ ] Paham konsep
[ ] Bisa beri contoh  
[ ] Indikator lain
Skor: _____/100

Konten spesifik ${topik}, praktis, mendorong berpikir kritis.`;

		const userInput = {
			mataPelajaran: mapel,
			kelas: `${kelas} (Semester ${semester})`,
			topik: topik,
			alokasiWaktu: waktu,
			modelPembelajaran: `${model} (${modelDetail.deskripsi})`,
			tujuanKhusus: tujuan || 'Buat tujuan pembelajaran yang sesuai'
		};

		return buildPrompt(systemContext, userInput, outputFormat);
	}

	async function handleGenerate(e) {
		e.preventDefault();
		if (!form.mapel || !form.topik) return;
		
		isGenerating = true;
		output = '';
		error = '';
		
		try {
			const prompt = buildLKPDPrompt();
			const result = await callGeminiAPI(prompt, {
				maxRetries: 3,
				timeout: 45000
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

	async function copyOutput() {
		await navigator.clipboard.writeText(output);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<svelte:head>
	<title>LKPD Generator — Asisten Guru AI</title>
</svelte:head>

<div class="p-6">
	<!-- Breadcrumb -->
	<div class="mb-4 flex items-center gap-2 text-sm text-gray-500">
		<a href="/dashboard" class="hover:text-emerald-600">Dashboard</a>
		<span>/</span>
		<span class="font-medium text-gray-800">LKPD Generator</span>
	</div>

	<!-- Page header -->
	<div class="mb-6 flex items-center gap-4">
		<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
			<svg class="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
				/>
			</svg>
		</div>
		<div>
			<h1 class="text-2xl font-bold text-gray-800">LKPD Generator</h1>
			<p class="text-sm text-gray-500">
				Buat Lembar Kerja Peserta Didik yang interaktif dan terstruktur
			</p>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
		<!-- Form -->
		<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
			<h2 class="mb-5 text-base font-semibold text-gray-700">Data LKPD</h2>
			<form onsubmit={handleGenerate} class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="col-span-2">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Nama Sekolah</label>
						<input
							type="text"
							bind:value={form.sekolah}
							placeholder="cth: SMP Negeri 1 Jakarta"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
						/>
					</div>
					<div class="col-span-2">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Mata Pelajaran *</label>
						<input
							type="text"
							bind:value={form.mapel}
							placeholder="cth: IPA, Matematika, B. Indonesia..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
							required
						/>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Kelas</label>
						<select
							bind:value={form.kelas}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
						>
							{#each ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'] as k}
								<option value={k} selected={form.kelas === k}>{k}</option>
							{/each}
						</select>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Semester</label>
						<select
							bind:value={form.semester}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
						>
							<option value="1">Semester 1 (Ganjil)</option>
							<option value="2">Semester 2 (Genap)</option>
						</select>
					</div>
					<div class="col-span-2">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Topik / Materi *</label>
						<input
							type="text"
							bind:value={form.topik}
							placeholder="cth: Fotosintesis, Sistem Persamaan Linear..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
							required
						/>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Model Pembelajaran</label>
						<select
							bind:value={form.model}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
						>
							<option>Discovery Learning</option>
							<option>Problem Based Learning</option>
							<option>Project Based Learning</option>
							<option>Inquiry Learning</option>
						</select>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Alokasi Waktu</label>
						<select
							bind:value={form.waktu}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
						>
							<option>1x40 menit</option>
							<option>2x40 menit</option>
							<option>1x45 menit</option>
							<option>2x45 menit</option>
						</select>
					</div>
					<div class="col-span-2">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700"
							>Tujuan Pembelajaran <span class="text-gray-400">(opsional)</span></label
						>
						<textarea
							bind:value={form.tujuan}
							rows="3"
							placeholder="Kosongkan untuk dibuat otomatis..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
						></textarea>
					</div>
				</div>

				<button
					type="submit"
					disabled={isGenerating}
					class="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:bg-emerald-400"
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
						Sedang Membuat LKPD...
					{:else}
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
						Generate LKPD
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

			{#if isGenerating}
				<div class="flex flex-col items-center justify-center py-20 text-gray-400">
					<svg class="mb-3 h-8 w-8 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<p class="text-sm">AI sedang menyusun LKPD...</p>
					<p class="mt-1 text-xs text-gray-400">Mohon tunggu 10-30 detik</p>
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
					<p class="mb-2 font-medium text-red-800">Gagal Generate LKPD</p>
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
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						/>
					</svg>
					<p class="text-sm">Hasil LKPD akan muncul di sini</p>
					<p class="mt-1 text-xs">Isi form dan klik Generate</p>
				</div>
			{/if}
		</div>
	</div>
</div>
