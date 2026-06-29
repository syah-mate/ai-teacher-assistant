/**
 * GET /api/export/pdf/[id]
 *
 * Generate PDF dari htmlOutput dokumen menggunakan pdfmake (server-side, pure JS).
 * Tidak pakai Puppeteer, tidak pakai html2canvas, tidak pakai window.print().
 * Text di PDF tetap selectable/searchable.
 */

import { error } from '@sveltejs/kit';
import { getCollection } from '$lib/server/db.js';
import { ObjectId } from 'mongodb';
import { parse } from 'node-html-parser';
import pdfmake from 'pdfmake';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// ── Font setup (server-side, resolve dari package pdfmake) ──────────────────
const PDFMAKE_DIR = dirname(require.resolve('pdfmake')); // .../pdfmake/js
const ROBOTO_DIR = join(PDFMAKE_DIR, '..', 'fonts', 'Roboto'); // .../pdfmake/fonts/Roboto

const FONTS = {
	Roboto: {
		normal: join(ROBOTO_DIR, 'Roboto-Regular.ttf'),
		bold: join(ROBOTO_DIR, 'Roboto-Medium.ttf'),
		italics: join(ROBOTO_DIR, 'Roboto-Italic.ttf'),
		bolditalics: join(ROBOTO_DIR, 'Roboto-MediumItalic.ttf')
	}
};

// ── Konstanta warna (sesuai .doc-preview di +page.svelte) ───────────────────
const C_ACCENT = '#cc785c';
const C_DARK = '#141413';
const C_BODY = '#3d3d3a';
const C_KV = '#1e3a8a';
const C_BORDER = '#e6dfd8';
const C_STRIPE = '#faf9f5';
const C_WHITE = '#ffffff';

