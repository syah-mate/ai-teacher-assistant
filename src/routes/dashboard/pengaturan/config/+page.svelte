<script>
  import { onMount } from 'svelte';

  // ── Data model lists (hardcode agar tidak perlu import server-side) ──
  const TEXT_MODELS = [
    { id: 'google/gemini-3.5-flash', label: 'Gemini 3.5 Flash', provider: 'Google', supportsReasoning: true },
    { id: 'x-ai/grok-4.3', label: 'Grok 4.3', provider: 'xAI', supportsReasoning: true },
    { id: 'openai/gpt-5.5', label: 'GPT-5.5', provider: 'OpenAI', supportsReasoning: false },
    { id: 'openai/gpt-5.4-nano', label: 'GPT-5.4 Nano', provider: 'OpenAI', supportsReasoning: true }
  ];

  const THINKING_LEVELS = [
    { id: 'low', label: 'Low', icon: '⚡', description: 'Lebih cepat, hemat token. Cocok konten sederhana.' },
    { id: 'medium', label: 'Medium', icon: '⚖️', description: 'Keseimbangan kecepatan dan kualitas. Rekomendasi default.' },
    { id: 'high', label: 'High', icon: '🧠', description: 'Reasoning mendalam. Lebih lambat, hasil lebih akurat.' }
  ];

  const IMAGE_MODELS = [
    { id: 'bytedance-seed/seedream-4.5', label: 'Seedream 4.5', description: 'ByteDance. Cepat & kreatif.' },
    { id: 'google/gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image', description: 'Google. Cepat dengan pemahaman konteks kuat.' },
    { id: 'openai/gpt-5-image-mini', label: 'GPT-5 Image Mini', description: 'OpenAI. Ringan, efisien, hasil tajam.' }
  ];

  // ── State ──
  let loading = $state(true);
  let saving = $state(false);
  let saveSuccess = $state(false);
  let saveError = $state('');

  let textModel = $state('google/gemini-3.5-flash');
  let thinkingEffort = $state('medium');
  let imageModel = $state('bytedance-seed/seedream-4.5');
  let lastUpdatedAt = $state(null);

  let currentTextModelMeta = $derived(TEXT_MODELS.find(m => m.id === textModel));
  let supportsReasoning = $derived(currentTextModelMeta?.supportsReasoning ?? false);

  onMount(async () => {
    try {
      const res = await fetch('/api/config/ai-model');
      if (res.ok) {
        const data = await res.json();
        textModel = data.textModel;
        thinkingEffort = data.thinkingEffort;
        imageModel = data.imageModel;
        lastUpdatedAt = data.updatedAt;
      }
    } catch {
      // pakai default state
    } finally {
      loading = false;
    }
  });

  async function handleSave() {
    saving = true;
    saveSuccess = false;
    saveError = '';

    try {
      const res = await fetch('/api/config/ai-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textModel, thinkingEffort, imageModel })
      });

      const data = await res.json();

      if (!res.ok) {
        saveError = data.error || 'Gagal menyimpan config';
        return;
      }

      saveSuccess = true;
      lastUpdatedAt = data.config?.updatedAt;
      setTimeout(() => (saveSuccess = false), 3000);
    } catch {
      saveError = 'Terjadi kesalahan jaringan. Coba lagi.';
    } finally {
      saving = false;
    }
  }
</script>

