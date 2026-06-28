<script>
	let { data } = $props();
	const item = $derived(data.item);

	let isPrinting = $state(false);
	let isSaving = $state(false);
	let saveResult = $state(/** @type {'saved'|'error'|null} */ (null));

	// Use editedHtml from DB if available, otherwise fall back to generated HTML
	const htmlOutput = $derived(
		item.editedHtml || item.result?.htmlOutput || '<p><em>Dokumen tidak tersedia.</em></p>'
	);

	// Parse sections for editing
	let sections = $state([]);
	$effect(() => {
		sections = parseSections(htmlOutput);
	});

	let isEditing = $state(false);

	function parseSections(html) {
		const parts = html.split(/(?=<h[123](?:\s[^>]*)?>)/i);
		return parts
			.filter((p) => p.trim())
			.map((part, i) => {
				const headingMatch = part.match(/^<h([123])(?:[^>]*)?>(.+?)<\/h[123]>/i);
				const headingText = headingMatch
					? headingMatch[2].replace(/<[^>]+>/g, '').trim()
					: `Bagian ${i + 1}`;
				return { id: i, html: part, backup: part, editing: false, headingText };
			});
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

	function downloadPdf() {
		isPrinting = true;
		setTimeout(() => {
			window.print();
			isPrinting = false;
		}, 100);
	}

	function toggleEdit() {
		isEditing = !isEditing;
		if (!isEditing) {
			sections = sections.map((s) => ({ ...s, editing: false, html: s.backup }));
		}
	}

	function startEdit(i) {
		sections[i].backup = sections[i].html;
		sections[i].editing = true;
	}

	async function saveSection(i) {
		sections[i].editing = false;
		isSaving = true;
		saveResult = null;
		try {
			const fullHtml = sections.map((s) => s.html).join('');
			const resp = await fetch(`/api/history/${item._id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ editedHtml: fullHtml })
			});
			if (!resp.ok) throw new Error('Gagal menyimpan');
			saveResult = 'saved';
			setTimeout(() => (saveResult = null), 3000);
		} catch {
			saveResult = 'error';
		} finally {
			isSaving = false;
		}
	}

	function cancelEdit(i) {
		sections[i].html = sections[i].backup;
		sections[i].editing = false;
	}

	async function revertToGenerated() {
		if (!confirm('Kembalikan ke konten asli yang dihasilkan AI? Semua perubahan manual akan hilang.'))
			return;
		isSaving = true;
		saveResult = null;
		try {
			const resp = await fetch(`/api/history/${item._id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ editedHtml: '' })
			});
			if (!resp.ok) throw new Error();
			sections = parseSections(item.result?.htmlOutput || '');
			saveResult = 'saved';
			setTimeout(() => (saveResult = null), 3000);
		} catch {
			saveResult = 'error';
		} finally {
			isSaving = false;
		}
	}

	function getTitle() {
		const ctx = item.userContext || {};
		const titleKeys = ['judul', 'nama', 'topik', 'tema', 'judul_modul', 'nama_modul', 'mata_pelajaran', 'mapel'];
		for (const k of titleKeys) {
			if (ctx[k]) return ctx[k];
		}
		// Fallback: first non-empty text value
		for (const [, val] of Object.entries(ctx)) {
			if (val && !Array.isArray(val) && typeof val === 'string' && val.trim()) {
				return val.trim();
			}
		}
		return item.templateName || 'Dokumen';
	}

	function getSubtitle() {
		const ctx = item.userContext || {};
		const parts = [];
		const descKeys = ['mapel', 'mata_pelajaran', 'kelas', 'fase', 'jenjang'];
		for (const k of descKeys) {
			if (ctx[k]) parts.push(k === 'kelas' ? `Kelas ${ctx[k]}` : ctx[k]);
		}
		// Also add any other non-title values for context
		const titleKeys = new Set(['judul', 'nama', 'topik', 'tema', 'judul_modul', 'nama_modul']);
		for (const [k, v] of Object.entries(ctx)) {
			if (!titleKeys.has(k) && !descKeys.includes(k) && v && !Array.isArray(v) && typeof v === 'string' && v.trim()) {
				if (parts.length < 3) parts.push(v.trim());
			}
		}
		return parts.join(' · ') || '';
	}
</script>

<svelte:head>
	<title>{getTitle()} — Riwayat · Asisten Guru AI</title>
</svelte:head>

