<script>
  let { schema, meta } = $props();

  const identitas = $derived(schema?.identitas || {});
  const id        = $derived(identitas?.identitas || {});
  const soalPg    = $derived(schema?.['soal-pg'] || {});
  const soalEsai  = $derived(schema?.['soal-esai'] || {});
</script>

<!-- ── SECTION A: INFORMASI UMUM ── -->
<section class="doc-section">
  <h2>A. INFORMASI UMUM</h2>

  <table class="info-table">
    <tbody>
      <tr><td>Satuan Pendidikan</td><td>{id.satuan || '-'}</td></tr>
      <tr><td>Mata Pelajaran</td><td>{id.mataPelajaran || '-'}</td></tr>
      <tr><td>Fase</td><td>{id.fase || '-'}</td></tr>
      <tr><td>Kelas</td><td>{id.kelas || '-'}</td></tr>
      <tr><td>Penulis</td><td>{id.penulis || '-'}</td></tr>
      <tr><td>Instansi</td><td>{id.instansi || '-'}</td></tr>
      <tr><td>Jenis Soal</td><td>{meta?.jenisSoal || '-'}</td></tr>
      <tr><td>Jumlah Soal</td><td>{meta?.jumlahSoal || '-'}</td></tr>
      <tr><td>Tingkat Kesulitan</td><td>{meta?.tingkat || '-'}</td></tr>
      <tr><td>Level Kognitif</td><td>{meta?.levelBloom || '-'}</td></tr>
    </tbody>
  </table>
</section>

<!-- ── SECTION B: SOAL PILIHAN GANDA ── -->
{#if (soalPg.soalPilihanGanda || []).length > 0}
<section class="doc-section">
  <h2>B. SOAL PILIHAN GANDA</h2>

  <div class="field-block">
    <p class="field-label">Petunjuk: Pilihlah jawaban yang paling tepat!</p>
  </div>

  {#each soalPg.soalPilihanGanda as soal, i}
    <div class="soal-item">
      <p class="soal-nomor">{soal.nomor || i + 1}. {soal.soal || ''}</p>
      <div class="pilihan-grid">
        {#each Object.entries(soal.pilihan || {}) as [kunci, teks]}
          <div class="pilihan-item">
            <span class="pilihan-label">{kunci}.</span>
            <span>{teks || ''}</span>
          </div>
        {/each}
      </div>
      <div class="soal-meta">
        <span class="bloom-badge">{soal.levelBloom || '-'}</span>
      </div>
      <!-- Kunci & Pembahasan hanya muncul untuk guru (metadata) -->
    </div>
  {/each}
</section>
{/if}

<!-- ── SECTION C: KUNCI JAWABAN & PEMBAHASAN PG ── -->
{#if (soalPg.soalPilihanGanda || []).length > 0}
<section class="doc-section kunci-section">
  <h2>KUNCI JAWABAN & PEMBAHASAN — Pilihan Ganda</h2>

  {#each soalPg.soalPilihanGanda as soal, i}
    <div class="field-block">
      <p class="field-label">{soal.nomor || i + 1}. Kunci: <strong class="kunci-highlight">{soal.kunciJawaban || '-'}</strong></p>
      {#if soal.pembahasan}
        <p class="pembahasan-text">{soal.pembahasan}</p>
      {/if}
    </div>
  {/each}
</section>
{/if}

<!-- ── SECTION D: SOAL ESAI ── -->
{#if (soalEsai.soalEsai || []).length > 0}
<section class="doc-section">
  <h2>D. SOAL ESAI</h2>

  <div class="field-block">
    <p class="field-label">Petunjuk: Jawablah pertanyaan berikut dengan jelas dan lengkap!</p>
  </div>

  {#each soalEsai.soalEsai as soal, i}
    <div class="soal-item">
      <p class="soal-nomor">{soal.nomor || i + 1}. {soal.soal || ''}</p>
      {#if soal.petunjukMenjawab}
        <p class="petunjuk-text"><em>Petunjuk: {soal.petunjukMenjawab}</em></p>
      {/if}
      <div class="soal-meta">
        <span class="bobot-badge">Bobot: {soal.bobot || '-'}</span>
      </div>
    </div>
  {/each}
</section>
{/if}

<!-- ── SECTION E: KUNCI JAWABAN & RUBRIK ESAI ── -->
{#if (soalEsai.soalEsai || []).length > 0}
<section class="doc-section kunci-section">
  <h2>KUNCI JAWABAN & RUBRIK PENILAIAN — Esai</h2>

  {#each soalEsai.soalEsai as soal, i}
    <div class="field-block">
      <p class="field-label">{soal.nomor || i + 1}. Kunci Jawaban:</p>
      {#if soal.kunciJawaban}
        <p class="pembahasan-text">{soal.kunciJawaban}</p>
      {/if}
      {#if soal.rubrikPenilaian}
        <p class="field-label mt-2">Rubrik Penilaian:</p>
        <p class="rubrik-text">{soal.rubrikPenilaian}</p>
      {/if}
    </div>
  {/each}
</section>
{/if}

<style>
  .doc-section { margin-bottom: 2rem; }
  .doc-section h2 {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #e2e8f0;
  }
  .info-table { width: 100%; border-collapse: collapse; }
  .info-table td {
    padding: 0.4rem 0.75rem;
    font-size: 0.875rem;
    border: 1px solid #e2e8f0;
  }
  .info-table td:first-child {
    font-weight: 600;
    color: #475569;
    width: 35%;
    background: #f8fafc;
  }
  .field-block { margin-bottom: 1rem; }
  .field-label {
    font-size: 0.8rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }
  .soal-item {
    margin-bottom: 1.25rem;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    background: #fafafa;
  }
  .soal-nomor { font-weight: 600; margin-bottom: 0.5rem; color: #1e293b; }
  .pilihan-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem; }
  .pilihan-item { display: flex; gap: 0.5rem; font-size: 0.875rem; }
  .pilihan-label { font-weight: 700; color: #6366f1; min-width: 1.5rem; }
  .soal-meta { margin-top: 0.5rem; display: flex; gap: 0.5rem; align-items: center; }
  .bloom-badge {
    font-size: 0.7rem;
    font-style: normal;
    background: #ede9fe;
    color: #7c3aed;
    padding: 0.15rem 0.5rem;
    border-radius: 1rem;
    font-weight: 600;
  }
  .bobot-badge {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 500;
  }
  .kunci-highlight {
    color: #059669;
    font-size: 1.1rem;
  }
  .pembahasan-text {
    font-size: 0.85rem;
    color: #475569;
    margin-top: 0.25rem;
    line-height: 1.5;
  }
  .rubrik-text {
    font-size: 0.85rem;
    color: #475569;
    line-height: 1.5;
    white-space: pre-wrap;
  }
  .petunjuk-text {
    font-size: 0.8rem;
    color: #64748b;
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
  }
  .kunci-section {
    border: 2px dashed #10b981;
    border-radius: 0.75rem;
    padding: 1rem;
    background: #f0fdf4;
  }
  .kunci-section h2 { color: #059669; }
  .mt-2 { margin-top: 0.5rem; }
</style>
