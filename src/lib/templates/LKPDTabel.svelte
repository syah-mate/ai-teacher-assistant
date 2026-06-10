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
<section class="tbl-section">
  <h2>A. INFORMASI UMUM</h2>
  <table class="info-table">
    <tbody>
      <tr><td>Satuan Pendidikan</td><td>{id.satuan || '-'}</td><td>Alokasi Waktu</td><td>{identitas.alokasiWaktu || '-'}</td></tr>
      <tr><td>Mata Pelajaran</td><td>{id.mataPelajaran || '-'}</td><td>Jenis Kegiatan</td><td>{identitas.jenisKegiatan || '-'}</td></tr>
      <tr><td>Fase / Kelas</td><td>{id.fase || '-'} / {id.kelas || '-'}</td><td>Pola Belajar</td><td>{identitas.polaBelajar || '-'}</td></tr>
      <tr><td>Penulis</td><td>{id.penulis || '-'}</td><td></td><td></td></tr>
      <tr><td>Instansi</td><td colspan="3">{id.instansi || '-'}</td></tr>
    </tbody>
  </table>

  {#if identitas.deskripsiUmum}
    <div class="desc-block">
      <span class="desc-label">Deskripsi Umum:</span>
      {identitas.deskripsiUmum}
    </div>
  {/if}
</section>

<!-- ── SECTION B: CAPAIAN PEMBELAJARAN ── -->
<section class="tbl-section">
  <h2>B. CAPAIAN PEMBELAJARAN</h2>

  {#if (capaian_lkpd.tujuanPembelajaran || []).length > 0}
    <table class="content-table">
      <thead><tr><th style="width:3rem">No</th><th>Tujuan Pembelajaran</th><th style="width:7rem">Level Bloom</th></tr></thead>
      <tbody>
        {#each capaian_lkpd.tujuanPembelajaran as t}
          <tr>
            <td class="center">{t.nomor}</td>
            <td>{t.tujuan}</td>
            <td class="center bloom">{t.levelBloom || '-'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

  {#if (capaian_lkpd.indikatorKetercapaian || []).length > 0}
    <p class="sub-label">Indikator Ketercapaian</p>
    <table class="content-table">
      <thead><tr><th style="width:3rem">No</th><th>Indikator</th></tr></thead>
      <tbody>
        {#each capaian_lkpd.indikatorKetercapaian as indikator, i}
          <tr><td class="center">{i + 1}</td><td>{indikator}</td></tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>

<!-- ── SECTION C: RINGKASAN MATERI ── -->
<section class="tbl-section">
  <h2>C. RINGKASAN MATERI</h2>

  {#if ringkasan.materiSingkat}
    <div class="desc-block">
      <span class="desc-label">Materi:</span>
      {ringkasan.materiSingkat}
    </div>
  {/if}

  {#if (ringkasan.konsepKunci || []).length > 0}
    <p class="sub-label">Konsep Kunci</p>
    <table class="content-table">
      <thead><tr><th style="width:30%">Konsep</th><th>Definisi</th></tr></thead>
      <tbody>
        {#each ringkasan.konsepKunci as k}
          <tr><td><strong>{k.konsep}</strong></td><td>{k.definisi}</td></tr>
        {/each}
      </tbody>
    </table>
  {/if}

  {#if (ringkasan.faktaPenting || []).length > 0}
    <p class="sub-label">Fakta Penting</p>
    <table class="content-table">
      <thead><tr><th style="width:3rem">No</th><th>Fakta</th></tr></thead>
      <tbody>
        {#each ringkasan.faktaPenting as fakta, i}
          <tr><td class="center">{i + 1}</td><td>{fakta}</td></tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>

<!-- ── SECTION D: LANGKAH KERJA ── -->
<section class="tbl-section">
  <h2>D. LANGKAH KERJA</h2>

  {#if (langkah_kerja.alatBahan || []).length > 0}
    <div class="desc-block">
      <span class="desc-label">Alat & Bahan:</span>
      {(langkah_kerja.alatBahan || []).join(' • ')}
    </div>
  {/if}

  {#each (langkah_kerja.langkahKerja || []) as bagian}
    <div class="bagian-header">
      <strong>{bagian.bagian}</strong>
      {#if bagian.tujuanBagian} — {bagian.tujuanBagian}{/if}
    </div>

    <table class="content-table langkah-table">
      <thead>
        <tr>
          <th style="width:3rem">No</th>
          <th>Instruksi</th>
          <th style="width:6rem">Waktu</th>
          <th style="width:8rem">Ruang Jawaban</th>
        </tr>
      </thead>
      <tbody>
        {#each (bagian.langkah || []) as l}
          <tr>
            <td class="center">{l.nomor}</td>
            <td>{l.instruksi}</td>
            <td class="center">{l.estimasiWaktu || '-'}</td>
            <td class="jawaban-cell">{#if l.ruangJawaban}&nbsp;{/if}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/each}

  {#if langkah_kerja.tabelPengamatan?.kolom?.length > 0}
    <p class="sub-label">Tabel Pengamatan: {langkah_kerja.tabelPengamatan.judul || ''}</p>
    <table class="content-table">
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
  {/if}
</section>

<!-- ── SECTION E: PENILAIAN ── -->
{#if (penilaian.rubrikPenilaian || []).length > 0 || (penilaian.evaluasiRefleksi || []).length > 0}
  <section class="tbl-section">
    <h2>E. PENILAIAN</h2>

    {#if (penilaian.rubrikPenilaian || []).length > 0}
      <p class="sub-label">Rubrik Penilaian</p>
      {#if penilaian.totalBobot}
        <p class="total-bobot">Total Bobot: {penilaian.totalBobot}</p>
      {/if}
      {#each penilaian.rubrikPenilaian as r}
        <p class="aspek-label">{r.aspek} <span class="bobot-inline">(Bobot: {r.bobot ?? '-'})</span></p>
        <table class="content-table">
          <thead><tr><th>Sangat Baik (4)</th><th>Baik (3)</th><th>Cukup (2)</th><th>Perlu Bimbingan (1)</th></tr></thead>
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
    {/if}

    {#if (penilaian.evaluasiRefleksi || []).length > 0}
      <p class="sub-label">Evaluasi & Refleksi</p>
      <ol class="refleksi-list">
        {#each penilaian.evaluasiRefleksi as item}<li>{item}</li>{/each}
      </ol>
    {/if}
  </section>
{/if}

<style>
  .tbl-section {
    margin-bottom: 1.75rem;
  }

  h2 {
    font-weight: 800;
    background: var(--thead-bg, #059669);
    color: white;
    padding: 0.5rem 0.875rem;
    border-radius: 6px 6px 0 0;
    margin: 0 0 0 0;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    font-size: 0.8rem;
  }

  .info-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    border: 1px solid #e5e7eb;
    margin-bottom: 0.75rem;
  }
  .info-table td {
    padding: 0.4rem 0.75rem;
    border: 1px solid #e5e7eb;
    vertical-align: middle;
  }
  .info-table td:nth-child(odd) {
    background: #f1f5f9;
    font-weight: 600;
    color: #374151;
    width: 18%;
    white-space: nowrap;
  }

  .content-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8125rem;
    margin-bottom: 0.75rem;
    border: 1px solid #e5e7eb;
  }
  .content-table th {
    background: var(--thead-bg, #059669);
    color: white;
    padding: 0.45rem 0.75rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .content-table td {
    border: 1px solid #e5e7eb;
    padding: 0.45rem 0.75rem;
    vertical-align: top;
    color: #1f2937;
    line-height: 1.55;
  }
  .content-table tr:nth-child(even) td {
    background: var(--tr-even, #f0fdf4);
  }
  .content-table td.center {
    text-align: center;
  }

  .bloom {
    font-weight: 700;
    color: var(--h2-color, #059669);
  }

  .desc-block {
    font-size: 0.875rem;
    color: #374151;
    background: #f9fafb;
    border-left: 3px solid var(--h3-border, #10b981);
    padding: 0.6rem 0.875rem;
    margin-bottom: 0.75rem;
    border-radius: 0 6px 6px 0;
    line-height: 1.65;
  }
  .desc-label {
    font-weight: 700;
    color: #111827;
    margin-right: 0.4rem;
  }

  .sub-label {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    margin: 0.75rem 0 0.25rem;
  }

  .bagian-header {
    background: #ecfdf5;
    border-left: 4px solid var(--h3-border, #10b981);
    padding: 0.45rem 0.875rem;
    font-size: 0.875rem;
    color: #047857;
    margin: 1rem 0 0.5rem;
    border-radius: 0 6px 6px 0;
  }

  .langkah-table td.jawaban-cell {
    min-height: 40px;
    background: #fafafa;
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
    font-size: 0.875rem;
    color: #374151;
    margin: 0.75rem 0 0.25rem;
  }

  .bobot-inline {
    font-weight: 400;
    font-style: normal;
    font-size: 0.8rem;
    color: #6b7280;
  }

  .total-bobot {
    font-size: 0.8rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
  }

  .refleksi-list {
    padding-left: 1.25rem;
    font-size: 0.875rem;
  }
  .refleksi-list li {
    margin-bottom: 0.35rem;
    color: #374151;
    line-height: 1.6;
  }
</style>
