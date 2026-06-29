/**
 * GET /api/export/docx/[id]
 *
 * Ambil htmlOutput dari generated_docs, parse HTML, konversi ke DOCX,
 * return sebagai file download.
 *
 * Menggunakan library: docx (sudah ada), node-html-parser (baru)
 */

import { error } from '@sveltejs/kit';
import { getCollection } from '$lib/server/db.js';
import { ObjectId } from 'mongodb';
import { parse } from 'node-html-parser';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  LevelFormat
} from 'docx';

// ── Konstanta warna (sesuai .doc-preview di +page.svelte) ──────────────────
const C_ACCENT  = 'CC785C'; // #cc785c — H2, border dekoratif, TH background
const C_DARK    = '141413'; // #141413 — H1
const C_BODY    = '3D3D3A'; // #3d3d3a — teks umum, H3
const C_KV      = '1E3A8A'; // #1e3a8a — KV table kolom pertama
const C_BORDER  = 'E6DFD8'; // #e6dfd8 — border tabel
const C_STRIPE  = 'FAF9F5'; // #faf9f5 — zebra stripe even rows
const C_WHITE   = 'FFFFFF';

export async function GET({ params, locals }) {
  // ── 1. Auth ───────────────────────────────────────────────────────────────
  if (!locals.user) throw error(401, 'Unauthorized');

  const userId = locals.user.id || locals.user._id?.toString();
  if (!userId) throw error(400, 'User ID tidak ditemukan');

  // ── 2. Ambil dokumen dari DB ──────────────────────────────────────────────
  let objectId;
  try {
    objectId = new ObjectId(params.id);
  } catch {
    throw error(400, 'ID tidak valid');
  }

  const col = await getCollection('generated_docs');
  const doc = await col.findOne({ _id: objectId, userId });
  if (!doc) throw error(404, 'Dokumen tidak ditemukan');

  // ── 3. Ambil HTML (editedHtml prioritas) ─────────────────────────────────
  const htmlContent = doc.editedHtml || doc.result?.htmlOutput || '';
  if (!htmlContent.trim()) throw error(404, 'Konten dokumen kosong');

  // ── 4. Parse HTML ─────────────────────────────────────────────────────────
  const root = parse(htmlContent);
  // Target .doc-container, fallback ke body
  const container = root.querySelector('.doc-container') || root.querySelector('body') || root;

  // ── 5. Konversi ke elemen DOCX ────────────────────────────────────────────
  const children = htmlToDocxChildren(container);

  // Jika tidak ada konten, tambahkan paragraf fallback
  if (children.length === 0) {
    children.push(new Paragraph({ children: [new TextRun('(Dokumen kosong)')] }));
  }

  // ── 6. Build Document ─────────────────────────────────────────────────────
  const docxDoc = new Document({
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [{
            level: 0,
            format: LevelFormat.BULLET,
            text: '\u2022',
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: { indent: { left: 720, hanging: 360 } }
            }
          }]
        }
      ]
    },
    styles: {
      default: {
        document: {
          run: { font: 'Arial', size: 22, color: C_BODY } // 11pt default
        }
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 36, bold: true, font: 'Arial', color: C_DARK },
          paragraph: {
            spacing: { before: 0, after: 240 },
            outlineLevel: 0,
            // Simulasi border-bottom via paragraph border
            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 18,        // 1.5pt
                color: C_ACCENT,
                space: 4
              }
            }
          }
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 26, bold: true, font: 'Arial', color: C_ACCENT },
          paragraph: {
            spacing: { before: 320, after: 160 },
            outlineLevel: 1,
            // Simulasi border-left via paragraph border
            border: {
              left: {
                style: BorderStyle.SINGLE,
                size: 24,        // 2pt
                color: C_ACCENT,
                space: 8
              }
            }
          }
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 22, bold: true, font: 'Arial', color: C_BODY },
          paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 2 }
        }
      ]
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4 dalam DXA
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } // ~2cm
        }
      },
      children
    }]
  });

  // ── 7. Generate buffer ────────────────────────────────────────────────────
  const buffer = await Packer.toBuffer(docxDoc);

  const rawName = doc.templateName || 'dokumen';
  const safeName = rawName.replace(/[^\w\s\-\.]/g, '').trim() || 'dokumen';
  const filename = encodeURIComponent(safeName) + '.docx';

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}

// ── HTML → DOCX Converter ───────────────────────────────────────────────────

/**
 * Rekursif konversi node HTML → array elemen DOCX.
 * Hanya handle tag yang dihasilkan html-renderer.js.
 */
