<!-- src/routes/dashboard/template-builder/new/+page.svelte -->
<script>
	import { goto } from '$app/navigation';
	import TemplateBuilder from '$lib/components/TemplateBuilder.svelte';

	async function handleSave(name, description, sections) {
		const res = await fetch('/api/custom-templates', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, description, sections })
		});

		if (res.ok) {
			goto('/dashboard/template-builder');
			return { success: true };
		}

		const err = await res.json().catch(() => ({}));
		return { success: false, error: err.error || 'Gagal menyimpan template' };
	}

	function handleCancel() {
		goto('/dashboard/template-builder');
	}
</script>

<svelte:head>
	<title>Buat Template Baru — Asisten Guru AI</title>
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
		<span class="font-medium text-gray-700">Buat Baru</span>
	</div>

	<TemplateBuilder
		mode="create"
		onSave={handleSave}
		onCancel={handleCancel}
	/>
</div>
