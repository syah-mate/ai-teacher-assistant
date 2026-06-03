// src/lib/utils/template-renderer.js
//
// Registry: templateId → komponen Svelte renderer
//
// Cara menambah template baru:
// 1. Buat file MyTemplate.svelte di /lib/templates/
// 2. Import di sini
// 3. Tambahkan entry di RENDERER_REGISTRY

import ModulAjarStandar from '$lib/templates/ModulAjarStandar.svelte';
import ModulAjarTabel   from '$lib/templates/ModulAjarTabel.svelte';

/**
 * Map dari templateId ke komponen Svelte renderer.
 * Key harus SAMA PERSIS dengan templateId di file *.template.js dan di DB.
 */
const RENDERER_REGISTRY = {
  'modul-ajar-standar': ModulAjarStandar,
  'modul-ajar-tabel':   ModulAjarTabel,
};

/**
 * Resolve templateId ke komponen Svelte renderer.
 * Jika templateId tidak dikenal, fallback ke ModulAjarStandar.
 *
 * @param {string | undefined | null} templateId
 * @returns {typeof import('svelte').SvelteComponent}
 */
export function resolveRenderer(templateId) {
  return RENDERER_REGISTRY[templateId] ?? ModulAjarStandar;
}

/**
 * Daftar semua template yang tersedia (untuk keperluan UI picker dll).
 * @returns {string[]}
 */
export function getAvailableTemplateIds() {
  return Object.keys(RENDERER_REGISTRY);
}