export async function GET({ params, locals }) {
	// ── 1. Auth ───────────────────────────────────────────────────────────────
	if (!locals.user) throw error(401, 'Unauthorized');

	const userId = locals.user.id || locals.user._id?.toString();
	if (!userId) throw error(400, 'User ID tidak ditemukan');

	// ── 2. Ambil dokumen ──────────────────────────────────────────────────────
	let objectId;
	try {
		objectId = new ObjectId(params.id);
	} catch {
		throw error(400, 'ID tidak valid');
	}

	const col = await getCollection('generated_docs');
	const doc = await col.findOne({ _id: objectId, userId });
	if (!doc) throw error(404, 'Dokumen tidak ditemukan');

	// ── 3. Ambil HTML ─────────────────────────────────────────────────────────
	const htmlContent = doc.editedHtml || doc.result?.htmlOutput || '';
	if (!htmlContent.trim()) throw error(404, 'Konten dokumen kosong');

	// ── 4. Parse HTML → pdfmake content array ────────────────────────────────
	const root = parse(htmlContent);
	const container = root.querySelector('.doc-container') || root.querySelector('body') || root;
	const content = htmlToPdfContent(container);

	if (content.length === 0) {
		content.push({ text: '(Dokumen kosong)', color: C_BODY });
	}

	// ── 5. Build pdfmake document definition ─────────────────────────────────
	const docDefinition = {
		pageSize: 'A4',
		pageMargins: [40, 50, 40, 50],

		defaultStyle: {
			font: 'Roboto',
			fontSize: 10.5,
			color: C_BODY,
			lineHeight: 1.5
		},

		styles: {
			h1: {
				fontSize: 18,
				bold: true,
				color: C_DARK,
				margin: [0, 0, 0, 16]
			},
			h2: {
				fontSize: 13,
				bold: true,
				color: C_ACCENT,
				margin: [8, 20, 0, 10]
			},
			h3: {
				fontSize: 11,
				bold: true,
				color: C_BODY,
				margin: [0, 14, 0, 6]
			},
			paragraph: {
				fontSize: 10.5,
				color: C_BODY,
				margin: [0, 0, 0, 8]
			},
			bullet: {
				fontSize: 10.5,
				color: C_BODY,
				margin: [0, 0, 0, 4]
			},
			tableHeader: {
				bold: true,
				color: C_WHITE,
				fillColor: C_ACCENT,
				fontSize: 10
			},
			tableCell: {
				fontSize: 10,
				color: C_BODY
			}
		},

		content
	};

	// ── 6. Generate PDF buffer ─────────────────────────────────────────────────
	pdfmake.setFonts(FONTS);
	// Suppress warnings & izinkan baca font lokal
	pdfmake.setUrlAccessPolicy(() => false);
	pdfmake.setLocalAccessPolicy(() => true);
	const pdfDoc = pdfmake.createPdf(docDefinition);
	const buffer = await pdfDoc.getBuffer();

	// ── 7. Return PDF ─────────────────────────────────────────────────────────
	const rawName = doc.templateName || 'dokumen';
	const safeName = rawName.replace(/[^\w\s\-\.]/g, '').trim() || 'dokumen';
	const filename = encodeURIComponent(safeName) + '.pdf';

	return new Response(buffer, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
}

// ═══════════════════════════════════════════════════════════════════════════════
// HTML → pdfmake content converter
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Rekursif konversi node HTML → array pdfmake content objects.
 */
function htmlToPdfContent(container) {
	const result = [];

	for (const node of container.childNodes) {
		const tag = node.tagName?.toLowerCase();
		if (!tag) continue;

		switch (tag) {
			case 'h1': {
				const text = node.innerText.trim();
				if (!text) break;
				result.push({ text, style: 'h1' });
				result.push({
					canvas: [
						{
							type: 'line',
							x1: 0,
							y1: 0,
							x2: 515,
							y2: 0,
							lineWidth: 2,
							lineColor: C_ACCENT
						}
					],
					margin: [0, -12, 0, 20]
				});
				break;
			}

			case 'h2': {
				const text = node.innerText.trim();
				if (!text) break;
				result.push({
					table: {
						widths: [3, '*'],
						body: [
							[
								{
									text: '',
									border: [false, false, false, false],
									fillColor: C_ACCENT,
									margin: [0, 0, 0, 0]
								},
								{
									text,
									style: 'h2',
									border: [false, false, false, false],
									margin: [8, 2, 0, 2]
								}
							]
						]
					},
					layout: 'noBorders',
					margin: [0, 20, 0, 10]
				});
				break;
			}

			case 'h3': {
				const text = node.innerText.trim();
				if (text) result.push({ text, style: 'h3' });
				break;
			}

			case 'p': {
				const parsed = parseInlineText(node);
				if (parsed) result.push({ text: parsed, style: 'paragraph' });
				break;
			}

			case 'ul': {
				const items = [];
				for (const li of node.querySelectorAll('li')) {
					const t = li.innerText.trim();
					if (t) items.push(t);
				}
				if (items.length > 0) {
					result.push({
						ul: items,
						color: C_BODY,
						fontSize: 10.5,
						margin: [0, 0, 0, 8]
					});
				}
				break;
			}

			case 'table': {
				const tableNode = buildPdfTable(node);
				if (tableNode) {
					result.push(tableNode);
					result.push({ text: '', margin: [0, 0, 0, 8] });
				}
				break;
			}

			case 'section':
			case 'div':
				result.push(...htmlToPdfContent(node));
				break;
		}
	}

	return result;
}

/**
 * Parse inline nodes untuk bold/italic di dalam paragraf.
 */
function parseInlineText(node) {
	const runs = [];

	for (const child of node.childNodes) {
		const tag = child.tagName?.toLowerCase();
		const text = child.text || '';
		if (!text.trim()) continue;

		if (tag === 'strong' || tag === 'b') {
			runs.push({ text, bold: true });
		} else if (tag === 'em' || tag === 'i') {
			runs.push({ text, italics: true });
		} else {
			runs.push({ text });
		}
	}

	if (runs.length === 0) {
		const t = node.innerText.trim();
		return t || null;
	}

	const allPlain = runs.every((r) => !r.bold && !r.italics);
	if (allPlain) return runs.map((r) => r.text).join('');

	return runs;
}

/**
 * Konversi <table> → pdfmake table object.
 */
function buildPdfTable(tableNode) {
	const isKvTable = tableNode.getAttribute('class')?.includes('doc-kv-table');
	const allTr = tableNode.querySelectorAll('tr');
	if (allTr.length === 0) return null;

	const firstRowCells = allTr[0].querySelectorAll('th, td');
	const colCount = firstRowCells.length;
	if (colCount === 0) return null;

	const body = [];

	allTr.forEach((tr, rowIndex) => {
		const isHeaderRow = tr.closest('thead') !== null || tr.querySelectorAll('th').length > 0;
		const cells = tr.querySelectorAll('th, td');
		const isEvenData = !isHeaderRow && rowIndex % 2 === 0;

		const row = [...cells].map((cell, colIndex) => {
			const cellText = cell.innerText.trim();

			let fillColor = null;
			if (isHeaderRow) fillColor = C_ACCENT;
			else if (isEvenData) fillColor = C_STRIPE;

			let color = C_BODY;
			if (isHeaderRow) color = C_WHITE;
			else if (isKvTable && colIndex === 0) color = C_KV;

			return {
				text: cellText,
				bold: isHeaderRow || (isKvTable && colIndex === 0),
				color,
				fillColor,
				fontSize: 10,
				margin: [6, 5, 6, 5]
			};
		});

		body.push(row);
	});

	const widths = Array(colCount).fill('*');

	return {
		table: {
			headerRows: 1,
			widths,
			body
		},
		layout: {
			hLineWidth: () => 0.5,
			vLineWidth: () => 0.5,
			hLineColor: () => C_BORDER,
			vLineColor: () => C_BORDER,
			paddingLeft: () => 6,
			paddingRight: () => 6,
			paddingTop: () => 5,
			paddingBottom: () => 5
		},
		margin: [0, 8, 0, 0]
	};
}