<div class="mx-auto max-w-2xl p-6 md:p-8">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-2xl font-bold text-gray-900">Config AI Model</h1>
    <p class="mt-1 text-sm text-gray-500">
      Pilihan model di sini berlaku global untuk semua proses generate. Perubahan langsung aktif untuk job berikutnya.
    </p>
    {#if lastUpdatedAt}
      <p class="mt-1 text-xs text-gray-400">
        Terakhir diperbarui: {new Date(lastUpdatedAt).toLocaleString('id-ID')}
      </p>
    {/if}
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-16">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
    </div>
  {:else}
    <div class="space-y-6">

      <!-- ── Section 1: Text Generation Model ── -->
      <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div class="mb-4 flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
            <svg class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 class="text-sm font-semibold text-gray-800">AI Model Text Generation</h2>
            <p class="text-xs text-gray-400">Digunakan untuk generate konten dokumen (Modul Ajar, LKPD, dll)</p>
          </div>
        </div>

        <!-- Model cards -->
        <div class="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {#each TEXT_MODELS as model}
            <button
              type="button"
              onclick={() => (textModel = model.id)}
              class="flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all {textModel === model.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}"
            >
              <div class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 {textModel === model.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}">
                {#if textModel === model.id}
                  <div class="h-1.5 w-1.5 rounded-full bg-white"></div>
                {/if}
              </div>
              <div>
                <p class="text-sm font-semibold {textModel === model.id ? 'text-blue-700' : 'text-gray-700'}">{model.label}</p>
                <p class="text-xs text-gray-400">{model.provider}{model.supportsReasoning ? ' · Supports Thinking' : ''}</p>
              </div>
            </button>
          {/each}
        </div>

        <!-- Thinking Effort (conditional) -->
        {#if supportsReasoning}
          <div class="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Thinking Effort</p>
            <div class="flex gap-2">
              {#each THINKING_LEVELS as level}
                <button
                  type="button"
                  onclick={() => (thinkingEffort = level.id)}
                  title="{level.icon} {level.description}"
                  class="flex flex-1 flex-col items-center gap-1 rounded-lg border-2 px-3 py-2.5 text-center text-xs font-semibold transition-all {thinkingEffort === level.id
                    ? level.id === 'low'
                      ? 'border-sky-400 bg-sky-50 text-sky-700'
                      : level.id === 'medium'
                        ? 'border-violet-400 bg-violet-50 text-violet-700'
                        : 'border-amber-400 bg-amber-50 text-amber-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-white'}"
                >
                  <span class="text-base">{level.icon}</span>
                  <span>{level.label}</span>
                </button>
              {/each}
            </div>
            <p class="mt-2 text-xs text-gray-400">
              {THINKING_LEVELS.find(l => l.id === thinkingEffort)?.description}
            </p>
          </div>
        {:else}
          <div class="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center text-xs text-gray-400">
            Model ini tidak mendukung Thinking / Reasoning
          </div>
        {/if}
      </div>

      <!-- ── Section 2: Image Generation Model ── -->
      <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div class="mb-4 flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
            <svg class="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 class="text-sm font-semibold text-gray-800">AI Model Image Generation</h2>
            <p class="text-xs text-gray-400">Digunakan untuk generate worksheet gambar (Match Column, Word Search, dll)</p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {#each IMAGE_MODELS as model}
            <button
              type="button"
              onclick={() => (imageModel = model.id)}
              class="flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all {imageModel === model.id
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}"
            >
              <div class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 {imageModel === model.id ? 'border-purple-500 bg-purple-500' : 'border-gray-300'}">
                {#if imageModel === model.id}
                  <div class="h-1.5 w-1.5 rounded-full bg-white"></div>
                {/if}
              </div>
              <div>
                <p class="text-sm font-semibold {imageModel === model.id ? 'text-purple-700' : 'text-gray-700'}">{model.label}</p>
                <p class="text-xs text-gray-400">{model.description}</p>
              </div>
            </button>
          {/each}
        </div>
      </div>

      <!-- ── Save Button & Feedback ── -->
      {#if saveError}
        <div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {saveError}
        </div>
      {/if}

      {#if saveSuccess}
        <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          ✓ Config berhasil disimpan. Berlaku untuk job generate berikutnya.
        </div>
      {/if}

      <button
        type="button"
        onclick={handleSave}
        disabled={saving}
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {#if saving}
          <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
          Menyimpan...
        {:else}
          Simpan Config
        {/if}
      </button>

    </div>
  {/if}
</div>
