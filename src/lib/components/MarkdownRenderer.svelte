<script>
	import { renderMarkdown } from '$lib/utils/markdown.js';

	/** @type {string} */
	export let content = '';

	$: html = renderMarkdown(content);
</script>

<div class="prose-content">
	{@html html}
</div>

<style>
	.prose-content :global(h1),
	.prose-content :global(h2),
	.prose-content :global(h3) {
		font-weight: 700;
		margin-top: 1.5rem;
		margin-bottom: 0.5rem;
		line-height: 1.3;
	}

	.prose-content :global(h1) {
		font-size: 1.75rem;
	}
	.prose-content :global(h2) {
		font-size: 1.4rem;
	}
	.prose-content :global(h3) {
		font-size: 1.15rem;
	}

	.prose-content :global(p) {
		margin-bottom: 0.75rem;
		line-height: 1.7;
	}

	.prose-content :global(ul),
	.prose-content :global(ol) {
		padding-left: 1.5rem;
		margin-bottom: 0.75rem;
	}

	.prose-content :global(li) {
		margin-bottom: 0.25rem;
		line-height: 1.6;
	}

	.prose-content :global(strong) {
		font-weight: 700;
	}

	.prose-content :global(em) {
		font-style: italic;
	}

	.prose-content :global(code) {
		background: #f3f4f6;
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
		font-size: 0.875em;
		font-family: 'Courier New', monospace;
	}

	.prose-content :global(pre) {
		background: #1e293b;
		color: #e2e8f0;
		padding: 1rem;
		border-radius: 8px;
		overflow-x: auto;
		margin-bottom: 1rem;
	}

	.prose-content :global(pre code) {
		background: none;
		padding: 0;
		color: inherit;
	}

	.prose-content :global(blockquote) {
		border-left: 4px solid #6366f1;
		padding-left: 1rem;
		color: #6b7280;
		margin: 1rem 0;
		font-style: italic;
	}

	.prose-content :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1rem;
	}

	.prose-content :global(th),
	.prose-content :global(td) {
		border: 1px solid #e5e7eb;
		padding: 0.5rem 0.75rem;
		text-align: left;
	}

	.prose-content :global(th) {
		background: #f9fafb;
		font-weight: 600;
	}

	.prose-content :global(hr) {
		border: none;
		border-top: 1px solid #e5e7eb;
		margin: 1.25rem 0;
	}
</style>
