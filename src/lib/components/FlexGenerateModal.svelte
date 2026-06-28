<script>

	let { template, onClose, onSuccess } = $props();

	let isGenerating = $state(false);
	let error = $state('');

	// Image template states
	let isImageTemplate = $derived(template?.type === 'image');
	let generatedImageUrl = $state(null);
	let generatedImageBase64 = $state(null);
	let isGeneratingImage = $state(false);
	let imageError = $state('');

	// Build userContext dari inputSchema (jika ada), atau fallback ke field bebas
	let userContext = $state(
		Object.fromEntries(
			(template.inputSchema ?? []).map((f) => [
				f.key,
				f.type === 'multiselect' ? [] : f.type === 'number' ? '' : ''
			])
		)
	);

	// File upload states
	let filePreviews = $state({});      // { fieldKey: dataURL } untuk preview thumbnail
	let fileNames = $state({});         // { fieldKey: 'nama_file.jpg' }
	let fileUploadErrors = $state({});  // { fieldKey: 'pesan error' }
	let fileUploadLoading = $state({}); // { fieldKey: true/false }

	/**
	 * Kompres + resize gambar ke max 1200px, quality 0.82.
	 * Return base64 dataURL "data:image/jpeg;base64,..."
	 */
	async function compressImageToBase64(file) {
		return new Promise((resolve, reject) => {
			// Gunakan FileReader (data: URL) bukan URL.createObjectURL (blob: URL)
			// karena CSP img-src hanya allow 'self' data: , tidak allow blob:
			const reader = new FileReader();
			reader.onload = () => {
				const img = new Image();
				img.onload = () => {
					const MAX = 1200;
					let { width, height } = img;
					if (width > MAX || height > MAX) {
						if (width > height) {
							height = Math.round((height * MAX) / width);
							width = MAX;
						} else {
							width = Math.round((width * MAX) / height);
							height = MAX;
						}
					}
					const canvas = document.createElement('canvas');
					canvas.width = width;
					canvas.height = height;
					canvas.getContext('2d').drawImage(img, 0, 0, width, height);
					resolve(canvas.toDataURL('image/jpeg', 0.82));
				};
				img.onerror = () => reject(new Error('Gagal memuat gambar'));
				img.src = /** @type {string} */ (reader.result);
			};
			reader.onerror = () => reject(new Error('Gagal membaca file'));
			reader.readAsDataURL(file);
		});
	}

	/**
	 * Konversi PDF ke array base64 images via pdf.js CDN (lazy load).
	 * Return array dataURL, 1 per halaman, max maxPages halaman.
	 */
	async function pdfToBase64Images(file, maxPages = 5) {
		if (!window.pdfjsLib) {
			await new Promise((resolve, reject) => {
				const script = document.createElement('script');
				script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
				script.onload = resolve;
				script.onerror = reject;
				document.head.appendChild(script);
			});
			window.pdfjsLib.GlobalWorkerOptions.workerSrc =
				'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
		}

		const arrayBuffer = await file.arrayBuffer();
		const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
		const total = Math.min(pdf.numPages, maxPages);
		const results = [];

		for (let i = 1; i <= total; i++) {
			const page = await pdf.getPage(i);
			const viewport = page.getViewport({ scale: 1.5 });
			const canvas = document.createElement('canvas');
			canvas.width = viewport.width;
			canvas.height = viewport.height;
			await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
			results.push(canvas.toDataURL('image/jpeg', 0.82));
		}
		return results;
	}

	/**
	 * Handle upload file untuk field tipe 'file'.
	 * Support: JPG, PNG, WEBP (1 gambar), PDF (multi-halaman → multi-gambar).
	 */
	async function handleFileUpload(e, fieldKey) {
		const file = e.target.files?.[0];
		if (!file) return;

		fileUploadErrors[fieldKey] = '';
		fileUploadLoading[fieldKey] = true;

		const MAX_MB = 10;
		if (file.size > MAX_MB * 1024 * 1024) {
			fileUploadErrors[fieldKey] = `File terlalu besar (maks ${MAX_MB}MB)`;
			fileUploadLoading[fieldKey] = false;
			return;
		}

		try {
			if (file.type === 'application/pdf') {
				const images = await pdfToBase64Images(file, 5);
				if (images.length === 1) {
					userContext[fieldKey] = images[0];
				} else {
					// Multi-halaman: simpan semua sebagai array
					userContext[fieldKey] = images;
				}
				filePreviews[fieldKey] = images[0]; // tampilkan halaman 1 sebagai preview
				fileNames[fieldKey] = `${file.name} (${images.length} halaman)`;
			} else if (file.type.startsWith('image/')) {
				const dataUrl = await compressImageToBase64(file);
				userContext[fieldKey] = dataUrl;
				filePreviews[fieldKey] = dataUrl;
				fileNames[fieldKey] = file.name;
			} else {
				fileUploadErrors[fieldKey] = 'Format tidak didukung. Gunakan JPG, PNG, atau PDF.';
			}
		} catch (err) {
			fileUploadErrors[fieldKey] = 'Gagal memproses file. Coba lagi.';
			console.error('[FileUpload]', err);
		} finally {
			fileUploadLoading[fieldKey] = false;
			e.target.value = ''; // reset input agar bisa upload file yang sama lagi
		}
	}

	// Auto-compute canSubmit: semua required field harus terisi
	const hasInputSchema = $derived((template.inputSchema ?? []).length > 0);
	const canSubmit = $derived(() => {
		if (isGenerating || isGeneratingImage) return false;
		if (!hasInputSchema) return true; // fallback: no schema = always submittable
		const schema = template.inputSchema ?? [];
		for (const field of schema) {
			if (!field.required) continue;
			const val = userContext[field.key];
			if (field.type === 'file') {
				const isEmpty =
					!val ||
					(typeof val === 'string' && !val.startsWith('data:image/')) ||
					(Array.isArray(val) && val.length === 0);
				if (isEmpty) return false;
				continue;
			}
			const isEmpty = Array.isArray(val)
				? val.length === 0
				: val === '' || val === null || val === undefined || !val.toString().trim();
			if (isEmpty) return false;
		}
		return true;
	});

	async function handleGenerate() {
		const schema = template.inputSchema ?? [];

		// Validasi required fields
		const errors = [];
		for (const field of schema) {
			if (!field.required) continue;
			const val = userContext[field.key];
			if (field.type === 'file') {
				const isEmpty =
					!val ||
					(typeof val === 'string' && !val.startsWith('data:image/')) ||
					(Array.isArray(val) && val.length === 0);
				if (isEmpty) errors.push(field.label);
				continue;
			}
			const isEmpty = Array.isArray(val)
				? val.length === 0
				: val === '' || val === null || val === undefined || !val.toString().trim();
			if (isEmpty) errors.push(field.label);
		}
		if (errors.length > 0) {
			error = `Field berikut wajib diisi: ${errors.join(', ')}`;
			return;
		}

		isGenerating = true;
		error = '';

		// Clean userContext: number → actual number, remove empty, keep file data as-is
		const cleanContext = {};
		for (const field of schema) {
			const val = userContext[field.key];
			if (field.type === 'file') {
				// Keep file data as-is (dataURL string or array of dataURLs)
				if (val) cleanContext[field.key] = val;
			} else if (Array.isArray(val)) {
				if (val.length > 0) cleanContext[field.key] = val;
			} else if (field.type === 'number') {
				const num = Number(val);
				if (!isNaN(num)) cleanContext[field.key] = num;
				else if (field.required) cleanContext[field.key] = 0;
			} else {
				const str = val?.toString().trim();
				if (str) cleanContext[field.key] = str;
			}
		}

		try {

			const res = await fetch('/api/generate-async', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ templateId: template._id, userContext: cleanContext })
			});

			const data = await res.json().catch(() => ({}));

			if (!res.ok) {
				if (res.status === 402) {
					throw new Error(data.error || 'Kuota generate Anda sudah habis.');
				}
				throw new Error(data.error || 'Gagal memulai generate');
			}

			onSuccess?.(data.jobId);
		} catch (err) {
			isGenerating = false;
			error = err.message || 'Terjadi kesalahan.';
		}
	}

	async function handleGenerateImage() {
		const schema = template.inputSchema ?? [];

		// Validasi required fields
		const errors = [];
		for (const field of schema) {
			if (!field.required) continue;
			const val = userContext[field.key];
			if (field.type === 'file') {
				const isEmpty =
					!val ||
					(typeof val === 'string' && !val.startsWith('data:image/')) ||
					(Array.isArray(val) && val.length === 0);
				if (isEmpty) errors.push(field.label);
				continue;
			}
			const isEmpty = Array.isArray(val)
				? val.length === 0
				: val === '' || val === null || val === undefined || !val.toString().trim();
			if (isEmpty) errors.push(field.label);
		}
		if (errors.length > 0) {
			imageError = `Field berikut wajib diisi: ${errors.join(', ')}`;
			return;
		}

		isGeneratingImage = true;
		imageError = '';
		generatedImageUrl = null;
		generatedImageBase64 = null;

		try {
			const res = await fetch('/api/generate-image', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ templateId: template._id, userContext })
			});

			const data = await res.json().catch(() => ({}));

			if (!res.ok) {
				throw new Error(data.error || 'Gagal generate gambar');
			}

			generatedImageUrl = data.imageUrl;
			generatedImageBase64 = data.imageBase64;
		} catch (err) {
			imageError = err.message || 'Terjadi kesalahan.';
		} finally {
			isGeneratingImage = false;
		}
	}

	function downloadImage() {
		if (generatedImageBase64) {
			const a = document.createElement('a');
			a.href = `data:image/png;base64,${generatedImageBase64}`;
			a.download = `worksheet-${Date.now()}.png`;
			a.click();
		} else if (generatedImageUrl) {
			window.open(generatedImageUrl, '_blank');
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
		if (!isGenerating) onClose?.();
	}}
	onkeydown={(e) => {
		if ((e.key === 'Enter' || e.key === 'Escape') && !isGenerating) onClose?.();
	}}
