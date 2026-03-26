<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	const STORAGE_KEY = 'jurnal_mengajar_entries';

	let form = $state({
		tanggal: new Date().toISOString().split('T')[0],
		kelas: '',
		mapel: '',
		topik: '',
		jumlahHadir: '',
		metode: '',
		mediaDipakai: '',
		capaianTujuan: 'Tercapai',
		hambatan: '',
		solusi: '',
		refleksi: '',
		rencanaBerikutnya: ''
	});

	let entries = $state([]);
	let isSaving = $state(false);
	let saveSuccess = $state(false);
	let activeTab = $state('form'); // 'form' | 'list'
	let expandedId = $state(null);

	onMount(() => {
		if (browser) {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) entries = JSON.parse(stored);
		}
	});

	function saveEntries(newEntries) {
		entries = newEntries;
		if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
	}

	async function handleSave(e) {
		e.preventDefault();
		if (!form.kelas || !form.mapel || !form.topik) return;
		isSaving = true;
		await new Promise((r) => setTimeout(r, 800));

		const newEntry = {
			id: Date.now(),
			...JSON.parse(JSON.stringify(form))
		};
		saveEntries([newEntry, ...entries]);
		isSaving = false;
		saveSuccess = true;
		setTimeout(() => (saveSuccess = false), 3000);

		// Reset form
		form.kelas = '';
		form.mapel = '';
		form.topik = '';
		form.jumlahHadir = '';
		form.metode = '';
		form.mediaDipakai = '';
		form.hambatan = '';
		form.solusi = '';
		form.refleksi = '';
		form.rencanaBerikutnya = '';
		form.capaianTujuan = 'Tercapai';
		form.tanggal = new Date().toISOString().split('T')[0];

		activeTab = 'list';
	}

	function deleteEntry(id) {
		saveEntries(entries.filter((e) => e.id !== id));
	}

	function formatDate(dateStr) {
		return new Date(dateStr).toLocaleDateString('id-ID', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Jurnal Mengajar — Asisten Guru AI</title>
</svelte:head>

<div class="p-6">
	<!-- Breadcrumb -->
	<div class="mb-4 flex items-center gap-2 text-sm text-gray-500">
		<a href="/dashboard" class="hover:text-rose-600">Dashboard</a>
		<span>/</span>
		<span class="font-medium text-gray-800">Jurnal Mengajar</span>
	</div>

	<!-- Page header -->
	<div class="mb-6 flex items-start justify-between">
		<div class="flex items-center gap-4">
			<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100">
				<svg class="h-6 w-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
					/>
				</svg>
			</div>
			<div>
				<h1 class="text-2xl font-bold text-gray-800">Jurnal Mengajar</h1>
				<p class="text-sm text-gray-500">Catat dan simpan refleksi harian mengajar Anda</p>
			</div>
		</div>
		<span
			class="mt-1 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600"
		>
			{entries.length} Jurnal Tersimpan
		</span>
	</div>

	<!-- Tabs -->
	<div class="mb-6 flex gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1 w-fit">
		<button
			onclick={() => (activeTab = 'form')}
			class="rounded-lg px-5 py-2 text-sm font-medium transition-colors {activeTab === 'form'
				? 'bg-white text-rose-600 shadow-sm'
				: 'text-gray-500 hover:text-gray-700'}"
		>
			✏️ Tulis Jurnal Baru
		</button>
		<button
			onclick={() => (activeTab = 'list')}
			class="rounded-lg px-5 py-2 text-sm font-medium transition-colors {activeTab === 'list'
				? 'bg-white text-rose-600 shadow-sm'
				: 'text-gray-500 hover:text-gray-700'}"
		>
			📋 Riwayat Jurnal ({entries.length})
		</button>
	</div>

	{#if activeTab === 'form'}
		<!-- Form -->
		<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
			{#if saveSuccess}
				<div
					class="mb-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					Jurnal berhasil disimpan! Lihat di tab Riwayat Jurnal.
				</div>
			{/if}

			<form onsubmit={handleSave} class="space-y-5">
				<div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Tanggal</label>
						<input
							type="date"
							bind:value={form.tanggal}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-rose-500 focus:outline-none"
						/>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Kelas *</label>
						<input
							type="text"
							bind:value={form.kelas}
							placeholder="cth: X IPA 2, VII B..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-rose-500 focus:outline-none"
							required
						/>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Mata Pelajaran *</label>
						<input
							type="text"
							bind:value={form.mapel}
							placeholder="cth: Fisika, PKN..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-rose-500 focus:outline-none"
							required
						/>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Topik / KD yang Diajarkan *</label>
						<input
							type="text"
							bind:value={form.topik}
							placeholder="cth: Gerak Parabola, Pancasila..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-rose-500 focus:outline-none"
							required
						/>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Jumlah Siswa Hadir</label>
						<input
							type="number"
							bind:value={form.jumlahHadir}
							placeholder="cth: 32"
							min="0"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-rose-500 focus:outline-none"
						/>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Metode / Strategi</label>
						<input
							type="text"
							bind:value={form.metode}
							placeholder="cth: PBL, Diskusi Kelompok..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-rose-500 focus:outline-none"
						/>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Media yang Dipakai</label>
						<input
							type="text"
							bind:value={form.mediaDipakai}
							placeholder="cth: PPT, Video, LKPD..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-rose-500 focus:outline-none"
						/>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Capaian Tujuan</label>
						<select
							bind:value={form.capaianTujuan}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-rose-500 focus:outline-none"
						>
							<option>Tercapai</option>
							<option>Sebagian Tercapai</option>
							<option>Belum Tercapai</option>
						</select>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Hambatan / Kendala</label>
						<textarea
							bind:value={form.hambatan}
							rows="3"
							placeholder="Tuliskan hambatan yang ditemui selama pembelajaran..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-rose-500 focus:outline-none"
						></textarea>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Solusi / Tindak Lanjut</label>
						<textarea
							bind:value={form.solusi}
							rows="3"
							placeholder="Solusi yang dilakukan atau direncanakan..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-rose-500 focus:outline-none"
						></textarea>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Catatan Refleksi Guru</label>
						<textarea
							bind:value={form.refleksi}
							rows="3"
							placeholder="Apa yang berjalan baik? Apa yang perlu diperbaiki?"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-rose-500 focus:outline-none"
						></textarea>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Rencana Pertemuan Berikutnya</label>
						<textarea
							bind:value={form.rencanaBerikutnya}
							rows="3"
							placeholder="Topik, kegiatan, atau perbaikan untuk pertemuan selanjutnya..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-rose-500 focus:outline-none"
						></textarea>
					</div>
				</div>

				<button
					type="submit"
					disabled={isSaving}
					class="flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-rose-700 disabled:bg-rose-400"
				>
					{#if isSaving}
						<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Menyimpan...
					{:else}
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
							/>
						</svg>
						Simpan Jurnal
					{/if}
				</button>
			</form>
		</div>
	{:else}
		<!-- Entries list -->
		{#if entries.length === 0}
			<div
				class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-gray-400"
			>
				<svg class="mb-3 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
				<p class="text-sm">Belum ada jurnal tersimpan</p>
				<button
					onclick={() => (activeTab = 'form')}
					class="mt-3 text-sm font-medium text-rose-600 hover:underline"
					>Tulis jurnal pertama Anda →</button
				>
			</div>
		{:else}
			<div class="space-y-4">
				{#each entries as entry (entry.id)}
					<div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
						<!-- Entry header -->
						<button
							onclick={() => (expandedId = expandedId === entry.id ? null : entry.id)}
							class="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50"
						>
							<div class="flex items-center gap-4">
						<div class="shrink-0">
									<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
										<svg
											class="h-5 w-5 text-rose-600"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
											/>
										</svg>
									</div>
								</div>
								<div>
									<p class="font-semibold text-gray-800">{entry.mapel} — {entry.topik}</p>
									<p class="text-xs text-gray-500">
										{formatDate(entry.tanggal)} · Kelas {entry.kelas}
										{entry.jumlahHadir ? `· ${entry.jumlahHadir} siswa hadir` : ''}
									</p>
								</div>
							</div>
							<div class="flex items-center gap-3">
								<span
									class="rounded-full px-2.5 py-0.5 text-xs font-medium {entry.capaianTujuan ===
									'Tercapai'
										? 'bg-emerald-100 text-emerald-700'
										: entry.capaianTujuan === 'Sebagian Tercapai'
											? 'bg-amber-100 text-amber-700'
											: 'bg-red-100 text-red-700'}"
								>
									{entry.capaianTujuan}
								</span>
								<svg
									class="h-4 w-4 text-gray-400 transition-transform {expandedId === entry.id
										? 'rotate-180'
										: ''}"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</div>
						</button>

						<!-- Expanded content -->
						{#if expandedId === entry.id}
							<div class="border-t border-gray-100 px-6 py-5">
								<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
									{#if entry.metode}
										<div>
											<p class="font-medium text-gray-500">Metode:</p>
											<p class="text-gray-700">{entry.metode}</p>
										</div>
									{/if}
									{#if entry.mediaDipakai}
										<div>
											<p class="font-medium text-gray-500">Media:</p>
											<p class="text-gray-700">{entry.mediaDipakai}</p>
										</div>
									{/if}
									{#if entry.hambatan}
										<div>
											<p class="font-medium text-gray-500">Hambatan:</p>
											<p class="text-gray-700">{entry.hambatan}</p>
										</div>
									{/if}
									{#if entry.solusi}
										<div>
											<p class="font-medium text-gray-500">Solusi:</p>
											<p class="text-gray-700">{entry.solusi}</p>
										</div>
									{/if}
									{#if entry.refleksi}
										<div class="md:col-span-2">
											<p class="font-medium text-gray-500">Refleksi:</p>
											<p class="text-gray-700">{entry.refleksi}</p>
										</div>
									{/if}
									{#if entry.rencanaBerikutnya}
										<div class="md:col-span-2">
											<p class="font-medium text-gray-500">Rencana Berikutnya:</p>
											<p class="text-gray-700">{entry.rencanaBerikutnya}</p>
										</div>
									{/if}
								</div>
								<div class="mt-4 flex justify-end">
									<button
										onclick={() => deleteEntry(entry.id)}
										class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
									>
										<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
										Hapus Jurnal
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
