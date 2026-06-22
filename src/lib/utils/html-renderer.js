/**
 * html-renderer.js — Konversi hasil agent ke HTML string
 *
 * @param {Object} template - Template object (dengan sections dan fields metadata)
 * @param {Array}  sectionResults - Output dari FlexOrchestrator: [{ sectionId, title, fields }]
 * @returns {string} HTML string lengkap
 */
export function renderToHtml(template, sectionResults) {
	const sectionsHtml = sectionResults
		.map((section) => {
			const templateSection = template.sections.find((s) => s.id === section.sectionId);
			const fieldsHtml = renderFields(templateSection?.fields ?? [], section.fields);
			return [
				'<section class="doc-section">',
				`  <h2>${escapeHtml(section.title)}</h2>`,
				`  ${fieldsHtml}`,
				'</section>'
			].join('\n');
		})
		.join('\n');

	return [
		'<!DOCTYPE html>',
		'<html lang="id">',
		'<head>',
		'  <meta charset="UTF-8">',
		`  <title>${escapeHtml(template.name)}</title>`,
		`  <style>${getDocStyles()}</style>`,
		'</head>',
		'<body>',
		'  <div class="doc-container">',
		`    <h1 class="doc-title">${escapeHtml(template.name)}</h1>`,
		`    ${sectionsHtml}`,
		'  </div>',
		'</body>',
		'</html>'
	].join('\n');
}

function renderFields(fieldsMeta, fieldsData) {
	return fieldsMeta
		.map((meta) => {
			const value = fieldsData[meta.key];
			if (value === undefined || value === null) return '';
			return [
				'<div class="doc-field">',
				`  <h3>${escapeHtml(meta.label)}</h3>`,
				`  ${renderFieldValue(meta.type, value)}`,
				'</div>'
			].join('\n');
		})
		.join('\n');
}

function renderFieldValue(type, value) {
	switch (type) {
		case 'array':
			if (!Array.isArray(value)) return `<p>${escapeHtml(String(value))}</p>`;
			return `<ul>${value.map((item) => `<li>${escapeHtml(String(item))}</li>`).join('')}</ul>`;
		case 'array-object':
			if (!Array.isArray(value)) return `<p>${escapeHtml(JSON.stringify(value))}</p>`;
			return renderObjectArray(value);
		case 'keyvalue':
			if (!Array.isArray(value)) return `<p>${escapeHtml(JSON.stringify(value))}</p>`;
			return renderKeyValue(value);
		case 'richtext':
			return value; // HTML langsung, no escaping
		case 'number':
			return `<p class="doc-number">${value}</p>`;
		default: // text
			return `<p>${escapeHtml(String(value))}</p>`;
	}
}

function renderObjectArray(items) {
	if (items.length === 0) return '';
	// Kumpulkan SEMUA key dari SEMUA objek — bukan cuma objek pertama
	// Ini mencegah baris kosong ketika AI menghasilkan objek dengan struktur tidak konsisten
	const allKeys = new Set();
	for (const item of items) {
		if (item && typeof item === 'object') {
			for (const k of Object.keys(item)) {
				allKeys.add(k);
			}
		}
	}
	const keys = [...allKeys];
	if (keys.length === 0) return '';
	return [
		'<table class="doc-table">',
		`  <thead><tr>${keys.map((k) => `<th>${escapeHtml(k)}</th>`).join('')}</tr></thead>`,
		'  <tbody>',
		...items.map(
			(item) =>
				`    <tr>${keys.map((k) => `<td>${escapeHtml(String((item && typeof item === 'object' ? item[k] : '') ?? ''))}</td>`).join('')}</tr>`
		),
		'  </tbody>',
		'</table>'
	].join('\n');
}

function renderKeyValue(items) {
	if (items.length === 0) return '';
	// Deteksi nama kolom dari item pertama (fleksibel: bisa "nama"/"name"/"label"/"key" dan "value"/"nilai"/"isi")
	const firstItem = items[0];
	let nameKey = 'nama';
	let valueKey = 'value';
	if (firstItem && typeof firstItem === 'object') {
		const keys = Object.keys(firstItem);
		if (keys.length === 2) {
			// Ambil key pertama sebagai nama, key kedua sebagai value
			nameKey = keys[0];
			valueKey = keys[1];
		} else if (keys.length > 2) {
			// Cari key yang menyerupai "nama" atau "name"
			const nameCandidates = keys.filter(k => /nama|name|label|key|field/i.test(k));
			const valueCandidates = keys.filter(k => /value|nilai|isi|content/i.test(k));
			if (nameCandidates.length > 0) nameKey = nameCandidates[0];
			if (valueCandidates.length > 0) valueKey = valueCandidates[0];
		}
	}

	return [
		'<table class="doc-table doc-kv-table">',
		'  <thead><tr><th>Nama Field</th><th>Value</th></tr></thead>',
		'  <tbody>',
		...items.map(
			(item) => {
				const nameVal = (item && typeof item === 'object') ? (item[nameKey] ?? '') : '';
				const valueVal = (item && typeof item === 'object') ? (item[valueKey] ?? '') : '';
				return `    <tr><td>${escapeHtml(String(nameVal))}</td><td>${escapeHtml(String(valueVal))}</td></tr>`;
			}
		),
		'  </tbody>',
		'</table>'
	].join('\n');
}

function escapeHtml(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function getDocStyles() {
	return `
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1a1a1a; background: #fff; margin: 0; padding: 0; }
    .doc-container { max-width: 900px; margin: 0 auto; padding: 40px 32px; }
    .doc-title { font-size: 1.8rem; color: #1e3a8a; border-bottom: 3px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 32px; }
    .doc-section { margin-bottom: 40px; }
    .doc-section h2 { font-size: 1.2rem; color: #1d4ed8; border-left: 4px solid #1d4ed8; padding-left: 12px; margin-bottom: 16px; }
    .doc-field { margin-bottom: 20px; }
    .doc-field h3 { font-size: 0.95rem; color: #374151; font-weight: 600; margin-bottom: 8px; }
    .doc-field p { color: #374151; line-height: 1.7; margin: 0; }
    .doc-field ul { padding-left: 20px; color: #374151; line-height: 1.8; }
    .doc-number { font-size: 1.1rem; font-weight: 700; color: #1d4ed8; }
    .doc-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .doc-table th { background: #1d4ed8; color: white; padding: 8px 12px; text-align: left; }
    .doc-table td { border: 1px solid #e5e7eb; padding: 8px 12px; }
    .doc-table tr:nth-child(even) td { background: #f8faff; }
    .doc-kv-table { width: auto; min-width: 50%; }
    .doc-kv-table th:first-child { width: 40%; }
    .doc-kv-table td:first-child { font-weight: 600; color: #1e3a8a; }
    @media print {
      body { font-size: 11pt; }
      .doc-container { max-width: 100%; padding: 0; }
      .doc-table th { background: #1d4ed8 !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;
}
