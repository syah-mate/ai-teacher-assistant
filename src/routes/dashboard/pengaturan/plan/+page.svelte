<script>
	let currentPlan = $state('Plus');
	let showUpgradeModal = $state(false);
	let selectedPlan = $state('');

	const plans = [
		{
			name: 'Plus',
			price: 'Gratis',
			period: '',
			description: 'Perfect untuk memulai dengan fitur dasar',
			color: 'blue',
			current: true,
			benefits: [
				'Akses ke semua generator dasar',
				'Maksimal 50 generasi per bulan',
				'Template standar',
				'Dukungan email',
				'Penyimpanan cloud 1GB'
			]
		},
		{
			name: 'Pro',
			price: 'Rp 199.000',
			period: '/bulan',
			description: 'Untuk guru profesional yang membutuhkan lebih',
			color: 'purple',
			current: false,
			benefits: [
				'Semua fitur Plus',
				'Generasi tanpa batas',
				'Template premium & kustom',
				'Integrasi Google Drive penuh',
				'Dukungan prioritas 24/7',
				'Penyimpanan cloud 10GB',
				'Export ke berbagai format',
				'Analitik pembelajaran',
				'Kolaborasi tim (5 anggota)'
			]
		},
		{
			name: 'Institution',
			price: 'Custom',
			period: '',
			description: 'Solusi lengkap untuk institusi pendidikan',
			color: 'emerald',
			current: false,
			benefits: [
				'Semua fitur Pro',
				'Unlimited users',
				'Dedicated account manager',
				'Custom branding',
				'SSO & Advanced security',
				'Penyimpanan unlimited',
				'API access',
				'Training & onboarding',
				'Custom integrations',
				'SLA 99.9% uptime',
				'Dedicated server option'
			]
		}
	];

	function handleUpgrade(planName) {
		if (planName === 'Plus') return;
		selectedPlan = planName;
		showUpgradeModal = true;
	}

	function closeModal() {
		showUpgradeModal = false;
		selectedPlan = '';
	}

	function getColorClasses(color) {
		const colors = {
			blue: {
				bg: 'bg-blue-50',
				border: 'border-blue-200',
				text: 'text-blue-600',
				badge: 'bg-blue-100 text-blue-700',
				button: 'bg-blue-600 hover:bg-blue-700 text-white',
				buttonOutline: 'border-blue-600 text-blue-600 hover:bg-blue-50'
			},
			purple: {
				bg: 'bg-purple-50',
				border: 'border-purple-200',
				text: 'text-purple-600',
				badge: 'bg-purple-100 text-purple-700',
				button: 'bg-purple-600 hover:bg-purple-700 text-white',
				buttonOutline: 'border-purple-600 text-purple-600 hover:bg-purple-50'
			},
			emerald: {
				bg: 'bg-emerald-50',
				border: 'border-emerald-200',
				text: 'text-emerald-600',
				badge: 'bg-emerald-100 text-emerald-700',
				button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
				buttonOutline: 'border-emerald-600 text-emerald-600 hover:bg-emerald-50'
			}
		};
		return colors[color];
	}
</script>

<svelte:head>
	<title>Plan — Asisten Guru AI</title>
</svelte:head>

