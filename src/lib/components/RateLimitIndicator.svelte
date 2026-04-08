<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let rateLimit = $state({
		limit: 2,
		remaining: 2,
		used: 0,
		resetIn: 0,
		isLimited: false,
		loading: true
	});

	let showDetails = $state(false);

	async function fetchRateLimitStatus() {
		if (!browser) return;

		try {
			const response = await fetch('/api/user/rate-limit');
			if (response.ok) {
				const data = await response.json();
				rateLimit = {
					...data,
					loading: false
				};
			}
		} catch (error) {
			console.error('Failed to fetch rate limit:', error);
			rateLimit.loading = false;
		}
	}

	function formatResetTime(seconds) {
		if (seconds < 60) return `${seconds} detik`;
		const minutes = Math.ceil(seconds / 60);
		if (minutes < 60) return `${minutes} menit`;
		const hours = Math.ceil(minutes / 60);
		return `${hours} jam`;
	}

	function getStatusColor() {
		if (rateLimit.isLimited) return 'red';
		if (rateLimit.remaining === 1) return 'amber';
		return 'emerald';
	}

	onMount(() => {
		fetchRateLimitStatus();

		// Refresh setiap 30 detik
		const interval = setInterval(fetchRateLimitStatus, 30000);

		// Listen to custom event when generate success
		const handleGenerateSuccess = () => {
			fetchRateLimitStatus();
		};
		window.addEventListener('generate-success', handleGenerateSuccess);

		return () => {
			clearInterval(interval);
			window.removeEventListener('generate-success', handleGenerateSuccess);
		};
	});

	// Expose refresh function untuk dipanggil setelah generate
	export function refresh() {
		fetchRateLimitStatus();
	}
</script>

<div class="relative">
	<button
		onclick={() => (showDetails = !showDetails)}
		class="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all hover:shadow-sm {rateLimit.isLimited
			? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
			: rateLimit.remaining === 1
				? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
				: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}"
		title="Klik untuk detail"
		aria-label="Rate limit status"
	>
		{#if rateLimit.loading}
			<div class="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400"></div>
			<span class="hidden sm:inline">Loading...</span>
		{:else}
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 10V3L4 14h7v7l9-11h-7z"
				/>
			</svg>
			<span class="hidden sm:inline">
				{rateLimit.remaining}/{rateLimit.limit} Generate
			</span>
			<span class="sm:hidden">
				{rateLimit.remaining}/{rateLimit.limit}
			</span>
		{/if}
	</button>

	<!-- Dropdown details -->
	{#if showDetails && !rateLimit.loading}
		<div
			class="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
		>
			<div class="mb-3 flex items-start justify-between">
				<div>
					<h3 class="text-sm font-bold text-gray-800">Limit Generate</h3>
					<p class="text-xs text-gray-500">Status penggunaan Anda</p>
				</div>
				<button
					onclick={() => (showDetails = false)}
					class="text-gray-400 transition-colors hover:text-gray-600"
					aria-label="Tutup detail"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="mb-3 space-y-2">
				<div class="flex items-center justify-between text-sm">
					<span class="text-gray-600">Terpakai</span>
					<span class="font-semibold text-gray-800">{rateLimit.used} kali</span>
				</div>
				<div class="flex items-center justify-between text-sm">
					<span class="text-gray-600">Tersisa</span>
					<span
						class="font-semibold {rateLimit.isLimited
							? 'text-red-600'
							: rateLimit.remaining === 1
								? 'text-amber-600'
								: 'text-emerald-600'}"
					>
						{rateLimit.remaining} kali
					</span>
				</div>
			</div>

			<!-- Progress bar -->
			<div class="mb-3">
				<div class="h-2 overflow-hidden rounded-full bg-gray-100">
					<div
						class="h-full rounded-full transition-all duration-500 {rateLimit.isLimited
							? 'bg-red-500'
							: rateLimit.remaining === 1
								? 'bg-amber-500'
								: 'bg-emerald-500'}"
						style="width: {(rateLimit.used / rateLimit.limit) * 100}%"
					></div>
				</div>
			</div>

			{#if rateLimit.isLimited}
				<div class="rounded-lg bg-red-50 p-3">
					<div class="mb-1 flex items-center gap-2">
						<svg class="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd"
							/>
						</svg>
						<span class="text-xs font-semibold text-red-700">Limit Tercapai</span>
					</div>
					<p class="text-xs text-red-600">
						Reset dalam <strong>{formatResetTime(rateLimit.resetIn)}</strong>
					</p>
				</div>
			{:else if rateLimit.resetIn > 0}
				<div class="rounded-lg bg-gray-50 p-3">
					<div class="mb-1 flex items-center gap-2">
						<svg class="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span class="text-xs font-semibold text-gray-700">Reset Otomatis</span>
					</div>
					<p class="text-xs text-gray-600">Dalam {formatResetTime(rateLimit.resetIn)}</p>
				</div>
			{/if}

			<div class="mt-3 border-t border-gray-100 pt-3">
				<p class="text-xs text-gray-500">
					💡 <strong>Tips:</strong> Setiap user dapat generate maksimal
					<strong>{rateLimit.limit} kali per jam</strong> untuk memastikan layanan tetap stabil untuk
					semua pengguna.
				</p>
			</div>
		</div>
	{/if}
</div>

<!-- Close dropdown when clicking outside -->
{#if showDetails}
	<button
		class="fixed inset-0 z-40"
		onclick={() => (showDetails = false)}
		aria-label="Close details"
	></button>
{/if}
