// src/lib/utils/template-renderer.js
//
// Registry: templateId → komponen Svelte renderer
//
// Cara menambah template baru:
// 1. Buat file MyTemplate.svelte di /lib/templates/
// 2. Import di sini
// 3. Tambahkan entry di RENDERER_REGISTRY

import ModulAjarStandar  from '$lib/templates/ModulAjarStandar.svelte';
import ModulAjarTabel    from '$lib/templates/ModulAjarTabel.svelte';
import LKPDStandar       from '$lib/templates/LKPDStandar.svelte';
import LKPDTabel         from '$lib/templates/LKPDTabel.svelte';
import CustomTemplateRenderer from '$lib/templates/CustomTemplateRenderer.svelte';

/**
 * Map dari templateId ke komponen Svelte renderer.
 * Key harus SAMA PERSIS dengan templateId di file *.template.js dan di DB.
 */
const RENDERER_REGISTRY = {
	'modul-ajar-standar': ModulAjarStandar,
	'modul-ajar-tabel':   ModulAjarTabel,
	'lkpd-standar':       LKPDStandar,
	'lkpd-tabel':         LKPDTabel,
};

/**
 * Resolve templateId ke komponen Svelte renderer.
 *
 * Untuk template kustom (templateId dimulai dengan "custom-"),
 * selalu return CustomTemplateRenderer.
 * Caller wajib pass prop tambahan `sections` ke komponen ini.
 *
 * @param {string | undefined | null} templateId
 * @returns {typeof import('svelte').SvelteComponent}
 */
export function resolveRenderer(templateId) {
	if (!templateId) return ModulAjarStandar;
	if (templateId.startsWith('custom-')) return CustomTemplateRenderer;
	return RENDERER_REGISTRY[templateId] ?? ModulAjarStandar;
}

/**
 * Cek apakah templateId adalah template kustom user.
 * @param {string | undefined | null} templateId
 * @returns {boolean}
 */
export function isCustomTemplate(templateId) {
	return typeof templateId === 'string' && templateId.startsWith('custom-');
}

/**
 * Daftar semua template sistem yang tersedia (untuk keperluan UI picker dll).
 * @returns {string[]}
 */
export function getAvailableTemplateIds() {
	return Object.keys(RENDERER_REGISTRY);
}
