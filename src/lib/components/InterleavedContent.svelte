<script>
	import MarkdownRenderer from './MarkdownRenderer.svelte';

	/**
	 * @typedef {Object} Section
	 * @property {'text'|'image'} type
	 * @property {string} [content]
	 * @property {string} [prompt]
	 * @property {string|null} [imageUrl]
	 * @property {boolean} [error]
	 */

	/** @type {Section[]} */
	export let sections = [];

	/** @type {boolean} */
	export let isLoading = false;
</script>

<div class="interleaved-content">
	{#each sections as section}
		{#if section.type === 'text'}
			<div class="section-text">
				<MarkdownRenderer content={section.content ?? ''} />
			</div>
		{:else if section.type === 'image'}
			<div class="section-image">
				{#if section.imageUrl}
					<img
						src={section.imageUrl}
						alt={section.prompt ?? 'Ilustrasi'}
						class="generated-image"
					/>
					{#if section.prompt}
						<p class="image-caption">{section.prompt}</p>
					{/if}
				{:else if section.error}
					<div class="image-placeholder image-error">
						<span>⚠️ Gagal membuat ilustrasi</span>
					</div>
				{:else}
					<div class="image-placeholder">
						<div class="image-spinner"></div>
						<span>Membuat ilustrasi...</span>
					</div>
				{/if}
			</div>
		{/if}
	{/each}

	{#if isLoading}
		<div class="loading-indicator">
			<span class="dot"></span>
			<span class="dot"></span>
			<span class="dot"></span>
		</div>
	{/if}
</div>

<style>
	.interleaved-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.section-text {
		width: 100%;
	}

	.section-image {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 0.5rem 0;
	}

	.generated-image {
		max-width: 100%;
		border-radius: 12px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
	}

	.image-caption {
		font-size: 0.8rem;
		color: #6b7280;
		margin-top: 0.4rem;
		text-align: center;
		font-style: italic;
	}

	.image-placeholder {
		width: 100%;
		min-height: 180px;
		background: #f3f4f6;
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		color: #9ca3af;
		font-size: 0.875rem;
		border: 2px dashed #d1d5db;
	}

	.image-error {
		background: #fef2f2;
		border-color: #fca5a5;
		color: #ef4444;
	}

	.image-spinner {
		width: 28px;
		height: 28px;
		border: 3px solid #e5e7eb;
		border-top-color: #6366f1;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-indicator {
		display: flex;
		gap: 4px;
		padding: 0.5rem 0;
	}

	.dot {
		width: 8px;
		height: 8px;
		background: #6366f1;
		border-radius: 50%;
		animation: bounce 1.2s infinite;
	}

	.dot:nth-child(2) {
		animation-delay: 0.2s;
	}
	.dot:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes bounce {
		0%,
		80%,
		100% {
			transform: translateY(0);
			opacity: 0.5;
		}
		40% {
			transform: translateY(-6px);
			opacity: 1;
		}
	}
</style>
