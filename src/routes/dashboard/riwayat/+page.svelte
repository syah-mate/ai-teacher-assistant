<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';

	let items = $state([]);
	let loading = $state(true);
	let error = $state('');

	// Active jobs (queued/running)
	let activeJobs = $state([]);
	let jobPollInterval = null;

	async function fetchHistory() {
		loading = true;
		error = '';
		try {
			const res = await fetch('/api/history?limit=50');
			if (!res.ok) throw new Error('Gagal memuat riwayat');
			const json = await res.json();
			items = json.data || [];
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	async function fetchActiveJobs() {
		try {
			const res = await fetch('/api/jobs?status=active&limit=10');
			if (!res.ok) return;
			const data = await res.json();
			const prev = activeJobs;
			activeJobs = data.data || [];

			const prevIds = new Set(prev.map((j) => j._id));
			const nowIds = new Set(activeJobs.map((j) => j._id));
			const someCompleted = [...prevIds].some((id) => !nowIds.has(id));
			if (someCompleted) {
				fetchHistory();
			}

			if (activeJobs.length === 0 && jobPollInterval) {
				clearInterval(jobPollInterval);
				jobPollInterval = null;
			}
		} catch {
			// ignore
		}
	}

	function startJobPolling() {
		if (jobPollInterval) return;
		jobPollInterval = setInterval(fetchActiveJobs, 3000);
	}

	function formatDate(dateStr) {
		if (!dateStr) return '-';
		return new Date(dateStr).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function progressPercent(job) {
		const step = job.progress?.step ?? 0;
		const total = job.progress?.total ?? 10;
		const percent = total > 0 ? (step / total) * 100 : 0;
		const minimum = job.status === 'running' ? 10 : job.status === 'queued' ? 5 : 0;
		return Math.min(100, Math.max(minimum, percent));
	}

	function getUserContextSummary(ctx) {
		if (!ctx) return '-';
		const titleKeys = ['judul', 'nama', 'topik', 'tema', 'judul_modul', 'nama_modul', 'mata_pelajaran', 'mapel'];
		const descKeys = ['kelas', 'fase', 'jenjang'];

		const title = titleKeys.find((k) => ctx[k]) || '';
		const desc = descKeys.filter((k) => ctx[k]).map((k) => ctx[k]).join(' · ');

		if (title) return desc ? `${title} · ${desc}` : title;
		if (desc) return desc;

		// Fallback: first non-empty text value
		for (const [, val] of Object.entries(ctx)) {
			if (val && !Array.isArray(val) && typeof val === 'string' && val.trim()) {
				return val.trim();
			}
		}
		return '-';
	}

	onMount(async () => {
		await Promise.all([fetchHistory(), fetchActiveJobs()]);
		startJobPolling();
	});

	onDestroy(() => {
		if (jobPollInterval) clearInterval(jobPollInterval);
	});
</script>

<svelte:head>
	<title>Riwayat Generate — Asisten Guru AI</title>
</svelte:head>

<div class="p-6">
	<h1 class="mb-1 text-2xl font-bold text-gray-800">Riwayat Generate</h1>
	<p class="mb-6 text-sm text-gray-500">Dokumen yang sudah Anda generate</p>

	<!-- Active Jobs -->
	{#if activeJobs.length > 0}
		<div class="mb-6">
			<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
				Sedang Diproses ({activeJobs.length})
			</h2>
			<div class="space-y-3">
				{#each activeJobs as job (job._id)}
					<div class="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
						<div class="mb-2 flex items-center justify-between">
							<p class="text-sm font-semibold text-gray-700">
								{getUserContextSummary(job.userContext) || 'Generate Dokumen'}
							</p>
							<span class="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
								{job.status === 'running' ? 'Processing' : 'Queued'}
							</span>
						</div>
						<div class="mb-1 h-2 overflow-hidden rounded-full bg-blue-100">
							<div
								class="h-full rounded-full bg-blue-600 transition-all duration-500"
								style="width: {progressPercent(job)}%"
							></div>
						</div>
						<p class="text-xs text-gray-500">{job.progress?.message || 'Menunggu...'}</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Error -->
	{#if error}
		<div class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
	{/if}

	<!-- Loading -->
	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
		</div>
	{:else if items.length === 0 && activeJobs.length === 0}
		<div class="flex flex-col items-center justify-center py-20 text-center">
			<div class="mb-4 rounded-full bg-gray-100 p-4">
				<svg class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<h3 class="mb-1 text-lg font-semibold text-gray-700">Belum ada riwayat</h3>
			<p class="mb-6 text-sm text-gray-500">Generate dokumen dari template untuk melihat hasilnya di sini</p>
			<button
				onclick={() => goto('/dashboard/template-builder')}
				class="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
			>
				Ke Template Saya
			</button>
		</div>
	{:else}
		<div class="space-y-3">
			{#each items as item (item._id)}
				<a
					href="/dashboard/riwayat/{item._id}"
					class="block rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
				>
					<div class="flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<h3 class="mb-1 text-sm font-bold text-gray-800 truncate">
								{getUserContextSummary(item.userContext)}
							</h3>
							<div class="flex items-center gap-3 text-xs text-gray-400">
								<span class="flex items-center gap-1">
									<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
									</svg>
									{item.templateName || 'Template'}
								</span>
								<span>{formatDate(item.createdAt)}</span>
							</div>
						</div>
						<svg class="mt-1 h-4 w-4 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
