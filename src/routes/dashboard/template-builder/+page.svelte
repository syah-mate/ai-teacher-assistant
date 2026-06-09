<!-- src/routes/dashboard/template-builder/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let templates = $state([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			const res = await fetch('/api/custom-templates');
			if (res.ok) {
				const data = await res.json();
				templates = data.templates ?? [];
			}
		} catch {
			// ignore
		} finally {
			loading = false;
		}
	});

	async function hapusTemplate(id) {
		if (!confirm('Yakin hapus template ini? Tindakan ini tidak bisa dibatalkan.')) return;
		try {
			const res = await fetch(`/api/custom-templates/${id}`, { method: 'DELETE' });
			if (res.ok) {
				templates = templates.filter(t => t._id !== id);
			}
		} catch {
			alert('Gagal menghapus template.');
		}
	}
</script>

<svelte:head>
	<title>Template Saya — Asisten Guru AI</title>
</svelte:head>

<div class="p-6">
	<!-- Breadcrumb -->
	<div class="mb-5 flex items-center gap-2 text-sm text-gray-400">
		<a href="/dashboard" class="transition-colors hover:text-blue-600">Dashboard</a>
		<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
		<span class="font-medium text-gray-700">Template Saya</span>
	</div>

	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="h-5 w-1 rounded-full bg-purple-600"></div>
			<h2 class="text-base font-bold text-gray-800">Template Saya</h2>
			<span class="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
				{templates.length} Template
			</span>
		</div>
		<a
			href="/dashboard/template-builder/new"
			class="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-200 transition-all hover:bg-purple-700 hover:shadow-md active:scale-95"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Buat Template Baru
		</a>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20 text-gray-400">
			<svg class="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
			</svg>
			<span class="ml-3">Memuat template...</span>
		</div>
	{:else if templates.length === 0}
		<!-- Empty state -->
		<div class="flex flex-col items-center justify-center py-20 text-center">
			<div class="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-purple-50">
				<svg class="h-10 w-10 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
						d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
				</svg>
			</div>
			<h3 class="mb-2 text-lg font-semibold text-gray-700">Belum ada template kustom</h3>
			<p class="mb-6 max-w-sm text-sm text-gray-500">
				Buat template modul ajar sendiri dengan memilih section yang kamu butuhkan. Drag & drop untuk menyusun urutannya.
			</p>
			<a
				href="/dashboard/template-builder/new"
				class="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-200 transition-all hover:bg-purple-700"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				Buat Template Pertama
			</a>
		</div>
	{:else}
		<!-- Grid cards -->
		<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
			{#each templates as ct (ct._id)}
				<div class="group relative flex flex-col rounded-2xl border border-purple-200 bg-white p-6 shadow-sm
					transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-purple-50">
					<!-- Top: icon + date -->
					<div class="mb-4 flex items-start justify-between">
						<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100">
							<svg class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
							</svg>
						</div>
						<span class="rounded-full border border-purple-100 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
							Template Kustom
						</span>
					</div>

					<!-- Name + description -->
					<h3 class="mb-1.5 text-base font-bold text-gray-800">{ct.name}</h3>
					<p class="mb-4 text-sm text-gray-500">{ct.description || 'Tidak ada deskripsi'}</p>

					<!-- Section chips -->
					<div class="mb-3 flex flex-wrap gap-1.5">
						{#each ct.sections.slice(0, 5) as s}
							<span class="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">{s.title}</span>
						{/each}
						{#if ct.sections.length > 5}
							<span class="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-400">+{ct.sections.length - 5} lagi</span>
						{/if}
					</div>

					<!-- Footer actions -->
					<div class="mt-auto border-t border-gray-100 pt-4 flex items-center justify-between gap-3">
						<span class="text-xs text-gray-400">
							{ct.sections.length} section
						</span>
						<div class="flex items-center gap-2">
							<a
								href="/dashboard/template-builder/{ct._id}"
								class="rounded-lg border border-purple-200 px-3 py-1.5 text-xs font-medium text-purple-600 transition hover:bg-purple-50"
							>
								Edit
							</a>
							<button
								onclick={() => hapusTemplate(ct._id)}
								class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
							>
								Hapus
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
