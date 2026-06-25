<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let templates = $state([]);
	let kategoriList = $state([]);
	let loading = $state(true);
	let error = $state('');
	let deleteConfirmId = $state(null);
	let filterKategoriId = $state('');

	let currentUserId = $derived($page.data.user?.id || $page.data.user?._id?.toString() || null);

	onMount(async () => {
		try {
			// Load kategori
			const katRes = await fetch('/api/kategori');
			if (katRes.ok) {
				const katData = await katRes.json();
				kategoriList = katData.kategori || [];
			}

			const res = await fetch('/api/user-templates');
			if (res.ok) {
				const data = await res.json();
				templates = data.templates || [];
			} else {
				error = 'Gagal memuat template';
			}
		} catch (e) {
			error = 'Gagal terhubung ke server';
		} finally {
			loading = false;
		}
	});

	function isOwner(template) {
		return template.userId === currentUserId;
	}

	function getKategoriNama(kategoriId) {
		if (!kategoriId) return null;
		const kat = kategoriList.find((k) => k._id === kategoriId);
		return kat ? kat.nama : null;
	}

	let filteredTemplates = $derived(filterKategoriId
		? templates.filter((t) => t.kategoriId === filterKategoriId)
		: templates);

	async function handleDelete(id) {
		try {
			const res = await fetch(`/api/user-templates/${id}`, { method: 'DELETE' });
			if (res.ok) {
				templates = templates.filter((t) => t._id !== id);
				deleteConfirmId = null;
			} else {
				error = 'Gagal menghapus template';
			}
		} catch {
			error = 'Gagal terhubung ke server';
		}
	}
</script>

<svelte:head>
	<title>Template Saya — Asisten Guru AI</title>
</svelte:head>

<div class="p-6">
	<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-gray-800">Template Saya</h1>
			<p class="mt-1 text-sm text-gray-500">Kelola template generate dokumen Anda sendiri</p>
		</div>
		<div class="flex items-center gap-3">
			{#if kategoriList.length > 0}
				<select
					bind:value={filterKategoriId}
					class="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-600 shadow-sm transition-colors hover:border-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
				>
					<option value="">Semua Kategori</option>
					{#each kategoriList as kat}
						<option value={kat._id}>{kat.nama}</option>
					{/each}
				</select>
			{/if}
			<button
				onclick={() => goto('/dashboard/template-builder/new')}
				class="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
			>
				+ Template Baru
			</button>
		</div>
	</div>

	{#if error}
		<div class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
			{error}
		</div>
	{/if}

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
		</div>
	{:else if filteredTemplates.length === 0}
		<div class="flex flex-col items-center justify-center py-20 text-center">
			<div class="mb-4 rounded-full bg-blue-50 p-4">
				<svg class="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
			</div>
			<h3 class="mb-1 text-lg font-semibold text-gray-700">Belum ada template</h3>
			<p class="mb-6 text-sm text-gray-500">{filterKategoriId ? 'Tidak ada template di kategori ini' : 'Buat template pertama Anda untuk mulai generate dokumen'}</p>
			<button
				onclick={() => goto('/dashboard/template-builder/new')}
				class="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
			>
				Buat Template Pertama
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredTemplates as template}
				<div class="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-gray-200 hover:shadow-md">
					<div class="mb-2 flex items-center gap-2">
						<h3 class="text-base font-bold text-gray-800">{template.name}</h3>
						{#if getKategoriNama(template.kategoriId)}
							<span class="shrink-0 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600">
								{getKategoriNama(template.kategoriId)}
							</span>
						{/if}
						{#if template.type === 'image'}
							<span class="shrink-0 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600">
								🖼 Gambar
							</span>
						{:else}
							<span class="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
								📄 Dokumen
							</span>
						{/if}
						{#if !isOwner(template)}
							<span class="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600" title="Dibuat oleh pengguna lain">
								Bersama
							</span>
						{/if}
					</div>
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
					<div class="flex items-center gap-2">
						{#if isOwner(template)}
							<button
								onclick={() => goto(`/dashboard/template-builder/${template._id}`)}
								class="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
							>
								Edit
							</button>
							<button
								onclick={() => (deleteConfirmId = template._id)}
								class="rounded-lg border border-red-200 px-2.5 py-2 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50"
								title="Hapus template"
							>
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
							</button>
						{:else}
							<button
								onclick={() => goto(`/dashboard/template-builder/${template._id}`)}
								class="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-50"
							>
								Lihat
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Delete Confirmation Modal -->
{#if deleteConfirmId}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onclick={() => (deleteConfirmId = null)} role="presentation">
		<div class="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onclick={(e) => e.stopPropagation()} role="dialog">
			<h3 class="mb-2 text-lg font-semibold text-gray-800">Hapus Template?</h3>
			<p class="mb-5 text-sm text-gray-500">Template yang dihapus tidak dapat dikembalikan.</p>
			<div class="flex justify-end gap-3">
				<button
					onclick={() => (deleteConfirmId = null)}
					class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
				>
					Batal
				</button>
				<button
					onclick={() => handleDelete(deleteConfirmId)}
					class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
				>
					Hapus
				</button>
			</div>
		</div>
	</div>
{/if}
