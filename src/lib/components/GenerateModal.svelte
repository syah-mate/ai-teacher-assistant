<script>
	import { onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import { selectedModel, selectedThinking } from '$lib/stores/modelStore.js';

	let { template, onClose, onSuccess } = $props();

	let isGenerating = $state(false);
	let error = $state('');
	let jobId = $state(null);
	let pollInterval = null;

	// Form fields
	let judul = $state('');
	let mapel = $state('');
	let kelas = $state('X');
	let fase = $state('Fase E');
	let jumlahPertemuan = $state('4');
	let alokasiPerPertemuan = $state('2x45 menit (2 JP)');
	let metode = $state('Problem Based Learning (PBL)');
	let modePembelajaran = $state('Luring (Tatap Muka)');
	let penulis = $state('');
	let instansi = $state('');

	const kelasList = [
		{ val: 'I', fase: 'Fase A' },
		{ val: 'II', fase: 'Fase A' },
		{ val: 'III', fase: 'Fase B' },
		{ val: 'IV', fase: 'Fase B' },
		{ val: 'V', fase: 'Fase C' },
		{ val: 'VI', fase: 'Fase C' },
		{ val: 'VII', fase: 'Fase D' },
		{ val: 'VIII', fase: 'Fase D' },
		{ val: 'IX', fase: 'Fase D' },
		{ val: 'X', fase: 'Fase E' },
		{ val: 'XI', fase: 'Fase F' },
		{ val: 'XII', fase: 'Fase F' }
	];

	function getJenjangFromKelas(k) {
		if (['I', 'II', 'III', 'IV', 'V', 'VI'].includes(k)) return 'SD';
		if (['VII', 'VIII', 'IX'].includes(k)) return 'SMP';
		return 'SMA';
	}

	function onKelasChange(val) {
		kelas = val;
		const found = kelasList.find((k) => k.val === val);
		if (found) fase = found.fase;
	}

	const canSubmit = $derived(judul.trim().length > 0 && mapel.trim().length > 0);

	function fillExample() {
		judul = 'Perkenalan Teman Baru';
		mapel = 'Bahasa Indonesia';
		onKelasChange('II');
		jumlahPertemuan = '2';
		penulis = 'Budi';
		instansi = 'SD Cita Hati';
	}

	async function handleGenerate() {
		if (!canSubmit) return;

		isGenerating = true;
		error = '';
		jobId = null;

		const userInput = {
			jenis: template.jenis,
			templateId: template.templateId,
			judul: judul.trim(),
			mapel: mapel.trim(),
			kelas,
			fase,
			jenjang: getJenjangFromKelas(kelas),
			jumlahPertemuan,
			alokasiPerPertemuan,
			metode,
			modePembelajaran,
			penulis: penulis.trim() || 'Guru Mata Pelajaran',
			instansi: instansi.trim() || 'Sekolah'
		};

		try {
			const model = get(selectedModel);
			const thinkingEffort = get(selectedThinking);

			const res = await fetch('/api/generate-async', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userInput, model, thinkingEffort })
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.error || 'Gagal memulai generate');
			}

			const { jobId: id } = await res.json();
			jobId = id;

			pollInterval = setInterval(async () => {
				try {
					const poll = await fetch(`/api/jobs/${jobId}`).then((r) => r.json());
					if (poll.status === 'completed') {
						clearInterval(pollInterval);
						pollInterval = null;
						isGenerating = false;
						onSuccess(poll.resultId);
					} else if (poll.status === 'failed') {
						clearInterval(pollInterval);
						pollInterval = null;
						isGenerating = false;
						error = poll.error || 'Generate gagal. Silakan coba lagi.';
					}
				} catch {
					// lanjut polling saat error jaringan sementara
				}
			}, 2000);
		} catch (err) {
			isGenerating = false;
			error = err.message || 'Terjadi kesalahan.';
		}
	}

	onDestroy(() => {
		if (pollInterval) clearInterval(pollInterval);
	});
</script>

<!-- Overlay -->
<div
	role="button"
	tabindex="0"
	aria-label="Tutup modal"
	class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
	onclick={() => {
		if (!isGenerating) onClose();
	}}
	onkeydown={(e) => {
		if ((e.key === 'Enter' || e.key === 'Escape') && !isGenerating) onClose();
	}}
></div>

<!-- Modal -->
<div
	class="fixed inset-x-4 top-1/2 z-50 mx-auto max-h-[92vh] max-w-xl -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-2xl"
