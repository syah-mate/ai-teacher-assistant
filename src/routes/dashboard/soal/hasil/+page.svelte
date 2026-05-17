<script>
	import { onMount } from 'svelte';
	import { renderMarkdownWithImages } from '$lib/utils/markdown.js';

	let soalData = $state(null);
	let renderedHtml = $state('');
	let isDownloadingDocx = $state(false);
	let isPrinting = $state(false);
	let notFound = $state(false);

	onMount(() => {
		const data = window.opener?.__soalHasil;
		if (!data) {
			notFound = true;
			return;
		}
		try {
			soalData = data;
			renderedHtml = renderMarkdownWithImages(soalData.output, soalData.images);
		} catch {
			notFound = true;
		}
	});

	async function downloadDocx() {
		if (!soalData) return;
		isDownloadingDocx = true;
		try {
			const response = await fetch('/api/export-soal-docx', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					soalData: {
						judulSoal: `${soalData.topik || 'Soal'} - ${soalData.mapel || ''}`,
						mapel: soalData.mapel,
						kelas: soalData.kelas,
						topik: soalData.topik,
						jenis: soalData.jenis,
						jumlah: soalData.jumlah,
						tingkat: soalData.tingkat,
						level: soalData.level,
						content: soalData.output,
						images: soalData.images || []
					}
				})
			});
			if (!response.ok) throw new Error('Gagal export');
			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `Soal_${(soalData.mapel || '')}_${(soalData.topik || 'output').replace(/[^a-z0-9]/gi, '_')}.docx`;
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
</script>

<svelte:head>
	<title>{soalData?.topik ?? 'Soal'} — Asisten Guru AI</title>
</svelte:head>