<div class="p-6">
	<!-- Header -->
	<div class="mb-6">
		<div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
			<a href="/dashboard" class="hover:text-blue-600">Dashboard</a>
			<span>/</span>
			<span class="text-gray-800 font-medium">Plan</span>
		</div>
		<h1 class="text-2xl font-bold text-gray-800">Kelola Plan</h1>
		<p class="text-gray-600 mt-1">
			Pilih paket yang sesuai dengan kebutuhan Anda
		</p>
	</div>

	<!-- Current plan banner -->
	<div class="mb-8 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm font-medium text-blue-100 mb-1">Plan Aktif Sekarang</p>
				<h2 class="text-2xl font-bold">{currentPlan}</h2>
			</div>
			<div class="rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
				<svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
					/>
				</svg>
			</div>
		</div>
	</div>

	<!-- Plans grid -->
	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each plans as plan}
			{@const colors = getColorClasses(plan.color)}
			<div
				class="relative flex flex-col rounded-xl border-2 {plan.current
					? colors.border + ' ' + colors.bg
					: 'border-gray-200 bg-white'} p-6 shadow-sm transition-all hover:shadow-md"
			>
				<!-- Current badge -->
				{#if plan.current}
					<div class="absolute -top-3 left-6">
						<span class="rounded-full {colors.badge} px-3 py-1 text-xs font-semibold">
							Plan Aktif
						</span>
					</div>
				{/if}

				<!-- Plan header -->
				<div class="mb-4">
					<h3 class="text-xl font-bold text-gray-800">{plan.name}</h3>
					<p class="mt-1 text-sm text-gray-600">{plan.description}</p>
				</div>

				<!-- Price -->
				<div class="mb-6">
					<div class="flex items-baseline gap-1">
						<span class="text-3xl font-bold {colors.text}">{plan.price}</span>
						{#if plan.period}
							<span class="text-sm text-gray-500">{plan.period}</span>
						{/if}
					</div>
				</div>

				<!-- Benefits -->
				<div class="mb-6 flex-1">
					<p class="mb-3 text-sm font-semibold text-gray-700">Benefit:</p>
					<ul class="space-y-2">
						{#each plan.benefits as benefit}
							<li class="flex items-start gap-2 text-sm text-gray-600">
								<svg
									class="mt-0.5 h-4 w-4 shrink-0 {colors.text}"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span>{benefit}</span>
							</li>
						{/each}
					</ul>
				</div>

				<!-- CTA Button -->
				<button
					onclick={() => handleUpgrade(plan.name)}
					disabled={plan.current}
					class="w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {plan.current
						? 'bg-gray-100 text-gray-400'
						: colors.button + ' focus:ring-' + plan.color + '-500'}"
				>
					{plan.current ? 'Plan Aktif' : plan.name === 'Institution' ? 'Hubungi Sales' : 'Upgrade ke ' + plan.name}
				</button>
			</div>
		{/each}
	</div>

	<!-- Comparison note -->
	<div class="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-6">
		<div class="flex items-start gap-3">
			<div class="rounded-lg bg-blue-100 p-2">
				<svg class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
			<div>
				<h4 class="font-semibold text-gray-800 mb-1">Butuh bantuan memilih?</h4>
				<p class="text-sm text-gray-600">
					Tim kami siap membantu Anda menemukan plan yang tepat. Hubungi kami di
					<a href="mailto:support@asistenguru.ai" class="text-blue-600 hover:text-blue-700 underline">
						support@asistenguru.ai
					</a>
					atau WhatsApp
					<a href="https://wa.me/6281234567890" class="text-blue-600 hover:text-blue-700 underline">
						0812-3456-7890
					</a>
				</p>
			</div>
		</div>
	</div>
</div>

<!-- Upgrade Modal -->
{#if showUpgradeModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onclick={closeModal}>
		<div
			class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-xl font-bold text-gray-800">Upgrade ke {selectedPlan}</h3>
				<button
					onclick={closeModal}
					class="text-gray-400 hover:text-gray-600 transition-colors"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<p class="mb-6 text-sm text-gray-600">
				{#if selectedPlan === 'Institution'}
					Silakan hubungi tim sales kami untuk mendapatkan penawaran khusus yang disesuaikan dengan kebutuhan institusi Anda.
				{:else}
					Anda akan diarahkan ke halaman pembayaran untuk menyelesaikan proses upgrade.
				{/if}
			</p>

			<div class="flex gap-3">
				<button
					onclick={closeModal}
					class="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
				>
					Batal
				</button>
				<button
					onclick={() => {
						if (selectedPlan === 'Institution') {
							window.open('mailto:sales@asistenguru.ai?subject=Inquiry Institution Plan', '_blank');
						} else {
							// Redirect ke halaman pembayaran (frontend only demo)
							alert('Demo: Redirect ke halaman pembayaran');
						}
						closeModal();
					}}
					class="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
				>
					{selectedPlan === 'Institution' ? 'Hubungi Sales' : 'Lanjutkan'}
				</button>
			</div>
		</div>
	</div>
{/if}
