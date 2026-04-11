<script>
	let uploadedFiles = $state([]);
	let isAnalyzing = $state(false);
	let results = $state(null);
	let error = $state('');
	let dragActive = $state(false);

	// Configuration
	let config = $state({
		mataPelajaran: '',
		judulUjian: '',
		totalSoal: '',
		kunciJawaban: ''
	});

	const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
	const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

	function handleFileInput(e) {
		const files = Array.from(e.target.files);
		addFiles(files);
	}

	function handleDragOver(e) {
		e.preventDefault();
		dragActive = true;
	}

	function handleDragLeave(e) {
		e.preventDefault();
		dragActive = false;
	}

	function handleDrop(e) {
		e.preventDefault();
		dragActive = false;
		const files = Array.from(e.dataTransfer.files);
		addFiles(files);
	}

	function addFiles(files) {
		error = '';
		const validFiles = files.filter((file) => {
			if (!ACCEPTED_TYPES.includes(file.type)) {
				error = `File ${file.name} tidak didukung. Gunakan JPG, PNG, atau PDF.`;
				return false;
			}
			if (file.size > MAX_FILE_SIZE) {
				error = `File ${file.name} terlalu besar. Maksimal 10MB.`;
				return false;
			}
			return true;
		});

		uploadedFiles = [...uploadedFiles, ...validFiles];
	}

	function removeFile(index) {
		uploadedFiles = uploadedFiles.filter((_, i) => i !== index);
	}

	function formatFileSize(bytes) {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	async function handleAnalyze() {
		if (uploadedFiles.length === 0) {
			error = 'Silakan upload minimal 1 file hasil ujian siswa';
			return;
		}

		if (!config.mataPelajaran || !config.judulUjian) {
			error = 'Silakan isi mata pelajaran dan judul ujian';
			return;
		}

		isAnalyzing = true;
		error = '';
		results = null;

		try {
			// Convert files to base64
			const filePromises = uploadedFiles.map(async (file) => {
				const base64 = await fileToBase64(file);
				return {
					name: file.name,
					type: file.type,
					data: base64
				};
			});

			const filesData = await Promise.all(filePromises);

			const response = await fetch('/api/koreksi-ujian', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					files: filesData,
					config: config
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Terjadi kesalahan saat menganalisis');
			}

			const data = await response.json();
			results = data;

			// Dispatch event to update rate limit indicator
			window.dispatchEvent(new Event('generate-success'));
		} catch (err) {
			error = err.message || 'Terjadi kesalahan saat menganalisis ujian';
			console.error('Analysis error:', err);
		} finally {
			isAnalyzing = false;
		}
	}

	function fileToBase64(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				const base64 = reader.result.split(',')[1];
				resolve(base64);
			};
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}

	function handleCopyResult() {
		if (!results?.analysis) return;
		navigator.clipboard.writeText(results.analysis);
		// You can add a toast notification here
	}

	function handleReset() {
		uploadedFiles = [];
		results = null;
		error = '';
		config = {
			mataPelajaran: '',
			judulUjian: '',
			totalSoal: '',
			kunciJawaban: ''
		};
	}
</script>

