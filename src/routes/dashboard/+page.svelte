<script>
	const tools = [
		{
			href: '/dashboard/template-builder',
			title: 'Template Saya',
			description:
				'Buat dan kelola template generate dokumen Anda sendiri. Tentukan section, field, dan prompt sesuai kebutuhan mengajar.',
			bgColor: 'bg-blue-100',
			iconColor: 'text-blue-600',
			btnColor: 'text-blue-600 hover:text-blue-700',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />`
		},
		{
			href: '/dashboard/riwayat',
			title: 'Riwayat Generate',
			description:
				'Lihat semua dokumen yang sudah Anda generate. Buka, edit, atau download dalam format HTML.',
			bgColor: 'bg-emerald-100',
			iconColor: 'text-emerald-600',
			btnColor: 'text-emerald-600 hover:text-emerald-700',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />`
		}
	];
</script>

<svelte:head>
	<title>Dashboard — Asisten Guru AI</title>
</svelte:head>

<div class="p-6">
	<!-- Hero banner -->
	<div
		class="relative mb-8 overflow-hidden rounded-2xl bg-linear-to-r from-blue-600 to-indigo-700 p-8 text-white"
	>
		<div
			class="absolute top-0 right-0 h-64 w-64 -translate-y-1/2 translate-x-1/4 rounded-full bg-white/5"
		></div>
		<div
			class="absolute bottom-0 left-1/3 h-48 w-48 translate-y-1/2 rounded-full bg-white/5"
		></div>
		<div class="relative z-10">
			<div
				class="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/20 px-4 py-1.5 text-sm font-medium backdrop-blur-sm"
			>
				<span class="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
				LAYANAN AKTIF
			</div>
			<h1 class="mb-2 text-2xl font-bold md:text-3xl">Selamat Datang, Guru! 👋</h1>
			<p class="max-w-xl text-sm text-blue-100 md:text-base">
				Manfaatkan kecerdasan buatan untuk mempersiapkan pembelajaran Anda lebih cepat, efisien, dan
				berkualitas tinggi.
			</p>
		</div>
	</div>

	<!-- Tools header -->
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="h-6 w-1 rounded-full bg-blue-600"></div>
			<h2 class="text-xl font-bold text-gray-800">Pilih Alat Bantu Mengajar</h2>
		</div>
		<span
			class="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
		>
	2 AKSI UTAMA
		</span>
	</div>

	<!-- Tool cards grid -->
	<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
		{#each tools as tool}
			<div
				class="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-gray-200 hover:shadow-md"
			>
				<div
					class="{tool.bgColor} mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-105"
				>
					<svg
						class="h-7 w-7 {tool.iconColor}"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						{@html tool.icon}
					</svg>
				</div>
				<h3 class="mb-2 text-base font-bold text-gray-800">{tool.title}</h3>
				<p class="mb-5 text-sm leading-relaxed text-gray-500">{tool.description}</p>
				<a
					href={tool.href}
					class="inline-flex items-center gap-1 text-sm font-semibold transition-colors {tool.btnColor}"
				>
					BUKA TOOLS
					<svg
						class="h-4 w-4 transition-transform group-hover:translate-x-0.5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 8l4 4m0 0l-4 4m4-4H3"
						/>
					</svg>
				</a>
			</div>
		{/each}
	</div>

	<!-- Footer -->
	<!-- <div class="mt-12 border-t border-gray-100 pt-6 text-center text-sm text-gray-400">
		<p>
			© 2026 TwinLabs —
			<span class="font-medium text-red-500">DILARANG MEMBAGIKAN LINK INI KEPADA SIAPAPUN</span>
		</p>
		<p class="mt-1">support email: TwinLabs@gmail.com</p>
	</div> -->
</div>
