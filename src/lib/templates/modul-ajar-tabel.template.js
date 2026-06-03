// src/lib/templates/modul-ajar-tabel.template.js
//
// Template ini menggunakan sections yang identik dengan modul-ajar-standar.
// Perbedaannya HANYA di templateId (→ pilih renderer ModulAjarTabel.svelte)
// dan label/description (→ tampil di UI picker).

import { modulAjarStandarTemplate } from './modul-ajar-standar.template.js';

export const modulAjarTabelTemplate = {
  // Spread semua field dari standar (sections[], kurikulum, jenis, dll)
  ...modulAjarStandarTemplate,

  // Override hanya 3 field ini:
  templateId:  'modul-ajar-tabel',
  label:       'Modul Ajar — Layout Tabel Grid',
  description: 'Seluruh section disajikan dalam format tabel grid yang compact, cocok untuk dicetak dan ditempel di papan guru',
};
