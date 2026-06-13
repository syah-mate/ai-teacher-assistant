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
	let fileMateri = $state(null);
	let fileName = $state('');
	let jenisSoal = $state('Pilihan Ganda');
	let jumlahSoal = $state(10);
	let jumlahPg = $state(5);
	let jumlahEsai = $state(5);
	let tingkatOptions = $state({
		C1: false, C2: true, C3: true, C4: false, C5: false, C6: false
	});
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

	const tingkatBloom = [
		{ key: 'C1', label: 'C1 – Mengingat', desc: 'Mengenali & mengingat fakta' },
		{ key: 'C2', label: 'C2 – Memahami', desc: 'Menjelaskan & menafsirkan' },
		{ key: 'C3', label: 'C3 – Mengaplikasikan', desc: 'Menerapkan konsep' },
		{ key: 'C4', label: 'C4 – Menganalisis', desc: 'Mengurai & membedakan' },
		{ key: 'C5', label: 'C5 – Mengevaluasi', desc: 'Menilai & mengkritisi' },
		{ key: 'C6', label: 'C6 – Mencipta', desc: 'Menyusun & mengkreasi' }
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

	function toggleTingkat(key) {
		tingkatOptions[key] = !tingkatOptions[key];
		tingkatOptions = { ...tingkatOptions };
	}

	function getSelectedTingkat() {
		return Object.entries(tingkatOptions)
			.filter(([, v]) => v)
			.map(([k]) => k);
	}

	const canSubmit = $derived(
		mapel.trim().length > 0 &&
		topik.trim().length > 0 &&
		getSelectedTingkat().length > 0
	);

	function handleFileChange(e) {
		const file = e.target.files?.[0];
		if (file) {
			fileMateri = file;
			fileName = file.name;
		}
	}

	function clearFile() {
		fileMateri = null;
		fileName = '';
	}

	function fillExample() {
		mapel = 'Biologi';
		onKelasChange('X');
		topik = 'Sistem Pencernaan pada Manusia';
		jenisSoal = 'Campuran';
		jumlahPg = 10;
		jumlahEsai = 5;
		tingkatOptions = { C1: false, C2: true, C3: true, C4: true, C5: false, C6: false };
		namaGuru = 'Anisa Rahmawati, S.Pd';
		namaSekolah = 'SMA Negeri 3 Bandung';
	}

	async function handleGenerate() {
		if (!canSubmit) return;

		isGenerating = true;
		error = '';

		const selectedTingkat = getSelectedTingkat();
		const levelBloom = selectedTingkat.join(', ');

		// Hitung jumlah soal
		let finalJumlahSoal = jumlahSoal;
		let finalJumlahPg = null;
		let finalJumlahEsai = null;
		let finalJenisSoal = jenisSoal.toLowerCase();

		if (jenisSoal === 'Campuran') {
			finalJumlahPg = jumlahPg;
			finalJumlahEsai = jumlahEsai;
			finalJumlahSoal = jumlahPg + jumlahEsai;
		}

		// Jika ada file upload, baca sebagai base64
		let fileBase64 = null;
		let fileMimeType = null;
		if (fileMateri && fileMateri.size > 0) {
			try {
				const buffer = await fileMateri.arrayBuffer();
				const bytes = new Uint8Array(buffer);
				let binary = '';
				for (let i = 0; i < bytes.byteLength; i++) {
					binary += String.fromCharCode(bytes[i]);
				}
				fileBase64 = btoa(binary);
				fileMimeType = fileMateri.type || 'application/octet-stream';
			} catch (err) {
				error = 'Gagal membaca file: ' + err.message;
				isGenerating = false;
				return;
			}
		}

		const userInput = {
			jenis: 'soal',
			templateId: template.templateId,
			judul: topik.trim(),
			mapel: mapel.trim(),
			kelas,
			fase,
			jenjang: getJenjangFromKelas(kelas),
			jenisSoal: finalJenisSoal,
			jumlahSoal: finalJumlahSoal,
			jumlahPg: finalJumlahPg,
			jumlahEsai: finalJumlahEsai,
			tingkat: selectedTingkat.length > 1 ? 'campuran' : selectedTingkat[0] || 'C3',
			levelBloom,
			selectedTingkat,
			penulis: namaGuru.trim() || 'Guru Mata Pelajaran',
			instansi: namaSekolah.trim() || 'Sekolah',
			// File upload
			materiFile: fileBase64 ? { data: fileBase64, mimeType: fileMimeType, name: fileName } : null
		};

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
	<!-- Header: Blue gradient untuk soal -->
	<div
		class="relative overflow-hidden rounded-t-2xl bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white"
	>
		<div
			class="absolute top-0 right-0 h-32 w-32 translate-x-1/4 -translate-y-1/3 rounded-full bg-white/10"
		></div>
		<div class="relative flex items-start justify-between gap-3">
			<div>
				<p class="mb-0.5 text-xs font-semibold tracking-wider text-blue-200 uppercase">
					{template.label || template.name || 'Template'}
				</p>
				<h2 class="text-lg font-bold">Generate Soal</h2>
				<p class="mt-1 text-xs text-blue-100">Isi detail soal yang ingin dibuat</p>
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
					coba contoh soal
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
						placeholder="cth. Biologi, Matematika, Sejarah..."
						class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors
       focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
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
							placeholder="cth. Sistem Pencernaan, Trigonometri..."
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

				<!-- File Upload Materi -->
				<div>
					<label class="mb-1.5 block text-sm font-medium text-gray-700">
						Upload File Materi <span class="text-xs text-gray-400">(opsional — PDF, DOCX, TXT)</span>
					</label>
					{#if fileName}
						<div class="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm">
							<svg class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
							<span class="flex-1 truncate text-blue-700">{fileName}</span>
							<button
								type="button"
								onclick={clearFile}
								class="text-blue-400 hover:text-red-500 transition-colors"
							>
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					{:else}
						<label
							class="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3.5 py-3 text-sm text-gray-500 transition-colors hover:border-blue-300 hover:bg-blue-50"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
							</svg>
							<span>Klik untuk upload file materi (PDF, DOCX, TXT)</span>
							<input type="file" class="hidden" accept=".pdf,.docx,.txt,.doc" onchange={handleFileChange} />
						</label>
					{/if}
					<p class="mt-1 text-[11px] text-gray-400">
						AI akan membaca file materi Anda sebagai referensi pembuatan soal.
					</p>
				</div>
			</div>
		</div>

		<!-- Divider -->
		<div class="mb-5 border-t border-dashed border-gray-200"></div>

		<!-- Section: Konfigurasi Soal -->
		<div class="mb-5">
			<div class="mb-3 flex items-center gap-2">
				<div
					class="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700"
				>
					2
				</div>
				<span class="text-xs font-semibold tracking-wide text-gray-500 uppercase"
					>Konfigurasi Soal</span
				>
			</div>
			<div class="space-y-3">
				<div>
					<label for="input-jenis" class="mb-1.5 block text-sm font-medium text-gray-700">
						Jenis Soal <span class="text-red-400">*</span>
					</label>
					<select
						id="input-jenis"
						bind:value={jenisSoal}
						class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors
       focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
					>
						<option>Pilihan Ganda</option>
						<option>Esai</option>
						<option>Campuran</option>
					</select>
				</div>

				{#if jenisSoal === 'Campuran'}
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="mb-1.5 block text-sm font-medium text-gray-700">
								Jumlah Soal PG <span class="text-red-400">*</span>
							</label>
							<div class="flex items-center gap-3">
								<input
									type="range"
									bind:value={jumlahPg}
									min="5"
									max="25"
									step="5"
									class="flex-1 accent-blue-600"
								/>
								<span class="w-10 text-center text-sm font-bold text-blue-600">{jumlahPg}</span>
							</div>
						</div>
						<div>
							<label class="mb-1.5 block text-sm font-medium text-gray-700">
								Jumlah Soal Esai <span class="text-red-400">*</span>
							</label>
							<div class="flex items-center gap-3">
								<input
									type="range"
									bind:value={jumlahEsai}
									min="2"
									max="15"
									step="1"
									class="flex-1 accent-indigo-600"
								/>
								<span class="w-10 text-center text-sm font-bold text-indigo-600">{jumlahEsai}</span>
							</div>
						</div>
					</div>
					<p class="text-xs text-gray-400">
						Total: <strong>{jumlahPg + jumlahEsai}</strong> soal ({jumlahPg} PG + {jumlahEsai} Esai)
					</p>
				{:else}
					<div>
						<label class="mb-1.5 block text-sm font-medium text-gray-700">
							Jumlah Soal ({jumlahSoal})
						</label>
						<div class="flex items-center gap-3">
							<input
								type="range"
								bind:value={jumlahSoal}
								min="5"
								max="30"
								step="5"
								class="flex-1 accent-blue-600"
							/>
							<span class="w-10 text-center text-sm font-bold text-blue-600">{jumlahSoal}</span>
						</div>
						<div class="mt-1 flex justify-between text-[11px] text-gray-400">
							<span>5</span><span>15</span><span>25</span><span>30</span>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Divider -->
		<div class="mb-5 border-t border-dashed border-gray-200"></div>

		<!-- Section: Level Kognitif -->
		<div class="mb-5">
			<div class="mb-3 flex items-center gap-2">
				<div
					class="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700"
				>
					3
				</div>
				<span class="text-xs font-semibold tracking-wide text-gray-500 uppercase"
					>Level Kognitif (Bloom)</span
				>
				<span class="text-[10px] text-red-400">* pilih minimal 1</span>
			</div>
			<div class="grid grid-cols-2 gap-2">
				{#each tingkatBloom as t}
					<label
						class="flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2.5 transition-colors
						{tingkatOptions[t.key]
							? 'border-blue-300 bg-blue-50'
							: 'border-gray-200 bg-gray-50 hover:border-blue-200'}"
					>
						<input
							type="checkbox"
							class="sr-only"
							checked={tingkatOptions[t.key]}
							onchange={() => toggleTingkat(t.key)}
						/>
						<div
							class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors
							{tingkatOptions[t.key]
								? 'border-blue-500 bg-blue-500'
								: 'border-gray-300 bg-white'}"
						>
							{#if tingkatOptions[t.key]}
								<svg class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
								</svg>
							{/if}
						</div>
						<div>
							<span class="text-sm font-medium {tingkatOptions[t.key] ? 'text-blue-800' : 'text-gray-700'}">
								{t.label}
							</span>
							<p class="text-[11px] text-gray-400">{t.desc}</p>
						</div>
					</label>
				{/each}
			</div>
		</div>

		<!-- Divider -->
		<div class="mb-5 border-t border-dashed border-gray-200"></div>

		<!-- Section: Detail Tambahan -->
		<div class="mb-5">
			<div class="mb-3 flex items-center gap-2">
				<div
					class="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700"
				>
					4
				</div>
				<span class="text-xs font-semibold tracking-wide text-gray-500 uppercase"
					>Detail Tambahan</span
				>
				<span class="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400"
					>opsional</span
				>
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label for="input-guru" class="mb-1.5 block text-sm font-medium text-gray-700">Nama Guru</label>
					<input
						id="input-guru"
						bind:value={namaGuru}
						placeholder="cth. Anisa Rahmawati, S.Pd"
						class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors
       focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
					/>
				</div>
				<div>
					<label for="input-sekolah" class="mb-1.5 block text-sm font-medium text-gray-700">Nama Sekolah</label>
					<input
						id="input-sekolah"
						bind:value={namaSekolah}
						placeholder="cth. SMA Negeri 3 Bandung"
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
			class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600
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
				Generate Soal
			{/if}
		</button>
	</div>
</div>
