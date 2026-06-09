<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { lkpdStandarTemplate } from '$lib/templates/lkpd-standar.template.js';
	import { lkpdTabelTemplate } from '$lib/templates/lkpd-tabel.template.js';
	import LKPDGenerateModal from '$lib/components/LKPDGenerateModal.svelte';

	let showModal = $state(false);
	let selectedTemplate = $state(null);
	let customTemplates = $state([]);

	onMount(async () => {
		try {
			const res = await fetch('/api/custom-templates');
			if (res.ok) {
				const data = await res.json();
				customTemplates = (data.templates ?? []).filter(t => t.jenis === 'lkpd');
			}
		} catch {
			// ignore
		}
	});

	const templates = [
		{
			...lkpdStandarTemplate,
			available: true,
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />`,
			color: 'emerald',
			previewSections: ['Capaian Pembelajaran', 'Ringkasan Materi', 'Langkah Kerja', 'Penilaian'],
			previewStyle: 'Heading sections + ruang jawaban siswa'
		},
		{
			...lkpdTabelTemplate,
			available: true,
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18M10 4v16M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />`,
			color: 'teal',
			previewSections: ['Capaian Pembelajaran', 'Ringkasan Materi', 'Langkah Kerja', 'Penilaian'],
			previewStyle: 'Layout tabel compact — cocok untuk dicetak'
		}
	];

	const colorMap = {
		emerald: {
			bg: 'bg-emerald-100', icon: 'text-emerald-600',
			badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
			border: 'border-emerald-200 shadow-emerald-50',
			chip: 'bg-emerald-50 text-emerald-700'
		},
		teal: {
			bg: 'bg-teal-100', icon: 'text-teal-600',
			badge: 'bg-teal-50 text-teal-700 border-teal-100',
			border: 'border-teal-200 shadow-teal-50',
			chip: 'bg-teal-50 text-teal-700'
		},
		violet: {
			bg: 'bg-violet-100',
			icon: 'text-violet-600',
			badge: 'bg-gray-100 text-gray-500 border-gray-200',
			border: 'border-gray-200',
			chip: 'bg-gray-100 text-gray-500'
		}
	};

	function handlePilih(template) {
		if (template.available === false) return;
		selectedTemplate = template;
		showModal = true;
	}

	function handleEdit(ct) {
		goto(`/dashboard/template-builder/${ct._id}`);
	}

	async function handleHapus(ct) {
		if (!confirm(`Hapus template "${ct.name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
		try {
			const res = await fetch(`/api/custom-templates/${ct._id}`, { method: 'DELETE' });
			if (res.ok) {
				customTemplates = customTemplates.filter(t => t._id !== ct._id);
			} else {
				alert('Gagal menghapus template');
			}
		} catch {
			alert('Gagal menghapus template');
		}
	}
</script>

<svelte:head>
	<title>LKPD Generator — Asisten Guru AI</title>
</svelte:head>

<div class="p-6">
	<!-- Breadcrumb -->
	<div class="mb-5 flex items-center gap-2 text-sm text-gray-400">
		<a href="/dashboard" class="transition-colors hover:text-emerald-600">Dashboard</a>
		<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
		<span class="font-medium text-gray-700">LKPD Generator</span>
	</div>

	<!-- Section header dengan tombol Buat Template Baru -->
	<div class="mb-5 flex items-center justify-between gap-3">
		<div class="flex items-center gap-3">
			<div class="h-5 w-1 rounded-full bg-emerald-600"></div>
			<h2 class="text-base font-bold text-gray-800">Pilih Template LKPD</h2>
			<span
				class="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-500"
			>
				{templates.length} Template
			</span>
		</div>
		<a
			href="/dashboard/template-builder/new?jenis=lkpd"
			class="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-purple-300
				px-4 py-2 text-sm font-medium text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-all"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Buat Template Baru
		</a>
	</div>

	<!-- Template cards -->
	<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
		{#each templates as template}
			{@const c = colorMap[template.color]}
			<div
				class="group relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-all duration-200
{template.available
					? `${c.border} hover:-translate-y-0.5 hover:shadow-md`
					: 'border-gray-200 opacity-60'}"
			>
				<!-- Top row: icon + badge -->
				<div class="mb-4 flex items-start justify-between">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl {c.bg} transition-transform group-hover:scale-105"
					>
						<svg class="h-6 w-6 {c.icon}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							{@html template.icon}
						</svg>
					</div>
					<span class="rounded-full border px-2.5 py-0.5 text-xs font-semibold {c.badge}">
						{template.available ? '✓ Tersedia' : '🔒 Segera Hadir'}
					</span>
				</div>

				<!-- Title + description -->
				<h3 class="mb-1.5 text-base font-bold text-gray-800">{template.label}</h3>
				<p class="mb-4 text-sm leading-relaxed text-gray-500">{template.description}</p>

				<!-- Section chips -->
				<div class="mb-3 flex flex-wrap gap-1.5">
					{#each template.previewSections as s}
						<span class="rounded-md px-2 py-0.5 text-xs font-medium {c.chip}">{s}</span>
					{/each}
				</div>

				{#if template.previewStyle && template.available}
					<p class="mb-4 text-xs italic text-gray-400">{template.previewStyle}</p>
				{:else}
					<div class="mb-4"></div>
				{/if}

				<!-- Divider -->
				<div class="mb-4 border-t border-gray-100"></div>

				<!-- Footer: section count + CTA -->
				<div class="mt-auto flex items-center justify-between gap-3">
					<span class="text-xs text-gray-400">
						{template.previewSections.length} Bagian Dokumen
					</span>
					{#if template.available}
						<button
							onclick={() => handlePilih(template)}
							class="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600
       px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-200
       transition-all duration-150 hover:shadow-md hover:shadow-emerald-300 active:scale-95"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 10V3L4 14h7v7l9-11h-7z"
								/>
							</svg>
							Generate dengan AI
						</button>
					{:else}
						<span
							class="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-400"
						>
							🔒 Segera Hadir
						</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- Section Template Kustom -->
	{#if customTemplates.length > 0}
		<div class="mt-8 mb-5 flex items-center gap-3">
			<div class="h-5 w-1 rounded-full bg-purple-500"></div>
			<h2 class="text-base font-bold text-gray-800">Template Saya</h2>
			<span class="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
				{customTemplates.length} Template
			</span>
		</div>
		<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
			{#each customTemplates as ct}
				<div class="group relative flex flex-col rounded-2xl border border-purple-200 bg-white p-6 shadow-sm
					transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-purple-50">
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
					<h3 class="mb-1.5 text-base font-bold text-gray-800">{ct.name}</h3>
					<p class="mb-4 text-sm text-gray-500">{ct.description || 'Tidak ada deskripsi'}</p>
					<div class="mb-3 flex flex-wrap gap-1.5">
						{#each ct.sections.slice(0, 5) as s}
							<span class="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">{s.title}</span>
						{/each}
						{#if ct.sections.length > 5}
							<span class="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-400">+{ct.sections.length - 5} lagi</span>
						{/if}
					</div>
					<div class="mt-auto border-t border-gray-100 pt-4 flex items-center justify-between gap-2">
						<div class="flex items-center gap-1">
							<button
								onclick={() => handleEdit(ct)}
								class="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
							>
								Edit
							</button>
							<button
								onclick={() => handleHapus(ct)}
								class="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
							>
								Hapus
							</button>
						</div>
						<button
							onclick={() => handlePilih(ct)}
							class="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-purple-500 to-indigo-600
								px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-200
								transition-all hover:shadow-md hover:shadow-purple-300 active:scale-95"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
							Generate dengan AI
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Modal -->
{#if showModal && selectedTemplate}
	<LKPDGenerateModal
		template={selectedTemplate}
		onClose={() => {
			showModal = false;
			selectedTemplate = null;
		}}
		onSuccess={(jobId) => {
			void jobId;
			showModal = false;
			selectedTemplate = null;
			window.dispatchEvent(new CustomEvent('quota-updated'));
			goto('/dashboard/riwayat');
		}}
	/>
{/if}