></div>

<!-- Modal -->
<div
	class="fixed inset-x-4 top-1/2 z-50 mx-auto max-h-[92vh] max-w-xl -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-2xl"
>
	<!-- Header -->
	<div
		class="relative overflow-hidden rounded-t-2xl bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white"
	>
		<div
			class="absolute top-0 right-0 h-32 w-32 translate-x-1/4 -translate-y-1/3 rounded-full bg-white/10"
		></div>
		<div class="relative flex items-start justify-between gap-3">
			<div>
				<p class="mb-0.5 text-xs font-semibold tracking-wider text-blue-200 uppercase">
					{template.name || 'Template'}
				</p>
				<h2 class="text-lg font-bold">{isImageTemplate ? 'Generate Gambar' : 'Generate Dokumen'}</h2>
				<p class="mt-1 text-xs text-blue-100">{isImageTemplate ? 'Isi parameter untuk membuat worksheet gambar' : 'Isi detail untuk memulai generate'}</p>
			</div>
			<button
				onclick={onClose}
				disabled={isGenerating}
				aria-label="Tutup"
				class="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white/80 transition-colors hover:bg-white/25 disabled:opacity-30"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	</div>

	<!-- Body -->
	<div class="p-6">
		{#if error}
			<div class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
				{error}
			</div>
		{/if}

		{#if hasInputSchema}
			<div class="space-y-4">
				{#each template.inputSchema as field (field.id)}
					<div>
						<label for="input-{field.key}" class="mb-1.5 block text-sm font-medium text-gray-700">
							{field.label}
							{#if field.required}<span class="text-red-400"> *</span>{/if}
						</label>

						{#if field.type === 'text'}
							<input
								id="input-{field.key}"
								type="text"
								bind:value={userContext[field.key]}
								placeholder={field.placeholder || ''}
								class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
							/>

						{:else if field.type === 'textarea'}
							<textarea
								id="input-{field.key}"
								bind:value={userContext[field.key]}
								placeholder={field.placeholder || ''}
								rows="3"
								class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
							></textarea>

						{:else if field.type === 'number'}
							<input
								id="input-{field.key}"
								type="number"
								bind:value={userContext[field.key]}
								placeholder={field.placeholder || ''}
								class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
							/>

						{:else if field.type === 'select'}
							<select
								id="input-{field.key}"
								bind:value={userContext[field.key]}
								class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
							>
								<option value="">-- Pilih --</option>
								{#each field.options as opt}
									<option value={opt}>{opt}</option>
								{/each}
							</select>

						{:else if field.type === 'multiselect'}
							<div class="space-y-1.5 rounded-xl border border-gray-200 bg-gray-50 p-3">
								{#each field.options as opt}
									<label class="flex items-center gap-2.5 py-1 text-sm text-gray-700 cursor-pointer hover:text-gray-900">
										<input
											type="checkbox"
											checked={userContext[field.key].includes(opt)}
											onchange={(e) => {
												if (e.target.checked) {
													userContext[field.key] = [...userContext[field.key], opt];
												} else {
													userContext[field.key] = userContext[field.key].filter((o) => o !== opt);
												}
											}}
											class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
										/>
										{opt}
									</label>
								{/each}
							</div>

						{:else if field.type === 'file'}
							<div class="rounded-xl border border-gray-100 bg-gray-50 p-4">

								{#if fileUploadLoading[field.key]}
									<!-- Loading state -->
									<div class="flex items-center gap-3 py-4">
										<div class="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
										<span class="text-sm text-gray-500">Memproses file...</span>
									</div>

								{:else if filePreviews[field.key]}
									<!-- Preview state -->
									<div class="flex items-start gap-3">
										<img
											src={filePreviews[field.key]}
											alt="Preview"
											class="h-20 w-16 shrink-0 rounded-lg border border-gray-200 object-cover"
										/>
										<div class="flex-1 min-w-0">
											<p class="truncate text-sm font-medium text-gray-700">{fileNames[field.key]}</p>
											<p class="mt-0.5 text-xs text-emerald-600">✓ File siap diproses AI</p>
											<button
												type="button"
												onclick={() => {
													userContext[field.key] = '';
													filePreviews[field.key] = null;
													fileNames[field.key] = '';
													fileUploadErrors[field.key] = '';
												}}
												class="mt-2 text-xs text-red-500 hover:text-red-700 hover:underline"
											>
												Hapus & upload ulang
											</button>
										</div>
									</div>

								{:else}
									<!-- Upload state -->
									<label class="flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border-2 border-dashed border-gray-300 p-5 transition hover:border-blue-400 hover:bg-blue-50">
										<svg class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
												d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
										</svg>
										<div class="text-center">
											<p class="text-sm font-medium text-gray-600">{field.placeholder || 'Klik untuk upload file'}</p>
											<p class="mt-0.5 text-xs text-gray-400">JPG, PNG, PDF · Maks 10MB · PDF max 5 halaman</p>
										</div>
										<input
											type="file"
											accept="image/jpeg,image/png,image/webp,application/pdf"
											class="hidden"
											onchange={(e) => handleFileUpload(e, field.key)}
										/>
									</label>
								{/if}

								{#if fileUploadErrors[field.key]}
									<p class="mt-2 text-xs text-red-600">{fileUploadErrors[field.key]}</p>
								{/if}

							</div>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
				Template ini belum memiliki form input. Silakan edit template untuk menambahkan field input.
			</div>
		{/if}

		<!-- Image result preview -->
		{#if isImageTemplate && (generatedImageUrl || generatedImageBase64)}
			<div class="mt-5 rounded-xl border border-purple-100 bg-purple-50 p-4">
				<p class="mb-3 text-sm font-semibold text-purple-700">✓ Gambar berhasil dibuat!</p>
				<div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
					<img
						src={generatedImageBase64 ? `data:image/png;base64,${generatedImageBase64}` : generatedImageUrl}
						alt="Generated worksheet"
						class="w-full object-contain"
					/>
				</div>
				<button
					onclick={downloadImage}
					class="mt-3 w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
				>
					Download Gambar
				</button>
			</div>
		{/if}

		{#if imageError}
			<div class="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
				{imageError}
			</div>
		{/if}

		<!-- Action -->
		<div class="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
			<button
				onclick={onClose}
				disabled={isGenerating || isGeneratingImage}
				class="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
			>
				Batal
			</button>
			<button
				onclick={isImageTemplate ? handleGenerateImage : handleGenerate}
				disabled={!canSubmit() || isGenerating || isGeneratingImage}
				class="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if isGeneratingImage}
					<span class="flex items-center gap-2">
						<span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
						Generating gambar...
					</span>
				{:else if isGenerating}
					<span class="flex items-center gap-2">
						<span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
						Memproses...
					</span>
				{:else if isImageTemplate}
					Generate Gambar
				{:else}
					Generate
				{/if}
			</button>
		</div>
	</div>
</div>
