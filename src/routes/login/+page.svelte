<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.js';

	let username = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);
	let showPassword = $state(false);

	onMount(() => {
		const stored = localStorage.getItem('asisten_guru_auth');
		if (stored) goto('/dashboard');
	});

	async function handleLogin(e) {
		e.preventDefault();
		error = '';
		loading = true;
		await new Promise((r) => setTimeout(r, 800));
		const result = auth.login(username, password);
		loading = false;
		if (result.success) {
			goto('/dashboard');
		} else {
			error = result.error;
		}
	}
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
						<p class="text-xs text-blue-200">by eSolusi.id</p>
					</div>
				</div>
				<p class="text-sm text-blue-100">Kerjaan Beres Tanpa Ribet ✨</p>
			</div>

			<!-- Form -->
			<div class="px-8 py-8">
				<h2 class="mb-1 text-xl font-semibold text-gray-800">Masuk ke Akun Guru</h2>
				<p class="mb-6 text-sm text-gray-500">Silakan masukkan kredensial Anda untuk melanjutkan.</p>

				<form onsubmit={handleLogin} class="space-y-5">
					<!-- Username -->
					<div>
						<label for="username" class="mb-1.5 block text-sm font-medium text-gray-700"
							>Email / Username</label
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
								type="text"
								bind:value={username}
								placeholder="guru@esolusi.id"
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
								type={showPassword ? 'text' : 'password'}
								bind:value={password}
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

					{#if error}
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
							{error}
						</div>
					{/if}

					<button
						type="submit"
						disabled={loading}
						class="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
					>
						{#if loading}
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
							Masuk...
						{:else}
							Masuk ke Dashboard
						{/if}
					</button>
				</form>

				<!-- Demo credentials hint -->
				<div class="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
					<p class="mb-1.5 text-xs font-medium text-blue-700">👤 Akun Demo:</p>
					<div class="space-y-1 font-mono text-xs text-blue-600">
						<p>Email: <span class="font-semibold">guru@esolusi.id</span></p>
						<p>Password: <span class="font-semibold">guru123</span></p>
					</div>
				</div>
			</div>
		</div>

		<p class="mt-6 text-center text-xs text-blue-200">© 2026 eSolusi.id — Asisten Guru AI</p>
	</div>
</div>
