<script>
	import { tick } from 'svelte';

	/**
	 * @typedef {{ type: string, action: string, name?: string, message: string, timestamp: Date, batch?: number, agents?: string[] }} LogEntry
	 */

	/** @type {{ logs: LogEntry[], isVisible?: boolean }} */
	let { logs = [], isVisible = true } = $props();

	let consoleEl = $state(null);
	let isCollapsed = $state(false);
	let autoScroll = $state(true);

	// Auto-scroll to bottom when new logs arrive
	$effect(() => {
		if (logs.length && autoScroll && !isCollapsed && consoleEl) {
			tick().then(() => {
				if (consoleEl) consoleEl.scrollTop = consoleEl.scrollHeight;
			});
		}
	});

	function handleScroll() {
		if (!consoleEl) return;
		const atBottom = consoleEl.scrollHeight - consoleEl.scrollTop - consoleEl.clientHeight < 40;
		autoScroll = atBottom;
	}

	/** @param {LogEntry} entry */
	function getEntryStyle(entry) {
		const { type, action } = entry;
		if (type === 'orchestrator') return { color: 'text-purple-400', icon: '🎯', dot: 'bg-purple-500' };
		if (type === 'orchestrator-ai') {
			if (action === 'pipeline_start' || action === 'pipeline_done') return { color: 'text-purple-400', icon: '🎯', dot: 'bg-purple-500' };
			if (action === 'briefing') return { color: 'text-fuchsia-400', icon: '🧠', dot: 'bg-fuchsia-500' };
			if (action === 'spawning') return { color: 'text-indigo-400', icon: '🚀', dot: 'bg-indigo-500' };
			if (action === 'section_done') return { color: 'text-purple-300', icon: '✓', dot: 'bg-purple-400' };
			if (action === 'warn') return { color: 'text-yellow-300', icon: '⚠', dot: 'bg-yellow-400' };
			return { color: 'text-purple-400', icon: '◆', dot: 'bg-purple-500' };
		}
		if (type === 'agent') {
			if (action === 'batch_start') return { color: 'text-blue-400', icon: '📦', dot: 'bg-blue-500' };
			if (action === 'batch_done') return { color: 'text-blue-300', icon: '✓', dot: 'bg-blue-400' };
			if (action === 'start') return { color: 'text-cyan-400', icon: '▶', dot: 'bg-cyan-500' };
			if (action === 'completed') return { color: 'text-green-400', icon: '✅', dot: 'bg-green-500' };
			return { color: 'text-blue-400', icon: '◆', dot: 'bg-blue-500' };
		}
		if (type === 'sub-agent') {
			if (action === 'start') return { color: 'text-cyan-300', icon: '⚡', dot: 'bg-cyan-500' };
			if (action === 'done') return { color: 'text-emerald-400', icon: '✓', dot: 'bg-emerald-500' };
			if (action === 'error') return { color: 'text-red-400', icon: '✗', dot: 'bg-red-500' };
			return { color: 'text-cyan-300', icon: '·', dot: 'bg-cyan-400' };
		}
		if (type === 'tool') {
			if (action === 'start') return { color: 'text-yellow-400', icon: '🔧', dot: 'bg-yellow-500' };
			if (action === 'done') return { color: 'text-emerald-400', icon: '✓', dot: 'bg-emerald-500' };
			if (action === 'error') return { color: 'text-red-400', icon: '✗', dot: 'bg-red-500' };
			if (action === 'warn') return { color: 'text-yellow-300', icon: '⚠', dot: 'bg-yellow-400' };
			return { color: 'text-yellow-400', icon: '·', dot: 'bg-yellow-500' };
		}
		return { color: 'text-gray-400', icon: '·', dot: 'bg-gray-500' };
	}

	function formatTime(date) {
		return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	}

	/** Count active (started but not done/error) sub-agents & tools */
	function getActiveCount() {
		const started = new Set();
		const finished = new Set();
		for (const log of logs) {
			const key = `${log.type}:${log.name}`;
			if (log.action === 'start') started.add(key);
			if (log.action === 'done' || log.action === 'error' || log.action === 'warn') finished.add(key);
		}
		let active = 0;
		for (const k of started) if (!finished.has(k)) active++;
		return active;
	}
</script>

{#if isVisible && logs.length > 0}
	<div class="mt-6 overflow-hidden rounded-xl border border-gray-700 bg-gray-950 font-mono text-xs shadow-lg">
		<!-- Header bar -->
		<div class="flex items-center justify-between border-b border-gray-700 bg-gray-900 px-4 py-2">
			<div class="flex items-center gap-2">
				<!-- Traffic lights -->
				<span class="h-3 w-3 rounded-full bg-red-500"></span>
				<span class="h-3 w-3 rounded-full bg-yellow-500"></span>
				<span class="h-3 w-3 rounded-full bg-green-500"></span>
				<span class="ml-2 text-gray-400">Agent Console</span>
				{#if getActiveCount() > 0}
					<span class="ml-1 flex items-center gap-1 rounded-full bg-blue-900 px-2 py-0.5 text-blue-300">
						<span class="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400"></span>
						{getActiveCount()} aktif
					</span>
				{/if}
				<span class="text-gray-600">{logs.length} event</span>
			</div>
			<div class="flex items-center gap-3">
				{#if !autoScroll}
					<button
						onclick={() => { autoScroll = true; if (consoleEl) consoleEl.scrollTop = consoleEl.scrollHeight; }}
						class="text-gray-500 hover:text-gray-300"
						title="Scroll ke bawah"
					>↓ scroll ke bawah</button>
				{/if}
				<button
					onclick={() => (isCollapsed = !isCollapsed)}
					class="text-gray-500 hover:text-gray-300"
					title={isCollapsed ? 'Perluas' : 'Ciutkan'}
				>
					{isCollapsed ? '▼ buka' : '▲ tutup'}
				</button>
			</div>
		</div>

		{#if !isCollapsed}
			<!-- Log entries -->
			<div
				bind:this={consoleEl}
				onscroll={handleScroll}
				class="max-h-72 overflow-y-auto scroll-smooth px-1 py-2"
				style="scrollbar-width: thin; scrollbar-color: #374151 transparent;"
			>
				{#each logs as entry (entry)}
					{@const style = getEntryStyle(entry)}
					<div class="group flex items-start gap-2 rounded px-3 py-1 hover:bg-gray-900">
						<!-- Timestamp -->
						<span class="mt-0.5 shrink-0 text-gray-600">{formatTime(entry.timestamp)}</span>

						<!-- Type badge -->
						<span class="mt-0.5 shrink-0">
							<span class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] {style.color} bg-gray-800">
								<span class="h-1.5 w-1.5 rounded-full {style.dot}"></span>
								{entry.type}
							</span>
						</span>

						<!-- Icon + message -->
						<span class="{style.color} flex-1 leading-relaxed">
							<span class="mr-1">{style.icon}</span>{entry.message}
						</span>

						<!-- Agent list for batch_start -->
						{#if entry.agents && entry.agents.length > 0}
							<span class="ml-2 shrink-0 text-gray-600">
								[{entry.agents.join(', ')}]
							</span>
						{/if}
					</div>
				{/each}

				<!-- Blinking cursor at end when active -->
				{#if getActiveCount() > 0}
					<div class="px-3 py-1 text-gray-600">
						<span class="animate-pulse">█</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
