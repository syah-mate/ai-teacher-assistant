<script>
  let { schema, meta } = $props();

  const identitas = $derived(schema?.identitas || {});
  const id        = $derived(identitas?.identitas || {});
  const capaian   = $derived(schema?.capaian || {});
  const kegiatan  = $derived(schema?.kegiatan || {});
  const asesmen   = $derived(schema?.asesmen || {});
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
      <tr><td>Durasi Total</td><td>{identitas.durasiTotal || '-'}</td></tr>
      <tr><td>Alokasi Waktu</td><td>{identitas.alokasiWaktu || '-'}</td></tr>
      <tr><td>Model Pembelajaran</td><td>{meta?.metode || '-'}</td></tr>
      <tr><td>Mode Pembelajaran</td><td>{meta?.modePembelajaran || '-'}</td></tr>
    </tbody>
  </table>

  {#if identitas.deskripsiUmum}
    <div class="field-block">
      <p class="field-label">Deskripsi Umum</p>
      <p>{identitas.deskripsiUmum}</p>
    </div>
  {/if}
</section>

<!-- ── SECTION B: CAPAIAN & TUJUAN ── -->
<section class="doc-section">
  <h2>B. KEMAMPUAN PRASYARAT & TUJUAN PEMBELAJARAN</h2>

  {#if capaian.kemampuanPrasyarat}
    <div class="field-block">
      <p class="field-label">Kemampuan Prasyarat</p>
      <p>{capaian.kemampuanPrasyarat}</p>
    </div>
  {/if}

  {#if (capaian.tujuanPembelajaran || []).length > 0}
    <div class="field-block">
      <p class="field-label">Tujuan Pembelajaran</p>
      <ol>
        {#each capaian.tujuanPembelajaran as t}
          <li>{t.tujuan} <em class="bloom-badge">{t.levelBloom || ''}</em></li>
        {/each}
      </ol>
    </div>
  {/if}

  {#if (capaian.profilPelajarPancasila || []).length > 0}
    <div class="field-block">
      <p class="field-label">Profil Pelajar Pancasila</p>
      <ul>
        {#each capaian.profilPelajarPancasila as p}
          <li><strong>{p.dimensi}</strong>: {p.implementasi}</li>
        {/each}
      </ul>
    </div>
  {/if}
</section>

<!-- ── SECTION C: KEGIATAN PEMBELAJARAN ── -->
<section class="doc-section">
  <h2>C. KEGIATAN PEMBELAJARAN</h2>

  {#each (kegiatan.pertemuan || []) as p}
    <div class="pertemuan-block">
      <h3>Pertemuan ke-{p.ke}: {p.tujuanPertemuan || ''}</h3>

      {#if (p.pertanyaanPemantik || []).length > 0}
        <div class="field-block">
          <p class="field-label">Pertanyaan Pemantik</p>
          <ul>
            {#each p.pertanyaanPemantik as q}<li>{q}</li>{/each}
          </ul>
        </div>
      {/if}

      <div class="langkah-grid">
        <!-- Pembuka -->
        <div class="langkah-col">
          <p class="langkah-label pembuka">Pembuka</p>
          <ul>
            {#each (p.langkahPembelajaran?.pembuka || []) as l}
              <li>{l.aktivitas} <span class="durasi">{l.durasi || ''}</span></li>
            {/each}
          </ul>
        </div>
        <!-- Inti -->
        <div class="langkah-col">
          <p class="langkah-label inti">Inti</p>
          <ul>
            {#each (p.langkahPembelajaran?.inti || []) as l}
              <li>{l.aktivitas} <span class="durasi">{l.durasi || ''}</span></li>
            {/each}
          </ul>
        </div>
        <!-- Penutup -->
        <div class="langkah-col">
          <p class="langkah-label penutup">Penutup</p>
          <ul>
            {#each (p.langkahPembelajaran?.penutup || []) as l}
              <li>{l.aktivitas} <span class="durasi">{l.durasi || ''}</span></li>
            {/each}
          </ul>
        </div>
      </div>

      {#if p.diferensiasi}
        <div class="diferensiasi-block">
          <p class="field-label">Diferensiasi</p>
          <div class="dif-grid">
            <div><span class="dif-label">Konten:</span> {p.diferensiasi.konten || '-'}</div>
            <div><span class="dif-label">Proses:</span> {p.diferensiasi.proses || '-'}</div>
            <div><span class="dif-label">Produk:</span> {p.diferensiasi.produk || '-'}</div>
          </div>
        </div>
      {/if}
    </div>
  {/each}
</section>

<!-- ── SECTION D: ASESMEN ── -->
<section class="doc-section">
  <h2>D. ASESMEN</h2>

  {#if asesmen.asesmenDiagnostik}
    <div class="field-block">
      <p class="field-label">Asesmen Diagnostik</p>
      <p>{asesmen.asesmenDiagnostik.tujuan || ''}</p>
      {#if (asesmen.asesmenDiagnostik.instrumen || []).length > 0}
        <ul>{#each asesmen.asesmenDiagnostik.instrumen as i}<li>{i}</li>{/each}</ul>
      {/if}
    </div>
  {/if}

  {#if (asesmen.asesmenFormatif || []).length > 0}
    <div class="field-block">
      <p class="field-label">Asesmen Formatif</p>
      <ul>
        {#each asesmen.asesmenFormatif as a}
          <li>Pertemuan {a.pertemuan}: {a.teknik} — {a.instrumen}</li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if asesmen.asesmenSumatif}
    <div class="field-block">
      <p class="field-label">Asesmen Sumatif</p>
      <p>{asesmen.asesmenSumatif.bentuk || ''} (Bobot: {asesmen.asesmenSumatif.bobot || ''})</p>
      <p>{asesmen.asesmenSumatif.instrumen || ''}</p>
    </div>
  {/if}

  {#if (asesmen.rubrikPenilaian || []).length > 0}
    <div class="field-block">
      <p class="field-label">Rubrik Penilaian</p>
      {#each asesmen.rubrikPenilaian as r}
        <p class="aspek-label">{r.aspek}</p>
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

  {#if (asesmen.refleksiGuru || []).length > 0}
    <div class="field-block">
      <p class="field-label">Refleksi Guru</p>
      <ul>{#each asesmen.refleksiGuru as r}<li>{r}</li>{/each}</ul>
    </div>
  {/if}
</section>

<style>
  section.doc-section {
    margin-bottom: 2rem;
  }

  h2 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--h2-color, #1d4ed8);
    margin-top: 2rem;
    margin-bottom: 0.75rem;
  }

  h3 {
    font-size: 1.05rem;
    font-weight: 700;
    color: #374151;
    margin: 1.5rem 0 0.5rem;
    padding-left: 0.75rem;
    border-left: 3px solid var(--h3-border, #3b82f6);
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
    background: #eff6ff;
    color: #1d4ed8;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    margin-left: 0.5rem;
    font-style: normal;
  }

  .langkah-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.75rem;
    margin: 0.75rem 0;
  }
  .langkah-col {
    background: #f9fafb;
    border-radius: 8px;
    padding: 0.75rem;
  }
  .langkah-label {
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }
  .langkah-label.pembuka { color: #0891b2; }
  .langkah-label.inti    { color: #1d4ed8; }
  .langkah-label.penutup { color: #7c3aed; }

  .durasi {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-left: 0.25rem;
  }

  .diferensiasi-block {
    background: #fafafa;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    margin-top: 0.75rem;
  }
  .dif-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #374151;
  }
  .dif-label { font-weight: 600; color: #111827; }

  .pertemuan-block {
    border-bottom: 1px dashed #e5e7eb;
    padding-bottom: 1.5rem;
    margin-bottom: 1.5rem;
  }
  .pertemuan-block:last-child {
    border-bottom: none;
  }

  .aspek-label {
    font-weight: 600;
    font-style: italic;
    color: #374151;
    margin: 0.75rem 0 0.25rem;
  }

  .rubrik-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8125rem;
    margin-bottom: 0.75rem;
  }
  .rubrik-table th {
    background: var(--thead-bg, #1d4ed8);
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
    color: #374151;
  }
  .rubrik-table tr:nth-child(even) td {
    background: var(--tr-even, #f8faff);
  }
</style>
