<script>
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

	function generateSoal() {
		const { mapel, kelas, topik, kurikulum, jenis, jumlah, tingkat, level } = form;

		let soalPG = '';
		let soalEsai = '';

		const pgOptions = ['A', 'B', 'C', 'D', 'E'];
		const kunciArray = ['B', 'D', 'A', 'C', 'B', 'D', 'A', 'C', 'B', 'A'];

		if (jenis === 'Pilihan Ganda' || jenis === 'Campuran') {
			const jumlahPG = jenis === 'Campuran' ? Math.ceil(jumlah * 0.7) : jumlah;
			const soalList = [];
			for (let i = 1; i <= jumlahPG; i++) {
				const kunci = kunciArray[(i - 1) % kunciArray.length];
				soalList.push(`Soal ${i}. Pernyataan berikut ini yang benar tentang ${topik} adalah...
   A. Pilihan A terkait ${topik} (keliru)
   B. Pilihan B terkait ${topik} (benar)
   C. Pilihan C terkait ${topik} (keliru)
   D. Pilihan D terkait ${topik} (keliru)
   ${jenis === 'Campuran' ? '' : 'E. Pilihan E terkait ' + topik + ' (keliru)'}
   Kunci: ${kunci}`);
			}
			soalPG = `▌ BAGIAN A — PILIHAN GANDA (Jumlah: ${jumlahPG} soal)
Petunjuk: Pilih satu jawaban yang paling tepat!

${soalList.join('\n\n')}`;
		}

		if (jenis === 'Esai' || jenis === 'Campuran') {
			const jumlahEsai = jenis === 'Campuran' ? Math.floor(jumlah * 0.3) : jumlah;
			const esaiList = [];
			for (let i = 1; i <= jumlahEsai; i++) {
				esaiList.push(`Soal ${i}. Jelaskan secara detail tentang ${topik} beserta contoh penerapannya dalam kehidupan sehari-hari! (${tingkat === 'Sulit' ? '20' : tingkat === 'Sedang' ? '15' : '10'} poin)

   Rubrik Penilaian:
   • Menyebutkan definisi ${topik} dengan benar          : 4 poin
   • Memberikan penjelasan yang lengkap dan tepat        : 6 poin
   • Memberikan minimal 2 contoh yang relevan            : 4 poin
   • Penulisan rapi, sistematis, dan menggunakan EYD     : ${tingkat === 'Sulit' ? '6' : tingkat === 'Sedang' ? '1' : '1'} poin`);
			}
			soalEsai = `▌ BAGIAN ${jenis === 'Campuran' ? 'B' : 'A'} — ESAI (Jumlah: ${jumlahEsai} soal)
Petunjuk: Jawablah pertanyaan berikut dengan jelas dan lengkap!

${esaiList.join('\n\n')}`;
		}

		return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BANK SOAL DAN UJIAN — ${kurikulum.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Mata Pelajaran   : ${mapel}
  Kelas            : ${kelas}
  Topik            : ${topik}
  Jenis Soal       : ${jenis}
  Jumlah Soal      : ${jumlah} butir
  Tingkat Kesulitan: ${tingkat}
  Level Kognitif   : ${level}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${soalPG}
${soalEsai ? '\n' + soalEsai : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  KUNCI JAWABAN PILIHAN GANDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${
	jenis !== 'Esai'
		? Array.from(
				{ length: jenis === 'Campuran' ? Math.ceil(form.jumlah * 0.7) : form.jumlah },
				(_, i) => `  ${i + 1}. ${['B', 'D', 'A', 'C', 'B', 'D', 'A', 'C', 'B', 'A'][i % 10]}`
			).join('\n')
		: '  (Lihat rubrik penilaian pada masing-masing soal esai)'
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Dibuat dengan Asisten Guru AI — TwinLabs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
	}

	async function handleGenerate(e) {
		e.preventDefault();
		if (!form.mapel || !form.topik) return;
		isGenerating = true;
		output = '';
		await new Promise((r) => setTimeout(r, 2000));
		output = generateSoal();
		isGenerating = false;
	}

	async function copyOutput() {
		await navigator.clipboard.writeText(output);
		copied = true;
		setTimeout(() => (copied = false), 2000);
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
						Generate Soal
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
					<svg class="mb-3 h-8 w-8 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<p class="text-sm">AI sedang menyusun soal...</p>
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
							d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<p class="text-sm">Kumpulan soal akan muncul di sini</p>
					<p class="mt-1 text-xs">Isi form dan klik Generate</p>
				</div>
			{/if}
		</div>
	</div>
</div>
