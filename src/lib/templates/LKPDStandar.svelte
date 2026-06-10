<script>
  let { schema, meta } = $props();

  const identitas     = $derived(schema?.identitas || {});
  const id            = $derived(identitas?.identitas || {});
  const capaian_lkpd  = $derived(schema?.capaian_lkpd || {});
  const ringkasan     = $derived(schema?.ringkasan_materi || {});
  const langkah_kerja = $derived(schema?.langkah_kerja || {});
  const penilaian     = $derived(schema?.penilaian_lkpd || {});
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
      <tr><td>Alokasi Waktu</td><td>{identitas.alokasiWaktu || '-'}</td></tr>
      <tr><td>Jenis Kegiatan</td><td>{identitas.jenisKegiatan || '-'}</td></tr>
      <tr><td>Pola Belajar</td><td>{identitas.polaBelajar || '-'}</td></tr>
    </tbody>
  </table>

  {#if identitas.deskripsiUmum}
    <div class="field-block">
      <p class="field-label">Deskripsi Umum</p>
      <p>{identitas.deskripsiUmum}</p>
    </div>
  {/if}
</section>

<!-- ── SECTION B: CAPAIAN PEMBELAJARAN ── -->
<section class="doc-section">
  <h2>B. CAPAIAN PEMBELAJARAN</h2>

  {#if (capaian_lkpd.tujuanPembelajaran || []).length > 0}
    <div class="field-block">
      <p class="field-label">Tujuan Pembelajaran</p>
      <ol>
        {#each capaian_lkpd.tujuanPembelajaran as t}
          <li>{t.tujuan} <em class="bloom-badge">{t.levelBloom || ''}</em></li>
        {/each}
      </ol>
    </div>
  {/if}

  {#if (capaian_lkpd.indikatorKetercapaian || []).length > 0}
    <div class="field-block">
      <p class="field-label">Indikator Ketercapaian</p>
      <ul>
        {#each capaian_lkpd.indikatorKetercapaian as indikator}
          <li>{indikator}</li>
        {/each}
      </ul>
    </div>
  {/if}
</section>

<!-- ── SECTION C: RINGKASAN MATERI ── -->
<section class="doc-section">
  <h2>C. RINGKASAN MATERI</h2>

  {#if ringkasan.materiSingkat}
    <div class="field-block">
      <p class="field-label">Materi</p>
      <p>{ringkasan.materiSingkat}</p>
    </div>
  {/if}

  {#if (ringkasan.konsepKunci || []).length > 0}
    <div class="field-block">
      <p class="field-label">Konsep Kunci</p>
      <ul>
        {#each ringkasan.konsepKunci as k}
          <li><strong>{k.konsep}</strong>: {k.definisi}</li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if (ringkasan.faktaPenting || []).length > 0}
    <div class="field-block">
      <p class="field-label">Fakta Penting</p>
      <ul>
        {#each ringkasan.faktaPenting as fakta}
          <li>{fakta}</li>
        {/each}
      </ul>
    </div>
  {/if}
</section>

<!-- ── SECTION D: LANGKAH KERJA ── -->
<section class="doc-section">
  <h2>D. LANGKAH KERJA</h2>

  {#if (langkah_kerja.alatBahan || []).length > 0}
    <div class="field-block">
      <p class="field-label">Alat & Bahan</p>
      <ul>
        {#each langkah_kerja.alatBahan as item}
          <li>{item}</li>
        {/each}
      </ul>
    </div>
  {/if}

  {#each (langkah_kerja.langkahKerja || []) as bagian}
    <div class="bagian-block">
      <h3>{bagian.bagian} — {bagian.tujuanBagian || ''}</h3>
      <ol>
        {#each (bagian.langkah || []) as l}
          <li>
            {l.instruksi}
            {#if l.estimasiWaktu}
              <span class="durasi">{l.estimasiWaktu}</span>
            {/if}
            {#if l.ruangJawaban}
              <div class="jawaban-space"></div>
            {/if}
          </li>
        {/each}
      </ol>
    </div>
  {/each}

  {#if langkah_kerja.tabelPengamatan?.kolom?.length > 0}
    <div class="field-block">
      <p class="field-label">Tabel Pengamatan: {langkah_kerja.tabelPengamatan.judul || ''}</p>
      <table class="pengamatan-table">
        <thead>
          <tr>
            <th style="width:3rem">No</th>
            {#each langkah_kerja.tabelPengamatan.kolom as kol}
              <th>{kol}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each Array(5) as _, i}
            <tr>
              <td class="center">{i + 1}</td>
              {#each langkah_kerja.tabelPengamatan.kolom as _k}
                <td>&nbsp;</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
      {#if langkah_kerja.tabelPengamatan.keterangan}
        <p class="keterangan">{langkah_kerja.tabelPengamatan.keterangan}</p>
      {/if}
    </div>
  {/if}
</section>

<!-- ── SECTION E: PENILAIAN ── -->
{#if (penilaian.rubrikPenilaian || []).length > 0 || (penilaian.evaluasiRefleksi || []).length > 0}
  <section class="doc-section">
    <h2>E. PENILAIAN</h2>

    {#if (penilaian.rubrikPenilaian || []).length > 0}
      <div class="field-block">
        <p class="field-label">Rubrik Penilaian</p>
        {#if penilaian.totalBobot}
          <p class="total-bobot">Total Bobot: {penilaian.totalBobot}</p>
        {/if}
        {#each penilaian.rubrikPenilaian as r}
          <p class="aspek-label">{r.aspek} <span class="bobot-label">(Bobot: {r.bobot ?? '-'})</span></p>
          <table class="rubrik-table">
            <thead>
              <tr>
                <th>Sangat Baik</th>
                <th>Baik</th>
                <th>Cukup</th>
                <th>Perlu Bimbingan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{r.kriteria?.sangat_baik || ''}</td>
                <td>{r.kriteria?.baik || ''}</td>
                <td>{r.kriteria?.cukup || ''}</td>
                <td>{r.kriteria?.perlu_bimbingan || ''}</td>
              </tr>
            </tbody>
          </table>
        {/each}
      </div>
    {/if}

    {#if (penilaian.evaluasiRefleksi || []).length > 0}
      <div class="field-block">
        <p class="field-label">Evaluasi & Refleksi</p>
        <ul>
          {#each penilaian.evaluasiRefleksi as item}
            <li>{item}</li>
          {/each}
        </ul>
      </div>
    {/if}
  </section>
{/if}

<style>
  section.doc-section {
    margin-bottom: 2rem;
  }

  h2 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--h2-color, #059669);
    margin-top: 2rem;
    margin-bottom: 0.75rem;
  }

  h3 {
    font-size: 1.05rem;
    font-weight: 700;
    color: #374151;
    margin: 1.5rem 0 0.5rem;
    padding-left: 0.75rem;
    border-left: 3px solid var(--h3-border, #10b981);
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
  .info-table td:first-child {
    font-weight: 600;
    color: #374151;
    width: 40%;
    white-space: nowrap;
  }

  .field-block {
    margin-bottom: 1.25rem;
  }
  .field-label {
    font-weight: 700;
    font-size: 0.85rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.4rem;
  }

  ul, ol {
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }
  li {
    margin-bottom: 0.35rem;
    font-size: 0.9375rem;
    line-height: 1.7;
    color: #1f2937;
  }

  .bloom-badge {
    font-size: 0.75rem;
    background: #ecfdf5;
    color: #059669;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    margin-left: 0.5rem;
    font-style: normal;
  }

  .durasi {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-left: 0.25rem;
  }

  .bagian-block {
    border-bottom: 1px dashed #e5e7eb;
    padding-bottom: 1.5rem;
    margin-bottom: 1.5rem;
  }
  .bagian-block:last-child {
    border-bottom: none;
  }

  .jawaban-space {
    border-bottom: 2px dashed #d1d5db;
    min-height: 60px;
    margin-top: 0.5rem;
    border-radius: 4px;
  }

  .pengamatan-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8125rem;
    margin-bottom: 0.5rem;
    border: 1px solid #e5e7eb;
  }
  .pengamatan-table th {
    background: var(--thead-bg, #059669);
    color: white;
    padding: 0.5rem 0.75rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .pengamatan-table td {
    border: 1px solid #e5e7eb;
    padding: 0.45rem 0.75rem;
    vertical-align: top;
    color: #1f2937;
  }
  .pengamatan-table td.center {
    text-align: center;
  }

  .keterangan {
    font-size: 0.8rem;
    color: #6b7280;
    font-style: italic;
    margin-top: 0.25rem;
  }

  .aspek-label {
    font-weight: 600;
    font-style: italic;
    color: #374151;
    margin: 0.75rem 0 0.25rem;
  }

  .bobot-label {
    font-weight: 400;
    font-style: normal;
    font-size: 0.8rem;
    color: #6b7280;
  }

  .total-bobot {
    font-size: 0.8rem;
    color: #6b7280;
    margin-bottom: 0.5rem;
  }

  .rubrik-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8125rem;
    margin-bottom: 0.75rem;
  }
  .rubrik-table th {
    background: var(--thead-bg, #059669);
    color: white;
    padding: 0.5rem 0.75rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .rubrik-table td {
    border: 1px solid #e5e7eb;
    padding: 0.5rem 0.75rem;
    vertical-align: top;
    font-size: 0.8125rem;
    color: #1f2937;
    line-height: 1.5;
  }
</style>