{#if notFound}
	<div class="flex min-h-screen items-center justify-center bg-gray-50">
		<div class="text-center">
			<p class="mb-2 text-lg font-semibold text-gray-700">Tidak ada data soal.</p>
			<p class="mb-6 text-sm text-gray-400">Silakan generate ulang dari halaman generator.</p>
			<a
				href="/dashboard/soal"
				class="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
			>
				Kembali ke Generator
			</a>
		</div>
	</div>
{:else if !soalData}
	<div class="flex min-h-screen items-center justify-center bg-gray-50">
		<div class="flex items-center gap-3 text-gray-500">
			<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
			</svg>
			Memuat dokumen...
		</div>
	</div>
{:else}
	<!-- Toolbar -->
	<div class="toolbar-wrapper no-print sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
			<div class="flex items-center gap-3">
				<a
					href="/dashboard/soal"
					class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
					Kembali
				</a>
				<div class="h-5 w-px bg-gray-200"></div>
				<div>
					<p class="text-sm font-semibold text-gray-800">{soalData.topik}</p>
					<p class="text-xs text-gray-400">{soalData.mapel} · Kelas {soalData.kelas} · {soalData.jenis}</p>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<!-- Quality badge -->
				{#if soalData.qualityScore > 0}
					<span
						class="rounded-full px-3 py-1 text-xs font-semibold
						{soalData.qualityScore >= 80
							? 'bg-violet-100 text-violet-700'
							: soalData.qualityScore >= 60
								? 'bg-yellow-100 text-yellow-700'
								: 'bg-orange-100 text-orange-700'}"
					>
						Kualitas {soalData.qualityScore}/100
					</span>
				{/if}

				<!-- Download PDF -->
				<button
					onclick={downloadPdf}
					class="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
				>
					<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
					</svg>
					Download PDF
				</button>

				<!-- Download DOCX -->
				<button
					onclick={downloadDocx}
					disabled={isDownloadingDocx}
					class="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
				>
					{#if isDownloadingDocx}
						<svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
						</svg>
						Sedang Export...
					{:else}
						<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						Download .docx
					{/if}
				</button>
			</div>
		</div>
	</div>

	<!-- Document body -->
	<div class="min-h-screen bg-gray-100 py-10 print:bg-white print:py-0">
		<div class="document-paper mx-auto max-w-4xl bg-white shadow-lg print:shadow-none">
			<!-- Cover -->
			<div class="border-b-4 border-violet-600 px-12 pb-6 pt-10">
				<div class="mb-1 text-xs font-semibold uppercase tracking-widest text-violet-500">
					Instrumen Soal · {soalData.jenis}
				</div>
				<h1 class="text-3xl font-bold leading-tight text-gray-900">{soalData.topik}</h1>
				<div class="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
					<span class="flex items-center gap-1">
						<svg class="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13" />
						</svg>
						{soalData.mapel}
					</span>
					<span class="flex items-center gap-1">
						<svg class="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
						</svg>
						Kelas {soalData.kelas}
					</span>
					<span class="flex items-center gap-1">
						<svg class="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
						</svg>
						{soalData.tingkat} · {soalData.level}
					</span>
					<span class="flex items-center gap-1">
						<svg class="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
						</svg>
						{soalData.jumlah} soal
					</span>
				</div>

				<!-- Nama / Kelas / Tanggal siswa -->
				<div class="mt-5 grid grid-cols-3 gap-4 rounded-lg border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-gray-700">
					<div>Nama&nbsp;: <span class="ml-1 inline-block w-32 border-b border-gray-400">&nbsp;</span></div>
					<div>Kelas&nbsp;: <span class="ml-1 inline-block w-20 border-b border-gray-400">&nbsp;</span></div>
					<div>Tanggal: <span class="ml-1 inline-block w-24 border-b border-gray-400">&nbsp;</span></div>
				</div>
			</div>

			<!-- Rendered content -->
			<div class="document-content px-12 py-8">
				{@html renderedHtml}
			</div>

			<!-- Footer -->
			<div class="border-t border-gray-200 px-12 py-4 text-center text-xs text-gray-400 print:block">
				Dibuat dengan Asisten Guru AI · {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
			</div>
		</div>
	</div>
{/if}

<style>
	.document-content :global(h1) {
		font-size: 1.5rem;
		font-weight: 800;
		color: #3b0764;
		margin-top: 2.5rem;
		margin-bottom: 0.75rem;
		padding-bottom: 0.4rem;
		border-bottom: 2px solid #ede9fe;
		line-height: 1.3;
	}

	.document-content :global(h2) {
		font-size: 1.2rem;
		font-weight: 700;
		color: #6d28d9;
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
		border-left: 3px solid #7c3aed;
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
		background: #7c3aed;
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
		background: #c4b5fd;
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
		color: #7c3aed;
		font-weight: 700;
		min-width: 1.5rem;
	}

	.document-content :global(strong) {
		font-weight: 700;
		color: #111827;
	}

	.document-content :global(em) {
		font-style: italic;
		color: #374151;
	}

	.document-content :global(blockquote) {
		border-left: 4px solid #7c3aed;
		background: #f5f3ff;
		padding: 0.75rem 1rem;
		margin: 1.25rem 0;
		border-radius: 0 8px 8px 0;
		font-style: italic;
		color: #4c1d95;
	}

	.document-content :global(blockquote p) {
		margin-bottom: 0;
		color: #4c1d95;
	}

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
		background: #6d28d9;
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
		background: #faf5ff;
	}

	.document-content :global(tbody tr:hover) {
		background: #f5f3ff;
	}

	.document-content :global(td) {
		padding: 0.6rem 0.875rem;
		border-bottom: 1px solid #e5e7eb;
		color: #374151;
		vertical-align: top;
	}

	.document-content :global(hr) {
		border: none;
		height: 3px;
		background: linear-gradient(to right, #6d28d9, #7c3aed 40%, #c4b5fd 70%, transparent);
		margin: 2rem 0;
		border-radius: 2px;
	}

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

	.document-content :global(code) {
		background: #f5f3ff;
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
		font-size: 0.85em;
		font-family: 'Courier New', monospace;
		color: #3b0764;
	}

	@media print {
		:global(.no-print) {
			display: none !important;
		}

		:global(body) {
			background: white !important;
		}

		.document-paper {
			box-shadow: none !important;
			max-width: 100% !important;
		}

		.document-content :global(h1),
		.document-content :global(h2),
		.document-content :global(h3) {
			page-break-after: avoid;
		}

		.document-content :global(table) {
			page-break-inside: avoid;
		}

		.document-content :global(ol li) {
			page-break-inside: avoid;
		}
	}
</style>
