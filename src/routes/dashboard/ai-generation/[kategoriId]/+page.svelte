<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import FlexGenerateModal from '$lib/components/FlexGenerateModal.svelte';

	let kategori = $state(null);
	let templates = $state([]);
	let loading = $state(true);
	let error = $state('');
	let showGenerateModal = $state(false);
	let selectedTemplate = $state(null);

	let kategoriId = $derived($page.params.kategoriId);

	$effect(() => {
		// Re-run setiap kali kategoriId berubah (navigasi antar kategori)
		const id = kategoriId;
		loading = true;
		error = '';

		(async () => {
			try {
				// Load kategori detail
				const katRes = await fetch(`/api/kategori/${id}`);
				if (katRes.ok) {
					const katData = await katRes.json();
					kategori = katData.kategori;
				} else {
					error = 'Kategori tidak ditemukan';
					loading = false;
					return;
				}

				// Load templates
				const tplRes = await fetch('/api/user-templates');
				if (tplRes.ok) {
					const tplData = await tplRes.json();
					// Filter templates belonging to this kategori
					templates = (tplData.templates || []).filter(
						(t) => t.kategoriId === id
					);
				} else {
					error = 'Gagal memuat template';
				}
			} catch {
				error = 'Gagal terhubung ke server';
			} finally {
				loading = false;
			}
		})();
	});

	function openGenerate(template) {
		selectedTemplate = template;
		showGenerateModal = true;
	}

	function closeGenerate() {
		showGenerateModal = false;
		selectedTemplate = null;
	}

	function handleGenerateSuccess() {
		closeGenerate();
		goto('/dashboard/riwayat');
	}
</script>

<svelte:head>
	<title>{kategori ? kategori.nama + ' — AI Generation' : 'AI Generation'} — Asisten Guru AI</title>
</svelte:head>

<div class="p-6">
	<!-- Breadcrumb -->
	<button
		onclick={() => goto('/dashboard')}
		class="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
	>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
		</svg>
		Beranda
	</button>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>
		</div>
	{:else if error}
		<div class="flex flex-col items-center justify-center py-20 text-center">
			<div class="mb-4 rounded-full bg-red-50 p-4">
				<svg class="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
				</svg>
			</div>
			<h3 class="mb-1 text-lg font-semibold text-gray-700">{error}</h3>
			<button
				onclick={() => goto('/dashboard')}
				class="mt-4 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
			>
				Kembali ke Beranda
			</button>
		</div>
	{:else}
		<!-- Header -->
		<div class="mb-6">
			<div class="flex items-center gap-3">
				<div class="shrink-0 rounded-xl bg-emerald-600 p-2">
					<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
				</div>
				<div>
					<h1 class="text-2xl font-bold text-gray-800">{kategori?.nama || 'AI Generation'}</h1>
					<p class="mt-1 text-sm text-gray-500">
						{kategori?.deskripsi || 'Generate dokumen dengan template kategori ini'}
					</p>
				</div>
			</div>
		</div>

		{#if templates.length === 0}
			<div class="flex flex-col items-center justify-center py-16 text-center">
				<div class="mb-4 rounded-full bg-emerald-50 p-4">
					<svg class="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
				<h3 class="mb-1 text-lg font-semibold text-gray-700">Belum ada template</h3>
				<p class="mb-4 text-sm text-gray-500">
					Belum ada template dalam kategori ini. Buat template di menu Data Master &rarr; Template.
				</p>
				<button
					onclick={() => goto('/dashboard/template-builder/new')}
					class="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
				>
					Buat Template Baru
				</button>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each templates as template}
					<div class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
						<h3 class="mb-1 text-base font-bold text-gray-800">{template.name}</h3>
						<p class="mb-3 line-clamp-2 text-sm text-gray-500">
							{template.description || 'Tanpa deskripsi'}
						</p>
						<div class="mb-4 flex items-center gap-3 text-xs text-gray-400">
							<span class="flex items-center gap-1">
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
								</svg>
								{template.sectionCount} section
							</span>
							<span>
								{new Date(template.createdAt).toLocaleDateString('id-ID')}
							</span>
						</div>
						<button
							onclick={() => openGenerate(template)}
							class="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
						>
							<svg class="mr-1.5 inline-block h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
							Generate
						</button>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<!-- Generate Modal -->
{#if showGenerateModal && selectedTemplate}
	<FlexGenerateModal
		template={selectedTemplate}
		onClose={closeGenerate}
		onSuccess={handleGenerateSuccess}
	/>
{/if}
