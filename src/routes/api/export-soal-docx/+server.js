/**
 * API Endpoint untuk Export Soal ke .docx
 * Schema-based builder — menghasilkan dokumen terstruktur dan rapi (violet theme)
 */

import { json } from '@sveltejs/kit';
import {
Document, Paragraph, TextRun, HeadingLevel, AlignmentType,
Table, TableRow, TableCell, WidthType, BorderStyle,
convertInchesToTwip, ImageRun, ShadingType, Packer
} from 'docx';

export async function POST({ request, locals }) {
if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

try {
const body = await request.json();
const { soalData } = body;
if (!soalData) return json({ error: 'Data Soal tidak ditemukan' }, { status: 400 });

const images = soalData.images || [];
console.log('[Export Soal DOCX] Images:', images.length, '| Has schema:', !!soalData.schema);

const doc = soalData.schema
? await buildSoalFromSchema(soalData.schema, soalData, images)
: await buildSoalFromText(soalData, images);

const buffer = await Packer.toBuffer(doc);

return new Response(buffer, {
status: 200,
headers: {
'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
'Content-Disposition': `attachment; filename="Soal_${sanitizeFilename(soalData.judulSoal || soalData.topik || 'Document')}.docx"`
}
});
} catch (error) {
console.error('[Export Soal DOCX] Error:', error);
return json({ success: false, error: 'Gagal export dokumen. Silakan coba lagi.' }, { status: 500 });
}
}

// ─────────────────────────────────────────────────────────────────────────────
// COLOR PALETTE  (Violet theme)
// ─────────────────────────────────────────────────────────────────────────────

const C = {
violet:      '7C3AED',
violetDark:  '5B21B6',
violetLight: 'EDE9FE',
violetPale:  'F5F3FF',
green:       '16A34A',
amber:       'D97706',
border:      'CBD5E1',
altRow:      'F1F5F9',
white:       'FFFFFF',
text:        '1E293B',
subtext:     '475569'
};

const CLEAR = ShadingType.CLEAR;

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function noBorders() {
const s = { style: BorderStyle.NONE, size: 0, color: 'auto' };
return { top: s, bottom: s, left: s, right: s, insideH: s, insideV: s };
}

function subtleBorders(color = C.border) {
const s = { style: BorderStyle.SINGLE, size: 4, color };
return { top: s, bottom: s, left: s, right: s };
}

function mkRun(text, opts = {}) {
return new TextRun({ text: String(text ?? ''), font: 'Calibri', size: 24, color: C.text, ...opts });
}

function mkPara(runs, opts = {}) {
return new Paragraph({ children: Array.isArray(runs) ? runs : [runs], spacing: { after: 100 }, ...opts });
}

function spacer(size = 200) {
return new Paragraph({ children: [new TextRun('')], spacing: { after: size } });
}

function sectionHeading(text) {
return new Paragraph({
children: [new TextRun({ text, bold: true, size: 28, color: C.violetDark, font: 'Calibri' })],
spacing: { before: 480, after: 0 },
border: {
bottom: { style: BorderStyle.THICK, size: 6, color: C.violet }
},
indent: { left: 0 }
});
}

function subHeading(text, color = C.violet) {
return new Paragraph({
children: [new TextRun({ text, bold: true, size: 24, color, font: 'Calibri' })],
border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.violetLight } },
spacing: { before: 280, after: 120 }
});
}

function hCell(text, fill, widthPct = 50) {
return new TableCell({
shading: { type: CLEAR, fill, color: 'auto' },
borders: subtleBorders(fill),
width: { size: widthPct, type: WidthType.PERCENTAGE },
margins: { top: 120, bottom: 120, left: 160, right: 160 },
children: [new Paragraph({
children: [new TextRun({ text, bold: true, size: 22, color: C.white, font: 'Calibri' })],
alignment: AlignmentType.CENTER
})]
});
}

