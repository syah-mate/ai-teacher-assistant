<script>
	import { page } from '$app/stores';
	import { derived } from 'svelte/store';

	let { data } = $props();

	const oauthError = derived(page, ($page) => $page.url.searchParams.get('error'));
</script>

<svelte:head>
	<title>Login — Asisten Guru AI</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-700 via-blue-600 to-indigo-700 p-4"
>
	<div class="w-full max-w-md">
		<!-- Card -->
		<div class="overflow-hidden rounded-2xl bg-white shadow-2xl">
			<!-- Top Header -->
			<div class="bg-linear-to-r from-blue-600 to-indigo-600 px-8 py-8 text-center">
				<div class="mb-3 flex items-center justify-center gap-3">
					<div class="rounded-xl bg-white p-2.5">
						<svg class="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 14l9-5-9-5-9 5 9 5z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
							/>
						</svg>
					</div>
					<div class="text-left">
						<h1 class="text-lg font-bold leading-tight text-white">Asisten Guru AI</h1>
					</div>
				</div>
				<p class="text-sm text-blue-100">Kerjaan Beres Tanpa Ribet ✨</p>
			</div>

			<!-- Content -->
			<div class="px-8 py-8">
				<h2 class="mb-1 text-xl font-semibold text-gray-800">Masuk ke Akun Guru</h2>
				<p class="mb-6 text-sm text-gray-500">Login menggunakan akun Google Anda untuk melanjutkan.</p>

				<!-- OAuth Error Message -->
				{#if $oauthError === 'oauth_failed'}
					<div class="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
						<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						Login dengan Google gagal. Silakan coba lagi.
					</div>
				{/if}

				<!-- Tombol Google -->
				<a
					href="/login/google"
					class="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
				>
					<!-- Google Logo SVG -->
					<svg class="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
						<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
						<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
						<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
					</svg>
					Lanjutkan dengan Google
				</a>
			</div>
		</div>

		<p class="mt-6 text-center text-xs text-blue-200">Asisten Guru AI</p>
	</div>
</div>
