<!-- src/routes/dashboard/template-builder/[id]/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import TemplateBuilder from '$lib/components/TemplateBuilder.svelte';

	let initialName = $state('');
	let initialDescription = $state('');
	let initialSections = $state([]);
	let templateJenis = $state('modul_ajar');
	let loading = $state(true);
	let notFound = $state(false);

	onMount(async () => {
		try {
			const res = await fetch(`/api/custom-templates/${$page.params.id}`);
			if (!res.ok) {
				if (res.status === 404) { notFound = true; loading = false; return; }
				goto('/dashboard/template-builder');
				return;
			}
			const { template } = await res.json();
			initialName = template.name || '';
			initialDescription = template.description || '';
			initialSections = template.sections || [];
			templateJenis = template.jenis || 'modul_ajar';
		} catch {
			goto('/dashboard/template-builder');
		} finally {
			loading = false;
		}
	});

	async function handleSave(name, description, sections) {
		const res = await fetch(`/api/custom-templates/${$page.params.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, description, sections, jenis: templateJenis })
		});

		if (res.ok) {
			goto('/dashboard/template-builder');
			return { success: true };
		}

		const err = await res.json().catch(() => ({}));
		return { success: false, error: err.error || 'Gagal memperbarui template' };
	}

	function handleCancel() {
		goto('/dashboard/template-builder');
	}
</script>

<svelte:head>
	<title>Edit Template — Asisten Guru AI</title>
</svelte:head>

<div class="p-6">
	<!-- Breadcrumb -->
	<div class="mb-5 flex items-center gap-2 text-sm text-gray-400">
		<a href="/dashboard" class="transition-colors hover:text-blue-600">Dashboard</a>
		<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
		<a href="/dashboard/template-builder" class="transition-colors hover:text-purple-600">Template Saya</a>
		<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
		<span class="font-medium text-gray-700">Edit</span>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20 text-gray-400">
			<svg class="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
			</svg>
			<span class="ml-3">Memuat template...</span>
		</div>
	{:else if notFound}
		<div class="flex flex-col items-center justify-center py-20 text-center">
			<p class="mb-2 text-lg font-semibold text-gray-700">Template tidak ditemukan</p>
			<p class="mb-6 text-sm text-gray-500">Template ini mungkin sudah dihapus.</p>
			<a
				href="/dashboard/template-builder"
				class="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
			>
				Kembali ke Template Saya
			</a>
		</div>
	{:else}
		<TemplateBuilder
			mode="edit"
			jenis={templateJenis}
			initialName={initialName}
			initialDescription={initialDescription}
			initialSections={initialSections}
			onSave={handleSave}
			onCancel={handleCancel}
		/>
	{/if}
</div>
