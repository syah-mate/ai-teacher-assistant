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

	// ── Helpers ──────────────────────────────────────────────────────

	/** camelCase/snake_case → label readable */
	function formatKey(key) {
		return key
			.replace(/_/g, ' ')
			.replace(/([A-Z])/g, ' $1')
			.replace(/^\w/, c => c.toUpperCase())
			.trim();
	}

	/**
	 * Cek apakah agentKey ini punya renderer khusus.
	 * AgentKey yang tidak ada di sini → pakai generic renderer.
	 */
	const KNOWN_AGENTS = new Set(['capaian', 'kegiatan', 'asesmen', 'materi', 'evaluasi', 'langkah']);

	function isKnownAgent(agentKey) {
		return KNOWN_AGENTS.has(agentKey);
	}


</script>

<!-- ================================================================ -->
<!-- IDENTITAS — selalu tampil di atas, tidak berubah                  -->
<!-- ================================================================ -->
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

<!-- ================================================================ -->
<!-- RENDER TIAP SECTION                                               -->
<!-- ================================================================ -->
{#each sections as section (section.id)}
	{@const data = schema?.[section.agentKey]}
	{#if data}
		<section class="doc-section">
			<h2>{section.title}</h2>

			{#if section.agentKey === 'capaian'}
				<!-- ── CAPAIAN: Kemampuan Prasyarat, Tujuan, Profil PP ─────── -->

				{#if section.displayType === 'table'}

					<!-- Kemampuan Prasyarat -->
					{#if data.kemampuanPrasyarat}
						<h3>Kemampuan Prasyarat</h3>
						<table class="info-table">
							<tbody>
								<tr><td>{data.kemampuanPrasyarat}</td></tr>
							</tbody>
						</table>
					{/if}

					<!-- Tujuan Pembelajaran -->
					{#if data.tujuanPembelajaran?.length}
						<h3>Tujuan Pembelajaran</h3>
						<table class="info-table">
							<thead>
								<tr><th>No</th><th>Tujuan</th><th>Level Bloom</th></tr>
							</thead>
							<tbody>
								{#each data.tujuanPembelajaran as t}
									<tr>
										<td class="num-cell">{t.nomor}</td>
										<td>{t.tujuan}</td>
										<td class="badge-cell"><span class="badge">{t.levelBloom}</span></td>
									</tr>
								{/each}
							</tbody>
						</table>
					{/if}

					<!-- Profil Pelajar Pancasila -->
					{#if data.profilPelajarPancasila?.length}
						<h3>Profil Pelajar Pancasila</h3>
						<table class="info-table">
							<thead>
								<tr><th>Dimensi</th><th>Implementasi</th></tr>
							</thead>
							<tbody>
								{#each data.profilPelajarPancasila as p}
									<tr><td class="key-cell">{p.dimensi}</td><td>{p.implementasi}</td></tr>
								{/each}
							</tbody>
						</table>
					{/if}

				{:else}
					<!-- BULLETS mode -->

					{#if data.kemampuanPrasyarat}
						<h3>Kemampuan Prasyarat</h3>
						<p class="prose-text">{data.kemampuanPrasyarat}</p>
					{/if}

					{#if data.tujuanPembelajaran?.length}
						<h3>Tujuan Pembelajaran</h3>
						<ul>
							{#each data.tujuanPembelajaran as t}
								<li><span class="badge">{t.levelBloom}</span> {t.tujuan}</li>
							{/each}
						</ul>
					{/if}

					{#if data.profilPelajarPancasila?.length}
						<h3>Profil Pelajar Pancasila</h3>
						<ul>
							{#each data.profilPelajarPancasila as p}
								<li><strong>{p.dimensi}:</strong> {p.implementasi}</li>
							{/each}
						</ul>
					{/if}

				{/if}

			{:else if section.agentKey === 'kegiatan'}
				<!-- ── KEGIATAN: per pertemuan ──────────────────────────────── -->

				{#if data.pertemuan?.length}
					{#each data.pertemuan as ptm}
						<div class="pertemuan-block">
							<h3>Pertemuan ke-{ptm.ke}</h3>
							{#if ptm.tujuanPertemuan}
								<p class="prose-text tujuan-pertemuan">🎯 {ptm.tujuanPertemuan}</p>
							{/if}

							{#if section.displayType === 'table'}

								<!-- Pertanyaan Pemantik -->
								{#if ptm.pertanyaanPemantik?.length}
									<h4>Pertanyaan Pemantik</h4>
									<table class="info-table">
										<tbody>
											{#each ptm.pertanyaanPemantik as q, qi}
												<tr><td class="num-cell">{qi + 1}</td><td>{q}</td></tr>
											{/each}
										</tbody>
									</table>
								{/if}

								<!-- Pembuka -->
								{#if ptm.langkahPembelajaran?.pembuka?.length}
									<h4>Pembuka</h4>
									<table class="info-table">
										<thead><tr><th>Aktivitas</th><th>Durasi</th></tr></thead>
										<tbody>
											{#each ptm.langkahPembelajaran.pembuka as step}
												<tr><td>{step.aktivitas}</td><td class="dur-cell">{step.durasi}</td></tr>
											{/each}
										</tbody>
									</table>
								{/if}

								<!-- Inti -->
								{#if ptm.langkahPembelajaran?.inti?.length}
									<h4>Inti</h4>
									<table class="info-table">
										<thead><tr><th>Aktivitas</th><th>Durasi</th></tr></thead>
										<tbody>
											{#each ptm.langkahPembelajaran.inti as step}
												<tr><td>{step.aktivitas}</td><td class="dur-cell">{step.durasi}</td></tr>
											{/each}
										</tbody>
									</table>
								{/if}

								<!-- Penutup -->
								{#if ptm.langkahPembelajaran?.penutup?.length}
									<h4>Penutup</h4>
									<table class="info-table">
										<thead><tr><th>Aktivitas</th><th>Durasi</th></tr></thead>
										<tbody>
											{#each ptm.langkahPembelajaran.penutup as step}
												<tr><td>{step.aktivitas}</td><td class="dur-cell">{step.durasi}</td></tr>
											{/each}
										</tbody>
									</table>
								{/if}

								<!-- Diferensiasi -->
								{#if ptm.diferensiasi}
									<h4>Diferensiasi</h4>
									<table class="info-table">
										<tbody>
											{#if ptm.diferensiasi.konten}
												<tr><td class="key-cell">Konten</td><td>{ptm.diferensiasi.konten}</td></tr>
											{/if}
											{#if ptm.diferensiasi.proses}
												<tr><td class="key-cell">Proses</td><td>{ptm.diferensiasi.proses}</td></tr>
											{/if}
											{#if ptm.diferensiasi.produk}
												<tr><td class="key-cell">Produk</td><td>{ptm.diferensiasi.produk}</td></tr>
											{/if}
										</tbody>
									</table>
								{/if}

							{:else}
								<!-- BULLETS mode untuk kegiatan -->

								{#if ptm.pertanyaanPemantik?.length}
									<h4>Pertanyaan Pemantik</h4>
									<ul>
										{#each ptm.pertanyaanPemantik as q}
											<li>{q}</li>
										{/each}
									</ul>
								{/if}

								{#if ptm.langkahPembelajaran?.pembuka?.length}
									<h4>Pembuka</h4>
									<ul>
										{#each ptm.langkahPembelajaran.pembuka as step}
											<li>{step.aktivitas} <span class="dur-tag">{step.durasi}</span></li>
										{/each}
									</ul>
								{/if}

								{#if ptm.langkahPembelajaran?.inti?.length}
									<h4>Inti</h4>
									<ul>
										{#each ptm.langkahPembelajaran.inti as step}
											<li>{step.aktivitas} <span class="dur-tag">{step.durasi}</span></li>
										{/each}
									</ul>
								{/if}

								{#if ptm.langkahPembelajaran?.penutup?.length}
									<h4>Penutup</h4>
									<ul>
										{#each ptm.langkahPembelajaran.penutup as step}
											<li>{step.aktivitas} <span class="dur-tag">{step.durasi}</span></li>
										{/each}
									</ul>
								{/if}

								{#if ptm.diferensiasi}
									<h4>Diferensiasi</h4>
									<ul>
										{#if ptm.diferensiasi.konten}<li><strong>Konten:</strong> {ptm.diferensiasi.konten}</li>{/if}
										{#if ptm.diferensiasi.proses}<li><strong>Proses:</strong> {ptm.diferensiasi.proses}</li>{/if}
										{#if ptm.diferensiasi.produk}<li><strong>Produk:</strong> {ptm.diferensiasi.produk}</li>{/if}
									</ul>
								{/if}

							{/if}
						</div>
					{/each}
				{/if}

			{:else if section.agentKey === 'asesmen'}
				<!-- ── ASESMEN: Diagnostik, Formatif, Sumatif ──────────────── -->

				{#if section.displayType === 'table'}

					<!-- Asesmen Diagnostik -->
					{#if data.asesmenDiagnostik}
						<h3>Asesmen Diagnostik</h3>
						<table class="info-table">
							<tbody>
								{#if data.asesmenDiagnostik.tujuan}
									<tr><td class="key-cell">Tujuan</td><td>{data.asesmenDiagnostik.tujuan}</td></tr>
								{/if}
								{#if data.asesmenDiagnostik.instrumen?.length}
									<tr>
										<td class="key-cell">Instrumen</td>
										<td>
											<ul>
												{#each data.asesmenDiagnostik.instrumen as item}
													<li>{item}</li>
												{/each}
											</ul>
										</td>
									</tr>
								{/if}
							</tbody>
						</table>
					{/if}

					<!-- Asesmen Formatif -->
					{#if data.asesmenFormatif?.length}
						<h3>Asesmen Formatif</h3>
						<table class="info-table">
							<thead><tr><th>Pertemuan</th><th>Teknik</th><th>Instrumen</th></tr></thead>
							<tbody>
								{#each data.asesmenFormatif as af}
									<tr>
										<td class="num-cell">Ke-{af.pertemuan}</td>
										<td>{af.teknik}</td>
										<td>{af.instrumen}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{/if}

					<!-- Asesmen Sumatif -->
					{#if data.asesmenSumatif}
						<h3>Asesmen Sumatif</h3>
						<table class="info-table">
							<tbody>
								{#if data.asesmenSumatif.bentuk}
									<tr><td class="key-cell">Bentuk</td><td>{data.asesmenSumatif.bentuk}</td></tr>
								{/if}
								{#if data.asesmenSumatif.bobot}
									<tr><td class="key-cell">Bobot</td><td>{data.asesmenSumatif.bobot}</td></tr>
								{/if}
								{#if data.asesmenSumatif.instrumen}
									<tr><td class="key-cell">Instrumen</td><td>{data.asesmenSumatif.instrumen}</td></tr>
								{/if}
							</tbody>
						</table>
					{/if}

				{:else}
					<!-- BULLETS mode untuk asesmen -->

					{#if data.asesmenDiagnostik}
						<h3>Asesmen Diagnostik</h3>
						{#if data.asesmenDiagnostik.tujuan}
							<p class="prose-text">{data.asesmenDiagnostik.tujuan}</p>
						{/if}
						{#if data.asesmenDiagnostik.instrumen?.length}
							<ul>
								{#each data.asesmenDiagnostik.instrumen as item}
									<li>{item}</li>
								{/each}
							</ul>
						{/if}
					{/if}

					{#if data.asesmenFormatif?.length}
						<h3>Asesmen Formatif</h3>
						<ul>
							{#each data.asesmenFormatif as af}
								<li><strong>Pertemuan ke-{af.pertemuan}:</strong> {af.teknik} — {af.instrumen}</li>
							{/each}
						</ul>
					{/if}

					{#if data.asesmenSumatif}
						<h3>Asesmen Sumatif</h3>
						<ul>
							{#if data.asesmenSumatif.bentuk}<li><strong>Bentuk:</strong> {data.asesmenSumatif.bentuk}</li>{/if}
							{#if data.asesmenSumatif.bobot}<li><strong>Bobot:</strong> {data.asesmenSumatif.bobot}</li>{/if}
							{#if data.asesmenSumatif.instrumen}<li><strong>Instrumen:</strong> {data.asesmenSumatif.instrumen}</li>{/if}
						</ul>
					{/if}

				{/if}

			{:else if section.agentKey === 'materi'}
				<!-- ── MATERI: Kata Pengantar + Materi Pokok ───────────────── -->
				<!--
					Sub-agent materi menghasilkan: ringkasanMateri, konsepKunci, faktaPenting,
					contohAplikasi, sumberReferensi.
					Kita map:
						- Kata Pengantar  → ringkasanMateri
						- Materi Pokok    → konsepKunci + faktaPenting + contohAplikasi
				-->

				{#if section.displayType === 'table'}

					{#if data.ringkasanMateri}
						<h3>Kata Pengantar</h3>
						<table class="info-table">
							<tbody>
								<tr><td>{data.ringkasanMateri}</td></tr>
							</tbody>
						</table>
					{/if}

					<h3>Materi Pokok</h3>

					{#if data.konsepKunci?.length}
						<h4>Konsep Kunci</h4>
						<table class="info-table">
							<thead><tr><th>Konsep</th><th>Definisi</th></tr></thead>
							<tbody>
								{#each data.konsepKunci as k}
									<tr><td class="key-cell">{k.konsep}</td><td>{k.definisi}</td></tr>
								{/each}
							</tbody>
						</table>
					{/if}

					{#if data.faktaPenting?.length}
						<h4>Fakta Penting</h4>
						<table class="info-table">
							<tbody>
								{#each data.faktaPenting as f, fi}
									<tr><td class="num-cell">{fi + 1}</td><td>{f}</td></tr>
								{/each}
							</tbody>
						</table>
					{/if}

					{#if data.contohAplikasi?.length}
						<h4>Contoh Aplikasi</h4>
						<table class="info-table">
							<tbody>
								{#each data.contohAplikasi as c, ci}
									<tr><td class="num-cell">{ci + 1}</td><td>{c}</td></tr>
								{/each}
							</tbody>
						</table>
					{/if}

				{:else}
					<!-- BULLETS mode untuk materi -->

					{#if data.ringkasanMateri}
						<h3>Kata Pengantar</h3>
						<p class="prose-text">{data.ringkasanMateri}</p>
					{/if}

					<h3>Materi Pokok</h3>

					{#if data.konsepKunci?.length}
						<h4>Konsep Kunci</h4>
						<ul>
							{#each data.konsepKunci as k}
								<li><strong>{k.konsep}:</strong> {k.definisi}</li>
							{/each}
						</ul>
					{/if}

					{#if data.faktaPenting?.length}
						<h4>Fakta Penting</h4>
						<ul>
							{#each data.faktaPenting as f}
								<li>{f}</li>
							{/each}
						</ul>
					{/if}

					{#if data.contohAplikasi?.length}
						<h4>Contoh Aplikasi</h4>
						<ul>
							{#each data.contohAplikasi as c}
								<li>{c}</li>
							{/each}
						</ul>
					{/if}

				{/if}

			{:else if section.agentKey === 'evaluasi'}
				<!-- ── EVALUASI: Soal & Kunci, Rubrik, Refleksi Guru ──────── -->
				<!--
					Sub-agent evaluasi menghasilkan: soalEvaluasi, pertanyaanRefleksi, totalBobot.
					Kita map:
						- Soal & Kunci Jawaban → soalEvaluasi
						- Rubrik Penilaian     → rubrikPenilaian (dari asesmen atau tidak ada)
						- Refleksi Guru        → pertanyaanRefleksi
					Catatan: rubrikPenilaian ada di schema asesmen, tidak di evaluasi.
					Jika tidak ada di data, section ini tidak ditampilkan — tidak error.
				-->

				{#if section.displayType === 'table'}

					{#if data.soalEvaluasi?.length}
						<h3>Soal & Kunci Jawaban</h3>
						<table class="info-table">
							<thead><tr><th>No</th><th>Soal</th><th>Bobot</th><th>Kunci Jawaban</th></tr></thead>
							<tbody>
								{#each data.soalEvaluasi as s}
									<tr>
										<td class="num-cell">{s.nomor}</td>
										<td>{s.soal}</td>
										<td class="num-cell">{s.bobot}</td>
										<td>{s.kunciJawaban}</td>
									</tr>
								{/each}
							</tbody>
						</table>
						{#if data.totalBobot}
							<p class="total-bobot">Total Bobot: <strong>{data.totalBobot}</strong></p>
						{/if}
					{/if}

					{#if data.rubrikPenilaian?.length}
						<h3>Rubrik Penilaian</h3>
						<table class="info-table">
							<thead>
								<tr><th>Aspek</th><th>Sangat Baik</th><th>Baik</th><th>Cukup</th><th>Perlu Bimbingan</th></tr>
							</thead>
							<tbody>
								{#each data.rubrikPenilaian as r}
									<tr>
										<td class="key-cell">{r.aspek}</td>
										<td>{r.kriteria?.sangat_baik ?? '-'}</td>
										<td>{r.kriteria?.baik ?? '-'}</td>
										<td>{r.kriteria?.cukup ?? '-'}</td>
										<td>{r.kriteria?.perlu_bimbingan ?? '-'}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{/if}

					{#if data.pertanyaanRefleksi?.length}
						<h3>Refleksi Guru</h3>
						<table class="info-table">
							<tbody>
								{#each data.pertanyaanRefleksi as q, qi}
									<tr><td class="num-cell">{qi + 1}</td><td>{q}</td></tr>
								{/each}
							</tbody>
						</table>
					{/if}

				{:else}
					<!-- BULLETS mode untuk evaluasi -->

					{#if data.soalEvaluasi?.length}
						<h3>Soal & Kunci Jawaban</h3>
						<ul>
							{#each data.soalEvaluasi as s}
								<li>
									<strong>Soal {s.nomor}</strong> (Bobot: {s.bobot})<br/>
									{s.soal}<br/>
									<em>Kunci: {s.kunciJawaban}</em>
								</li>
							{/each}
						</ul>
						{#if data.totalBobot}
							<p class="total-bobot">Total Bobot: <strong>{data.totalBobot}</strong></p>
						{/if}
					{/if}

					{#if data.rubrikPenilaian?.length}
						<h3>Rubrik Penilaian</h3>
						<ul>
							{#each data.rubrikPenilaian as r}
								<li>
									<strong>{r.aspek}</strong>
									<ul>
										{#if r.kriteria?.sangat_baik}<li>Sangat Baik: {r.kriteria.sangat_baik}</li>{/if}
										{#if r.kriteria?.baik}<li>Baik: {r.kriteria.baik}</li>{/if}
										{#if r.kriteria?.cukup}<li>Cukup: {r.kriteria.cukup}</li>{/if}
										{#if r.kriteria?.perlu_bimbingan}<li>Perlu Bimbingan: {r.kriteria.perlu_bimbingan}</li>{/if}
									</ul>
								</li>
							{/each}
						</ul>
					{/if}

					{#if data.pertanyaanRefleksi?.length}
						<h3>Refleksi Guru</h3>
						<ul>
							{#each data.pertanyaanRefleksi as q}
								<li>{q}</li>
							{/each}
						</ul>
					{/if}

				{/if}

			{:else}
				<!-- ── GENERIC FALLBACK: untuk section kustom user ─────────── -->
				<!-- Render semua key-value apa adanya, tanpa asumsi struktur   -->

				{#if section.displayType === 'table'}
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
					{#each Object.entries(data) as [key, value]}
						<div class="field-block">
							<h3>{formatKey(key)}</h3>
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
								<p class="prose-text">{value}</p>
							{/if}
						</div>
					{/each}
				{/if}

			{/if}
		</section>
	{/if}
{/each}

<style>
	/* ── Section headings ──────────────────────────────────────────── */
	section.doc-section {
		margin-bottom: 2.5rem;
	}
	h2 {
		font-size: 1.05rem;
		font-weight: 700;
		color: #1d4ed8;
		margin-top: 2rem;
		margin-bottom: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding-bottom: 0.4rem;
		border-bottom: 2px solid #dbeafe;
	}
	h3 {
		font-size: 0.95rem;
		font-weight: 700;
		color: #1e40af;
		margin-top: 1.5rem;
		margin-bottom: 0.6rem;
		padding-left: 0.75rem;
		border-left: 3px solid #3b82f6;
	}
	h4 {
		font-size: 0.85rem;
		font-weight: 600;
		color: #374151;
		margin-top: 1rem;
		margin-bottom: 0.4rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	/* ── Pertemuan block ───────────────────────────────────────────── */
	.pertemuan-block {
		border: 1px solid #e0e7ff;
		border-radius: 10px;
		padding: 1rem 1.25rem;
		margin-bottom: 1.25rem;
		background: #fafbff;
	}
	.pertemuan-block h3 {
		margin-top: 0;
		border-left: 3px solid #6366f1;
		color: #4338ca;
	}
	.tujuan-pertemuan {
		color: #4b5563;
		font-style: italic;
		margin-bottom: 0.75rem;
	}

	/* ── Tables ────────────────────────────────────────────────────── */
	.info-table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
	}
	.info-table thead tr {
		background: #1d4ed8;
		color: white;
	}
	.info-table thead th {
		padding: 0.5rem 0.75rem;
		text-align: left;
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.02em;
	}
	.info-table td {
		padding: 0.45rem 0.75rem;
		border-bottom: 1px solid #e5e7eb;
		vertical-align: top;
		color: #374151;
	}
	.info-table tbody tr:nth-child(even) {
		background: #f8faff;
	}
	.key-cell {
		font-weight: 600;
		color: #1f2937;
		width: 32%;
		white-space: nowrap;
	}
	.num-cell {
		width: 3rem;
		text-align: center;
		color: #6b7280;
		font-size: 0.8rem;
		white-space: nowrap;
	}
	.dur-cell {
		width: 7rem;
		text-align: right;
		color: #6b7280;
		font-size: 0.8rem;
		white-space: nowrap;
	}

	/* ── Lists ─────────────────────────────────────────────────────── */
	ul {
		padding-left: 1.5rem;
		margin: 0.5rem 0 0.75rem;
	}
	li {
		margin-bottom: 0.4rem;
		font-size: 0.9375rem;
		line-height: 1.75;
		color: #1f2937;
	}

	/* ── Inline helpers ────────────────────────────────────────────── */
	.prose-text {
		font-size: 0.9375rem;
		line-height: 1.85;
		color: #374151;
		margin-bottom: 0.75rem;
	}
	.dur-tag {
		display: inline-block;
		margin-left: 0.5rem;
		background: #f3f4f6;
		color: #6b7280;
		font-size: 0.75rem;
		padding: 0.1rem 0.5rem;
		border-radius: 999px;
		white-space: nowrap;
	}
	.badge {
		display: inline-block;
		background: #ede9fe;
		color: #5b21b6;
		font-size: 0.7rem;
		font-weight: 700;
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
		margin-right: 0.35rem;
		vertical-align: middle;
	}
	.total-bobot {
		font-size: 0.875rem;
		color: #374151;
		text-align: right;
		margin-top: 0.25rem;
	}
	.field-block {
		margin-bottom: 1rem;
	}
</style>

