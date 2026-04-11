<script>
	const tools = [
		{
			href: '/dashboard/modul-ajar',
			title: 'Modul Ajar / RPP',
			description:
				'Buat RPP dan Modul Ajar sesuai Kurikulum Merdeka atau K13 dengan berbagai pilihan metode pembelajaran.',
			bgColor: 'bg-blue-100',
			iconColor: 'text-blue-600',
			btnColor: 'text-blue-600 hover:text-blue-700',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />`
		},
		{
			href: '/dashboard/lkpd',
			title: 'Lembar Kerja Siswa',
			description:
				'Buat LKPD (Lembar Kerja Peserta Didik) yang interaktif dan sesuai tujuan pembelajaran Anda.',
			bgColor: 'bg-emerald-100',
			iconColor: 'text-emerald-600',
			btnColor: 'text-emerald-600 hover:text-emerald-700',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />`
		},
		{
			href: '/dashboard/soal',
			title: 'Soal dan Ujian',
			description:
				'Generate soal pilihan ganda, esai, atau campuran dengan berbagai tingkat kesulitan secara otomatis.',
			bgColor: 'bg-violet-100',
			iconColor: 'text-violet-600',
			btnColor: 'text-violet-600 hover:text-violet-700',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`
		},
		{
			href: '/dashboard/ice-breaking',
			title: 'Ice Breaking Generator',
			description:
				'Ciptakan aktivitas ice breaking yang seru dan energik untuk membuat suasana kelas lebih hidup.',
			bgColor: 'bg-amber-100',
			iconColor: 'text-amber-600',
			btnColor: 'text-amber-600 hover:text-amber-700',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />`
		},
		{
			href: '/dashboard/ppt',
			title: 'PPT / Materi Ajar',
			description:
				'Buat kerangka presentasi dan slide materi ajar yang terstruktur dan menarik untuk digunakan di kelas.',
			bgColor: 'bg-cyan-100',
			iconColor: 'text-cyan-600',
			btnColor: 'text-cyan-600 hover:text-cyan-700',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />`
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
			6 FITUR UNGGULAN
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
