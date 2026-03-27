<script>
	let form = $state({
		mapel: '',
		kelas: 'X',
		fase: 'Fase E',
		topik: '',
		waktu: '2x45 menit (2 JP)',
		kurikulum: 'Kurikulum Merdeka',
		metode: 'Problem Based Learning (PBL)',
		tujuan: ''
	});

	let isGenerating = $state(false);
	let output = $state('');
	let copied = $state(false);

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

	function generateRPP() {
		const { mapel, kelas, fase, topik, waktu, kurikulum, metode, tujuan } = form;
		const sintak =
			metode === 'Discovery Learning'
				? `Fase 1 — Stimulasi
   • Guru menayangkan fenomena/gambar/video terkait ${topik}
   • Peserta didik mengamati dan mengidentifikasi hal menarik
Fase 2 — Identifikasi Masalah
   • Peserta didik merumuskan pertanyaan/hipotesis tentang ${topik}
Fase 3 — Pengumpulan Data
   • Melalui eksplorasi buku, internet, dan diskusi kelompok
Fase 4 — Pengolahan Data
   • Peserta didik menganalisis data yang telah dikumpulkan
Fase 5 — Pembuktian
   • Peserta didik membuktikan hipotesis berdasarkan data
Fase 6 — Generalisasi
   • Bersama guru, peserta didik menarik kesimpulan`
				: metode === 'Problem Based Learning (PBL)'
					? `Fase 1 — Orientasi Masalah
   • Guru menyajikan masalah kontekstual terkait ${topik}
   • Peserta didik mengidentifikasi apa yang diketahui dan dibutuhkan
Fase 2 — Organisasi Belajar
   • Peserta didik dibagi dalam kelompok 4–5 orang
   • Setiap kelompok menerima LKPD tentang ${topik}
Fase 3 — Penyelidikan
   • Kelompok mengeksplorasi, berdiskusi, dan mengumpulkan data
   • Guru memantau dan membimbing proses penyelidikan
Fase 4 — Pengembangan Hasil
   • Kelompok menyusun laporan / presentasi solusi masalah
Fase 5 — Analisis & Evaluasi
   • Presentasi kelompok, tanya jawab antar kelompok
   • Guru memberikan klarifikasi dan penguatan konsep`
					: `Langkah 1 — Pembukaan
   • Guru menyampaikan topik dan tujuan pembelajaran ${topik}
   • Tanya jawab apersepsi mengaitkan dengan pengetahuan awal
Langkah 2 — Penyampaian Materi
   • Guru menjelaskan konsep utama ${topik} secara sistematis
   • Contoh konkret dan visualisasi digunakan untuk membantu pemahaman
Langkah 3 — Kegiatan Siswa
   • Peserta didik mengerjakan latihan secara mandiri/berpasangan
   • Diskusi singkat membahas kesulitan yang ditemukan
Langkah 4 — Presentasi & Konfirmasi
   • Beberapa siswa mempresentasikan jawaban
   • Guru memberikan umpan balik dan koreksi`;

		return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MODUL AJAR / RPP ${kurikulum.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A. IDENTITAS MODUL
   Mata Pelajaran   : ${mapel}
   Kelas / Fase     : ${kelas} / ${fase}
   Topik / Materi   : ${topik}
   Alokasi Waktu    : ${waktu}
   Kurikulum        : ${kurikulum}
   Metode           : ${metode}
   Penyusun         : User Guru

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

B. TUJUAN PEMBELAJARAN
${
	tujuan
		? tujuan
		: `Melalui kegiatan ${metode}, peserta didik diharapkan mampu:
   1. Memahami konsep dasar ${topik} dengan benar
   2. Menganalisis ${topik} dalam konteks kehidupan sehari-hari
   3. Menerapkan pengetahuan ${topik} untuk menyelesaikan masalah
   4. Mengkomunikasikan pemahaman ${topik} secara lisan dan tulisan`
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

C. PERTANYAAN PEMANTIK
   1. Apa yang kalian ketahui tentang ${topik}?
   2. Bagaimana ${topik} berkaitan dengan kehidupan sehari-hari?
   3. Apa manfaat mempelajari ${topik} bagi kalian?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

D. KEGIATAN PEMBELAJARAN

▌PENDAHULUAN (10 Menit)
   • Guru membuka dengan salam, doa, dan presensi
   • Guru menyampaikan tujuan pembelajaran dan alur kegiatan
   • Apersepsi: mengaitkan ${topik} dengan pengetahuan/pengalaman siswa
   • Guru memberikan motivasi pentingnya mempelajari ${topik}

▌KEGIATAN INTI (${waktu})
${sintak}

▌PENUTUP (10 Menit)
   • Guru bersama peserta didik merangkum poin penting ${topik}
   • Peserta didik mengerjakan kuis singkat (3–5 soal)
   • Guru memberikan tugas/PR dan informasi pertemuan berikutnya
   • Guru menutup pembelajaran dengan doa dan salam

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

E. ASESMEN

   📋 Diagnostik  : Tanya jawab di awal pembelajaran
   📝 Formatif    : Observasi, LKPD, kuis singkat
   📊 Sumatif     : Ulangan harian tentang ${topik}

   Instrumen Penilaian:
   • Pengetahuan  : Tes tertulis PG dan uraian
   • Keterampilan : Presentasi kelompok dan portofolio
   • Sikap        : Lembar observasi keaktifan & kerja sama

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

F. MEDIA DAN SUMBER BELAJAR
   • Buku teks ${mapel} Kelas ${kelas} (Kemendikbud)
   • LKPD tentang ${topik}
   • Papan tulis, spidol warna, dan proyektor
   • Video pembelajaran / animasi terkait ${topik}
   • Sumber internet yang relevan dan terpercaya

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
		output = generateRPP();
		isGenerating = false;
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
			<h1 class="text-2xl font-bold text-gray-800">RPP / Modul Ajar Generator</h1>
			<p class="text-sm text-gray-500">
				Buat rencana pelaksanaan pembelajaran secara otomatis dan terstruktur
			</p>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
		<!-- Form -->
		<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
			<h2 class="mb-5 text-base font-semibold text-gray-700">Data Pembelajaran</h2>
			<form onsubmit={handleGenerate} class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="col-span-2">
					<label for="mapel-input" class="mb-1 block text-sm font-medium text-gray-700">Mata Pelajaran *</label>
					<input
						id="mapel-input"
							type="text"
							bind:value={form.mapel}
							placeholder="cth: Matematika, Bahasa Indonesia..."
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
						<label class="mb-1 block text-sm font-medium text-gray-700">Fase (Kur. Merdeka)</label>
						<input
							type="text"
							bind:value={form.fase}
							readonly
							class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
						/>
					</div>
					<div class="col-span-2">
					<label for="topik-input" class="mb-1 block text-sm font-medium text-gray-700">Topik / Materi *</label>
					<input
						id="topik-input"
							type="text"
							bind:value={form.topik}
							placeholder="cth: Persamaan Linear Satu Variabel"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
							required
						/>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Alokasi Waktu</label>
						<select
							bind:value={form.waktu}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
						>
							<option>1x40 menit (1 JP)</option>
							<option>2x40 menit (2 JP)</option>
							<option>1x45 menit (1 JP)</option>
							<option>2x45 menit (2 JP)</option>
							<option>3x45 menit (3 JP)</option>
						</select>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Kurikulum</label>
						<select
							bind:value={form.kurikulum}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
						>
							<option>Kurikulum Merdeka</option>
							<option>Kurikulum 2013 (K13)</option>
						</select>
					</div>
					<div class="col-span-2">
					<label for="metode-select" class="mb-1 block text-sm font-medium text-gray-700">Metode Pembelajaran</label>
					<select
						id="metode-select"
							bind:value={form.metode}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
						>
							<option>Problem Based Learning (PBL)</option>
							<option>Project Based Learning (PJBL)</option>
							<option>Discovery Learning</option>
							<option>Cooperative Learning</option>
							<option>Ceramah Interaktif + Diskusi</option>
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
							placeholder="Kosongkan untuk dibuat otomatis oleh AI..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
						></textarea>
					</div>
				</div>

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
						Sedang Membuat RPP...
					{:else}
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
						Generate RPP / Modul Ajar
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
					<svg class="mb-3 h-8 w-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<p class="text-sm">AI sedang menyusun RPP...</p>
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
					<p class="text-sm">Hasil RPP akan muncul di sini</p>
					<p class="mt-1 text-xs">Isi form dan klik Generate</p>
				</div>
			{/if}
		</div>
	</div>
</div>