function htmlToDocxChildren(container) {
  const result = [];

  for (const node of container.childNodes) {
    const tag = node.tagName?.toLowerCase();
    if (!tag) continue; // skip text nodes di level container

    switch (tag) {
      case 'h1':
        result.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: parseInlineNodes(node)
        }));
        break;

      case 'h2':
        result.push(new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: parseInlineNodes(node)
        }));
        break;

      case 'h3':
        result.push(new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: parseInlineNodes(node)
        }));
        break;

      case 'p': {
        const text = node.innerText.trim();
        if (text) {
          result.push(new Paragraph({
            children: parseInlineNodes(node)
          }));
        }
        break;
      }

      case 'ul':
        for (const li of node.querySelectorAll('li')) {
          result.push(new Paragraph({
            numbering: { reference: 'bullets', level: 0 },
            children: [new TextRun({ text: li.innerText.trim(), color: C_BODY })]
          }));
        }
        break;

      case 'table':
        result.push(buildDocxTable(node));
        // Tambah spacing setelah tabel
        result.push(new Paragraph({ children: [] }));
        break;

      case 'section':
      case 'div':
        // Rekursif untuk wrapper element
        result.push(...htmlToDocxChildren(node));
        break;

      // Abaikan: style, script, head, meta, dll.
    }
  }

  return result;
}

/**
 * Parse inline nodes (text, <strong>, <em>, <br>) dalam satu elemen.
 * Untuk heading dan paragraf yang mungkin punya formatting inline.
 */
function parseInlineNodes(node) {
  const runs = [];
  const text = node.innerText.trim();
  if (!text) return [new TextRun('')];

  // Untuk sekarang: ambil plain text.
  // Extend di sini jika perlu bold/italic dari richtext field.
  for (const child of node.childNodes) {
    const childTag = child.tagName?.toLowerCase();
    const childText = child.text?.trim() || '';
    if (!childText) continue;

    if (childTag === 'strong' || childTag === 'b') {
      runs.push(new TextRun({ text: childText, bold: true, color: C_BODY }));
    } else if (childTag === 'em' || childTag === 'i') {
      runs.push(new TextRun({ text: childText, italics: true, color: C_BODY }));
    } else {
      runs.push(new TextRun({ text: childText, color: C_BODY }));
    }
  }

  // Fallback jika childNodes kosong (plain text node)
  if (runs.length === 0) {
    runs.push(new TextRun({ text, color: C_BODY }));
  }

  return runs;
}

/**
 * Konversi <table> HTML → Table DOCX.
 * Deteksi otomatis: thead (header row), tbody (data rows + zebra stripe).
 * Deteksi KV table via class "doc-kv-table" untuk warna kolom pertama.
 */
function buildDocxTable(tableNode) {
  const isKvTable = tableNode.classNames?.includes('doc-kv-table') ||
                    tableNode.getAttribute('class')?.includes('doc-kv-table');

  const borderDef = { style: BorderStyle.SINGLE, size: 6, color: C_BORDER };
  const borders = {
    top: borderDef, bottom: borderDef,
    left: borderDef, right: borderDef
  };

  const rows = [];
  const allTr = tableNode.querySelectorAll('tr');

  allTr.forEach((tr, rowIndex) => {
    const isHeaderRow = tr.closest('thead') !== null;
    const cells = tr.querySelectorAll('th, td');
    const colCount = cells.length;

    const docxCells = [...cells].map((cell, colIndex) => {
      const isThCell = cell.tagName?.toLowerCase() === 'th';
      const cellText = cell.innerText.trim();

      // Tentukan warna background cell
      let fillColor = C_WHITE;
      if (isThCell || isHeaderRow) {
        fillColor = C_ACCENT; // header: oranye
      } else if (rowIndex % 2 !== 0) {
        fillColor = C_STRIPE; // zebra stripe pada baris ganjil (karena row 0 = header)
      }

      // Warna teks cell
      let textColor = C_BODY;
      if (isThCell || isHeaderRow) {
        textColor = C_WHITE;
      } else if (isKvTable && colIndex === 0) {
        textColor = C_KV; // KV table: kolom pertama warna biru
      }

      return new TableCell({
        borders,
        shading: { fill: fillColor, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({
          children: [new TextRun({
            text: cellText,
            bold: isThCell || isHeaderRow || (isKvTable && colIndex === 0),
            color: textColor,
            size: 20 // 10pt
          })]
        })]
      });
    });

    rows.push(new TableRow({
      tableHeader: isHeaderRow, // repeat header di setiap halaman jika tabel panjang
      children: docxCells
    }));
  });

  // Hitung lebar kolom: A4 dengan margin 2cm = ~8526 DXA content width
  const colCount = rows[0]?.children?.length || 1;
  const colWidth = Math.floor(8526 / colCount);
  const columnWidths = Array(colCount).fill(colWidth);
  // Koreksi rounding: tambahkan sisa ke kolom terakhir
  const totalCalc = colWidth * colCount;
  if (columnWidths.length > 0) {
    columnWidths[columnWidths.length - 1] += (8526 - totalCalc);
  }

  return new Table({
    width: { size: 8526, type: WidthType.DXA },
    columnWidths,
    rows
  });
}
