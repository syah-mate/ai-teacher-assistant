<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';

  let remaining = $state(null);   // null = loading
  let loading = $state(true);
  let error = $state(false);

  async function fetchQuota() {
    if (!browser) return;
    try {
      const res = await fetch('/api/user/quota');
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      remaining = data.remaining ?? 0;
      error = false;
    } catch {
      error = true;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchQuota();

    // Refresh kuota setiap kali generate sukses
    const handleQuotaUpdated = () => fetchQuota();
    window.addEventListener('quota-updated', handleQuotaUpdated);

    return () => {
      window.removeEventListener('quota-updated', handleQuotaUpdated);
    };
  });

  // Expose fungsi refresh untuk dipanggil dari luar jika perlu
  export function refresh() {
    fetchQuota();
  }

  // Warna indikator berdasarkan sisa kuota
  const colorClass = $derived(() => {
    if (remaining === null || loading) return 'text-gray-400';
    if (remaining === 0) return 'text-red-600';
    if (remaining <= 3) return 'text-amber-600';
    return 'text-emerald-600';
  });

  const bgClass = $derived(() => {
    if (remaining === null || loading) return 'bg-gray-50 border-gray-200';
    if (remaining === 0) return 'bg-red-50 border-red-200';
    if (remaining <= 3) return 'bg-amber-50 border-amber-200';
    return 'bg-emerald-50 border-emerald-200';
  });
</script>

<div class="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold {bgClass()}">
  {#if loading}
    <!-- Skeleton loading -->
    <div class="h-3 w-16 animate-pulse rounded bg-gray-200"></div>
  {:else if error}
    <span class="text-gray-400">—</span>
  {:else}
    <!-- Icon kuota -->
    <svg class="h-3.5 w-3.5 {colorClass()}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M3 10h18M3 14h18M10 3v18M14 3v18" />
    </svg>

    <span class="{colorClass()}">
      Sisa Kuota:
      <strong>{remaining}</strong>
    </span>

    {#if remaining === 0}
      <!-- Link ke halaman plan jika kuota habis -->
      <button
        onclick={() => goto('/dashboard/pengaturan/plan')}
        class="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-700 hover:bg-red-200 transition-colors"
      >
        Upgrade
      </button>
    {/if}
  {/if}
</div>
