<script>
	let form = $state({
		pageName: '',
		purpose: '',
		targetAudience: 'siswa',
		mainFeatures: [],
		ctaText: 'Daftar Sekarang',
		colorTheme: 'professional-blue',
		sections: ['hero', 'features', 'about', 'cta'],
		additionalRequirements: ''
	});

	let isGenerating = $state(false);
	let output = $state('');
	let copied = $state(false);

	const audienceOptions = [
		{ value: 'siswa', label: 'Siswa/Peserta Didik' },
		{ value: 'orang-tua', label: 'Orang Tua' },
		{ value: 'guru', label: 'Guru/Pendidik' },
		{ value: 'umum', label: 'Umum' }
	];

	const themeOptions = [
		{ value: 'professional-blue', label: 'Professional Blue' },
		{ value: 'creative-gradient', label: 'Creative Gradient' },
		{ value: 'minimalist-clean', label: 'Minimalist Clean' },
		{ value: 'bold-modern', label: 'Bold Modern' },
		{ value: 'warm-friendly', label: 'Warm & Friendly' }
	];

	const sectionOptions = [
		{ value: 'hero', label: 'Hero Section (Header)' },
		{ value: 'features', label: 'Fitur/Keunggulan' },
		{ value: 'about', label: 'Tentang/Deskripsi' },
		{ value: 'testimonial', label: 'Testimoni' },
		{ value: 'gallery', label: 'Galeri/Portfolio' },
		{ value: 'faq', label: 'FAQ' },
		{ value: 'contact', label: 'Kontak' },
		{ value: 'cta', label: 'Call-to-Action' }
	];

	function generateLandingPageGuide() {
		const {
			pageName,
			purpose,
			targetAudience,
			mainFeatures,
			ctaText,
			colorTheme,
			sections,
			additionalRequirements
		} = form;
		const audienceLabel = audienceOptions.find((a) => a.value === targetAudience)?.label || '';
		const themeLabel = themeOptions.find((t) => t.value === colorTheme)?.label || '';
		const includedSections = sections
			.map((s) => sectionOptions.find((sec) => sec.value === s)?.label)
			.filter(Boolean);

		return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PANDUAN LANDING PAGE WEBSITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 INFORMASI WEBSITE

Nama Halaman    : ${pageName || '[Nama Landing Page]'}
Tujuan          : ${purpose || '[Tujuan landing page]'}
Target Audience : ${audienceLabel}
CTA Button      : "${ctaText}"
Tema Desain     : ${themeLabel}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUKTUR HALAMAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sections yang Disertakan:
${includedSections.map((s, i) => `${i + 1}. ${s}`).join('\n') || '- Belum ada section'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DETAIL KONTEN SETIAP SECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${
	sections.includes('hero')
		? `═══════════════════════════════════════════
【 1. HERO SECTION 】
═══════════════════════════════════════════

┌─────────────────────────────────────────┐
│  NAVBAR                                 │
│  [Logo] Home | Tentang | Fitur | Kontak│
├─────────────────────────────────────────┤
│                                         │
│     [HERO IMAGE/ILLUSTRATION]           │
│                                         │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    │
│  ┃  ${pageName || 'JUDUL HALAMAN'}  ┃    │
│  ┃  Font: Bold, 48-72px            ┃    │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    │
│                                         │
│  Tagline/Deskripsi singkat menarik      │
│  ${purpose || 'tentang tujuan halaman ini'}│
│                                         │
│  ┌─────────────────┐                   │
│  │  ${ctaText}     │ ← Primary Button  │
│  └─────────────────┘                   │
│                                         │
└─────────────────────────────────────────┘

KONTEN:
• Headline: ${pageName || '[Judul menarik]'}
• Subheadline: Jelaskan value proposition dalam 1-2 kalimat
• CTA Button: "${ctaText}"
• Visual: Ilustrasi/foto relevan dengan ${purpose}

`
		: ''
}${
			sections.includes('features')
				? `═══════════════════════════════════════════
【 2. FITUR/KEUNGGULAN SECTION 】
═══════════════════════════════════════════

┌─────────────────────────────────────────┐
│  Keunggulan Kami / Fitur Utama          │
│                                         │
│  ┌───────┐  ┌───────┐  ┌───────┐      │
│  │ Icon1 │  │ Icon2 │  │ Icon3 │      │
│  │       │  │       │  │       │      │
│  │Fitur 1│  │Fitur 2│  │Fitur 3│      │
│  │ desc  │  │ desc  │  │ desc  │      │
│  └───────┘  └───────┘  └───────┘      │
│                                         │
${mainFeatures.length > 0 ? `│  Fitur yang ditampilkan:                │\n${mainFeatures.map((f, i) => `│  ${i + 1}. ${f}                             │`).join('\n')}\n` : ''}
└─────────────────────────────────────────┘

KONTEN:
${
	mainFeatures.length > 0
		? mainFeatures
				.map(
					(f, i) => `• Fitur ${i + 1}: ${f}
  Icon: [Pilih icon relevan]
  Deskripsi: [Jelaskan manfaat fitur]`
				)
				.join('\n\n')
		: '• Fitur 1: [Keunggulan pertama]\n  Icon: [Icon]\n  Deskripsi: [Manfaat]'
}

`
				: ''
		}${
			sections.includes('about')
				? `═══════════════════════════════════════════
【 3. TENTANG/DESKRIPSI SECTION 】
═══════════════════════════════════════════

┌─────────────────────────────────────────┐
│  ┌────────────┐   Tentang Kami          │
│  │   Image/   │                         │
│  │Ilustrasi   │   ${purpose || 'Deskripsi tujuan'}│
│  │            │                         │
│  └────────────┘   [Paragraf penjelasan  │
│                    lengkap tentang...]   │
│                                         │
│                   Target: ${audienceLabel}│
└─────────────────────────────────────────┘

KONTEN:
• Judul: "Tentang ${pageName || 'Program/Kegiatan'}"
• Deskripsi: Jelaskan detail ${purpose}
• Target audience: ${audienceLabel}
• Visual pendukung (foto/ilustrasi)

`
				: ''
		}${
			sections.includes('testimonial')
				? `═══════════════════════════════════════════
【 4. TESTIMONI SECTION 】
═══════════════════════════════════════════

┌─────────────────────────────────────────┐
│  Apa Kata Mereka?                       │
│                                         │
│  ┌───────────────┐ ┌───────────────┐   │
│  │ "Testimoni 1" │ │ "Testimoni 2" │   │
│  │ - Nama        │ │ - Nama        │   │
│  │ - ${audienceLabel}    │ │ - ${audienceLabel}    │   │
│  └───────────────┘ └───────────────┘   │
└─────────────────────────────────────────┘

KONTEN:
• Kumpulkan 3-5 testimoni dari ${audienceLabel}
• Format: Quote + Nama + Foto/Avatar
• Pastikan testimoni authentic dan spesifik

`
				: ''
		}${
			sections.includes('gallery')
				? `═══════════════════════════════════════════
【 5. GALERI/PORTFOLIO SECTION 】
═══════════════════════════════════════════

┌─────────────────────────────────────────┐
│  Galeri                                 │
│                                         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│  │Img1│ │Img2│ │Img3│ │Img4│          │
│  └────┘ └────┘ └────┘ └────┘          │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│  │Img5│ │Img6│ │Img7│ │Img8│          │
│  └────┘ └────┘ └────┘ └────┘          │
└─────────────────────────────────────────┘

KONTEN:
• Foto-foto kegiatan/produk terkait ${purpose}
• Grid layout 3-4 kolom
• Lightbox untuk preview besar

`
				: ''
		}${
			sections.includes('faq')
				? `═══════════════════════════════════════════
【 6. FAQ SECTION 】
═══════════════════════════════════════════

┌─────────────────────────────────────────┐
│  Pertanyaan yang Sering Diajukan        │
│                                         │
│  ▼ Pertanyaan 1                         │
│    Jawaban pertanyaan 1...              │
│                                         │
│  ▼ Pertanyaan 2                         │
│    Jawaban pertanyaan 2...              │
│                                         │
│  ▼ Pertanyaan 3                         │
│    Jawaban pertanyaan 3...              │
└─────────────────────────────────────────┘

KONTEN:
• Buat 5-8 FAQ relevan dengan ${purpose}
• Format accordion (bisa expand/collapse)
• Jawaban singkat dan jelas

`
				: ''
		}${
			sections.includes('contact')
				? `═══════════════════════════════════════════
【 7. KONTAK SECTION 】
═══════════════════════════════════════════

┌─────────────────────────────────────────┐
│  Hubungi Kami                           │
│                                         │
│  ┌─────────────┐   📍 Alamat           │
│  │   FORM      │   [Alamat lengkap]    │
│  │  - Nama     │                       │
│  │  - Email    │   📞 Telepon          │
│  │  - Pesan    │   [Nomor telepon]     │
│  │  [Submit]   │                       │
│  └─────────────┘   ✉️ Email           │
│                     [Email@example.com]│
└─────────────────────────────────────────┘

KONTEN:
• Form kontak: Nama, Email, Pesan
• Informasi kontak: Alamat, Telepon, Email
• Map embed (optional)

`
				: ''
		}${
			sections.includes('cta')
				? `═══════════════════════════════════════════
【 8. CALL-TO-ACTION SECTION 】
═══════════════════════════════════════════

┌─────────────────────────────────────────┐
│                                         │
│     Siap untuk Bergabung?               │
│                                         │
│  ${purpose || 'Deskripsi singkat motivasi untuk action'}│
│                                         │
│     ┌───────────────────┐              │
│     │  ${ctaText}       │              │
│     └───────────────────┘              │
│                                         │
└─────────────────────────────────────────┘

KONTEN:
• Headline mendorong action
• Brief motivational text
• Big prominent CTA button: "${ctaText}"

`
				: ''
		}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【 FOOTER 】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Logo dan nama sekolah/institusi
• Quick links (Tentang, Fitur, Kontak, dll)
• Social media icons
• Copyright © 2024

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PANDUAN WARNA: ${themeLabel}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${
	colorTheme === 'professional-blue'
		? `Primary    : #2563EB (Blue)
Secondary  : #64748B (Slate)
Background : #F8FAFC (Light)
Text       : #1E293B (Dark)
Accent     : #3B82F6 (Bright Blue)`
		: colorTheme === 'creative-gradient'
			? `Primary    : Linear gradient #6366F1 → #EC4899
Secondary  : #8B5CF6 (Purple)
Background : #FFFFFF (White)
Text       : #111827 (Black)
Accent     : #F59E0B (Amber)`
			: colorTheme === 'minimalist-clean'
				? `Primary    : #000000 (Black)
Secondary  : #F3F4F6 (Light Gray)
Background : #FFFFFF (White)
Text       : #374151 (Gray)
Accent     : #10B981 (Green)`
				: colorTheme === 'bold-modern'
					? `Primary    : #DC2626 (Red)
Secondary  : #1F2937 (Dark Gray)
Background : #F9FAFB (Off White)
Text       : #111827 (Black)
Accent     : #F59E0B (Orange)`
					: `Primary    : #F97316 (Orange)
Secondary  : #FEF3C7 (Warm Yellow)
Background : #FFFBEB (Cream)
Text       : #78350F (Brown)
Accent     : #FB923C (Light Orange)`
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TIPS DESAIN LANDING PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Mobile-first responsive design
✓ Fast loading speed (optimize images)
✓ Clear visual hierarchy
✓ Gunakan white space dengan baik
✓ CTA button yang menonjol dan jelas
✓ Maksimal 3 font berbeda
✓ Konsisten dengan brand identity
✓ Tambahkan micro-interactions
✓ SEO friendly (meta tags, headings)
✓ Accessibility (alt text, contrast)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIREMENTS TAMBAHAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${additionalRequirements || 'Tidak ada requirement tambahan'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REKOMENDASI TOOL PEMBUATAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WEBSITE BUILDER (No Code):
• Wix (https://wix.com) - Drag & drop, banyak template
• WordPress + Elementor - Flexible, powerful
• Webflow (https://webflow.com) - Design freedom
• Carrd (https://carrd.co) - Simple, one-page
• Google Sites - Gratis, mudah, terintegrasi

FRAMEWORK (Coding):
• HTML + CSS + JavaScript - Custom dari awal
• Bootstrap - Responsive components
• Tailwind CSS - Utility-first styling
• React/Next.js - Modern framework
• Svelte/SvelteKit - Fast & simple

LANGKAH PEMBUATAN:
1. Pilih platform sesuai skill (no-code vs coding)
2. Buat wireframe/mockup struktur halaman
3. Terapkan tema warna ${themeLabel}
4. Buat semua section: ${includedSections.join(', ')}
5. Tambahkan konten dan visual
6. Test responsiveness (mobile, tablet, desktop)
7. Optimize untuk SEO dan kecepatan
8. Deploy dan share URL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Dibuat dengan Asisten Guru AI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
	}

	async function handleGenerate(e) {
		e.preventDefault();
		if (!form.pageName || !form.purpose) return;
		isGenerating = true;
		output = '';
		await new Promise((r) => setTimeout(r, 2000));
		output = generateLandingPageGuide();
		isGenerating = false;
	}

	async function copyOutput() {
		await navigator.clipboard.writeText(output);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function toggleSection(value) {
		const index = form.sections.indexOf(value);
		if (index === -1) {
			form.sections = [...form.sections, value];
		} else {
			form.sections = form.sections.filter((s) => s !== value);
		}
	}

	function addFeature() {
		if (form.mainFeatures.length < 6) {
			form.mainFeatures = [...form.mainFeatures, ''];
		}
	}

	function removeFeature(index) {
		form.mainFeatures = form.mainFeatures.filter((_, i) => i !== index);
	}

	function updateFeature(index, value) {
		form.mainFeatures = form.mainFeatures.map((f, i) => (i === index ? value : f));
	}
</script>

<svelte:head>
	<title>Buat Landing Page — Asisten Guru AI</title>
</svelte:head>

<div class="p-6">
	<!-- Breadcrumb -->
	<div class="mb-4 flex items-center gap-2 text-sm text-gray-500">
		<a href="/dashboard" class="hover:text-blue-600">Dashboard</a>
		<span>/</span>
		<span class="font-medium text-gray-800">Buat Landing Page</span>
	</div>

	<!-- Page header -->
	<div class="mb-6 flex items-center gap-4">
		<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100">
			<svg class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
				/>
			</svg>
		</div>
		<div>
			<h1 class="text-2xl font-bold text-gray-800">Buat Landing Page Website</h1>
			<p class="text-sm text-gray-500">
				Generate panduan lengkap untuk membuat landing page website
			</p>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
		<!-- Form -->
		<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
			<h2 class="mb-5 text-base font-semibold text-gray-700">Informasi Landing Page</h2>
			<form onsubmit={handleGenerate} class="space-y-4">
				<div>
					<label for="page-name-input" class="mb-1 block text-sm font-medium text-gray-700"
						>Nama Halaman *</label
					>
					<input
						id="page-name-input"
						type="text"
						bind:value={form.pageName}
						placeholder="Contoh: Program Beasiswa Siswa Berprestasi"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
						required
					/>
				</div>

				<div>
					<label for="purpose-input" class="mb-1 block text-sm font-medium text-gray-700"
						>Tujuan Landing Page *</label
					>
					<textarea
						id="purpose-input"
						bind:value={form.purpose}
						placeholder="Contoh: Mempromosikan program beasiswa dan mengumpulkan pendaftar"
						rows="2"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
						required
					></textarea>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="audience-select" class="mb-1 block text-sm font-medium text-gray-700"
							>Target Audience</label
						>
						<select
							id="audience-select"
							bind:value={form.targetAudience}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
						>
							{#each audienceOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="theme-select" class="mb-1 block text-sm font-medium text-gray-700"
							>Tema Warna</label
						>
						<select
							id="theme-select"
							bind:value={form.colorTheme}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
						>
							{#each themeOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
				</div>

				<div>
					<label for="cta-input" class="mb-1 block text-sm font-medium text-gray-700"
						>Teks CTA Button</label
					>
					<input
						id="cta-input"
						type="text"
						bind:value={form.ctaText}
						placeholder="Contoh: Daftar Sekarang, Hubungi Kami, Download Sekarang"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
					/>
				</div>

				<div>
					<div class="mb-2 flex items-center justify-between">
						<p class="block text-sm font-medium text-gray-700">Fitur/Keunggulan Utama</p>
						<button
							type="button"
							onclick={addFeature}
							disabled={form.mainFeatures.length >= 6}
							class="text-xs text-indigo-600 hover:text-indigo-700 disabled:text-gray-400"
						>
							+ Tambah Fitur
						</button>
					</div>
					{#each form.mainFeatures as feature, index}
						<div class="mb-2 flex gap-2">
							<input
								type="text"
								value={feature}
								oninput={(e) => updateFeature(index, e.target.value)}
								placeholder="Contoh: Gratis Biaya Pendaftaran"
								class="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
							/>
							<button
								type="button"
								onclick={() => removeFeature(index)}
								class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
							>
								×
							</button>
						</div>
					{/each}
					{#if form.mainFeatures.length === 0}
						<p class="text-xs text-gray-400">Klik "+ Tambah Fitur" untuk menambahkan</p>
					{/if}
				</div>

				<div>
					<p class="mb-2 block text-sm font-medium text-gray-700">
						Section yang Disertakan
					</p>
					<div class="grid grid-cols-2 gap-2">
						{#each sectionOptions as option}
							<label class="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									checked={form.sections.includes(option.value)}
									onchange={() => toggleSection(option.value)}
									class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
								/>
								<span class="text-gray-700">{option.label}</span>
							</label>
						{/each}
					</div>
				</div>

				<div>
					<label for="additional-input" class="mb-1 block text-sm font-medium text-gray-700"
						>Requirements Tambahan</label
					>
					<textarea
						id="additional-input"
						bind:value={form.additionalRequirements}
						placeholder="Tambahkan requirement khusus, fitur special, atau notes lainnya"
						rows="2"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
					></textarea>
				</div>

				<button
					type="submit"
					disabled={isGenerating}
					class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if isGenerating}
						<span class="flex items-center justify-center gap-2">
							<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Generating...
						</span>
					{:else}
						🚀 Generate Panduan Landing Page
					{/if}
				</button>
			</form>
		</div>

		<!-- Output -->
		<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-base font-semibold text-gray-700">Hasil Panduan</h2>
				{#if output}
					<button
						onclick={copyOutput}
						class="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
					>
						{#if copied}
							<svg class="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							Tersalin!
						{:else}
							<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
								/>
							</svg>
							Salin
						{/if}
					</button>
				{/if}
			</div>
			{#if output}
				<div class="rounded-lg bg-gray-50 p-4">
					<pre
						class="max-h-150 overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-gray-700">{output}</pre>
				</div>
			{:else}
				<div class="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-200">
					<div class="text-center">
						<svg
							class="mx-auto mb-3 h-12 w-12 text-gray-300"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
							/>
						</svg>
						<p class="text-sm text-gray-500">Panduan landing page akan muncul di sini</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
