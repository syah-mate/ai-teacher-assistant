<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let jobId = $derived($page.params.id);

	let job = $state(null);
	let loading = $state(true);
	let error = $state('');
	let pollInterval = null;

	const STATUS_LABELS = {
		queued: 'Antri',
		running: 'Sedang Diproses',
		completed: 'Selesai',
		failed: 'Gagal'
	};

	const STATUS_CLASSES = {
		queued: 'bg-amber-100 text-amber-700',
		running: 'bg-blue-100 text-blue-700',
		completed: 'bg-green-100 text-green-700',
		failed: 'bg-red-100 text-red-700'
	};

	function jenisLabel(jenis) {
		return { modul_ajar: 'Modul Ajar', lkpd: 'LKPD', soal: 'Soal' }[jenis] || jenis;
	}

	function progressPercent(job) {
		if (!job?.progress) return 0;
		const step = job.progress.step ?? 0;
		const total = job.progress.total ?? 10;
		const percent = total > 0 ? (step / total) * 100 : 0;
		const minimum = job.status === 'running' ? 10 : job.status === 'queued' ? 5 : 0;
		return Math.min(100, Math.max(minimum, percent));
	}

	function formatLogTime(ts) {
		if (!ts) return '';
		const d = new Date(ts);
		return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	}

	function logColorClass(type) {
		switch (type) {
			case 'error': return 'text-red-400';
			case 'success': return 'text-green-400';
			case 'progress': return 'text-cyan-400';
			case 'orchestrator':
			case 'orchestrator-ai': return 'text-yellow-400';
			case 'sub-agent':
			case 'section-agent': return 'text-purple-400';
			case 'tool': return 'text-blue-400';
			default: return 'text-gray-300';
		}
	}

	function autoScroll(node) {
		const scroll = () => { node.scrollTop = node.scrollHeight; };
		scroll();
		const observer = new MutationObserver(scroll);
		observer.observe(node, { childList: true, subtree: true, characterData: true });
		return {
			destroy() { observer.disconnect(); },
			update() { scroll(); }
		};
	}

	async function fetchJob() {
		try {
			const res = await fetch(`/api/jobs/${jobId}`);
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error || 'Gagal memuat data job');
			}
			const data = await res.json();
			job = data;

			// Stop polling if job is completed or failed
			if (data.status === 'completed' || data.status === 'failed') {
				if (pollInterval) {
					clearInterval(pollInterval);
					pollInterval = null;
				}
			}
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchJob();
		pollInterval = setInterval(fetchJob, 2000);
	});

	onDestroy(() => {
		if (pollInterval) clearInterval(pollInterval);
	});
</script>

<svelte:head>
	<title>Console Monitor — {job?.userInput?.judul || 'Job'} — Asisten Guru AI</title>
</svelte:head>

<div class="flex h-screen flex-col bg-gray-950 text-gray-100">
	<!-- Top bar -->
	<div class="flex shrink-0 items-center justify-between border-b border-gray-700 bg-gray-900 px-5 py-3">
		<div class="flex items-center gap-3 min-w-0">
			<button
				onclick={() => goto(`/dashboard/riwayat`)}
				class="flex shrink-0 items-center gap-1 rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Kembali
			</button>

			{#if loading}
				<div class="h-4 w-24 animate-pulse rounded bg-gray-700"></div>
			{:else if job}
				<div class="min-w-0">
					<h1 class="truncate text-sm font-semibold text-white">{job.userInput?.judul || 'Tanpa Judul'}</h1>
					<p class="truncate text-xs text-gray-400">
						{jenisLabel(job.userInput?.jenis)} {job.userInput?.mapel ? `· ${job.userInput.mapel}` : ''} {job.userInput?.kelas ? `· Kelas ${job.userInput.kelas}` : ''}
					</p>
				</div>
			{/if}
		</div>

		<div class="flex items-center gap-3">
			{#if job?.status}
				<span class="rounded-full px-2.5 py-0.5 text-xs font-medium {STATUS_CLASSES[job.status] || 'bg-gray-700 text-gray-300'}">
					{STATUS_LABELS[job.status] || job.status}
				</span>
			{/if}
			{#if job?.status === 'running' || job?.status === 'queued'}
				<svg class="h-4 w-4 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
			{/if}
		</div>
	</div>

	<!-- Progress bar -->
	{#if job?.progress?.message}
		<div class="shrink-0 border-b border-gray-700 bg-gray-900 px-5 py-3">
			<div class="mb-1.5 flex items-center justify-between text-xs text-gray-400">
				<span>{job.progress.message}</span>
				<span>{Math.round(progressPercent(job))}%</span>
			</div>
			<div class="h-2 w-full overflow-hidden rounded-full bg-gray-800">
				<div class="h-full rounded-full bg-blue-500 transition-all duration-700 ease-out"
					style="width: {progressPercent(job)}%"></div>
			</div>
		</div>
	{/if}

	<!-- Error -->
	{#if error}
		<div class="flex flex-1 items-center justify-center">
			<div class="text-center">
				<svg class="mx-auto mb-3 h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
				</svg>
				<p class="text-red-400">{error}</p>
				<button
					onclick={() => { error = ''; loading = true; fetchJob(); }}
					class="mt-3 rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
				>
					Coba Lagi
				</button>
			</div>
		</div>

	<!-- Loading -->
	{:else if loading}
		<div class="flex flex-1 items-center justify-center">
			<div class="text-center">
				<svg class="mx-auto mb-3 h-8 w-8 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
				</svg>
				<p class="text-sm text-gray-500">Memuat console...</p>
			</div>
		</div>

	<!-- Empty log -->
	{:else if !job?.log || job.log.length === 0}
		<div class="flex flex-1 items-center justify-center">
			<div class="text-center">
				<svg class="mx-auto mb-3 h-10 w-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
						d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
				<p class="text-sm text-gray-500">Belum ada log</p>
				<p class="mt-1 text-xs text-gray-600">Log akan muncul setelah job mulai diproses</p>
			</div>
		</div>

	<!-- Console log -->
	{:else}
		<div
			class="flex-1 overflow-y-auto px-5 py-4 font-mono text-[12px] leading-relaxed"
			use:autoScroll
		>
			{#each job.log as entry}
				<div class="flex gap-3 py-px hover:bg-gray-900/50">
					<span class="shrink-0 select-none text-gray-600">{formatLogTime(entry.timestamp)}</span>
					<span class="whitespace-pre-wrap wrap-break-word {logColorClass(entry.type)}">{entry.message}</span>
				</div>
			{/each}

			{#if job?.status === 'running' || job?.status === 'queued'}
				<div class="mt-3 flex items-center gap-2 text-gray-600">
					<svg class="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
					</svg>
					<span class="text-[11px]">Menunggu log berikutnya...</span>
				</div>
			{/if}

			{#if job?.status === 'completed'}
				<div class="mt-3 rounded bg-green-900/30 px-3 py-2 text-green-400">
					✓ Job selesai — <a href="/dashboard/riwayat/{jobId}" target="_blank" class="underline hover:text-green-300">Lihat hasil generate</a>
				</div>
			{/if}

			{#if job?.status === 'failed'}
				<div class="mt-3 rounded bg-red-900/30 px-3 py-2 text-red-400">
					✗ Job gagal — {job.error || 'Terjadi kesalahan'}
				</div>
			{/if}
		</div>
	{/if}
</div>
