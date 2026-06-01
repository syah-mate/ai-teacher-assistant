<script>
	import { formatSchemaToText } from '$lib/utils/schema-formatter.js';
	import { renderMarkdownWithImages } from '$lib/utils/markdown.js';

	let { data } = $props();
	const item = data.item;

	// ── Section helpers ───────────────────────────────────────────────
	/**
	 * Split a rendered HTML string into sections at each h1/h2/h3 boundary.
	 * Returns an array of { id, html, backup, editing, headingText }.
	 */
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

	// ── Theme per tipe ────────────────────────────────────────────────
	const themes = {
		modul_ajar: {
			label: 'Modul Ajar / RPP',
			badgeClass: 'bg-blue-100 text-blue-700',
			headerBorder: 'border-blue-600',
			headerAccent: 'text-blue-500',
			h1Color: '#1e3a8a', h2Color: '#1d4ed8', h3Border: '#3b82f6',
			bullet: '#2563eb', bulletNested: '#93c5fd', olCounter: '#2563eb',
			bqBorder: '#3b82f6', bqBg: '#eff6ff', bqColor: '#1e40af',
			theadBg: '#1d4ed8', trEven: '#f8faff', trHover: '#eff6ff',
			hrStart: '#1d4ed8', hrMid: '#3b82f6', hrEnd: '#93c5fd',
			h1Border: '#dbeafe', codeBg: '#f1f5f9', codeColor: '#0f172a'
		},
		lkpd: {
			label: 'LKPD',
			badgeClass: 'bg-emerald-100 text-emerald-700',
			headerBorder: 'border-emerald-600',
			headerAccent: 'text-emerald-500',
			h1Color: '#064e3b', h2Color: '#047857', h3Border: '#10b981',
			bullet: '#10b981', bulletNested: '#6ee7b7', olCounter: '#10b981',
			bqBorder: '#10b981', bqBg: '#ecfdf5', bqColor: '#065f46',
			theadBg: '#047857', trEven: '#f0fdf4', trHover: '#ecfdf5',
			hrStart: '#047857', hrMid: '#10b981', hrEnd: '#6ee7b7',
			h1Border: '#d1fae5', codeBg: '#f0fdf4', codeColor: '#064e3b'
		},
		soal: {
			label: 'Soal',
			badgeClass: 'bg-violet-100 text-violet-700',
			headerBorder: 'border-violet-600',
			headerAccent: 'text-violet-500',
			h1Color: '#3b0764', h2Color: '#6d28d9', h3Border: '#7c3aed',
			bullet: '#7c3aed', bulletNested: '#c4b5fd', olCounter: '#7c3aed',
			bqBorder: '#7c3aed', bqBg: '#f5f3ff', bqColor: '#4c1d95',
			theadBg: '#6d28d9', trEven: '#faf5ff', trHover: '#f5f3ff',
			hrStart: '#6d28d9', hrMid: '#7c3aed', hrEnd: '#c4b5fd',
			h1Border: '#ede9fe', codeBg: '#f5f3ff', codeColor: '#3b0764'
		}
	};

	const theme = themes[item.tipe] ?? themes.soal;

	// CSS variables injected on the content wrapper
	const cssVars = [
		`--h1-color:${theme.h1Color}`, `--h2-color:${theme.h2Color}`, `--h3-border:${theme.h3Border}`,
		`--bullet:${theme.bullet}`, `--bullet-nested:${theme.bulletNested}`, `--ol-counter:${theme.olCounter}`,
		`--bq-border:${theme.bqBorder}`, `--bq-bg:${theme.bqBg}`, `--bq-color:${theme.bqColor}`,
		`--thead-bg:${theme.theadBg}`, `--tr-even:${theme.trEven}`, `--tr-hover:${theme.trHover}`,
		`--hr-start:${theme.hrStart}`, `--hr-mid:${theme.hrMid}`, `--hr-end:${theme.hrEnd}`,
		`--h1-border:${theme.h1Border}`, `--code-bg:${theme.codeBg}`, `--code-color:${theme.codeColor}`
	].join(';');

	// ── Extract images from schema ────────────────────────────────────
	function extractImages(tipe, schema) {
		if (!schema?.image) return [];
		const img = schema.image;
		// modul_ajar: schema.image = { data, mimeType, caption }
		if (tipe === 'modul_ajar' && typeof img === 'object' && img.data) return [img];
		// lkpd: schema.image = base64 string
		if (tipe === 'lkpd' && typeof img === 'string' && img.length > 0)
			return [{ data: img, mimeType: 'image/png', caption: '' }];
		return [];
	}

	const images = extractImages(item.tipe, item.schema);
	const markdown = item.schema ? formatSchemaToText(item.tipe, item.schema, { metode: item.metode, modePembelajaran: item.modePembelajaran }) : '_Isi dokumen tidak tersedia._';
	const generatedHtml = renderMarkdownWithImages(markdown, images);

	// Use editedHtml from DB if available, otherwise fall back to generated HTML
	const sourceHtml = item.editedHtml || generatedHtml;

	// Reactive sections state
	let sections = $state(parseSections(sourceHtml));
	let isDownloadingDocx = $state(false);
	let isPrinting = $state(false);
	let isSaving = $state(false);
	let saveResult = $state(/** @type {'saved'|'error'|null} */ (null));

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

	async function downloadDocx() {
		isDownloadingDocx = true;
		try {
			let endpoint, payload;

			if (item.tipe === 'modul_ajar') {
				endpoint = '/api/export-modul-docx';
				payload = {
					modulData: {
						judulModul: item.judul,
						mapel: item.mapel,
						kelas: item.kelas,
						penulis: 'Guru Mata Pelajaran',
						instansi: 'Sekolah',
						schema: item.schema,
						images: []
					}
				};
			} else if (item.tipe === 'lkpd') {
				endpoint = '/api/export-lkpd-docx';
				payload = {
					lkpdData: {
						judulModul: item.judul,
						topik: item.judul,
						mapel: item.mapel,
						kelas: item.kelas,
						semester: item.semester,
						penulis: 'Guru Mata Pelajaran',
						instansi: 'Sekolah',
						schema: item.schema,
						images: []
					}
				};
			} else {
				endpoint = '/api/export-soal-docx';
				payload = {
					soalData: {
						judulSoal: item.judul,
						topik: item.judul,
						mapel: item.mapel,
						kelas: item.kelas,
						jenis: item.jenisSoal,
						jumlah: item.jumlahSoal,
						tingkat: item.tingkat,
						level: item.levelBloom,
						schema: item.schema,
						images: []
					}
				};
			}

			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!response.ok) throw new Error('Export gagal');

			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${theme.label}_${(item.judul || 'output').replace(/[^a-z0-9]/gi, '_')}.docx`;
			document.body.appendChild(a);
			a.click();
			URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch {
			alert('Gagal download .docx. Silakan coba lagi.');
		} finally {
			isDownloadingDocx = false;
		}
	}

	function downloadPdf() {
		isPrinting = true;
		setTimeout(() => {
			window.print();
			isPrinting = false;
		}, 100);
	}

	// ── Section editing ───────────────────────────────────────────────
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
		if (!confirm('Kembalikan ke konten asli yang dihasilkan AI? Semua perubahan manual akan hilang.')) return;
		isSaving = true;
		saveResult = null;
		try {
			const resp = await fetch(`/api/history/${item._id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ editedHtml: '' })
			});
			if (!resp.ok) throw new Error();
			sections = parseSections(generatedHtml);
			saveResult = 'saved';
			setTimeout(() => (saveResult = null), 3000);
		} catch {
			saveResult = 'error';
		} finally {
			isSaving = false;
		}
	}</script>