function infoRow(label, value, labelFill = C.violetPale, valueFill = C.white) {
return new TableRow({ children: [
new TableCell({
shading: { type: CLEAR, fill: labelFill, color: 'auto' },
borders: subtleBorders(C.border),
width: { size: 35, type: WidthType.PERCENTAGE },
margins: { top: 100, bottom: 100, left: 160, right: 160 },
children: [mkPara(mkRun(label, { bold: true, color: C.violet, size: 22 }), { spacing: { after: 0 } })]
}),
new TableCell({
shading: { type: CLEAR, fill: valueFill, color: 'auto' },
borders: subtleBorders(C.border),
width: { size: 65, type: WidthType.PERCENTAGE },
margins: { top: 100, bottom: 100, left: 160, right: 160 },
children: [mkPara(mkRun(value, { size: 22 }), { spacing: { after: 0 } })]
})
]});
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA-BASED BUILDER
// ─────────────────────────────────────────────────────────────────────────────

async function buildSoalFromSchema(schema, soalData, imagesData = []) {
const soalPG    = schema['soal-pg']?.soalPilihanGanda   || schema.soalPilihanGanda   || [];
const soalEsai  = schema['soal-esai']?.soalEsai         || schema.soalEsai           || [];
const validator = schema.validator || {};

const topik   = soalData.topik   || soalData.judulSoal || '';
const mapel   = soalData.mapel   || '';
const kelas   = soalData.kelas   || '';
const jenis   = soalData.jenis   || 'Pilihan Ganda';
const jumlah  = soalData.jumlah  || (soalPG.length + soalEsai.length);
const tingkat = soalData.tingkat || 'Sedang';
const level   = soalData.level   || '';

const children = [];

// ── COVER ────────────────────────────────────────────────────────────────
children.push(
new Paragraph({
children: [new TextRun({ text: 'INSTRUMEN SOAL', bold: true, size: 64, color: C.violetDark, font: 'Calibri' })],
alignment: AlignmentType.CENTER,
spacing: { before: 800, after: 160 }
}),
new Paragraph({
children: [new TextRun({ text: 'KURIKULUM MERDEKA', size: 28, color: C.subtext, font: 'Calibri' })],
alignment: AlignmentType.CENTER,
spacing: { after: 600 }
})
);

// Dark violet title box
children.push(new Table({
width: { size: 100, type: WidthType.PERCENTAGE },
rows: [new TableRow({ children: [new TableCell({
shading: { type: CLEAR, fill: C.violetDark, color: 'auto' },
borders: noBorders(),
margins: { top: 280, bottom: 280, left: 400, right: 400 },
children: [new Paragraph({
children: [new TextRun({ text: topik || 'INSTRUMEN SOAL', bold: true, size: 44, color: C.white, font: 'Calibri' })],
alignment: AlignmentType.CENTER
})]
})]})],
}));

children.push(spacer(400));

// Mini info table on cover
children.push(new Table({
width: { size: 70, type: WidthType.PERCENTAGE },
alignment: AlignmentType.CENTER,
rows: [
infoRow('Mata Pelajaran', mapel,         C.violetPale, C.white),
infoRow('Kelas',          kelas,         C.altRow,     C.white),
infoRow('Jenis Soal',     jenis,         C.violetPale, C.white),
infoRow('Jumlah Soal',    String(jumlah), C.altRow,    C.white),
]
}));

// Page break
children.push(new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: true }));

// ── A. INFORMASI SOAL ───────────────────────────────────────────────────
children.push(sectionHeading('A.  INFORMASI SOAL'));
children.push(spacer(120));

children.push(new Table({
width: { size: 100, type: WidthType.PERCENTAGE },
rows: [
new TableRow({ tableHeader: true, children: [hCell('KETERANGAN', C.violet, 35), hCell('DETAIL', C.violet, 65)] }),
infoRow('Mata Pelajaran',      mapel,           C.violetPale, C.white),
infoRow('Kelas',               kelas,           C.altRow,     C.white),
infoRow('Topik / Materi',      topik,           C.violetPale, C.white),
infoRow('Jenis Soal',          jenis,           C.altRow,     C.white),
infoRow('Jumlah Soal',         String(jumlah),  C.violetPale, C.white),
infoRow('Tingkat Kesulitan',   tingkat,         C.altRow,     C.white),
infoRow('Level Kognitif',      level,           C.violetPale, C.white),
...(validator.qualityScore
? [infoRow('Skor Kualitas AI', String(validator.qualityScore) + '/100', C.altRow, C.white)]
: []),
]
}));

