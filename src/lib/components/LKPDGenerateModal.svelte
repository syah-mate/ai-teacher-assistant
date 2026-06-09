<script>
	import { get } from 'svelte/store';
	import { selectedModel, selectedThinking } from '$lib/stores/modelStore.js';

	let { template, onClose, onSuccess } = $props();

	let isGenerating = $state(false);
	let error = $state('');

	// Form fields
	let mapel = $state('');
	let kelas = $state('X');
	let fase = $state('Fase E');
	let topik = $state('');
	let tujuanPembelajaran = $state('');
	let jenisKegiatan = $state([]);
	let polaBelajar = $state('berkelompok');
	let alokasiWaktu = $state('2x40 menit');
	let namaGuru = $state('');
	let namaSekolah = $state('');

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

	const jenisKegiatanOptions = [
		{ value: 'eksperimen', label: 'Eksperimen' },
		{ value: 'latihan_soal', label: 'Latihan Soal' },
		{ value: 'project_karya', label: 'Project Karya' },
		{ value: 'observasi', label: 'Observasi' }
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

	function toggleJenisKegiatan(val) {
		if (jenisKegiatan.includes(val)) {
			jenisKegiatan = jenisKegiatan.filter(v => v !== val);
		} else {
			jenisKegiatan = [...jenisKegiatan, val];
		}
	}

	const canSubmit = $derived(
		mapel.trim().length > 0 &&
		topik.trim().length > 0 &&
		jenisKegiatan.length > 0
	);

	function fillExample() {
		mapel = 'IPA';
		onKelasChange('VII');
		topik = 'Fotosintesis pada Tumbuhan';
		jenisKegiatan = ['eksperimen'];
		polaBelajar = 'berkelompok';
		namaGuru = 'Budi Santoso, S.Pd';
		namaSekolah = 'SMP Negeri 1 Surabaya';
	}

	async function handleGenerate() {
		if (!canSubmit) return;

		isGenerating = true;
		error = '';

		const userInput = {
			jenis: 'lkpd',
			templateId: template.templateId,
			judul: topik.trim(),
			mapel: mapel.trim(),
			kelas,
			fase,
			jenjang: getJenjangFromKelas(kelas),
			jenisKegiatan,
			polaBelajar,
			alokasiWaktu,
			tujuanPembelajaran: tujuanPembelajaran.trim() || '',
			penulis: namaGuru.trim() || 'Guru Mata Pelajaran',
			instansi: namaSekolah.trim() || 'Sekolah'
		};

		if (template.templateId?.startsWith('custom-') && template.sections?.length > 0) {
			userInput.customSections = template.sections;
		}

		try {
			const model = get(selectedModel);
			const thinkingEffort = get(selectedThinking);

			const res = await fetch('/api/generate-async', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userInput, model, thinkingEffort })
			});

			const data = await res.json().catch(() => ({}));

			if (!res.ok) {
				if (res.status === 402) {
					throw new Error(data.error || 'Kuota generate Anda sudah habis.');
				}
				throw new Error(data.error || 'Gagal memulai generate');
			}

			onSuccess(data.jobId);
		} catch (err) {
			isGenerating = false;
			error = err.message || 'Terjadi kesalahan.';
		}
	}
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
		class="relative overflow-hidden rounded-t-2xl bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white"
	>
		<div
			class="absolute top-0 right-0 h-32 w-32 translate-x-1/4 -translate-y-1/3 rounded-full bg-white/10"
		></div>
		<div class="relative flex items-start justify-between gap-3">
			<div>
				<p class="mb-0.5 text-xs font-semibold tracking-wider text-emerald-200 uppercase">
					{template.label || template.name || 'Template'}
				</p>
				<h2 class="text-lg font-bold">Generate LKPD</h2>
				<p class="mt-1 text-xs text-emerald-100">Isi detail LKPD yang ingin dibuat</p>
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
					class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700"
				>
					1
				</div>
				<span class="text-xs font-semibold tracking-wide text-gray-500 uppercase"
					>Informasi Utama</span
				>
				<button
					type="button"
					onclick={fillExample}
					class="ml-auto rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 transition-colors hover:bg-emerald-100"
				>
					coba contoh LKPD
				</button>
			</div>
			<div class="space-y-3">
				<div>
					<label for="input-mapel" class="mb-1.5 block text-sm font-medium text-gray-700">
						Mata Pelajaran <span class="text-red-400">*</span>
					</label>
					<input
						id="input-mapel"
						bind:value={mapel}
						placeholder="cth. IPA, Matematika, B. Indonesia..."
						class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors
       focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:outline-none"
					/>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="input-topik" class="mb-1.5 block text-sm font-medium text-gray-700">
							Topik / Materi <span class="text-red-400">*</span>
						</label>
						<input
							id="input-topik"
							bind:value={topik}
							placeholder="cth. Fotosintesis, Sistem Persamaan Linear..."
							class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors
       focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:outline-none"
						/>
					</div>
					<div>
						<label for="input-kelas" class="mb-1.5 block text-sm font-medium text-gray-700">Kelas</label>
						<select
							id="input-kelas"
							value={kelas}
							onchange={(e) => onKelasChange(e.target.value)}
							class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors
       focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:outline-none"
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

		<!-- Section: Konfigurasi Kegiatan -->
		<div class="mb-5">
			<div class="mb-3 flex items-center gap-2">
				<div
					class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700"
				>
					2
				</div>
				<span class="text-xs font-semibold tracking-wide text-gray-500 uppercase"
					>Konfigurasi Kegiatan</span
				>
			</div>
			<div class="space-y-3">
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">
						Jenis Kegiatan <span class="text-red-400">*</span>
					</label>
					<div class="grid grid-cols-2 gap-2">
						{#each jenisKegiatanOptions as opt}
							<label
								class="flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm transition-colors
								{jenisKegiatan.includes(opt.value)
									? 'border-emerald-300 bg-emerald-50 text-emerald-800'
									: 'border-gray-200 bg-gray-50 text-gray-600 hover:border-emerald-200'}"
							>
								<input
									type="checkbox"
									class="sr-only"
									checked={jenisKegiatan.includes(opt.value)}
									onchange={() => toggleJenisKegiatan(opt.value)}
								/>
								<div
									class="flex h-4 w-4 items-center justify-center rounded border transition-colors
									{jenisKegiatan.includes(opt.value)
										? 'border-emerald-500 bg-emerald-500'
										: 'border-gray-300 bg-white'}"
								>
									{#if jenisKegiatan.includes(opt.value)}
										<svg class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
										</svg>
									{/if}
								</div>
								<span>{opt.label}</span>
							</label>
						{/each}
					</div>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="input-pola" class="mb-1.5 block text-sm font-medium text-gray-700">Pola Belajar</label>
						<select
							id="input-pola"
							bind:value={polaBelajar}
							class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors
       focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:outline-none"
						>
							<option value="berkelompok">Berkelompok</option>
							<option value="individu">Individu</option>
						</select>
					</div>
					<div>
						<label for="input-alokasi" class="mb-1.5 block text-sm font-medium text-gray-700">Alokasi Waktu</label>
						<select
							id="input-alokasi"
							bind:value={alokasiWaktu}
							class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors
       focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:outline-none"
						>
							<option>1x40 menit</option>
							<option>2x40 menit</option>
							<option>1x45 menit</option>
							<option>2x45 menit</option>
						</select>
					</div>
				</div>
			</div>
		</div>

		<!-- Divider -->
		<div class="mb-5 border-t border-dashed border-gray-200"></div>

		<!-- Section: Detail Tambahan -->
		<div class="mb-5">
			<div class="mb-3 flex items-center gap-2">
				<div
					class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700"
				>
					3
				</div>
				<span class="text-xs font-semibold tracking-wide text-gray-500 uppercase"
					>Detail Tambahan</span
				>
				<span class="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400"
					>opsional</span
				>
			</div>
			<div class="space-y-3">
				<div>
					<label for="input-tujuan" class="mb-1.5 block text-sm font-medium text-gray-700">
						Tujuan Pembelajaran
					</label>
					<textarea
						id="input-tujuan"
						bind:value={tujuanPembelajaran}
						rows="2"
						placeholder="cth. Fokus pada kemampuan menganalisis data eksperimen..."
						class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors
       focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:outline-none"
					></textarea>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="input-guru" class="mb-1.5 block text-sm font-medium text-gray-700">Nama Guru</label>
						<input
							id="input-guru"
							bind:value={namaGuru}
							placeholder="cth. Budi Santoso, S.Pd"
							class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors
       focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:outline-none"
						/>
					</div>
					<div>
						<label for="input-sekolah" class="mb-1.5 block text-sm font-medium text-gray-700">Nama Sekolah</label>
						<input
							id="input-sekolah"
							bind:value={namaSekolah}
							placeholder="cth. SMP Negeri 1 Surabaya"
							class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors
       focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:outline-none"
						/>
					</div>
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
				class="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3"
			>
				<svg
					class="mt-0.5 h-4 w-4 shrink-0 animate-spin text-emerald-500"
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
				<p class="text-sm text-emerald-700">
					Memulai generate... mohon tunggu sebentar.
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
			class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600
       py-2.5 text-sm font-bold text-white shadow-sm shadow-emerald-200 transition-all duration-150
       hover:shadow-md hover:shadow-emerald-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
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
				Generate LKPD
			{/if}
		</button>
	</div>
</div>