>
	<!-- Header with gradient accent -->
	<div
		class="relative overflow-hidden rounded-t-2xl bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white"
	>
		<div
			class="absolute top-0 right-0 h-32 w-32 translate-x-1/4 -translate-y-1/3 rounded-full bg-white/10"
		></div>
		<div class="relative flex items-start justify-between gap-3">
			<div>
				<p class="mb-0.5 text-xs font-semibold tracking-wider text-blue-200 uppercase">
					{template.label}
				</p>
				<h2 class="text-lg font-bold">Generate Modul Ajar</h2>
				<p class="mt-1 text-xs text-blue-100">Isi detail modul ajar yang ingin dibuat</p>
			</div>
			<button
				onclick={onClose}
				disabled={isGenerating}
				aria-label="Tutup"
				class="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white/80
       transition-colors hover:bg-white/25 disabled:opacity-30"
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
	</div>

	<!-- Body -->
	<div class="p-6">
		<!-- Section: Informasi Utama -->
		<div class="mb-5">
			<div class="mb-3 flex items-center gap-2">
				<div
					class="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700"
				>
					1
				</div>
				<span class="text-xs font-semibold tracking-wide text-gray-500 uppercase"
					>Informasi Utama</span
				>
				<button
					type="button"
					onclick={fillExample}
					class="ml-auto rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-600 transition-colors hover:bg-blue-100"
				>
					coba contoh modul ajar
				</button>
			</div>
			<div class="space-y-3">
				<div>
					<label for="input-judul" class="mb-1.5 block text-sm font-medium text-gray-700">
						Judul Modul <span class="text-red-400">*</span>
					</label>
					<input
						id="input-judul"
						bind:value={judul}
						placeholder="cth. Operasi Aljabar Linear Kelas X"
						class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors
       focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
					/>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="input-mapel" class="mb-1.5 block text-sm font-medium text-gray-700">
							Mata Pelajaran <span class="text-red-400">*</span>
						</label>
						<input
							id="input-mapel"
							bind:value={mapel}
							placeholder="cth. Matematika"
							class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors
       focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
						/>
					</div>
					<div>
						<label for="input-kelas" class="mb-1.5 block text-sm font-medium text-gray-700">Kelas</label>
						<select
							id="input-kelas"
							value={kelas}
							onchange={(e) => onKelasChange(e.target.value)}
							class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors
       focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
						>
							{#each kelasList as k}
								<option value={k.val}>{k.val} — {k.fase}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
		</div>

		<!-- Divider -->
		<div class="mb-5 border-t border-dashed border-gray-200"></div>

		<!-- Section: Konfigurasi Pembelajaran -->
		<div class="mb-5">
			<div class="mb-3 flex items-center gap-2">
				<div
					class="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700"
				>
					2
				</div>
				<span class="text-xs font-semibold tracking-wide text-gray-500 uppercase"
					>Konfigurasi Pembelajaran</span
				>
			</div>
			<div class="space-y-3">
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="input-pertemuan" class="mb-1.5 block text-sm font-medium text-gray-700">Jumlah Pertemuan</label>
						<select
							id="input-pertemuan"
							bind:value={jumlahPertemuan}
							class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors
       focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
						>
							{#each ['1', '2', '3', '4', '5', '6'] as n}
								<option value={n}>{n} pertemuan</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="input-alokasi" class="mb-1.5 block text-sm font-medium text-gray-700">Alokasi Waktu</label>
						<select
							id="input-alokasi"
							bind:value={alokasiPerPertemuan}
							class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors
       focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
						>
							<option>1x45 menit (1 JP)</option>
							<option>2x45 menit (2 JP)</option>
							<option>3x45 menit (3 JP)</option>
							<option>2x40 menit (2 JP)</option>
							<option>2x35 menit (2 JP)</option>
						</select>
					</div>
				</div>
				<div>
					<label for="input-metode" class="mb-1.5 block text-sm font-medium text-gray-700">Metode Pembelajaran</label>
					<select
						id="input-metode"
						bind:value={metode}
						class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors
       focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
					>
						<option>Problem Based Learning (PBL)</option>
						<option>Project Based Learning (PjBL)</option>
						<option>Discovery Learning</option>
						<option>Inquiry Learning</option>
						<option>Cooperative Learning</option>
						<option>Direct Instruction</option>
					</select>
				</div>
			</div>
		</div>

		<!-- Divider -->
		<div class="mb-5 border-t border-dashed border-gray-200"></div>

		<!-- Section: Identitas Guru (opsional) -->
		<div class="mb-5">
			<div class="mb-3 flex items-center gap-2">
				<div
					class="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500"
				>
					3
				</div>
				<span class="text-xs font-semibold tracking-wide text-gray-500 uppercase"
					>Identitas Guru</span
				>
				<span class="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400"
					>opsional</span
				>
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label for="input-penulis" class="mb-1.5 block text-sm font-medium text-gray-700">Nama Guru</label>
					<input
						id="input-penulis"
						bind:value={penulis}
						placeholder="cth. Budi Santoso, S.Pd"
						class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors
       focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
					/>
				</div>
				<div>
					<label for="input-instansi" class="mb-1.5 block text-sm font-medium text-gray-700">Instansi</label>
					<input
						id="input-instansi"
						bind:value={instansi}
						placeholder="cth. SMAN 1 Surabaya"
						class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors
       focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
					/>
				</div>
			</div>
		</div>

		<!-- Error -->
		{#if error}
			<div
				class="mb-4 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3"
			>
				<svg
					class="mt-0.5 h-4 w-4 shrink-0 text-red-500"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<p class="text-sm text-red-700">{error}</p>
			</div>
		{/if}

		<!-- Generating status -->
		{#if isGenerating}
			<div
				class="mb-4 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3"
			>
				<svg
					class="mt-0.5 h-4 w-4 shrink-0 animate-spin text-blue-500"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				<p class="text-sm text-blue-700">
					Sedang generate dengan AI di latar belakang, anda bisa menutup jendela ini dan akan diberitahu saat modul ajar sudah siap.
				</p>
			</div>
		{/if}
	</div>

	<!-- Footer -->
	<div class="flex gap-3 rounded-b-2xl border-t border-gray-100 bg-gray-50 px-6 py-4">
		<button
			onclick={onClose}
			disabled={isGenerating}
			class="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600
       transition-colors hover:bg-gray-50 disabled:opacity-40"
		>
			Batal
		</button>
		<button
			onclick={handleGenerate}
			disabled={isGenerating || !canSubmit}
			class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-500 to-indigo-600
       py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200 transition-all duration-150
       hover:shadow-md hover:shadow-blue-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
		>
			{#if isGenerating}
				<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				Generating...
			{:else}
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 10V3L4 14h7v7l9-11h-7z"
					/>
				</svg>
				Generate Modul Ajar
			{/if}
		</button>
	</div>
</div>
