<script>
	import { get } from 'svelte/store';
	import { selectedModel, selectedThinking } from '$lib/stores/modelStore.js';
	import { onDestroy } from 'svelte';

	let form = $state({
		mapel: '',
		kelas: 'X',
		topik: '',
		kurikulum: 'Kurikulum Merdeka',
		jenis: 'Pilihan Ganda',
		jumlah: 10,
		tingkat: 'Sedang',
		level: 'C2 – Memahami'
	});

	let isSubmitting = $state(false);
	let jobId = $state(null);
	let jobStatus = $state(null);
	let jobProgress = $state({ step: 0, total: 6, message: '', phase: '' });
	let jobResultId = $state(null);
	let error = $state('');

	let pollInterval = null;

	const isGenerating = $derived(jobStatus === 'queued' || jobStatus === 'running');
	const isCompleted = $derived(jobStatus === 'completed');
	const isFailed = $derived(jobStatus === 'failed');

	async function handleGenerate(e) {
		e.preventDefault();
		if (!form.mapel || !form.topik) {
			error = 'Harap isi Mata Pelajaran dan Topik/Materi';
			return;
		}

		isSubmitting = true;
		error = '';
		jobId = null;
		jobStatus = null;
		jobResultId = null;
		jobProgress = { step: 0, total: 6, message: 'Mengirim permintaan...', phase: '' };

		const userInput = {
			jenis: 'soal',
			judul: form.topik,
			mapel: form.mapel,
			kelas: form.kelas,
			jenisSoal: form.jenis,
			jumlahSoal: form.jumlah,
			tingkat: form.tingkat,
			levelBloom: form.level
		};

		try {
			const res = await fetch('/api/generate-async', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userInput, model: get(selectedModel), thinkingEffort: get(selectedThinking) })
			});

			const data = await res.json();
			if (!res.ok) { error = data.error || 'Gagal memulai generate'; return; }

			jobId = data.jobId;
			jobStatus = 'queued';
			jobProgress = { step: 0, total: 6, message: 'Job antri, segera diproses...', phase: '' };
			savePendingJob(jobId, 'soal', form.topik, form.mapel);
			startPolling();
		} catch (err) {
			error = 'Gagal terhubung ke server: ' + err.message;
		} finally {
			isSubmitting = false;
		}
	}

	function startPolling() {
		stopPolling();
		pollInterval = setInterval(async () => {
			if (!jobId) return;
			try {
				const res = await fetch(`/api/jobs/${jobId}`);
				if (!res.ok) return;
				const data = await res.json();
				jobStatus = data.status;
				if (data.progress) jobProgress = data.progress;
				if (data.status === 'completed') {
					jobResultId = data.resultId;
					stopPolling();
					removePendingJob(jobId);
					window.dispatchEvent(new Event('generate-success'));
				} else if (data.status === 'failed') {
					error = data.error || 'Generate gagal di server';
					stopPolling();
					removePendingJob(jobId);
				}
			} catch {}
		}, 2500);
	}

	function stopPolling() {
		if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
	}

	function savePendingJob(id, jenis, judul, mapel) {
		try {
			const stored = JSON.parse(localStorage.getItem('pending_jobs') || '[]');
			stored.push({ jobId: id, jenis, judul, mapel, createdAt: new Date().toISOString() });
			localStorage.setItem('pending_jobs', JSON.stringify(stored.slice(-10)));
		} catch {}
	}

	function removePendingJob(id) {
		try {
			const stored = JSON.parse(localStorage.getItem('pending_jobs') || '[]');
			localStorage.setItem('pending_jobs', JSON.stringify(stored.filter((j) => j.jobId !== id)));
		} catch {}
	}

	onDestroy(stopPolling);
</script>

<svelte:head>
	<title>Generator Soal — Asisten Guru AI</title>
</svelte:head>

