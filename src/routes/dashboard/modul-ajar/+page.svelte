<script>
	import { goto } from '$app/navigation';
	import { modulAjarStandarTemplate } from '$lib/templates/modul-ajar-standar.template.js';
	import { modulAjarTabelTemplate } from '$lib/templates/modul-ajar-tabel.template.js';
	import GenerateModal from '$lib/components/GenerateModal.svelte';

	let showModal = $state(false);
	let selectedTemplate = $state(null);

	const templates = [
		{
			...modulAjarStandarTemplate,
			available: true,
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />`,
			color: 'blue',
			previewSections: [
				'Identitas',
				'Capaian & Tujuan',
				'Kegiatan Pembelajaran',
				'Asesmen',
				'Refleksi'
			],
			previewStyle: 'Heading A/B/C/D + bullet list'
		},
		{
			...modulAjarTabelTemplate,
			available: true,
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18M10 4v16M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />`,
			color: 'teal',
			previewSections: [
				'Identitas',
				'Capaian & Tujuan',
				'Kegiatan Pembelajaran',
				'Asesmen',
				'Refleksi'
			],
			previewStyle: 'Tabel grid compact — cocok untuk dicetak'
		},
		{
			templateId: 'modul-p5',
			label: 'Modul Projek (P5)',
			description:
				'Projek Penguatan Profil Pelajar Pancasila — cocok untuk lintas mapel dan kegiatan projek',
			available: false,
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />`,
			color: 'violet',
			previewSections: ['Tema Projek', 'Dimensi PPP', 'Sub-elemen', 'Aktivitas', 'Asesmen'],
			previewStyle: 'Coming soon'
		}
	];

	const colorMap = {
		blue: {
			bg: 'bg-blue-100',
			icon: 'text-blue-600',
			badge: 'bg-blue-50 text-blue-700 border-blue-100',
			border: 'border-blue-200 shadow-blue-50',
			chip: 'bg-blue-50 text-blue-700'
		},
		teal: {
			bg: 'bg-teal-100',
			icon: 'text-teal-600',
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
		if (!template.available) return;
		selectedTemplate = template;
		showModal = true;
	}
</script>

<svelte:head>
	<title>Modul Ajar / RPP — Asisten Guru AI</title>
</svelte:head>

<div class="p-6">
	<!-- Breadcrumb -->
	<div class="mb-5 flex items-center gap-2 text-sm text-gray-400">
		<a href="/dashboard" class="transition-colors hover:text-blue-600">Dashboard</a>
		<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
		<span class="font-medium text-gray-700">RPP / Modul Ajar Generator</span>
	</div>

	<!-- Section header -->
	<div class="mb-5 flex items-center gap-3">
		<div class="h-5 w-1 rounded-full bg-blue-600"></div>
		<h2 class="text-base font-bold text-gray-800">Pilih Template Modul Ajar</h2>
		<span
			class="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-500"
		>
			{templates.length} Template
		</span>
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
							class="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-500 to-indigo-600
       px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200
       transition-all duration-150 hover:shadow-md hover:shadow-blue-300 active:scale-95"
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
</div>

<!-- Modal -->
{#if showModal && selectedTemplate}
	<GenerateModal
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