<!-- Toolbar -->
<div class="no-print sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
	<div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
		<div class="flex items-center gap-3">
			<a
				href="/dashboard/riwayat"
				class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
				Riwayat
			</a>
			<div class="h-5 w-px bg-gray-200"></div>
			<div>
				<p class="text-sm font-semibold text-gray-800 leading-tight">{getTitle()}</p>
				<p class="text-xs text-gray-400">
					{item.templateName} · {formatDate(item.createdAt)}
					{#if getSubtitle()} · {getSubtitle()}{/if}
				</p>
			</div>
		</div>

		<div class="flex items-center gap-2">
			{#if saveResult === 'saved'}
				<span class="text-xs font-medium text-green-600">✓ Tersimpan</span>
			{:else if saveResult === 'error'}
				<span class="text-xs font-medium text-red-600">Gagal menyimpan</span>
			{/if}

			{#if isEditing}
				<button
					onclick={toggleEdit}
					class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
				>
					Selesai Edit
				</button>
			{:else}
				<button
					onclick={downloadPdf}
					disabled={isPrinting}
					class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
				>
					{isPrinting ? 'Membuka...' : 'Cetak PDF'}
				</button>
				<button
					onclick={toggleEdit}
					class="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
				>
					Edit
				</button>
			{/if}
		</div>
	</div>
</div>

<!-- Content -->
<div class="mx-auto max-w-5xl px-6 py-8">
	<div class="doc-preview rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
		{#if isEditing}
			<div
				class="mb-4 flex items-center justify-between rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700"
			>
				<span>Mode Edit — klik section untuk mengedit, lalu simpan per section.</span>
				<button
					onclick={revertToGenerated}
					class="font-semibold text-amber-800 underline hover:text-amber-900"
				>
					Kembalikan ke Asli
				</button>
			</div>

			<div class="space-y-4">
				{#each sections as section, i (section.id)}
					<div
						class="group rounded-lg border {section.editing
							? 'border-blue-400 bg-blue-50/30'
							: 'border-gray-100 hover:border-gray-200'} p-3 transition-colors"
					>
						<div class="mb-2 flex items-center justify-between">
							<span class="text-xs font-semibold text-gray-500">{section.headingText}</span>
							<div
								class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
							>
								{#if section.editing}
									<button
										onclick={() => saveSection(i)}
										class="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700"
									>
										Simpan
									</button>
									<button
										onclick={() => cancelEdit(i)}
										class="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
									>
										Batal
									</button>
								{:else}
									<button
										onclick={() => startEdit(i)}
										class="rounded border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
									>
										Edit
									</button>
								{/if}
							</div>
						</div>
						{#if section.editing}
							<textarea
								value={section.html}
								oninput={(e) => (sections[i].html = e.target.value)}
								rows="8"
								class="w-full rounded-lg border border-blue-300 p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-100"
							></textarea>
						{:else}
							<div class="prose prose-sm max-w-none">
								{@html section.html}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="prose prose-sm max-w-none">
				{@html htmlOutput}
			</div>
		{/if}
	</div>
</div>

<style>
	:global(.doc-preview h1) {
		font-size: 1.8rem;
		color: #141413;
		border-bottom: 3px solid #cc785c;
		padding-bottom: 12px;
		margin-bottom: 32px;
	}

	:global(.doc-preview h2) {
		font-size: 1.2rem;
		color: #cc785c;
		border-left: 4px solid #cc785c;
		padding-left: 12px;
		margin-bottom: 16px;
		margin-top: 32px;
	}

	:global(.doc-preview h3) {
		font-size: 0.95rem;
		color: #3d3d3a;
		font-weight: 600;
		margin-bottom: 8px;
		margin-top: 24px;
	}

	:global(.doc-preview p) {
		color: #3d3d3a;
		line-height: 1.7;
		margin: 0 0 12px 0;
	}

	:global(.doc-preview ul) {
		padding-left: 20px;
		color: #3d3d3a;
		line-height: 1.8;
	}

	:global(.doc-preview table) {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
		margin: 16px 0;
	}

	:global(.doc-preview th) {
		background: #cc785c;
		color: white;
		padding: 8px 12px;
		text-align: left;
	}

	:global(.doc-preview td) {
		border: 1px solid #e6dfd8;
		padding: 8px 12px;
	}

	:global(.doc-preview tr:nth-child(even) td) {
		background: #faf9f5;
	}

	@media print {
		.no-print {
			display: none !important;
		}
	}
</style>
