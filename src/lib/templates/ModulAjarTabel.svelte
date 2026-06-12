<script>
  let { schema, meta } = $props();

  const identitas = $derived(schema?.identitas || {});
  const id        = $derived(identitas?.identitas || {});
  const capaian   = $derived(schema?.capaian || {});
  const kegiatan  = $derived(schema?.kegiatan || {});
  const asesmen   = $derived(schema?.asesmen || {});
</script>

<!-- ── SECTION A: INFORMASI UMUM ── -->
<section class="tbl-section">
  <h2>A. INFORMASI UMUM</h2>
  <table class="info-table">
    <tbody>
      <tr><td>Satuan Pendidikan</td><td>{id.satuan || '-'}</td><td>Durasi Total</td><td>{identitas.durasiTotal || '-'}</td></tr>
      <tr><td>Mata Pelajaran</td><td>{id.mataPelajaran || '-'}</td><td>Alokasi Waktu</td><td>{identitas.alokasiWaktu || '-'}</td></tr>
      <tr><td>Fase / Kelas</td><td>{id.fase || '-'} / {id.kelas || '-'}</td><td>Model Pembelajaran</td><td>{meta?.metode || '-'}</td></tr>
      <tr><td>Penulis</td><td>{id.penulis || '-'}</td><td>Mode</td><td>{meta?.modePembelajaran || '-'}</td></tr>
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

