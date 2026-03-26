<script>
	let form = $state({
		durasi: '10 menit',
		peserta: '30–35 orang',
		jenis: 'Fisik & Gerak',
		suasana: 'Ceria dan Menyenangkan',
		media: 'Tidak (tanpa alat)',
		tema: ''
	});

	let isGenerating = $state(false);
	let output = $state('');
	let copied = $state(false);

	function generateIceBreaking() {
		const { durasi, peserta, jenis, suasana, media, tema } = form;

		const aktivitasList = {
			'Fisik & Gerak': [
				`AKTIVITAS 1: "Cermin Bergerak"
─────────────────────────────────────
Deskripsi: Peserta berpasangan dan saling menirukan gerakan satu sama lain seperti bayangan cermin.
Cara Bermain:
  1. Minta peserta membentuk pasangan berhadapan
  2. Tentukan siapa yang menjadi "asli" dan siapa yang menjadi "cermin"
  3. Orang "asli" bergerak pelan, orang "cermin" menirukan secara bersamaan
  4. Setelah 1 menit, tukar peran
  5. Refleksi bersama: "Apa yang terasa sulit? Bagaimana rasanya jadi pemimpin?"
Durasi: ${durasi} | Peserta: ${peserta}
Manfaat: Membangun kerja sama, komunikasi nonverbal, konsentrasi`,

				`AKTIVITAS 2: "Bola Energi"
─────────────────────────────────────
Deskripsi: Peserta saling melempar "bola energi" imajiner sambil menyebutkan nama penerima.
Cara Bermain:
  1. Peserta berdiri membentuk lingkaran besar
  2. Guru mulai dengan "melempar" bola imajiner sambil menyebut nama seseorang
  3. Penerima "menangkap", memberi energi tambahan, lalu melempar ke orang lain
  4. Tambah tantangan: lempar 2 bola sekaligus!
  5. Eliminasi: yang terlambat tangkap/sebutkan nama duduk kembali
Durasi: ${durasi} | Peserta: ${peserta}
Manfaat: Menghapalkan nama teman, meningkatkan konsentrasi dan refleks`
			],
			'Kognitif & Otak': [
				`AKTIVITAS 1: "Tebak Kata Terbalik"
─────────────────────────────────────
Deskripsi: Peserta menebak kata yang dibacakan secara terbalik untuk mengaktifkan otak kanan.
Cara Bermain:
  1. Guru mempersiapkan 10–15 kata terkait pelajaran${tema ? ' tentang ' + tema : ''}
  2. Guru membacakan kata secara terbalik (cth: "TAKAM" = "MACAT")
  3. Peserta berlomba mengangkat tangan untuk menjawab
  4. Pemenang mendapat poin atau tepuk tangan
  5. Variasi: peserta yang tebak benar, membuat kata terbalik untuk teman lain
Durasi: ${durasi} | Peserta: ${peserta}
Manfaat: Aktivasi otak, mengingat kosakata, fokus dan konsentrasi`
			],
			'Sosial & Kolaborasi': [
				`AKTIVITAS 1: "Formasi Nama"
─────────────────────────────────────
Deskripsi: Peserta membentuk tulisan dengan tubuh mereka secara berkelompok.
Cara Bermain:
  1. Bagi peserta menjadi kelompok 5–7 orang
  2. Guru memberi instruksi: "Bentuk huruf A dengan tubuh kalian!"
  3. Kelompok yang paling cepat dan rapi mendapat poin
  4. Tantangan berikutnya: bentuk kata atau angka bersama
  5. Akhiri dengan seluruh kelas membentuk kalimat bersama
Durasi: ${durasi} | Peserta: ${peserta}
Manfaat: Kerja tim, komunikasi, kreativitas, koordinasi`
			]
		};

		const selected = aktivitasList[jenis] || aktivitasList['Fisik & Gerak'];
		const aktivitasText = selected.join('\n\n');

		return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ICE BREAKING GENERATOR — ASISTEN GURU AI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Durasi          : ${durasi}
  Jumlah Peserta  : ${peserta}
  Jenis Aktivitas : ${jenis}
  Suasana         : ${suasana}
  Media/Alat      : ${media}
  ${tema ? 'Tema Khusus    : ' + tema : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AKTIVITAS ICE BREAKING YANG DIREKOMENDASIKAN:

${aktivitasText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TIPS PELAKSANAAN:
  ✓ Berikan instruksi yang jelas dan singkat sebelum mulai
  ✓ Demonstrasikan terlebih dahulu jika perlu
  ✓ Jaga suasana tetap positif dan inklusif
  ✓ Akhiri dengan tepuk tangan atau yel-yel kelas
  ✓ Sebutkan koneksi aktivitas ice breaking dengan materi yang akan dipelajari

TRANSISI KE MATERI:
  Setelah ice breaking selesai, guru dapat berkata:
  "Nah, tadi kita sudah merasakan energi yang luar biasa!
   Semangat itulah yang kita butuhkan untuk belajar hari ini.
   Sekarang mari kita masuk ke materi ${tema || 'pembelajaran'}..."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Dibuat dengan Asisten Guru AI — eSolusi.id
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
	}

	async function handleGenerate(e) {
		e.preventDefault();
		isGenerating = true;
		output = '';
		await new Promise((r) => setTimeout(r, 1800));
		output = generateIceBreaking();
		isGenerating = false;
	}

	async function copyOutput() {
		await navigator.clipboard.writeText(output);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<svelte:head>
	<title>Ice Breaking Generator — Asisten Guru AI</title>
</svelte:head>

<div class="p-6">
	<!-- Breadcrumb -->
	<div class="mb-4 flex items-center gap-2 text-sm text-gray-500">
		<a href="/dashboard" class="hover:text-amber-600">Dashboard</a>
		<span>/</span>
		<span class="font-medium text-gray-800">Ice Breaking Generator</span>
	</div>

	<!-- Page header -->
	<div class="mb-6 flex items-center gap-4">
		<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100">
			<svg class="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 10V3L4 14h7v7l9-11h-7z"
				/>
			</svg>
		</div>
		<div>
			<h1 class="text-2xl font-bold text-gray-800">Ice Breaking Generator</h1>
			<p class="text-sm text-gray-500">
				Buat aktivitas pemecah suasana yang seru dan sesuai kondisi kelas
			</p>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
		<!-- Form -->
		<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
			<h2 class="mb-5 text-base font-semibold text-gray-700">Konfigurasi Ice Breaking</h2>
			<form onsubmit={handleGenerate} class="space-y-4">
				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="mb-2 block text-sm font-medium text-gray-700">Durasi Waktu</label>
					<div class="flex flex-wrap gap-2">
						{#each ['5 menit', '10 menit', '15 menit', '20 menit'] as d}
							<button
								type="button"
								onclick={() => (form.durasi = d)}
								class="rounded-lg border px-4 py-2 text-sm font-medium transition-colors {form.durasi ===
								d
									? 'border-amber-500 bg-amber-500 text-white'
									: 'border-gray-200 text-gray-600 hover:border-amber-300'}"
							>
								{d}
							</button>
						{/each}
					</div>
				</div>

				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="mb-1 block text-sm font-medium text-gray-700">Jumlah Peserta</label>
					<select
						bind:value={form.peserta}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
					>
						<option>Kurang dari 15 orang</option>
						<option>15–25 orang</option>
						<option>30–35 orang</option>
						<option>35–40 orang</option>
						<option>Lebih dari 40 orang</option>
					</select>
				</div>

				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="mb-1 block text-sm font-medium text-gray-700">Jenis Aktivitas</label>
					<select
						bind:value={form.jenis}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
					>
						<option>Fisik & Gerak</option>
						<option>Kognitif & Otak</option>
						<option>Sosial & Kolaborasi</option>
						<option>Kreatif & Ekspresif</option>
					</select>
				</div>

				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="mb-1 block text-sm font-medium text-gray-700">Suasana yang Diinginkan</label>
					<select
						bind:value={form.suasana}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
					>
						<option>Ceria dan Menyenangkan</option>
						<option>Fokus dan Tenang</option>
						<option>Kolaboratif dan Kompak</option>
						<option>Energik dan Bersemangat</option>
					</select>
				</div>

				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="mb-1 block text-sm font-medium text-gray-700">Media / Alat</label>
					<select
						bind:value={form.media}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
					>
						<option>Tidak (tanpa alat)</option>
						<option>Kertas dan alat tulis</option>
						<option>Bola kecil atau benda ringan</option>
						<option>Musik/lagu</option>
						<option>Kartu atau sticky note</option>
					</select>
				</div>

				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="mb-1 block text-sm font-medium text-gray-700"
						>Tema/Topik Pelajaran <span class="text-gray-400">(opsional)</span></label
					>
					<input
						type="text"
						bind:value={form.tema}
						placeholder="cth: Fotosintesis, Sejarah, Matematika..."
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
					/>
				</div>

				<button
					type="submit"
					disabled={isGenerating}
					class="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-3 font-semibold text-white transition-colors hover:bg-amber-600 disabled:bg-amber-300"
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
						Sedang Membuat...
					{:else}
						⚡ Generate Ice Breaking
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
					<svg class="mb-3 h-8 w-8 animate-spin text-amber-500" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<p class="text-sm">AI sedang mencari aktivitas yang tepat...</p>
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
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/>
					</svg>
					<p class="text-sm">Ide ice breaking akan muncul di sini</p>
					<p class="mt-1 text-xs">Pilih konfigurasi dan klik Generate</p>
				</div>
			{/if}
		</div>
	</div>
</div>
