<script>
	let form = $state({
		title: '',
		subtitle: '',
		topic: '',
		purpose: 'promosi-event',
		size: 'a4-portrait',
		colorScheme: 'modern-blue',
		includeElements: ['logo', 'tanggal'],
		additionalInfo: ''
	});

	let isGenerating = $state(false);
	let output = $state('');
	let copied = $state(false);

	const purposeOptions = [
		{ value: 'promosi-event', label: 'Promosi Event/Kegiatan' },
		{ value: 'pengumuman', label: 'Pengumuman Sekolah' },
		{ value: 'motivasi', label: 'Poster Motivasi' },
		{ value: 'edukasi', label: 'Poster Edukasi' },
		{ value: 'lomba', label: 'Poster Lomba' }
	];

	const sizeOptions = [
		{ value: 'a4-portrait', label: 'A4 Portrait (21 x 29.7 cm)' },
		{ value: 'a4-landscape', label: 'A4 Landscape (29.7 x 21 cm)' },
		{ value: 'a3-portrait', label: 'A3 Portrait (29.7 x 42 cm)' },
		{ value: 'instagram-post', label: 'Instagram Post (1080 x 1080 px)' },
		{ value: 'instagram-story', label: 'Instagram Story (1080 x 1920 px)' },
		{ value: 'facebook-post', label: 'Facebook Post (1200 x 630 px)' }
	];

	const colorSchemeOptions = [
		{ value: 'modern-blue', label: 'Modern Blue' },
		{ value: 'vibrant-orange', label: 'Vibrant Orange' },
		{ value: 'fresh-green', label: 'Fresh Green' },
		{ value: 'elegant-purple', label: 'Elegant Purple' },
		{ value: 'bold-red', label: 'Bold Red' },
		{ value: 'minimalist-grayscale', label: 'Minimalist Grayscale' }
	];

	const elementOptions = [
		{ value: 'logo', label: 'Logo Sekolah' },
		{ value: 'tanggal', label: 'Tanggal & Waktu' },
		{ value: 'lokasi', label: 'Lokasi' },
		{ value: 'kontak', label: 'Kontak/CP' },
		{ value: 'qr-code', label: 'QR Code' },
		{ value: 'ilustrasi', label: 'Ilustrasi/Icon' }
	];

	function generatePosterGuide() {
		const { title, subtitle, topic, purpose, size, colorScheme, includeElements, additionalInfo } =
			form;
		const purposeLabel = purposeOptions.find((p) => p.value === purpose)?.label || '';
		const sizeLabel = sizeOptions.find((s) => s.value === size)?.label || '';
		const colorLabel = colorSchemeOptions.find((c) => c.value === colorScheme)?.label || '';
		const elements = includeElements
			.map((e) => elementOptions.find((el) => el.value === e)?.label)
			.filter(Boolean)
			.join(', ');

		return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PANDUAN DESAIN POSTER/BANNER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 INFORMASI DESAIN

Judul           : ${title || '[Judul Poster]'}
Subtitle        : ${subtitle || '[Subtitle/Tagline]'}
Topik           : ${topic || '[Topik Utama]'}
Tujuan          : ${purposeLabel}
Ukuran          : ${sizeLabel}
Skema Warna     : ${colorLabel}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ELEMEN YANG DISERTAKAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${elements || 'Tidak ada elemen tambahan'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUKTUR LAYOUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────┐
│  [HEADER]                           │
│  Logo Sekolah (kiri atas)           │
│                                     │
├─────────────────────────────────────┤
│  [JUDUL UTAMA]                      │
│  ${title || 'JUDUL POSTER'}         │
│  Font: Bold, 48-60pt                │
│                                     │
├─────────────────────────────────────┤
│  [SUBTITLE]                         │
│  ${subtitle || 'Subtitle atau tagline menarik'}
│  Font: Regular, 24-32pt             │
│                                     │
├─────────────────────────────────────┤
│  [KONTEN UTAMA]                     │
│  Topik: ${topic || 'Topik utama poster'}
│                                     │
│  ${includeElements.includes('tanggal') ? '📅 Tanggal & Waktu Event' : ''}
│  ${includeElements.includes('lokasi') ? '📍 Lokasi Pelaksanaan' : ''}
│  ${includeElements.includes('ilustrasi') ? '🎨 Ilustrasi/Icon Relevan' : ''}
│                                     │
├─────────────────────────────────────┤
│  [FOOTER]                           │
│  ${includeElements.includes('kontak') ? 'Kontak: CP Panitia' : ''}
│  ${includeElements.includes('qr-code') ? 'QR Code untuk info lebih lanjut' : ''}
│                                     │
└─────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PANDUAN WARNA: ${colorLabel}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${
	colorScheme === 'modern-blue'
		? `Primer    : #2563EB (Blue)
Sekunder  : #DBEAFE (Light Blue)
Aksen     : #FFFFFF (White)
Teks      : #1E293B (Dark Gray)`
		: colorScheme === 'vibrant-orange'
			? `Primer    : #EA580C (Orange)
Sekunder  : #FED7AA (Light Orange)
Aksen     : #FFFFFF (White)
Teks      : #292524 (Dark Brown)`
			: colorScheme === 'fresh-green'
				? `Primer    : #16A34A (Green)
Sekunder  : #DCFCE7 (Light Green)
Aksen     : #FFFFFF (White)
Teks      : #14532D (Dark Green)`
				: colorScheme === 'elegant-purple'
					? `Primer    : #7C3AED (Purple)
Sekunder  : #EDE9FE (Light Purple)
Aksen     : #FFFFFF (White)
Teks      : #3B0764 (Dark Purple)`
					: colorScheme === 'bold-red'
						? `Primer    : #DC2626 (Red)
Sekunder  : #FEE2E2 (Light Red)
Aksen     : #FFFFFF (White)
Teks      : #450A0A (Dark Red)`
						: `Primer    : #1F2937 (Dark Gray)
Sekunder  : #F3F4F6 (Light Gray)
Aksen     : #FFFFFF (White)
Teks      : #111827 (Black)`
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TIPS DESAIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Gunakan font yang mudah dibaca (Poppins, Inter, Roboto)
✓ Kontras warna yang jelas antara teks dan background
✓ Jangan terlalu banyak teks, fokus pada pesan utama
✓ Gunakan hierarki visual (judul > subtitle > detail)
✓ Tambahkan white space untuk kesan clean dan modern
✓ Gunakan ilustrasi atau icon relevan dengan topik
${includeElements.includes('logo') ? '✓ Pastikan logo sekolah terlihat jelas' : ''}
${includeElements.includes('qr-code') ? '✓ QR Code ukuran minimal 2x2 cm agar mudah discan' : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INFORMASI TAMBAHAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${additionalInfo || 'Tidak ada informasi tambahan'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REKOMENDASI TOOL DESAIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Canva (https://canva.com) - Template siap pakai, mudah
• Figma (https://figma.com) - Profesional, kolaboratif
• Adobe Express - Quick design untuk social media
• Photopea (https://photopea.com) - Editor online gratis
• PosterMyWall - Khusus untuk poster & flyer

LANGKAH MEMBUAT:
1. Pilih ukuran sesuai kebutuhan: ${sizeLabel}
2. Terapkan skema warna: ${colorLabel}
3. Tambahkan judul besar dan menarik
4. Susun elemen sesuai hierarki
5. Tambahkan ${elements}
6. Review dan export dalam format PNG/JPG

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Dibuat dengan Asisten Guru AI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
	}

	async function handleGenerate(e) {
		e.preventDefault();
		if (!form.title || !form.topic) return;
		isGenerating = true;
		output = '';
		await new Promise((r) => setTimeout(r, 1500));
		output = generatePosterGuide();
		isGenerating = false;
	}

	async function copyOutput() {
		await navigator.clipboard.writeText(output);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function toggleElement(value) {
		const index = form.includeElements.indexOf(value);
		if (index === -1) {
			form.includeElements = [...form.includeElements, value];
		} else {
			form.includeElements = form.includeElements.filter((e) => e !== value);
		}
	}
</script>

<svelte:head>
	<title>Buat Poster/Banner — Asisten Guru AI</title>
</svelte:head>

<div class="p-6">
	<!-- Breadcrumb -->
	<div class="mb-4 flex items-center gap-2 text-sm text-gray-500">
		<a href="/dashboard" class="hover:text-blue-600">Dashboard</a>
		<span>/</span>
		<span class="font-medium text-gray-800">Buat Poster/Banner</span>
	</div>

	<!-- Page header -->
	<div class="mb-6 flex items-center gap-4">
		<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100">
			<svg class="h-6 w-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0a4 4 0 004 4h4a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v3a2 2 0 002 2z"
				/>
			</svg>
		</div>
		<div>
			<h1 class="text-2xl font-bold text-gray-800">Buat Poster/Banner</h1>
			<p class="text-sm text-gray-500">
				Generate panduan desain poster dan banner untuk berbagai kebutuhan
			</p>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
		<!-- Form -->
		<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
			<h2 class="mb-5 text-base font-semibold text-gray-700">Informasi Poster/Banner</h2>
			<form onsubmit={handleGenerate} class="space-y-4">
				<div>
					<label for="title-input" class="mb-1 block text-sm font-medium text-gray-700"
						>Judul Poster *</label
					>
					<input
						id="title-input"
						type="text"
						bind:value={form.title}
						placeholder="Contoh: Lomba Karya Ilmiah Remaja 2024"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-pink-500 focus:outline-none"
						required
					/>
				</div>

				<div>
					<label for="subtitle-input" class="mb-1 block text-sm font-medium text-gray-700"
						>Subtitle/Tagline</label
					>
					<input
						id="subtitle-input"
						type="text"
						bind:value={form.subtitle}
						placeholder="Contoh: Wujudkan Inovasi Masa Depan"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-pink-500 focus:outline-none"
					/>
				</div>

				<div>
					<label for="topic-input" class="mb-1 block text-sm font-medium text-gray-700"
						>Topik/Konten Utama *</label
					>
					<textarea
						id="topic-input"
						bind:value={form.topic}
						placeholder="Jelaskan konten utama poster, misalnya: Lomba karya ilmiah untuk siswa SMA se-Jawa Barat"
						rows="3"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-pink-500 focus:outline-none"
						required
					></textarea>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="purpose-select" class="mb-1 block text-sm font-medium text-gray-700"
							>Tujuan</label
						>
						<select
							id="purpose-select"
							bind:value={form.purpose}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-pink-500 focus:outline-none"
						>
							{#each purposeOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="size-select" class="mb-1 block text-sm font-medium text-gray-700"
							>Ukuran</label
						>
						<select
							id="size-select"
							bind:value={form.size}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-pink-500 focus:outline-none"
						>
							{#each sizeOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
				</div>

				<div>
					<label for="color-select" class="mb-1 block text-sm font-medium text-gray-700"
						>Skema Warna</label
					>
					<select
						id="color-select"
						bind:value={form.colorScheme}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-pink-500 focus:outline-none"
					>
						{#each colorSchemeOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<div>
					<p class="mb-2 block text-sm font-medium text-gray-700">
						Elemen yang Disertakan
					</p>
					<div class="grid grid-cols-2 gap-2">
						{#each elementOptions as option}
							<label class="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									checked={form.includeElements.includes(option.value)}
									onchange={() => toggleElement(option.value)}
									class="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-2 focus:ring-pink-500"
								/>
								<span class="text-gray-700">{option.label}</span>
							</label>
						{/each}
					</div>
				</div>

				<div>
					<label for="additional-input" class="mb-1 block text-sm font-medium text-gray-700"
						>Informasi Tambahan</label
					>
					<textarea
						id="additional-input"
						bind:value={form.additionalInfo}
						placeholder="Tambahkan informasi lain seperti requirement khusus, style preferensi, dll"
						rows="2"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-pink-500 focus:outline-none"
					></textarea>
				</div>

				<button
					type="submit"
					disabled={isGenerating}
					class="w-full rounded-lg bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if isGenerating}
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
							Generating...
						</span>
					{:else}
						🎨 Generate Panduan Desain
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
					<pre
						class="max-h-150 overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-gray-700">{output}</pre>
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
								d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0a4 4 0 004 4h4a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v3a2 2 0 002 2z"
							/>
						</svg>
						<p class="text-sm text-gray-500">Panduan desain akan muncul di sini</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