// ── B. SOAL PILIHAN GANDA ───────────────────────────────────────────────
if (soalPG.length > 0) {
children.push(spacer(200));
children.push(sectionHeading('B.  SOAL PILIHAN GANDA'));
children.push(spacer(80));

children.push(new Paragraph({
children: [
new TextRun({ text: 'Petunjuk: ', bold: true, size: 22, color: C.violet, font: 'Calibri' }),
mkRun('Pilihlah satu jawaban yang paling tepat dengan melingkari huruf A, B, C, atau D.', { italics: true, size: 22, color: C.subtext })
],
spacing: { after: 200 }
}));

soalPG.forEach((s, i) => {
// Question paragraph: bold number + question text
children.push(new Paragraph({
children: [
new TextRun({ text: String(s.nomor || i + 1) + '.  ', bold: true, size: 24, color: C.violetDark, font: 'Calibri' }),
mkRun(s.soal || '', { size: 24 }),
],
spacing: { before: 240, after: 100 }
}));

// Answer options — each on its own line
const pil = s.pilihan || {};
Object.entries(pil).filter(([, v]) => v).forEach(([key, val]) => {
children.push(new Paragraph({
children: [
mkRun(key + '.  ', { size: 22, color: C.subtext }),
mkRun(val, { size: 22 })
],
indent: { left: convertInchesToTwip(0.35) },
spacing: { after: 60 }
}));
});

// Kunci + Level Bloom line
if (s.kunci) {
children.push(spacer(100));
children.push(new Paragraph({
children: [
mkRun('Kunci: ', { bold: true, size: 22, color: C.green }),
mkRun(s.kunci, { bold: true, size: 22, color: C.green }),
...(s.levelBloom ? [
mkRun('  |  Level Bloom: ', { bold: true, size: 22, color: C.subtext }),
mkRun(s.levelBloom, { bold: true, size: 22, color: C.subtext })
] : [])
],
spacing: { after: 80 }
}));
}

// Pembahasan in shaded left-border box
if (s.pembahasan) {
children.push(new Paragraph({
children: [
mkRun('Pembahasan: ', { bold: true, italics: true, size: 21, color: C.subtext }),
mkRun(s.pembahasan, { italics: true, size: 21, color: C.subtext })
],
shading: { type: CLEAR, fill: C.violetPale, color: 'auto' },
border: { left: { style: BorderStyle.THICK, size: 12, color: C.violet } },
indent: { left: convertInchesToTwip(0.2), right: convertInchesToTwip(0.2) },
spacing: { before: 0, after: 0 }
}));
}

children.push(spacer(200));
});
}

