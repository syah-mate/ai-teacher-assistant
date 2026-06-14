<script>
	import { onMount, onDestroy } from 'svelte';

	let items = $state([]);
	let loading = $state(true);
	let error = $state('');
	let activeFilter = $state('semua'); // semua | modul_ajar | lkpd | soal

	// Active jobs (queued/running)
	let activeJobs = $state([]);
	let jobPollInterval = null;

	// Custom template names (templateId → name)
	let customTemplateNames = $state({});

	const BUILTIN_TEMPLATE_NAMES = {
		'modul-ajar-standar': 'Modul Ajar Standar',
		'modul-ajar-tabel': 'Modul Ajar — Layout Tabel Grid',
		'lkpd-standar': 'LKPD Standar',
		'lkpd-tabel': 'LKPD — Layout Tabel Compact'
	};

	function getTemplateName(templateId) {
		if (!templateId) return null;
		if (BUILTIN_TEMPLATE_NAMES[templateId]) return BUILTIN_TEMPLATE_NAMES[templateId];
		if (customTemplateNames[templateId]) return customTemplateNames[templateId];
		return templateId.startsWith('custom-') ? 'Template Kustom' : templateId;
	}

	const filters = [
		{ key: 'semua', label: 'Semua' },
		{ key: 'modul_ajar', label: 'Modul Ajar' },
		{ key: 'lkpd', label: 'LKPD' },
		{ key: 'soal', label: 'Soal' }
	];

	const tipeConfig = {
		modul_ajar: {
			label: 'Modul Ajar / RPP',
			badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
			dotClass: 'bg-blue-500',
			borderClass: 'border-blue-200 hover:border-blue-300'
		},
		lkpd: {
			label: 'LKPD',
			badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
			dotClass: 'bg-emerald-500',
			borderClass: 'border-emerald-200 hover:border-emerald-300'
		},
		soal: {
			label: 'Soal',
			badgeClass: 'bg-violet-100 text-violet-700 border-violet-200',
			dotClass: 'bg-violet-500',
			borderClass: 'border-violet-200 hover:border-violet-300'
		}
	};

	async function fetchHistory(tipe = 'semua') {
		loading = true;
		error = '';
		try {
			const url = tipe === 'semua' ? '/api/history?limit=50' : `/api/history?tipe=${tipe}&limit=50`;
			const res = await fetch(url);
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

			// Kalau ada job yang baru selesai (sebelumnya ada, sekarang tidak), refresh riwayat
			const prevIds = new Set(prev.map((j) => j._id));
			const nowIds = new Set(activeJobs.map((j) => j._id));
			const someCompleted = [...prevIds].some((id) => !nowIds.has(id));
			if (someCompleted) {
				fetchHistory(activeFilter);
			}

			// Stop polling jika tidak ada job aktif lagi
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

	async function handleFilter(key) {
		activeFilter = key;
		await fetchHistory(key);
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

	function jenisLabel(jenis) {
		return { modul_ajar: 'Modul Ajar', lkpd: 'LKPD', soal: 'Soal' }[jenis] || jenis;
	}

	function progressPercent(job) {
		const step = job.progress?.step ?? 0;
		const total = job.progress?.total ?? 10;
		const percent = total > 0 ? (step / total) * 100 : 0;
		const minimum = job.status === 'running' ? 10 : job.status === 'queued' ? 5 : 0;

		return Math.min(100, Math.max(minimum, percent));
	}

	async function fetchCustomTemplateNames() {
		try {
			const res = await fetch('/api/custom-templates');
			if (!res.ok) return;
			const data = await res.json();
			const map = {};
			for (const t of data.templates || []) {
				if (t.templateId && t.name) map[t.templateId] = t.name;
			}
			customTemplateNames = map;
		} catch {
			// ignore
		}
	}

	onMount(async () => {
		await Promise.all([fetchHistory(), fetchActiveJobs(), fetchCustomTemplateNames()]);
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
	<!-- Header -->
	<div class="mb-6 flex items-center gap-3">
		<div class="h-6 w-1 rounded-full bg-blue-600"></div>
		<h2 class="text-xl font-bold text-gray-800">Riwayat Generate</h2>
	</div>

	<!-- Active Jobs Banner -->
	{#if activeJobs.length > 0}
		<div class="mb-6 rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
			<div class="mb-3 flex items-center gap-2">
				<svg class="h-4 w-4 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				<span class="text-sm font-semibold text-amber-800">
					{activeJobs.length} job sedang berjalan di latar belakang
				</span>
			</div>
			<div class="flex flex-col gap-2">
				{#each activeJobs as job (job._id)}
					<div class="rounded-lg border border-amber-200 bg-white px-4 py-3">
						<div class="flex items-center justify-between gap-2">
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium text-gray-800">{job.judul || '-'}</p>
								<p class="text-xs text-gray-500">{jenisLabel(job.jenis)} · {job.mapel || ''} {job.kelas ? 'Kelas ' + job.kelas : ''}</p>
							</div>
							<span class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium {job.status === 'running' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}">
								{job.status === 'running' ? 'Sedang Diproses' : 'Antri'}
							</span>
						</div>
						{#if job.progress?.message}
						<div class="mt-2">
							<div class="h-1.5 w-full overflow-hidden rounded-full bg-amber-100">
								<div class="h-full bg-amber-500 transition-all duration-500"
									style="width: {progressPercent(job)}%"></div>
							</div>
							<p class="mt-1 text-xs text-amber-700">{job.progress.message}</p>
						</div>
						{/if}
					<!-- Console Monitor button -->
					{#if job.log?.length > 0}
						<a
							href="/dashboard/riwayat/{job._id}/console"
							target="_blank"
							rel="noopener noreferrer"
							class="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors border border-gray-700"
						>
							<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
									d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							Lihat Console ({job.log.length} log)
						</a>
					{/if}
					</div>
				{/each}
			</div>
			<p class="mt-3 text-xs text-amber-600">
				Halaman ini otomatis diperbarui saat generate selesai. Anda boleh menutup tab lain.
			</p>
		</div>
	{/if}

	<!-- Filter tabs -->
	<div class="mb-6 flex flex-wrap gap-2">
		{#each filters as f}
			<button
				onclick={() => handleFilter(f.key)}
				class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors {activeFilter === f.key
					? 'bg-blue-600 text-white'
					: 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}"
			>
				{f.label}
			</button>
		{/each}
	</div>

	<!-- Loading -->
	{#if loading}
		<div class="flex flex-col items-center justify-center py-20 text-gray-400">
			<svg class="mb-3 h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
			</svg>
			<p class="text-sm">Memuat riwayat...</p>
		</div>

	<!-- Error -->
	{:else if error}
		<div class="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
			<p class="font-medium">{error}</p>
			<button
				onclick={() => fetchHistory(activeFilter)}
				class="mt-3 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium hover:bg-red-200"
			>
				Coba Lagi
			</button>
		</div>

	<!-- Empty -->
	{:else if items.length === 0}
		<div class="flex flex-col items-center justify-center py-20 text-gray-400">
			<svg class="mb-3 h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
					d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
			</svg>
			<p class="text-sm font-medium">Belum ada riwayat</p>
			<p class="mt-1 text-xs text-gray-400">Generate konten untuk melihat riwayat di sini</p>
		</div>

	<!-- List -->
	{:else}
		<div class="flex flex-col gap-3">
			{#each items as item (item._id)}
				{@const cfg = tipeConfig[item.tipe] ?? tipeConfig.soal}
				<a
					href="/dashboard/riwayat/{item._id}"
					target="_blank"
					rel="noopener noreferrer"
					class="block rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 {cfg.borderClass}"
				>
					<!-- Top row: badge + date -->
					<div class="mb-2 flex items-start justify-between gap-2">
						<span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold {cfg.badgeClass}">
							<span class="h-1.5 w-1.5 rounded-full {cfg.dotClass}"></span>
							{cfg.label}
						</span>
						<div class="flex shrink-0 items-center gap-1.5">
							<time class="text-xs text-gray-400">{formatDate(item.createdAt)}</time>
							<svg class="h-3.5 w-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
									d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
							</svg>
						</div>
					</div>

					<!-- Judul -->
					<h3 class="mb-2 text-sm font-semibold text-gray-800 leading-snug">{item.judul}</h3>

					<!-- Template name (untuk modul_ajar) -->
					{#if item.templateId}
						{@const tplName = getTemplateName(item.templateId)}
						{#if tplName}
							<div class="mb-2 inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">
								<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
										d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
								</svg>
								{tplName}
							</div>
						{/if}
					{/if}

					<!-- Metadata chips -->
					<div class="flex flex-wrap gap-2">
						{#if item.mapel}
							<span class="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
								<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
										d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
								</svg>
								{item.mapel}
							</span>
						{/if}

						{#if item.kelas}
							<span class="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
								<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
										d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
								Kelas {item.kelas}
							</span>
						{/if}

						{#if item.jenjang}
							<span class="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
								🏫 {item.jenjang}
							</span>
						{/if}

						<!-- Modul Ajar specifics -->
						{#if item.tipe === 'modul_ajar'}
							{#if item.metode}
								<span class="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
									⚙️ {item.metode}
								</span>
							{/if}
							{#if item.jumlahPertemuan}
								<span class="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
									📅 {item.jumlahPertemuan} Pertemuan
								</span>
							{/if}
							{#if item.modePembelajaran}
								<span class="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
									🎯 {item.modePembelajaran}
								</span>
							{/if}
						{/if}

						<!-- LKPD specifics -->
						{#if item.tipe === 'lkpd'}
							{#if item.semester}
								<span class="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">
									📆 Semester {item.semester}
								</span>
							{/if}
							{#if item.metode}
								<span class="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">
									⚙️ {item.metode}
								</span>
							{/if}
							{#if item.alokasiWaktu}
								<span class="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">
									⏱️ {item.alokasiWaktu}
								</span>
							{/if}
						{/if}

						<!-- Soal specifics -->
						{#if item.tipe === 'soal'}
							{#if item.jenisSoal}
								<span class="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-xs text-violet-600">
									📝 {item.jenisSoal}
								</span>
							{/if}
							{#if item.jumlahSoal}
								<span class="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-xs text-violet-600">
									🔢 {item.jumlahSoal} soal
								</span>
							{/if}
							{#if item.tingkat}
								<span class="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-xs text-violet-600">
									📊 {item.tingkat}
								</span>
							{/if}
							{#if item.levelBloom}
								<span class="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-xs text-violet-600">
									🧠 {item.levelBloom}
								</span>
							{/if}
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
