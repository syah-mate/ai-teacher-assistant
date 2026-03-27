<script>
	import { onMount } from 'svelte';

	let googleDriveApiKey = $state('');
	let geminiApiKey = $state('');
	let googleDriveEnabled = $state(false);
	let saved = $state(false);

	onMount(() => {
		// Load dari localStorage
		const savedGoogleKey = localStorage.getItem('googleDriveApiKey');
		const savedGeminiKey = localStorage.getItem('geminiApiKey');
		const savedGDriveEnabled = localStorage.getItem('googleDriveEnabled');

		if (savedGoogleKey) googleDriveApiKey = savedGoogleKey;
		if (savedGeminiKey) geminiApiKey = savedGeminiKey;
		if (savedGDriveEnabled) googleDriveEnabled = savedGDriveEnabled === 'true';
	});

	function handleSave() {
		// Simpan ke localStorage (frontend only)
		localStorage.setItem('googleDriveApiKey', googleDriveApiKey);
		localStorage.setItem('geminiApiKey', geminiApiKey);
		localStorage.setItem('googleDriveEnabled', googleDriveEnabled.toString());

		saved = true;
		setTimeout(() => {
			saved = false;
		}, 3000);
	}

	function toggleGoogleDrive() {
		googleDriveEnabled = !googleDriveEnabled;
	}
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

	<div class="space-y-6">
		<!-- Google Drive Integration -->
		<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-start justify-between">
				<div>
					<div class="flex items-center gap-3 mb-2">
						<div class="rounded-lg bg-blue-100 p-2">
							<svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
							</svg>
						</div>
						<h2 class="text-lg font-semibold text-gray-800">Google Drive</h2>
					</div>
					<p class="text-sm text-gray-600">
						Hubungkan dengan Google Drive untuk menyimpan dan mengelola file secara otomatis
					</p>
				</div>
				<button
					onclick={toggleGoogleDrive}
					class="relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 {googleDriveEnabled
						? 'bg-blue-600'
						: 'bg-gray-200'}"
					role="switch"
					aria-checked={googleDriveEnabled}
				>
					<span
						class="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {googleDriveEnabled
							? 'translate-x-5'
							: 'translate-x-0'}"
					></span>
				</button>
			</div>

			<div class="mt-4">
				<label for="googleDriveKey" class="block text-sm font-medium text-gray-700 mb-2">
					Google Drive API Key
				</label>
				<input
					id="googleDriveKey"
					type="text"
					bind:value={googleDriveApiKey}
					disabled={!googleDriveEnabled}
					placeholder="Masukkan API Key Google Drive"
					class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-400"
				/>
				<p class="mt-2 text-xs text-gray-500">
					<a href="https://console.cloud.google.com/" target="_blank" class="text-blue-600 hover:text-blue-700 underline">
						Dapatkan API Key dari Google Cloud Console
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
					<h2 class="text-lg font-semibold text-gray-800">Gemini AI</h2>
				</div>
				<p class="text-sm text-gray-600">
					Gunakan API Key Gemini untuk meningkatkan kemampuan AI dalam menghasilkan konten
				</p>
			</div>

			<div class="mt-4">
				<label for="geminiKey" class="block text-sm font-medium text-gray-700 mb-2">
					Gemini API Key
				</label>
				<input
					id="geminiKey"
					type="text"
					bind:value={geminiApiKey}
					placeholder="Masukkan API Key Gemini"
					class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
				/>
				<p class="mt-2 text-xs text-gray-500">
					<a href="https://ai.google.dev/" target="_blank" class="text-blue-600 hover:text-blue-700 underline">
						Dapatkan API Key dari Google AI Studio
					</a>
				</p>
			</div>
		</div>

		<!-- Save button -->
		<div class="flex justify-end">
			<button
				onclick={handleSave}
				class="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
			>
				Simpan Pengaturan
			</button>
		</div>
	</div>
</div>
