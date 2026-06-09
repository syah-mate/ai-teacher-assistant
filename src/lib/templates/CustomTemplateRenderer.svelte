<!-- src/lib/templates/CustomTemplateRenderer.svelte -->
<script>
	/**
	 * Props:
	 *   schema   : Object — hasil generate AI, key = agentKey (misal schema.capaian, schema.kegiatan)
	 *   sections : Array  — config sections dari custom template
	 *              [{ id, agentKey, title, displayType: 'description_bullets' | 'table' }]
	 *   meta     : Object — metadata (judul, mapel, kelas, dll) dari form generate
	 */
	let { schema = {}, sections = [], meta = {} } = $props();

	/** Ubah camelCase/snake_case jadi label yang readable */
	function formatKey(key) {
		return key
			.replace(/_/g, ' ')
			.replace(/([A-Z])/g, ' $1')
			.replace(/^\w/, c => c.toUpperCase())
			.trim();
	}
</script>

<!-- Identitas selalu tampil di atas -->
<section class="doc-section">
	<h2>INFORMASI UMUM</h2>
	<table class="info-table">
		<tbody>
			<tr><td>Satuan Pendidikan</td><td>{schema?.identitas?.identitas?.satuan || meta?.jenjang || '-'}</td></tr>
			<tr><td>Mata Pelajaran</td><td>{schema?.identitas?.identitas?.mataPelajaran || meta?.mapel || '-'}</td></tr>
			<tr><td>Kelas</td><td>{schema?.identitas?.identitas?.kelas || meta?.kelas || '-'}</td></tr>
			<tr><td>Fase</td><td>{schema?.identitas?.identitas?.fase || meta?.fase || '-'}</td></tr>
			<tr><td>Penulis</td><td>{schema?.identitas?.identitas?.penulis || meta?.penulis || '-'}</td></tr>
			<tr><td>Model Pembelajaran</td><td>{meta?.metode || '-'}</td></tr>
		</tbody>
	</table>
</section>

<!-- Render tiap section sesuai config -->
{#each sections as section (section.id)}
	{@const data = schema?.[section.agentKey]}
	{#if data}
		<section class="doc-section">
			<h2>{section.title}</h2>

			{#if section.displayType === 'table'}
				<!-- TABLE MODE: render semua key-value sebagai tabel -->
				<table class="info-table">
					<tbody>
						{#each Object.entries(data) as [key, value]}
							<tr>
								<td class="key-cell">{formatKey(key)}</td>
								<td>
									{#if Array.isArray(value)}
										<ul>
											{#each value as item}
												<li>{typeof item === 'object' ? JSON.stringify(item) : item}</li>
											{/each}
										</ul>
									{:else if typeof value === 'object' && value !== null}
										{#each Object.entries(value) as [k, v]}
											<div><strong>{formatKey(k)}:</strong> {v}</div>
										{/each}
									{:else}
										{value}
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>

			{:else}
				<!-- DESCRIPTION BULLETS MODE: render semua value sebagai bullets -->
				{#each Object.entries(data) as [key, value]}
					<div class="field-block">
						<p class="field-label">{formatKey(key)}</p>

						{#if Array.isArray(value)}
							<ul>
								{#each value as item}
									{#if typeof item === 'object' && item !== null}
										<li>
											{#each Object.entries(item) as [k, v]}
												<span><strong>{formatKey(k)}:</strong> {v} </span>
											{/each}
										</li>
									{:else}
										<li>{item}</li>
									{/if}
								{/each}
							</ul>
						{:else if typeof value === 'object' && value !== null}
							<ul>
								{#each Object.entries(value) as [k, v]}
									<li><strong>{formatKey(k)}:</strong> {v}</li>
								{/each}
							</ul>
						{:else}
							<p>{value}</p>
						{/if}
					</div>
				{/each}
			{/if}
		</section>
	{/if}
{/each}

<style>
	section.doc-section {
		margin-bottom: 2rem;
	}
	h2 {
		font-size: 1.1rem;
		font-weight: 700;
		color: #1d4ed8;
		margin-top: 2rem;
		margin-bottom: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}
	.info-table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}
	.info-table td {
		padding: 0.45rem 0.75rem;
		border-bottom: 1px solid #e5e7eb;
		vertical-align: top;
	}
	.key-cell {
		font-weight: 600;
		color: #374151;
		width: 35%;
		white-space: nowrap;
	}
	.field-block {
		margin-bottom: 1.25rem;
	}
	.field-label {
		font-weight: 700;
		font-size: 0.8rem;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.4rem;
	}
	ul {
		padding-left: 1.5rem;
		margin: 0.5rem 0;
	}
	li {
		margin-bottom: 0.35rem;
		font-size: 0.9375rem;
		line-height: 1.7;
		color: #1f2937;
	}
</style>
