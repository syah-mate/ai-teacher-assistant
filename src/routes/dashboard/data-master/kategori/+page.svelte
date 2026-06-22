<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let kategori = $state([]);
	let loading = $state(true);
	let error = $state('');
	let showModal = $state(false);
	let editingId = $state(null);
	let formNama = $state('');
	let formDeskripsi = $state('');
	let saving = $state(false);
	let deleteConfirmId = $state(null);

	let currentUserId = $derived($page.data.user?.id || $page.data.user?._id?.toString() || null);

	onMount(loadKategori);

	async function loadKategori() {
		loading = true;
		try {
			const res = await fetch('/api/kategori');
			if (res.ok) {
				const data = await res.json();
				kategori = data.kategori || [];
			} else {
				error = 'Gagal memuat kategori';
			}
		} catch {
			error = 'Gagal terhubung ke server';
		} finally {
			loading = false;
		}
	}

	function isOwner(kat) {
		return kat.userId === currentUserId;
	}

	function openCreate() {
		editingId = null;
		formNama = '';
		formDeskripsi = '';
		showModal = true;
	}

	function openEdit(kat) {
		editingId = kat._id;
		formNama = kat.nama;
		formDeskripsi = kat.deskripsi || '';
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingId = null;
		formNama = '';
		formDeskripsi = '';
	}

	async function handleSave() {
		if (!formNama.trim()) {
			error = 'Nama kategori wajib diisi';
			return;
		}
		saving = true;
		error = '';
		try {
			let res;
			if (editingId) {
				res = await fetch(`/api/kategori/${editingId}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ nama: formNama.trim(), deskripsi: formDeskripsi.trim() })
				});
			} else {
				res = await fetch('/api/kategori', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ nama: formNama.trim(), deskripsi: formDeskripsi.trim() })
				});
			}
			const data = await res.json();
			if (res.ok) {
				closeModal();
				await loadKategori();
			} else {
				error = data.error || 'Gagal menyimpan';
			}
		} catch {
			error = 'Gagal terhubung ke server';
		} finally {
			saving = false;
		}
	}

	async function handleDelete(id) {
		try {
			const res = await fetch(`/api/kategori/${id}`, { method: 'DELETE' });
			if (res.ok) {
				kategori = kategori.filter((k) => k._id !== id);
				deleteConfirmId = null;
			} else {
				error = 'Gagal menghapus kategori';
			}
		} catch {
			error = 'Gagal terhubung ke server';
		}
	}
</script>

<svelte:head>
	<title>Kategori — Asisten Guru AI</title>
</svelte:head>

<div class="p-6">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-800">Kategori</h1>
			<p class="mt-1 text-sm text-gray-500">Kelola kategori untuk mengelompokkan template</p>
		</div>
		<button
			onclick={openCreate}
			class="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
		>
			+ Kategori Baru
		</button>
	</div>

	{#if error}
		<div class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
			{error}
			<button class="ml-2 underline" onclick={() => (error = '')}>Tutup</button>
		</div>
	{/if}

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
		</div>
	{:else if kategori.length === 0}
		<div class="flex flex-col items-center justify-center py-20 text-center">
			<div class="mb-4 rounded-full bg-blue-50 p-4">
				<svg class="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
				</svg>
			</div>
			<h3 class="mb-1 text-lg font-semibold text-gray-700">Belum ada kategori</h3>
			<p class="mb-6 text-sm text-gray-500">Buat kategori untuk mengelompokkan template Anda</p>
			<button
				onclick={openCreate}
				class="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
			>
				Buat Kategori Pertama
			</button>
		</div>
	{:else}
		<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
			<table class="w-full text-left text-sm">
				<thead class="border-b border-gray-100 bg-gray-50">
					<tr>
						<th class="px-5 py-3 font-semibold text-gray-600">Nama Kategori</th>
						<th class="px-5 py-3 font-semibold text-gray-600">Deskripsi</th>
						<th class="px-5 py-3 font-semibold text-gray-600 text-center">Template</th>
						<th class="px-5 py-3 font-semibold text-gray-600 text-right">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each kategori as kat (kat._id)}
						<tr class="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
							<td class="px-5 py-3.5 font-medium text-gray-800">
								{kat.nama}
								{#if !isOwner(kat)}
									<span class="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600" title="Dibuat oleh pengguna lain">Bersama</span>
								{/if}
							</td>
							<td class="px-5 py-3.5 text-gray-500">{kat.deskripsi || '-'}</td>
							<td class="px-5 py-3.5 text-center">
								<span class="inline-flex items-center justify-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
									{kat.templateCount ?? 0}
								</span>
							</td>
							<td class="px-5 py-3.5 text-right">
								<div class="flex items-center justify-end gap-2">
									{#if isOwner(kat)}
										<button
											onclick={() => openEdit(kat)}
											class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
										>
											Edit
										</button>
										<button
											onclick={() => (deleteConfirmId = kat._id)}
											class="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50"
											title="Hapus"
										>
											<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- Create / Edit Modal -->
{#if showModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onclick={closeModal} role="presentation">
		<div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onclick={(e) => e.stopPropagation()} role="dialog">
			<h3 class="mb-4 text-lg font-semibold text-gray-800">
				{editingId ? 'Edit Kategori' : 'Kategori Baru'}
			</h3>

			<div class="mb-4">
				<label class="mb-1.5 block text-sm font-medium text-gray-700">Nama Kategori *</label>
				<input
					type="text"
					bind:value={formNama}
					placeholder="Contoh: Modul Ajar"
					class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				/>
			</div>

			<div class="mb-5">
				<label class="mb-1.5 block text-sm font-medium text-gray-700">Deskripsi</label>
				<textarea
					bind:value={formDeskripsi}
					rows="2"
					placeholder="Deskripsi singkat kategori..."
					class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				></textarea>
			</div>

			<div class="flex justify-end gap-3">
				<button
					onclick={closeModal}
					class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
				>
					Batal
				</button>
				<button
					onclick={handleSave}
					disabled={saving}
					class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{saving ? 'Menyimpan...' : 'Simpan'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Delete Confirmation Modal -->
{#if deleteConfirmId}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onclick={() => (deleteConfirmId = null)} role="presentation">
		<div class="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onclick={(e) => e.stopPropagation()} role="dialog">
			<h3 class="mb-2 text-lg font-semibold text-gray-800">Hapus Kategori?</h3>
			<p class="mb-5 text-sm text-gray-500">
				Kategori yang dihapus tidak dapat dikembalikan. Template yang menggunakan kategori ini akan menjadi tanpa kategori.
			</p>
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