<div class="min-h-screen bg-linear-to-br from-purple-50 via-white to-pink-50 p-6">
	<div class="mx-auto max-w-6xl">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center gap-3 mb-2">
				<div class="rounded-xl bg-purple-600 p-3">
					<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
				</div>
				<div>
					<h1 class="text-2xl font-bold text-gray-900">Koreksi Ujian dengan AI</h1>
					<p class="text-sm text-gray-600">
						Upload foto atau dokumen hasil ujian siswa untuk dianalisis dan dinilai
					</p>
				</div>
			</div>
		</div>

		<div class="grid gap-6 lg:grid-cols-2">
			<!-- Left Panel: Upload & Config -->
			<div class="space-y-6">
				<!-- Configuration Form -->
				<div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-lg font-semibold text-gray-900">Informasi Ujian</h2>
					<div class="space-y-4">
						<div>
						<label for="mataPelajaran" class="mb-1 block text-sm font-medium text-gray-700">
							Mata Pelajaran <span class="text-red-500">*</span>
						</label>
						<input
							id="mataPelajaran"
								type="text"
								bind:value={config.mataPelajaran}
								placeholder="Contoh: Matematika"
								class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
							/>
						</div>
						<div>
						<label for="judulUjian" class="mb-1 block text-sm font-medium text-gray-700">
							Judul Ujian <span class="text-red-500">*</span>
						</label>
						<input
							id="judulUjian"
								type="text"
								bind:value={config.judulUjian}
								placeholder="Contoh: Ulangan Harian Bab 3"
								class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
							/>
						</div>
						<div>
						<label for="totalSoal" class="mb-1 block text-sm font-medium text-gray-700">
							Total Soal (Opsional)
						</label>
						<input
							id="totalSoal"
								type="number"
								bind:value={config.totalSoal}
								placeholder="Contoh: 20"
								class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
							/>
						</div>
						<div>
						<label for="kunciJawaban" class="mb-1 block text-sm font-medium text-gray-700">
							Kunci Jawaban (Opsional)
						</label>
						<textarea
							id="kunciJawaban"
								bind:value={config.kunciJawaban}
								placeholder="Contoh: 1.A 2.B 3.C atau berikan detail kunci jawaban"
								rows="3"
								class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
							></textarea>
							<p class="mt-1 text-xs text-gray-500">
								Memberikan kunci jawaban akan meningkatkan akurasi penilaian
							</p>
						</div>
					</div>
				</div>

				<!-- File Upload -->
				<div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-lg font-semibold text-gray-900">Upload Hasil Ujian</h2>

					<!-- Drag & Drop Area -->
					<div
						role="button"
						tabindex="0"
						class="relative rounded-xl border-2 border-dashed {dragActive
							? 'border-purple-500 bg-purple-50'
							: 'border-gray-300 bg-gray-50'} p-8 text-center transition-colors"
						ondragover={handleDragOver}
						ondragleave={handleDragLeave}
						ondrop={handleDrop}
					>
						<input
							type="file"
							id="fileInput"
							multiple
							accept=".jpg,.jpeg,.png,.pdf"
							onchange={handleFileInput}
							class="hidden"
						/>
						<label
							for="fileInput"
							class="flex cursor-pointer flex-col items-center justify-center gap-2"
						>
							<svg
								class="h-12 w-12 text-gray-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
								/>
							</svg>
							<p class="text-sm font-medium text-gray-700">
								Klik untuk upload atau drag & drop
							</p>
							<p class="text-xs text-gray-500">JPG, PNG atau PDF, maksimal 10MB per file</p>
						</label>
					</div>

					<!-- Uploaded Files List -->
					{#if uploadedFiles.length > 0}
						<div class="mt-4 space-y-2">
							<p class="text-sm font-medium text-gray-700">
								File yang diupload ({uploadedFiles.length})
							</p>
							{#each uploadedFiles as file, index}
								<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
									<div class="flex items-center gap-3">
										<div class="rounded-lg bg-purple-100 p-2">
											{#if file.type.startsWith('image/')}
												<svg class="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
													/>
												</svg>
											{:else}
												<svg class="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
													/>
												</svg>
											{/if}
										</div>
										<div>
											<p class="text-sm font-medium text-gray-900">{file.name}</p>
											<p class="text-xs text-gray-500">{formatFileSize(file.size)}</p>
										</div>
									</div>
									<button
										onclick={() => removeFile(index)}
										class="rounded-lg p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
										aria-label="Remove file"
									>
										<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								</div>
							{/each}
						</div>
					{/if}

					<!-- Error Message -->
					{#if error}
						<div class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
							<p class="text-sm text-red-600">{error}</p>
						</div>
					{/if}

					<!-- Action Buttons -->
					<div class="mt-6 flex gap-3">
						<button
							onclick={handleAnalyze}
							disabled={isAnalyzing || uploadedFiles.length === 0}
							class="flex-1 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-300"
						>
							{#if isAnalyzing}
								<span class="flex items-center justify-center gap-2">
									<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
										></circle>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									Menganalisis...
								</span>
							{:else}
								Analisis dengan AI
							{/if}
						</button>
						{#if uploadedFiles.length > 0}
							<button
								onclick={handleReset}
								disabled={isAnalyzing}
								class="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
							>
								Reset
							</button>
						{/if}
					</div>
				</div>
			</div>

			<!-- Right Panel: Results -->
			<div>
				<div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-lg font-semibold text-gray-900">Hasil Analisis</h2>
						{#if results}
							<button
								onclick={handleCopyResult}
								class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
							>
								Copy
							</button>
						{/if}
					</div>

					{#if isAnalyzing}
						<div class="flex flex-col items-center justify-center py-16">
							<svg class="h-16 w-16 animate-spin text-purple-600" fill="none" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							<p class="mt-4 text-sm font-medium text-gray-700">
								AI sedang menganalisis hasil ujian...
							</p>
							<p class="mt-1 text-xs text-gray-500">Ini mungkin memakan waktu beberapa saat</p>
						</div>
					{:else if results}
						<div class="space-y-4">
							<!-- Score Summary -->
							{#if results.score}
								<div class="rounded-xl bg-linear-to-br from-purple-500 to-pink-500 p-6 text-white">
									<p class="text-sm font-medium opacity-90">Nilai Akhir</p>
									<p class="mt-2 text-4xl font-bold">{results.score}</p>
									{#if results.grade}
										<p class="mt-1 text-sm opacity-90">Grade: {results.grade}</p>
									{/if}
								</div>
							{/if}

							<!-- Analysis Text -->
							<div class="prose prose-sm max-w-none rounded-xl bg-gray-50 p-4">
								<div class="whitespace-pre-wrap text-sm text-gray-700">{results.analysis}</div>
							</div>
						</div>
					{:else}
						<div class="flex flex-col items-center justify-center py-16 text-center">
							<div class="rounded-full bg-purple-100 p-4">
								<svg
									class="h-12 w-12 text-purple-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/>
								</svg>
							</div>
							<p class="mt-4 text-sm font-medium text-gray-700">
								Hasil analisis akan muncul di sini
							</p>
							<p class="mt-1 text-xs text-gray-500">
								Upload file dan klik "Analisis dengan AI" untuk memulai
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