// ── C. SOAL ESAI ────────────────────────────────────────────────────────
if (soalEsai.length > 0) {
const secLabel = soalPG.length > 0 ? 'C' : 'B';
children.push(spacer(200));
children.push(sectionHeading(`${secLabel}.  SOAL ESAI`));
children.push(spacer(80));

children.push(new Paragraph({
children: [
new TextRun({ text: 'Petunjuk: ', bold: true, size: 22, color: C.violet, font: 'Calibri' }),
mkRun('Jawablah pertanyaan berikut dengan uraian yang jelas dan lengkap.', { italics: true, size: 22, color: C.subtext })
],
spacing: { after: 200 }
}));

soalEsai.forEach((s, i) => {
const nomor = s.nomor || (soalPG.length + i + 1);

// Question paragraph: bold number + question text
children.push(new Paragraph({
children: [
new TextRun({ text: String(nomor) + '.  ', bold: true, size: 24, color: C.violetDark, font: 'Calibri' }),
mkRun(s.soal || '', { size: 24 }),
...(s.bobot ? [mkRun(`  (Bobot: ${s.bobot})`, { size: 21, italics: true, color: C.subtext })] : []),
...(s.levelBloom ? [mkRun(`  [${s.levelBloom}]`, { size: 21, italics: true, color: C.subtext })] : [])
],
spacing: { before: 240, after: 100 }
}));

// Answer space box
children.push(new Table({
width: { size: 100, type: WidthType.PERCENTAGE },
rows: [new TableRow({ children: [new TableCell({
shading: { type: CLEAR, fill: C.white, color: 'auto' },
borders: subtleBorders(C.border),
margins: { top: 80, bottom: 80, left: 200, right: 160 },
children: [
mkPara(mkRun('Jawaban :', { bold: true, size: 20, color: C.subtext }), { spacing: { after: 0 } }),
mkPara(mkRun(''), { spacing: { after: 200 } }),
mkPara(mkRun(''), { spacing: { after: 200 } }),
mkPara(mkRun(''), { spacing: { after: 200 } }),
mkPara(mkRun(''), { spacing: { after: 0 } }),
]
})]})],
}));

// Rubrik penilaian
if (s.rubrik && Object.keys(s.rubrik).length > 0) {
children.push(spacer(100));
children.push(subHeading('Rubrik Penilaian', C.green));
children.push(new Table({
width: { size: 100, type: WidthType.PERCENTAGE },
rows: [
new TableRow({ tableHeader: true, children: [hCell('Skor', C.green, 15), hCell('Kriteria Penilaian', C.green, 85)] }),
...Object.entries(s.rubrik).map(([skor, kriteria], ri) => new TableRow({ children: [
new TableCell({
shading: { type: CLEAR, fill: ri % 2 === 0 ? '#F0FDF4' : C.altRow, color: 'auto' },
borders: subtleBorders(C.border),
width: { size: 15, type: WidthType.PERCENTAGE },
margins: { top: 80, bottom: 80, left: 120, right: 120 },
children: [new Paragraph({
children: [mkRun(skor.replace(/_/g, ' '), { bold: true, color: C.green, size: 21 })],
alignment: AlignmentType.CENTER
})]
}),
new TableCell({
shading: { type: CLEAR, fill: ri % 2 === 0 ? '#F0FDF4' : C.altRow, color: 'auto' },
borders: subtleBorders(C.border),
width: { size: 85, type: WidthType.PERCENTAGE },
margins: { top: 80, bottom: 80, left: 120, right: 120 },
children: [mkPara(mkRun(kriteria || '', { size: 21 }), { spacing: { after: 0 } })]
})
]}))
]
}));
}

// Kunci jawaban
if (s.kunciJawaban) {
children.push(spacer(100));
children.push(subHeading('Kunci Jawaban / Model Jawaban', C.green));
children.push(mkPara(mkRun(s.kunciJawaban, { size: 22, color: C.subtext, italics: true })));
}

children.push(spacer(200));
});
}

// ── D. RINGKASAN KUNCI JAWABAN PG ───────────────────────────────────────
if (soalPG.length > 0) {
const secLabel = soalPG.length > 0 && soalEsai.length > 0 ? 'D' : 'C';
children.push(spacer(200));
children.push(sectionHeading(`${secLabel}.  RINGKASAN KUNCI JAWABAN`));
children.push(spacer(120));

const chunkSize = 5;
for (let i = 0; i < soalPG.length; i += chunkSize) {
const chunk = soalPG.slice(i, i + chunkSize);
const pct   = Math.floor(100 / chunk.length);
children.push(new Table({
width: { size: 100, type: WidthType.PERCENTAGE },
rows: [
new TableRow({ tableHeader: true, children: chunk.map(s => hCell(String(s.nomor || 0), C.violet, pct)) }),
new TableRow({ children: chunk.map(s => new TableCell({
shading: { type: CLEAR, fill: C.white, color: 'auto' },
borders: subtleBorders(C.border),
width: { size: pct, type: WidthType.PERCENTAGE },
margins: { top: 100, bottom: 100, left: 120, right: 120 },
children: [new Paragraph({
children: [mkRun(s.kunci || '-', { bold: true, size: 26, color: C.green })],
alignment: AlignmentType.CENTER
})]
})) })
]
}));
children.push(spacer(80));
}
}

