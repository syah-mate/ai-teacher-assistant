<script>
	import { selectedThinking, AI_MODELS, THINKING_LEVELS } from '$lib/stores/modelStore.js';

	let currentModelMeta = $derived(AI_MODELS.find((m) => m.id === $selectedModel));
	let supportsReasoning = $derived(currentModelMeta?.supportsReasoning ?? false);

	let showTooltip = $state(false);
	let tooltipLevel = $state(null);

	function handleSelect(levelId) {
		selectedThinking.select(levelId);
	}

	function showTip(levelId) {
		tooltipLevel = levelId;
		showTooltip = true;
	}

	function hideTip() {
		showTooltip = false;
		tooltipLevel = null;
	}
</script>

{#if supportsReasoning}
	<div class="relative hidden items-center gap-1 sm:flex" aria-label="Thinking effort selector">
		<!-- Label kecil -->
		<span class="mr-1 text-xs font-medium text-gray-400">Thinking:</span>

		<!-- Pills -->
		{#each THINKING_LEVELS as level}
			<div class="relative">
				<button
					onclick={() => handleSelect(level.id)}
					onmouseenter={() => showTip(level.id)}
					onmouseleave={hideTip}
					class="relative h-7 rounded-md px-2.5 text-xs font-semibold transition-all duration-150
						{$selectedThinking === level.id
							? level.id === 'low'
								? 'bg-sky-100 text-sky-700 ring-1 ring-sky-300'
								: level.id === 'medium'
									? 'bg-violet-100 text-violet-700 ring-1 ring-violet-300'
									: 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
							: 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'}"
					title="{level.icon} {level.description}"
					aria-pressed={$selectedThinking === level.id}
				>
					{level.label}
				</button>

				<!-- Tooltip -->
				{#if showTooltip && tooltipLevel === level.id}
					<div
						class="absolute top-full left-1/2 z-50 mt-2 w-48 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-2.5 shadow-lg"
						role="tooltip"
					>
						<p class="mb-0.5 text-xs font-semibold text-gray-800">{level.icon} {level.label}</p>
						<p class="text-xs leading-relaxed text-gray-500">{level.description}</p>
						<!-- Arrow -->
						<div class="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-t border-l border-gray-200 bg-white"></div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}