<!-- ── SECTION B: TUJUAN & CAPAIAN ── -->
<section class="tbl-section">
  <h2>B. TUJUAN PEMBELAJARAN</h2>

  {#if capaian.kemampuanPrasyarat}
    <div class="desc-block">
      <span class="desc-label">Kemampuan Prasyarat:</span>
      {capaian.kemampuanPrasyarat}
    </div>
  {/if}

  {#if (capaian.tujuanPembelajaran || []).length > 0}
    <table class="content-table">
      <thead><tr><th style="width:3rem">No</th><th>Tujuan Pembelajaran</th><th style="width:7rem">Level Bloom</th></tr></thead>
      <tbody>
        {#each capaian.tujuanPembelajaran as t}
          <tr>
            <td class="center">{t.nomor}</td>
            <td>{t.tujuan}</td>
            <td class="center bloom">{t.levelBloom || '-'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

  {#if (capaian.profilPelajarPancasila || []).length > 0}
    <p class="sub-label">Profil Pelajar Pancasila</p>
    <table class="content-table">
      <thead><tr><th style="width:35%">Dimensi</th><th>Implementasi dalam Pembelajaran</th></tr></thead>
      <tbody>
        {#each capaian.profilPelajarPancasila as p}
          <tr><td><strong>{p.dimensi}</strong></td><td>{p.implementasi}</td></tr>
        {/each}
      </tbody>
    </table>
  {/if}

  {#if (capaian.indikatorPencapaian || []).length > 0}
    <p class="sub-label">Indikator Pencapaian</p>
    <ul class="indikator-list">
      {#each capaian.indikatorPencapaian as ind}
        <li>{ind}</li>
      {/each}
    </ul>
  {/if}
</section>

<!-- ── SECTION C: KEGIATAN ── -->
<section class="tbl-section">
  <h2>C. KEGIATAN PEMBELAJARAN</h2>

  {#each (kegiatan.pertemuan || []) as p}
    <div class="pertemuan-header">
      <strong>Pertemuan ke-{p.ke}</strong>
      {#if p.tujuanPertemuan} — {p.tujuanPertemuan}{/if}
    </div>

    {#if (p.pertanyaanPemantik || []).length > 0}
      <div class="pemantik-block">
        <span class="desc-label">Pertanyaan Pemantik:</span>
        {p.pertanyaanPemantik.join(' • ')}
      </div>
    {/if}

    <table class="content-table langkah-table">
      <thead>
        <tr>
          <th style="width:6rem">Fase</th>
          <th>Aktivitas Pembelajaran</th>
          <th style="width:6rem">Durasi</th>
        </tr>
      </thead>
      <tbody>
        {#each (p.langkahPembelajaran?.pembuka || []) as l, i}
          <tr class="row-pembuka">
            {#if i === 0}<td rowspan={p.langkahPembelajaran.pembuka.length} class="fase-cell pembuka">Pembuka</td>{/if}
            <td>{l.aktivitas}</td>
            <td class="center">{l.durasi || ''}</td>
          </tr>
        {/each}
        {#each (p.langkahPembelajaran?.inti || []) as l, i}
          <tr class="row-inti">
            {#if i === 0}<td rowspan={p.langkahPembelajaran.inti.length} class="fase-cell inti">Inti</td>{/if}
            <td>{l.aktivitas}</td>
            <td class="center">{l.durasi || ''}</td>
          </tr>
        {/each}
        {#each (p.langkahPembelajaran?.penutup || []) as l, i}
          <tr class="row-penutup">
            {#if i === 0}<td rowspan={p.langkahPembelajaran.penutup.length} class="fase-cell penutup">Penutup</td>{/if}
            <td>{l.aktivitas}</td>
            <td class="center">{l.durasi || ''}</td>
          </tr>
        {/each}
      </tbody>
    </table>

    {#if p.diferensiasi}
      <table class="content-table dif-table">
        <thead><tr><th>Diferensiasi Konten</th><th>Diferensiasi Proses</th><th>Diferensiasi Produk</th></tr></thead>
        <tbody>
          <tr>
            <td>{p.diferensiasi.konten || '-'}</td>
            <td>{p.diferensiasi.proses || '-'}</td>
            <td>{p.diferensiasi.produk || '-'}</td>
          </tr>
        </tbody>
      </table>
    {/if}
  {/each}
</section>

<!-- ── SECTION D: ASESMEN ── -->
<section class="tbl-section">
  <h2>D. ASESMEN</h2>

  <table class="content-table">
    <thead><tr><th>Jenis Asesmen</th><th>Teknik / Bentuk</th><th>Instrumen</th></tr></thead>
    <tbody>
      {#if asesmen.asesmenDiagnostik}
        <tr>
          <td><strong>Diagnostik</strong></td>
          <td>{asesmen.asesmenDiagnostik.tujuan || '-'}</td>
          <td>
            <ul class="compact-list">
              {#each (asesmen.asesmenDiagnostik.instrumen || []) as i}<li>{i}</li>{/each}
            </ul>
          </td>
        </tr>
      {/if}
      {#each (asesmen.asesmenFormatif || []) as a}
        <tr>
          <td>Formatif — Pertemuan {a.pertemuan}</td>
          <td>{a.teknik}</td>
          <td>{a.instrumen}</td>
        </tr>
      {/each}
      {#if asesmen.asesmenSumatif}
        <tr>
          <td><strong>Sumatif</strong></td>
          <td>{asesmen.asesmenSumatif.bentuk || '-'} (Bobot: {asesmen.asesmenSumatif.bobot || '-'})</td>
          <td>{asesmen.asesmenSumatif.instrumen || '-'}</td>
        </tr>
      {/if}
    </tbody>
  </table>

  {#if (asesmen.rubrikPenilaian || []).length > 0}
    <p class="sub-label">Rubrik Penilaian</p>
    {#each asesmen.rubrikPenilaian as r}
      <p class="aspek-label">{r.aspek}</p>
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

  {#if (asesmen.refleksiGuru || []).length > 0}
    <p class="sub-label">Refleksi Guru</p>
    <ol class="refleksi-list">
      {#each asesmen.refleksiGuru as r}<li>{r}</li>{/each}
    </ol>
  {/if}
</section>

<style>
  .tbl-section {
    margin-bottom: 1.75rem;
  }

  h2 {
    font-weight: 800;
    background: var(--thead-bg, #1d4ed8);
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
    background: var(--thead-bg, #1d4ed8);
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
    background: var(--tr-even, #f8faff);
  }
  .content-table td.center {
    text-align: center;
  }

  .bloom {
    font-weight: 700;
    color: var(--h2-color, #1d4ed8);
  }

  .desc-block {
    font-size: 0.875rem;
    color: #374151;
    background: #f9fafb;
    border-left: 3px solid var(--h3-border, #3b82f6);
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

  .pertemuan-header {
    background: #eff6ff;
    border-left: 4px solid var(--h3-border, #3b82f6);
    padding: 0.45rem 0.875rem;
    font-size: 0.875rem;
    color: #1e40af;
    margin: 1rem 0 0.5rem;
    border-radius: 0 6px 6px 0;
  }

  .pemantik-block {
    font-size: 0.8125rem;
    color: #374151;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    margin-bottom: 0.5rem;
    line-height: 1.6;
  }

  .fase-cell {
    font-weight: 700;
    font-size: 0.75rem;
    text-align: center;
    vertical-align: middle;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }
  .fase-cell.pembuka { background: #ecfeff; color: #0891b2; }
  .fase-cell.inti    { background: #eff6ff; color: #1d4ed8; }
  .fase-cell.penutup { background: #f5f3ff; color: #7c3aed; }

  .compact-list {
    margin: 0;
    padding-left: 1rem;
    list-style: disc;
    font-size: 0.8rem;
  }

  .aspek-label {
    font-weight: 600;
    font-style: italic;
    font-size: 0.875rem;
    color: #374151;
    margin: 0.75rem 0 0.25rem;
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
