<script>
	let saved = $state(false);
</script>

<svelte:head>
	<title>Integrasi — Asisten Guru AI</title>
</svelte:head>

<div class="p-6">
	<!-- Header -->
	<div class="mb-6">
		<div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
			<a href="/dashboard" class="hover:text-blue-600">Dashboard</a>
			<span>/</span>
			<span class="text-gray-800 font-medium">Integrasi</span>
		</div>
		<h1 class="text-2xl font-bold text-gray-800">Integrasi</h1>
		<p class="text-gray-600 mt-1">Kelola integrasi dengan layanan eksternal untuk meningkatkan fungsionalitas</p>
	</div>

	<!-- Success message -->
	{#if saved}
		<div class="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 flex items-center gap-3">
			<svg class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
			<p class="text-green-800 text-sm font-medium">Pengaturan berhasil disimpan!</p>
		</div>
	{/if}

	<!-- Security Notice -->
	<div class="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
		<div class="flex items-start gap-3">
			<svg class="h-6 w-6 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
			</svg>
			<div>
				<h3 class="text-base font-semibold text-blue-900 mb-1">🔒 Keamanan Ditingkatkan</h3>
				<p class="text-sm text-blue-800 leading-relaxed">
					API Keys sekarang dikelola secara <strong>server-side</strong> untuk keamanan maksimal. 
					Konfigurasi dilakukan melalui environment variables (.env) dan tidak pernah ter-expose ke browser.
					Silakan hubungi administrator untuk mengonfigurasi API keys.
				</p>
			</div>
		</div>
	</div>

	<div class="space-y-6">
		<!-- Google Drive Integration -->
		<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
			<div class="mb-4">
				<div class="flex items-center gap-3 mb-2">
					<div class="rounded-lg bg-blue-100 p-2">
						<svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
						</svg>
					</div>
					<div>
						<h2 class="text-lg font-semibold text-gray-800">Google Drive</h2>
						<span class="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
							Server-side managed
						</span>
					</div>
				</div>
				<p class="text-sm text-gray-600 mt-3">
					Integrasi Google Drive memungkinkan penyimpanan otomatis untuk file yang dihasilkan.
				</p>
			</div>

			<div class="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
				<h4 class="text-sm font-medium text-gray-700 mb-2">Konfigurasi (Administrator Only)</h4>
				<code class="text-xs text-gray-600 block">GOOGLE_DRIVE_API_KEY=your_api_key_here</code>
				<p class="mt-2 text-xs text-gray-500">
					<a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-700 underline">
						Dapatkan API Key dari Google Cloud Console →
					</a>
				</p>
			</div>
		</div>

		<!-- Gemini AI Integration -->
		<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
			<div class="mb-4">
				<div class="flex items-center gap-3 mb-2">
					<div class="rounded-lg bg-purple-100 p-2">
						<svg class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
					</div>
					<div>
						<h2 class="text-lg font-semibold text-gray-800">Gemini AI</h2>
						<span class="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
							Server-side managed
						</span>
					</div>
				</div>
				<p class="text-sm text-gray-600 mt-3">
					Gemini AI digunakan untuk menghasilkan konten pembelajaran berkualitas tinggi.
				</p>
			</div>

			<div class="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
				<h4 class="text-sm font-medium text-gray-700 mb-2">Konfigurasi (Administrator Only)</h4>
				<code class="text-xs text-gray-600 block">GEMINI_API_KEY=your_api_key_here</code>
				<p class="mt-2 text-xs text-gray-500">
					<a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-700 underline">
						Dapatkan API Key dari Google AI Studio →
					</a>
				</p>
			</div>
		</div>

		<!-- Info Box -->
		<div class="rounded-xl border border-amber-200 bg-amber-50 p-5">
			<div class="flex items-start gap-3">
				<svg class="h-5 w-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<div class="text-sm text-amber-800">
					<p class="font-medium mb-1">Catatan untuk Administrator</p>
					<p>
						Untuk mengkonfigurasi API keys, edit file <code class="bg-amber-100 px-1.5 py-0.5 rounded text-xs">.env</code> 
						di root project dan restart aplikasi. Contoh konfigurasi tersedia di file 
						<code class="bg-amber-100 px-1.5 py-0.5 rounded text-xs">.env.example</code>.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
