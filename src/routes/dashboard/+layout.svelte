<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import QuotaIndicator from '$lib/components/QuotaIndicator.svelte';
	import { goto } from '$app/navigation';

	let { children, data } = $props();
	let sidebarOpen = $state(false);
	let quotaIndicator;
	let kategoriList = $state([]);

	onMount(async () => {
		try {
			const res = await fetch('/api/kategori');
			if (res.ok) {
				const d = await res.json();
				kategoriList = d.kategori || [];
			}
		} catch { /* silent */ }
	});

	async function handleLogout() {
		try {
			await fetch('/logout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: new URLSearchParams()
			});
			goto('/login');
		} catch (error) {
			console.error('Logout error:', error);
		}
	}

	const navItems = [];


	const settingsItems = [
		{
			href: '/dashboard/pengaturan/plan',
			label: 'Plan',
			icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
		}
	];

	const historyItem = {
		href: '/dashboard/riwayat',
		label: 'Riwayat Generate',
		icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
	};
</script>

<div class="flex min-h-screen bg-gray-50">
	<!-- Mobile overlay -->
	{#if sidebarOpen}
		<div
			class="fixed inset-0 z-20 bg-black/50 lg:hidden"
			onclick={() => (sidebarOpen = false)}
			role="presentation"
		></div>
	{/if}

	<!-- Sidebar -->
	<aside
		class="fixed top-0 left-0 z-30 flex h-screen w-64 flex-col bg-white shadow-lg transition-transform duration-300 {sidebarOpen
			? 'translate-x-0'
			: '-translate-x-full'} lg:sticky lg:z-auto lg:translate-x-0"
	>
		<!-- Logo -->
		<div class="border-b border-gray-100 p-5">
			<div class="flex items-center gap-3">
				<div class="shrink-0 rounded-xl bg-blue-600 p-2">
					<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 14l9-5-9-5-9 5 9 5z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
						/>
					</svg>
				</div>
				<div>
					<p class="text-sm font-bold leading-tight text-gray-800">Asisten Guru AI</p>
					<!-- <p class="text-xs text-gray-400">BY TwinLabs</p> -->
				</div>
			</div>
		</div>

		<!-- Nav -->
		<nav class="flex-1 overflow-y-auto p-4">
			<p class="mb-2 px-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">Navigasi</p>
			<a
				href="/dashboard"
				class="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors {$page.url
					.pathname === '/dashboard'
					? 'bg-blue-600 text-white'
					: 'text-gray-600 hover:bg-gray-100'}"
			>
				<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
					/>
				</svg>
				Beranda Utama
			</a>

			<p class="mt-5 mb-2 px-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
				Data Master
			</p>
			<a
				href="/dashboard/data-master/kategori"
				class="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors {$page.url.pathname.startsWith('/dashboard/data-master/kategori')
					? 'border border-blue-100 bg-blue-50 text-blue-700'
					: 'text-gray-600 hover:bg-gray-100'}"
			>
				<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
				</svg>
				<span class="truncate">Kategori</span>
			</a>
			<a
				href="/dashboard/template-builder"
				class="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors {$page.url.pathname.startsWith('/dashboard/template-builder')
					? 'border border-blue-100 bg-blue-50 text-blue-700'
					: 'text-gray-600 hover:bg-gray-100'}"
			>
				<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				<span class="truncate">Template</span>
			</a>

			<p class="mt-5 mb-2 px-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
				AI Generation
			</p>
			{#if kategoriList.length > 0}
				{#each kategoriList as kat}
					<a
						href="/dashboard/ai-generation/{kat._id}"
						class="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors {$page.url.pathname === '/dashboard/ai-generation/' + kat._id
							? 'border border-emerald-100 bg-emerald-50 text-emerald-700'
							: 'text-gray-600 hover:bg-gray-100'}"
					>
						<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
						<span class="truncate">{kat.nama}</span>
					</a>
				{/each}
			{:else}
				<p class="px-2 text-xs text-gray-400 italic">Belum ada kategori</p>
			{/if}

			<p class="mt-5 mb-2 px-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
				Riwayat
			</p>
			<a
				href={historyItem.href}
				class="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors {$page.url.pathname.startsWith(historyItem.href)
					? 'border border-blue-100 bg-blue-50 text-blue-700'
					: 'text-gray-600 hover:bg-gray-100'}"
			>
				<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={historyItem.icon} />
				</svg>
				<span class="truncate">{historyItem.label}</span>
			</a>

			<p class="mt-5 mb-2 px-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
				Pengaturan
			</p>
			{#each settingsItems as item}
				<a
					href={item.href}
					class="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors {$page
						.url.pathname === item.href
						? 'border border-blue-100 bg-blue-50 text-blue-700'
						: 'text-gray-600 hover:bg-gray-100'}"
				>
					<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
					</svg>
					<span class="truncate">{item.label}</span>
				</a>
			{/each}

			<!-- Config AI Model link -->
			<a
				href="/dashboard/pengaturan/config"
				class="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors {$page.url.pathname === '/dashboard/pengaturan/config'
					? 'border border-blue-100 bg-blue-50 text-blue-700'
					: 'text-gray-600 hover:bg-gray-100'}"
			>
				<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
				</svg>
				<span class="truncate">Config AI Model</span>
			</a>
		</nav>

		<!-- User info -->
		<div class="border-t border-gray-100 p-4">
			<div class="mb-3 flex items-center gap-3">
				<div
					class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white"
				>
					{data.user?.name?.charAt(0) ?? 'G'}
				</div>
				<div class="min-w-0">
					<p class="truncate text-sm font-semibold text-gray-800">{data.user?.name ?? 'Guru'}</p>
					<p class="truncate text-xs text-gray-400">{data.user?.role ?? ''}</p>
				</div>
			</div>
			<form method="POST" action="/logout">
				<button
					type="submit"
					class="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
						/>
					</svg>
					Keluar
				</button>
			</form>
		</div>
	</aside>

	<!-- Main content -->
	<div class="flex min-h-screen flex-1 flex-col">
		<!-- Top header -->
		<header
			class="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3"
		>
			<div class="flex items-center gap-4">
				<button
					class="text-gray-500 hover:text-gray-700 lg:hidden"
					onclick={() => (sidebarOpen = !sidebarOpen)}
					aria-label="Toggle sidebar"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				</button>
				<div class="hidden items-center gap-3 sm:flex">
					<div class="rounded-lg bg-blue-600 p-1.5">
						<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 14l9-5-9-5-9 5 9 5z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
							/>
						</svg>
					</div>
					<div>
						<p class="text-sm font-semibold text-gray-800">Asisten Guru AI</p>
						<p class="text-xs text-gray-400">Kerjaan Beres Tanpa Ribet</p>
					</div>
				</div>
			</div>
			<div class="flex items-center gap-3">

				<!-- Quota Indicator -->
				<QuotaIndicator bind:this={quotaIndicator} />

				<span
					class="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
				>
					<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
					SISTEM AKTIF
				</span>
				<button
					onclick={handleLogout}
					class="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
					title="Keluar"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
						/>
					</svg>
				</button>
			</div>
		</header>

		<!-- Page content -->
		<main class="flex-1">
			{@render children()}
		</main>
	</div>
</div>