<svelte:head>
	<title>{item.judul} — Riwayat · Asisten Guru AI</title>
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
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Riwayat
			</a>
			<div class="h-5 w-px bg-gray-200"></div>
			<div>
				<p class="text-sm font-semibold text-gray-800 leading-tight">{item.judul}</p>
				<p class="text-xs text-gray-400">
					{#if item.mapel}{item.mapel}{/if}{#if item.kelas} · Kelas {item.kelas}{/if}
					· {formatDate(item.createdAt)}
				</p>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<span class="hidden rounded-full px-2.5 py-0.5 text-xs font-semibold sm:inline {theme.badgeClass}">
				{theme.label}
			</span>

			<!-- Save status feedback -->
			{#if saveResult === 'saved'}
				<span class="flex items-center gap-1 text-xs font-medium text-green-600">
					<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
					</svg>
					Tersimpan
				</span>
			{:else if saveResult === 'error'}
				<span class="text-xs font-medium text-red-500">Gagal menyimpan</span>
			{/if}

			<!-- Revert to AI-generated (only if item was previously edited) -->
			{#if item.editedHtml}
				<button
					onclick={revertToGenerated}
					class="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
					title="Kembalikan ke konten asli AI"
				>
					<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					Reset
				</button>
			{/if}

			<!-- PDF -->
			<button
				onclick={downloadPdf}
				class="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
			>
				<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
				</svg>
				PDF
			</button>

			<!-- DOCX -->
			{#if item.schema}
				<button
					onclick={downloadDocx}
					disabled={isDownloadingDocx}
					class="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
				>
					{#if isDownloadingDocx}
						<svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
						</svg>
						Exporting...
					{:else}
						<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						Download .docx
					{/if}
				</button>
			{/if}
		</div>
	</div>
</div>

<!-- Document -->
<div class="min-h-screen bg-gray-100 py-10 print:bg-white print:py-0">
	<div class="mx-auto max-w-4xl bg-white shadow-lg print:shadow-none">

		<!-- Document cover header -->
		<div class="border-b-4 px-12 pb-6 pt-10 {theme.headerBorder}">
			<div class="mb-1 text-xs font-semibold uppercase tracking-widest {theme.headerAccent}">
				{theme.label}
			</div>
			<h1 class="text-3xl font-bold leading-tight text-gray-900">{item.judul}</h1>
			<div class="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
				{#if item.mapel}
					<span class="flex items-center gap-1">
						<svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
						</svg>
						{item.mapel}
					</span>
				{/if}
				{#if item.kelas}
					<span class="flex items-center gap-1">
						<svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						Kelas {item.kelas}
					</span>
				{/if}
				{#if item.jenjang}
					<span class="flex items-center gap-1">
						🏫 {item.jenjang}
					</span>
				{/if}
				{#if item.tipe === 'modul_ajar' && item.metode}
					<span class="flex items-center gap-1">⚙️ {item.metode}</span>
				{/if}
				{#if item.tipe === 'modul_ajar' && item.jumlahPertemuan}
					<span class="flex items-center gap-1">📅 {item.jumlahPertemuan} Pertemuan</span>
				{/if}
				{#if item.tipe === 'lkpd' && item.semester}
					<span class="flex items-center gap-1">📆 Semester {item.semester}</span>
				{/if}
				{#if item.tipe === 'soal' && item.jenisSoal}
					<span class="flex items-center gap-1">📝 {item.jenisSoal}</span>
				{/if}
				{#if item.tipe === 'soal' && item.jumlahSoal}
					<span class="flex items-center gap-1">🔢 {item.jumlahSoal} soal</span>
				{/if}
				{#if item.tipe === 'soal' && item.tingkat}
					<span class="flex items-center gap-1">📊 {item.tingkat}</span>
				{/if}
			</div>
		</div>

		<!-- Content with per-tipe CSS variables -->
		<div class="document-content" style={cssVars}>
			{#each sections as section, i (section.id)}
				<div class="section-block group/section relative px-12 {i === 0 ? 'pt-8' : ''} {i === sections.length - 1 ? 'pb-8' : ''}">
					{#if section.editing}
						<!-- ── Edit mode ── -->
						<div
							role="textbox"
							aria-multiline="true"
							aria-label="Edit bagian {section.headingText}"
							contenteditable="true"
							class="section-editor outline-none"
							bind:innerHTML={sections[i].html}
						></div>
						<div class="no-print mt-3 mb-2 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5">
							<button
								onclick={() => saveSection(i)}
							disabled={isSaving}
							class="flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60"
						>
							{#if isSaving}
								<svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
								</svg>
								Menyimpan...
							{:else}
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
								</svg>
								Simpan Bagian
							{/if}
							</button>
							<button
								onclick={() => cancelEdit(i)}
								class="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:bg-gray-100"
							>
								Batal
							</button>
							<span class="ml-1 truncate text-xs text-gray-400">
								Mengedit: <em>{section.headingText}</em>
							</span>
						</div>
					{:else}
						<!-- ── View mode ── -->
						{@html section.html}
						<button
							onclick={() => startEdit(i)}
							class="no-print edit-section-btn pointer-events-auto opacity-100 sm:pointer-events-none sm:opacity-0 absolute right-2 top-2 flex items-center gap-1 rounded-md border border-yellow-300 bg-yellow-50 px-2 py-1 text-xs text-yellow-700 shadow-sm transition-all hover:bg-yellow-100 hover:border-yellow-400 hover:text-yellow-900 sm:group-hover/section:pointer-events-auto sm:group-hover/section:opacity-100"
							title="Edit bagian ini"
						>
							<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
							</svg>
							Edit
						</button>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Footer -->
		<div class="border-t border-gray-200 px-12 py-4 text-center text-xs text-gray-400">
			Dibuat dengan Asisten Guru AI · {formatDate(item.createdAt)}
		</div>
	</div>
</div>

<style>
	/* ── Typography ─────────────────────────────────────────────────── */
	.document-content :global(h1) {
		font-size: 1.6rem;
		font-weight: 800;
		color: var(--h1-color);
		margin-top: 2.5rem;
		margin-bottom: 0.75rem;
		padding-bottom: 0.4rem;
		border-bottom: 2px solid var(--h1-border);
		line-height: 1.3;
	}
	.document-content :global(h2) {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--h2-color);
		margin-top: 2rem;
		margin-bottom: 0.6rem;
		line-height: 1.35;
	}
	.document-content :global(h3) {
		font-size: 1.05rem;
		font-weight: 700;
		color: #374151;
		margin-top: 1.5rem;
		margin-bottom: 0.5rem;
		padding-left: 0.75rem;
		border-left: 3px solid var(--h3-border);
	}
	.document-content :global(h4) {
		font-size: 0.95rem;
		font-weight: 600;
		color: #4b5563;
		margin-top: 1.25rem;
		margin-bottom: 0.4rem;
	}
	.document-content :global(p) {
		font-size: 0.9375rem;
		line-height: 1.85;
		color: #1f2937;
		margin-bottom: 1rem;
	}

	/* ── Lists ──────────────────────────────────────────────────────── */
	.document-content :global(ul) {
		list-style: none;
		padding-left: 0;
		margin-bottom: 1rem;
	}
	.document-content :global(ul li) {
		position: relative;
		padding-left: 2rem;
		margin-bottom: 0.5rem;
		font-size: 0.9375rem;
		line-height: 1.75;
		color: #1f2937;
	}
	.document-content :global(ul li::before) {
		content: '';
		position: absolute;
		left: 0.25rem;
		top: 0.6em;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--bullet);
		flex-shrink: 0;
	}
	.document-content :global(ul ul) {
		margin-top: 0.35rem;
		margin-bottom: 0.35rem;
		padding-left: 1.25rem;
	}
	.document-content :global(ul ul li::before) {
		width: 5px;
		height: 5px;
		background: var(--bullet-nested);
		top: 0.65em;
	}
	.document-content :global(ol) {
		padding-left: 0;
		margin-bottom: 1rem;
		counter-reset: ol-counter;
		list-style: none;
	}
	.document-content :global(ol li) {
		position: relative;
		padding-left: 2rem;
		margin-bottom: 0.5rem;
		font-size: 0.9375rem;
		line-height: 1.75;
		color: #1f2937;
		counter-increment: ol-counter;
	}
	.document-content :global(ol li::before) {
		content: counter(ol-counter) '.';
		position: absolute;
		left: 0;
		color: var(--ol-counter);
		font-weight: 700;
		min-width: 1.5rem;
	}

	/* ── Inline ─────────────────────────────────────────────────────── */
	.document-content :global(strong) {
		font-weight: 700;
		color: #111827;
	}
	.document-content :global(em) {
		font-style: italic;
		color: #374151;
	}
	.document-content :global(code) {
		background: var(--code-bg);
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
		font-size: 0.85em;
		font-family: 'Courier New', monospace;
		color: var(--code-color);
	}
	.document-content :global(pre) {
		background: #0f172a;
		color: #e2e8f0;
		padding: 1rem 1.25rem;
		border-radius: 8px;
		overflow-x: auto;
		margin-bottom: 1rem;
		font-size: 0.85rem;
	}
	.document-content :global(pre code) {
		background: none;
		padding: 0;
		color: inherit;
		font-size: inherit;
	}

	/* ── Blockquote ─────────────────────────────────────────────────── */
	.document-content :global(blockquote) {
		border-left: 4px solid var(--bq-border);
		background: var(--bq-bg);
		padding: 0.75rem 1rem;
		margin: 1.25rem 0;
		border-radius: 0 8px 8px 0;
		font-style: italic;
		color: var(--bq-color);
	}
	.document-content :global(blockquote p) {
		margin-bottom: 0;
		color: var(--bq-color);
	}

	/* ── Table ──────────────────────────────────────────────────────── */
	.document-content :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1.25rem;
		font-size: 0.875rem;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 0 0 1px #e5e7eb;
	}
	.document-content :global(thead tr) {
		background: var(--thead-bg);
		color: white;
	}
	.document-content :global(thead th) {
		padding: 0.65rem 0.875rem;
		text-align: left;
		font-weight: 600;
		font-size: 0.8rem;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}
	.document-content :global(tbody tr:nth-child(even)) {
		background: var(--tr-even);
	}
	.document-content :global(tbody tr:hover) {
		background: var(--tr-hover);
	}
	.document-content :global(td) {
		padding: 0.6rem 0.875rem;
		border-bottom: 1px solid #e5e7eb;
		color: #374151;
		vertical-align: top;
	}

	/* ── HR ─────────────────────────────────────────────────────────── */
	.document-content :global(hr) {
		border: none;
		height: 3px;
		background: linear-gradient(to right, var(--hr-start), var(--hr-mid) 40%, var(--hr-end) 70%, transparent);
		margin: 2rem 0;
		border-radius: 2px;
	}

	/* ── Images ─────────────────────────────────────────────────────── */
	.document-content :global(figure) {
		margin: 1.5rem 0;
		text-align: center;
	}
	.document-content :global(figure img) {
		border-radius: 10px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
		max-width: 100%;
	}
	.document-content :global(figcaption) {
		font-size: 0.8rem;
		color: #6b7280;
		margin-top: 0.5rem;
		font-style: italic;
	}

	/* ── Print ──────────────────────────────────────────────────────── */
	@media print {
		:global(.no-print) { display: none !important; }
		:global(body) { background: white !important; }
		.document-content :global(h1),
		.document-content :global(h2),
		.document-content :global(h3) { page-break-after: avoid; }
		.document-content :global(table) { page-break-inside: avoid; }
		.document-content :global(blockquote) { page-break-inside: avoid; }
		.document-content :global(ol li) { page-break-inside: avoid; }
	}

	/* ── Section editing ─────────────────────────────────────────────── */
	.section-block {
		/* gives space for absolute edit button */
		isolation: isolate;
	}

	/* Highlight the active edit area */
	.section-editor {
		border-radius: 6px;
		outline: 2px solid #3b82f6;
		outline-offset: 4px;
		padding: 0.25rem;
		min-height: 2rem;
		cursor: text;
	}

	/* Keep all document styles inside an editing section */
	.document-content .section-editor :global(h1) { color: var(--h1-color); font-size: 1.6rem; font-weight: 800; margin-top: 2.5rem; margin-bottom: 0.75rem; padding-bottom: 0.4rem; border-bottom: 2px solid var(--h1-border); line-height: 1.3; }
	.document-content .section-editor :global(h2) { color: var(--h2-color); font-size: 1.25rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.6rem; }
	.document-content .section-editor :global(h3) { color: #374151; font-size: 1.05rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem; padding-left: 0.75rem; border-left: 3px solid var(--h3-border); }
	.document-content .section-editor :global(p)  { font-size: 0.9375rem; line-height: 1.85; color: #1f2937; margin-bottom: 1rem; }
	.document-content .section-editor :global(ul li::before) { background: var(--bullet); }
	.document-content .section-editor :global(ol li::before) { color: var(--ol-counter); }
</style>