<div class="p-6">
	<!-- Breadcrumb -->
	<div class="mb-4 flex items-center gap-2 text-sm text-gray-500">
		<a href="/dashboard" class="hover:text-violet-600">Dashboard</a>
		<span>/</span>
		<span class="font-medium text-gray-800">Generator Soal Otomatis</span>
	</div>

	<!-- Page header -->
	<div class="mb-6 flex items-center gap-4">
		<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100">
			<svg class="h-6 w-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		</div>
		<div>
			<h1 class="text-2xl font-bold text-gray-800">Generator Soal Otomatis</h1>
			<p class="text-sm text-gray-500">
				Buat soal ujian pilihan ganda, esai, atau campuran secara otomatis
			</p>
		</div>
	</div>

	<div class="mx-auto max-w-3xl space-y-4">
			<!-- Info Card -->
			<div class="rounded-xl border border-violet-100 bg-violet-50 p-4">
				<div class="mb-2 flex items-center gap-2">
					<svg
						class="h-5 w-5 text-violet-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/>
					</svg>
					<h3 class="font-semibold text-violet-900">Fitur AI Powered</h3>
				</div>
				<p class="text-xs leading-relaxed text-violet-700">
					Generator soal ini menggunakan <strong>Agentic AI System</strong> dengan specialized agent:
					<br />
					🤖 <strong>Soal Generator Agent</strong> - Menyusun soal sesuai standar Kurikulum Merdeka
				</p>
			</div>

			<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
				<h2 class="mb-5 text-base font-semibold text-gray-700">Konfigurasi Soal</h2>
			<form onsubmit={handleGenerate} class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="col-span-2">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Mata Pelajaran *</label>
						<input
							type="text"
							bind:value={form.mapel}
							placeholder="cth: Biologi, Sejarah Indonesia..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-violet-500 focus:outline-none"
							required
						/>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Kelas</label>
						<select
							bind:value={form.kelas}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-violet-500 focus:outline-none"
						>
							{#each ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'] as k}
								<option value={k} selected={form.kelas === k}>{k}</option>
							{/each}
						</select>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Kurikulum</label>
						<select
							bind:value={form.kurikulum}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-violet-500 focus:outline-none"
						>
							<option>Kurikulum Merdeka</option>
							<option>Kurikulum 2013 (K13)</option>
						</select>
					</div>
					<div class="col-span-2">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Topik / Materi *</label>
						<input
							type="text"
							bind:value={form.topik}
							placeholder="cth: Sel dan Organel, Reformasi 1998..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-violet-500 focus:outline-none"
							required
						/>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Jenis Soal</label>
						<select
							bind:value={form.jenis}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-violet-500 focus:outline-none"
						>
							<option>Pilihan Ganda</option>
							<option>Esai</option>
							<option>Campuran</option>
						</select>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700"
							>Jumlah Soal ({form.jumlah})</label
						>
						<input
							type="range"
							bind:value={form.jumlah}
							min="5"
							max="30"
							step="5"
							class="w-full accent-violet-600"
						/>
						<div class="mt-1 flex justify-between text-xs text-gray-400">
							<span>5</span><span>15</span><span>25</span><span>30</span>
						</div>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Tingkat Kesulitan</label>
						<div class="flex gap-2">
							{#each ['Mudah', 'Sedang', 'Sulit'] as t}
								<button
									type="button"
									onclick={() => (form.tingkat = t)}
									class="flex-1 rounded-lg border py-2 text-xs font-medium transition-colors {form.tingkat ===
									t
										? 'border-violet-600 bg-violet-600 text-white'
										: 'border-gray-200 text-gray-600 hover:border-violet-300'}"
								>
									{t}
								</button>
							{/each}
						</div>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Level Kognitif (Bloom)</label>
						<select
							bind:value={form.level}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-violet-500 focus:outline-none"
						>
							<option>C1 – Mengingat</option>
							<option>C2 – Memahami</option>
							<option>C3 – Mengaplikasikan</option>
							<option>C4 – Menganalisis</option>
							<option>C5 – Mengevaluasi</option>
							<option>C6 – Mencipta</option>
						</select>
					</div>
				</div>

				<button
					type="submit"
					disabled={isSubmitting || isGenerating}
					class="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-3 font-semibold text-white transition-colors hover:bg-violet-700 disabled:bg-violet-400"
				>
					{#if isSubmitting}
						<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Mengirim...
					{:else if isGenerating}
						<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Sedang Dibuat di Background...
					{:else}
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
						Generate Soal (AI Powered)
					{/if}
				</button>

				<!-- Job Status indicator -->
				{#if jobId}
					<div class="mt-4 rounded-lg border {isCompleted ? 'border-green-200 bg-green-50' : isFailed ? 'border-red-200 bg-red-50' : 'border-violet-200 bg-violet-50'} p-4">
						<div class="mb-2 flex items-center justify-between text-sm">
							<span class="font-medium {isCompleted ? 'text-green-700' : isFailed ? 'text-red-700' : 'text-violet-700'}">
								{jobProgress.phase || (isCompleted ? 'Selesai' : isFailed ? 'Gagal' : 'Memproses...')}
							</span>
							<span class="{isCompleted ? 'text-green-600' : isFailed ? 'text-red-600' : 'text-violet-600'}">
								Step {jobProgress.step ?? 0}/{jobProgress.total ?? 6}
							</span>
						</div>
						{#if !isFailed}
						<div class="mb-2 h-2 overflow-hidden rounded-full {isCompleted ? 'bg-green-200' : 'bg-violet-200'}">
							<div class="h-full transition-all duration-300 {isCompleted ? 'bg-green-600' : 'bg-violet-600'}"
								style="width: {((jobProgress.step ?? 0) / (jobProgress.total ?? 6)) * 100}%"></div>
						</div>
						{/if}
						<p class="text-xs {isCompleted ? 'text-green-600' : isFailed ? 'text-red-600' : 'text-violet-600'}">
							{jobProgress.message || ''}
						</p>
						{#if isGenerating}
						<p class="mt-1 text-xs text-violet-500">Berjalan di latar belakang — Anda boleh menutup halaman ini</p>
						{/if}
					</div>
				{/if}

				<!-- Error message -->
				{#if error}
					<div class="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
						<p class="flex-1 text-sm text-red-700">❌ {error}</p>
						<button onclick={() => { error = ''; }} class="shrink-0 rounded p-1 text-red-400 hover:bg-red-100">✕</button>
					</div>
				{/if}
			</form>
		</div>

	<!-- Success notification -->
	{#if isCompleted && jobResultId}
		<div class="rounded-2xl border border-violet-200 bg-violet-50 p-5">
			<div class="flex items-center gap-4">
				<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100">
					<svg class="h-6 w-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<div class="flex-1">
					<p class="font-semibold text-violet-900">Soal berhasil dibuat!</p>
					<p class="mt-0.5 text-sm text-violet-700">
						Tersimpan di riwayat. Klik tombol untuk membuka hasilnya.
					</p>
				</div>
				<a
					href="/dashboard/riwayat/{jobResultId}"
					target="_blank"
					class="flex shrink-0 items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
					</svg>
					Buka Hasil
				</a>
			</div>
		</div>
	{/if}

	<!-- Agent Console Monitor -->
	</div>
</div>
