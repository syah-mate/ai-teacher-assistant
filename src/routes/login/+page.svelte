<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { derived } from 'svelte/store';

	let { data, form } = $props();
	let showPassword = $state(false);
	let loading = $state(false);

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
						<!-- <p class="text-xs text-blue-200">by TwinLabs</p> -->
					</div>
				</div>
				<p class="text-sm text-blue-100">Kerjaan Beres Tanpa Ribet ✨</p>
			</div>

			<!-- Form -->
			<div class="px-8 py-8">
				<h2 class="mb-1 text-xl font-semibold text-gray-800">Masuk ke Akun Guru</h2>
				<p class="mb-6 text-sm text-gray-500">Silakan masukkan kredensial Anda untuk melanjutkan.</p>

				<form method="POST" use:enhance class="space-y-5">
					<!-- Username -->
					<div>
						<label for="username" class="mb-1.5 block text-sm font-medium text-gray-700"
							>Username</label
						>
						<div class="relative">
							<span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
									/>
								</svg>
							</span>
							<input
								id="username"
								name="username"
								type="text"
								value={form?.username ?? ''}
								placeholder="Masukkan username"
								class="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
								required
							/>
						</div>
					</div>

					<!-- Password -->
					<div>
						<label for="password" class="mb-1.5 block text-sm font-medium text-gray-700"
							>Password</label
						>
						<div class="relative">
							<span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
									/>
								</svg>
							</span>
							<input
								id="password"
								name="password"
								type={showPassword ? 'text' : 'password'}
								placeholder="••••••••"
								class="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
								required
							/>
							<button
								type="button"
								onclick={() => (showPassword = !showPassword)}
								class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
							>
								{#if showPassword}
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"
										/>
									</svg>
								{:else}
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
										/>
									</svg>
								{/if}
							</button>
						</div>
					</div>

					{#if form?.error}
						<div
							class="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
						>
							<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							{form.error}
						</div>
					{/if}

					<button
						type="submit"
						class="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700"
					>
						Masuk ke Dashboard
					</button>
				</form>

				<!-- OAuth Error Message -->
				{#if $oauthError === 'oauth_failed'}
					<div class="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
						<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						Login dengan Google gagal. Silakan coba lagi.
					</div>
				{/if}

				<!-- Divider -->
				<div class="relative my-5 flex items-center">
					<div class="flex-grow border-t border-gray-200"></div>
					<span class="mx-3 shrink-0 text-xs text-gray-400">atau masuk dengan</span>
					<div class="flex-grow border-t border-gray-200"></div>
				</div>

				<!-- Tombol Google -->
				<a
					href="/login/google"
					class="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
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