return new Document({
sections: [{
properties: {
page: {
margin: {
top:    convertInchesToTwip(1),
bottom: convertInchesToTwip(1),
left:   convertInchesToTwip(1.25),
right:  convertInchesToTwip(1.25)
}
}
},
children
}]
});
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXT-BASED FALLBACK BUILDER
// ─────────────────────────────────────────────────────────────────────────────

async function buildSoalFromText(soalData, imagesData = []) {
const sections = [
new Paragraph({
children: [new TextRun({ text: 'INSTRUMEN SOAL', bold: true, size: 32 })],
heading: HeadingLevel.TITLE,
alignment: AlignmentType.CENTER,
spacing: { after: 400 }
}),
new Paragraph({
children: [new TextRun({ text: soalData.judulSoal || soalData.topik || '', bold: true, size: 28 })],
heading: HeadingLevel.HEADING_1,
alignment: AlignmentType.CENTER,
spacing: { after: 200 }
}),
new Paragraph({
children: [new TextRun({ text: `${soalData.mapel || ''} — Kelas ${soalData.kelas || ''}`, size: 24 })],
alignment: AlignmentType.CENTER,
spacing: { after: 100 }
}),
new Paragraph({ text: '', pageBreakBefore: true }),
...parseSoalText(soalData.content || '', imagesData)
];

return new Document({ sections: [{ properties: {}, children: sections }] });
}

function parseSoalText(content, imagesData = []) {
const paragraphs = [];
const lines = content.split('\n');
let imageIndex = 0;

for (const line of lines) {
const trimmed = line.trim();

if (trimmed.includes('[Image embedded - visible in .docx download]')) {
const img = imagesData[imageIndex];
if (img && img.data) {
try {
const buf = Buffer.from(img.data, 'base64');
paragraphs.push(new Paragraph({
children: [new ImageRun({ data: buf, transformation: { width: 400, height: 300 }, type: 'jpg' })],
alignment: AlignmentType.CENTER,
spacing: { before: 100, after: 200 }
}));
imageIndex++;
} catch (err) { console.error('[Parse Soal] Error adding image:', err); }
}
continue;
}

if (!trimmed) { paragraphs.push(spacer(80)); continue; }

const h2 = trimmed.match(/^##\s+(.*)/);
const h3 = trimmed.match(/^###\s+(.*)/);
if (h2) {
paragraphs.push(new Paragraph({
children: [mkRun(h2[1], { bold: true, size: 26, color: C.violetDark })],
heading: HeadingLevel.HEADING_2,
spacing: { before: 300, after: 150 }
}));
continue;
}
if (h3) {
paragraphs.push(new Paragraph({
children: [mkRun(h3[1], { bold: true, size: 24, color: C.violet })],
heading: HeadingLevel.HEADING_3,
spacing: { before: 240, after: 120 }
}));
continue;
}

if (trimmed.match(/^\d+\.\s+/) || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
const text = trimmed.replace(/^\d+\.\s+/, '').replace(/^[-*]\s+/, '');
paragraphs.push(new Paragraph({ children: [mkRun(text, { size: 22 })], bullet: { level: 0 }, spacing: { after: 80 } }));
continue;
}

const bold = trimmed.match(/^\*\*(.*)\*\*$/);
paragraphs.push(mkPara(mkRun(bold ? bold[1] : trimmed, { size: 23, bold: !!bold })));
}

return paragraphs;
}

function sanitizeFilename(filename) {
return filename.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/, '').substring(0, 100);
}
