/**
 * API Endpoint untuk Export LKPD ke .docx
 * Schema-based builder — menghasilkan dokumen terstruktur dan rapi
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
const { lkpdData } = body;
if (!lkpdData) return json({ error: 'Data LKPD tidak ditemukan' }, { status: 400 });

const images = lkpdData.images || [];
console.log('[Export LKPD DOCX] Images:', images.length, '| Has schema:', !!lkpdData.schema);

const doc = lkpdData.schema
? await buildLKPDFromSchema(lkpdData.schema, lkpdData, images)
: await buildLKPDFromText(lkpdData, images);

const buffer = await Packer.toBuffer(doc);

return new Response(buffer, {
status: 200,
headers: {
'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
'Content-Disposition': `attachment; filename="LKPD_${sanitizeFilename(lkpdData.judulModul || lkpdData.topik || 'Document')}.docx"`
}
});
} catch (error) {
console.error('[Export LKPD DOCX] Error:', error);
return json({ success: false, error: 'Gagal export dokumen. Silakan coba lagi.' }, { status: 500 });
}
}

// ─────────────────────────────────────────────────────────────────────────────
// COLOR PALETTE (Teal / Emerald theme)
// ─────────────────────────────────────────────────────────────────────────────

const C = {
teal:       '0D9488',
tealDark:   '0F766E',
tealLight:  'CCFBF1',
tealPale:   'F0FDFA',
green:      '16A34A',
greenDark:  '15803D',
amber:      'D97706',
amberLight: 'FEF3C7',
border:     'CBD5E1',
altRow:     'F1F5F9',
white:      'FFFFFF',
text:       '1E293B',
subtext:    '475569'
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
children: [new TextRun({ text, bold: true, size: 28, color: C.tealDark, font: 'Calibri' })],
spacing: { before: 480, after: 0 },
indent: { left: 200, right: 200 }
});
}

function subHeading(text, color = C.teal) {
return new Paragraph({
children: [new TextRun({ text, bold: true, size: 24, color, font: 'Calibri' })],
border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.tealLight } },
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

function infoRow(label, value, labelFill = C.tealPale, valueFill = C.white) {
return new TableRow({ children: [
new TableCell({
shading: { type: CLEAR, fill: labelFill, color: 'auto' },
borders: subtleBorders(C.border),
width: { size: 35, type: WidthType.PERCENTAGE },
margins: { top: 100, bottom: 100, left: 160, right: 160 },
children: [mkPara(mkRun(label, { bold: true, color: C.teal, size: 22 }), { spacing: { after: 0 } })]
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

async function buildLKPDFromSchema(schema, lkpdData, imagesData = []) {
const identitas  = schema.identitas  || {};
const id         = identitas.identitas || {};
const capaian    = schema.capaian    || {};
const materi     = schema.materi     || {};
const langkah    = schema.langkah    || {};
const evaluasi   = schema.evaluasi   || {};

const children = [];

// -- COVER ----------------------------------------------------------------
children.push(
new Paragraph({
children: [new TextRun({ text: 'LEMBAR KERJA PESERTA DIDIK', bold: true, size: 56, color: C.tealDark, font: 'Calibri' })],
alignment: AlignmentType.CENTER,
spacing: { before: 800, after: 160 }
}),
new Paragraph({
children: [new TextRun({ text: 'KURIKULUM MERDEKA', size: 28, color: C.subtext, font: 'Calibri' })],
alignment: AlignmentType.CENTER,
spacing: { after: 600 }
})
);

children.push(new Table({
width: { size: 100, type: WidthType.PERCENTAGE },
rows: [new TableRow({ children: [new TableCell({
shading: { type: CLEAR, fill: C.tealDark, color: 'auto' },
borders: noBorders(),
margins: { top: 240, bottom: 240, left: 360, right: 360 },
children: [new Paragraph({
children: [new TextRun({
text: identitas.judul || lkpdData.judulModul || lkpdData.topik || 'LKPD',
bold: true, size: 40, color: C.white, font: 'Calibri'
})],
alignment: AlignmentType.CENTER
})]
})]})],
}));

children.push(spacer(400));

children.push(new Table({
width: { size: 70, type: WidthType.PERCENTAGE },
alignment: AlignmentType.CENTER,
rows: [
infoRow('Mata Pelajaran', id.mataPelajaran || lkpdData.mapel || '', C.tealPale, C.white),
infoRow('Kelas / Fase',   `${id.kelas || lkpdData.kelas || ''} / ${id.fase || ''}`, C.altRow, C.white),
infoRow('Penulis',        id.penulis || lkpdData.penulis || '', C.tealPale, C.white),
infoRow('Instansi',       id.instansi || lkpdData.instansi || lkpdData.sekolah || '', C.altRow, C.white),
]
}));

children.push(new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: true }));

// -- A. IDENTITAS ---------------------------------------------------------
children.push(sectionHeading('A.  IDENTITAS LKPD'));
children.push(spacer(120));

children.push(new Table({
width: { size: 100, type: WidthType.PERCENTAGE },
rows: [
new TableRow({ tableHeader: true, children: [hCell('IDENTITAS', C.teal, 35), hCell('KETERANGAN', C.teal, 65)] }),
infoRow('Satuan Pendidikan', id.satuan || '',                          C.tealPale, C.white),
infoRow('Mata Pelajaran',    id.mataPelajaran || lkpdData.mapel || '', C.altRow,   C.white),
infoRow('Fase',             id.fase || '',                             C.tealPale, C.white),
infoRow('Kelas',            id.kelas || lkpdData.kelas || '',          C.altRow,   C.white),
infoRow('Penulis',          id.penulis || lkpdData.penulis || '',      C.tealPale, C.white),
infoRow('Instansi',         id.instansi || lkpdData.instansi || '',   C.altRow,   C.white),
infoRow('Alokasi Waktu',    identitas.alokasiWaktu || '',             C.tealPale, C.white),
]
}));

if (identitas.deskripsiUmum) {
children.push(spacer(160));
children.push(subHeading('Deskripsi Umum'));
children.push(mkPara(mkRun(identitas.deskripsiUmum)));
}

// -- B. TUJUAN PEMBELAJARAN -----------------------------------------------
children.push(spacer(200));
children.push(sectionHeading('B.  TUJUAN PEMBELAJARAN'));
children.push(spacer(120));

if (capaian.capaianPembelajaran) {
children.push(subHeading('Capaian Pembelajaran'));
children.push(mkPara(mkRun(capaian.capaianPembelajaran)));
}

if (capaian.kompetensiDasar) {
children.push(subHeading('Kompetensi Dasar'));
children.push(mkPara(mkRun(capaian.kompetensiDasar)));
}

if ((capaian.tujuanPembelajaran || []).length > 0) {
children.push(subHeading('Tujuan Pembelajaran'));
capaian.tujuanPembelajaran.forEach(t => {
children.push(new Paragraph({
children: [
mkRun(`${t.nomor}. `, { bold: true, color: C.teal }),
mkRun(t.tujuan),
...(t.levelBloom ? [mkRun(` (${t.levelBloom})`, { italics: true, color: C.subtext, size: 22 })] : [])
],
spacing: { after: 100 }
}));
});
}

if ((capaian.indikatorPencapaian || []).length > 0) {
children.push(subHeading('Indikator Pencapaian'));
capaian.indikatorPencapaian.forEach(ind => {
children.push(new Paragraph({
children: [mkRun(ind)],
bullet: { level: 0 },
spacing: { after: 80 }
}));
});
}

if ((capaian.profilPelajarPancasila || []).length > 0) {
children.push(subHeading('Profil Pelajar Pancasila'));
capaian.profilPelajarPancasila.forEach(p => {
children.push(new Paragraph({
children: [
mkRun(p.dimensi || '', { bold: true, color: C.green }),
mkRun(p.implementasi ? `: ${p.implementasi}` : '')
],
bullet: { level: 0 },
spacing: { after: 100 }
}));
});
children.push(spacer(80));
}

// -- C. MATERI PENDUKUNG --------------------------------------------------
if (materi.ringkasanMateri || (materi.konsepKunci || []).length > 0) {
children.push(spacer(200));
children.push(sectionHeading('C.  MATERI PENDUKUNG'));
children.push(spacer(120));

if (materi.ringkasanMateri) {
children.push(subHeading('Ringkasan Materi'));
children.push(mkPara(mkRun(materi.ringkasanMateri)));
}

if ((materi.konsepKunci || []).length > 0) {
children.push(spacer(160));
children.push(subHeading('Konsep Kunci'));
children.push(new Table({
width: { size: 100, type: WidthType.PERCENTAGE },
rows: [
new TableRow({ tableHeader: true, children: [hCell('KONSEP', C.teal, 35), hCell('DEFINISI', C.teal, 65)] }),
...materi.konsepKunci.map((k, i) =>
infoRow(k.konsep || '', k.definisi || '', i % 2 === 0 ? C.tealPale : C.altRow, C.white)
)
]
}));
}

if ((materi.faktaPenting || []).length > 0) {
children.push(spacer(160));
children.push(subHeading('Fakta Penting'));
materi.faktaPenting.forEach(f => {
children.push(new Paragraph({ children: [mkRun(f)], bullet: { level: 0 }, spacing: { after: 80 } }));
});
}

if ((materi.contohAplikasi || []).length > 0) {
children.push(spacer(120));
children.push(subHeading('Contoh Aplikasi'));
materi.contohAplikasi.forEach(c => {
children.push(new Paragraph({ children: [mkRun(c)], bullet: { level: 0 }, spacing: { after: 80 } }));
});
}
}

// -- D. LANGKAH KERJA -----------------------------------------------------
children.push(spacer(200));
children.push(sectionHeading('D.  LANGKAH KERJA'));

const langkahKerja = langkah.langkahKerja || [];
langkahKerja.forEach((bag, idx) => {
children.push(spacer(240));

// Activity header box
children.push(new Table({
width: { size: 100, type: WidthType.PERCENTAGE },
rows: [new TableRow({ children: [new TableCell({
shading: { type: CLEAR, fill: C.tealPale, color: 'auto' },
borders: subtleBorders(C.teal),
margins: { top: 160, bottom: 160, left: 200, right: 200 },
children: [new Paragraph({
children: [
new TextRun({ text: bag.bagian || `Bagian ${idx + 1}`, bold: true, size: 26, color: C.tealDark, font: 'Calibri' }),
...(bag.tujuanBagian ? [new TextRun({ text: `  —  ${bag.tujuanBagian}`, size: 22, color: C.subtext, font: 'Calibri' })] : [])
]
})]
})]})],
}));

// Activity image
const img = imagesData[idx];
if (img?.data) {
try {
const buf = Buffer.from(img.data, 'base64');
children.push(new Paragraph({
children: [new ImageRun({ data: buf, transformation: { width: 500, height: 250 }, type: img.mimeType === 'image/png' ? 'png' : 'jpg' })],
alignment: AlignmentType.CENTER,
spacing: { before: 200, after: 80 }
}));
if (img.caption) {
children.push(new Paragraph({
children: [mkRun(img.caption, { italics: true, size: 20, color: C.subtext })],
alignment: AlignmentType.CENTER,
spacing: { after: 160 }
}));
}
} catch (e) {
console.warn('[Export LKPD DOCX] Failed to embed image:', e.message);
}
}

// Steps
(bag.langkah || []).forEach(l => {
children.push(new Paragraph({
children: [
mkRun(`${l.nomor}. `, { bold: true, color: C.teal }),
mkRun(l.instruksi || ''),
...(l.estimasiWaktu ? [mkRun(`  (${l.estimasiWaktu})`, { italics: true, size: 21, color: C.subtext })] : [])
],
spacing: { after: l.ruangJawaban ? 60 : 100 },
indent: { left: convertInchesToTwip(0.2) }
}));

if (l.ruangJawaban) {
children.push(new Table({
width: { size: 100, type: WidthType.PERCENTAGE },
rows: [new TableRow({ children: [new TableCell({
shading: { type: CLEAR, fill: C.white, color: 'auto' },
borders: subtleBorders(C.border),
margins: { top: 80, bottom: 80, left: 160, right: 160 },
children: [
mkPara(mkRun('Jawaban :', { bold: true, size: 20, color: C.subtext }), { spacing: { after: 0 } }),
mkPara(mkRun(''), { spacing: { after: 0 } }),
mkPara(mkRun(''), { spacing: { after: 0 } }),
mkPara(mkRun(''), { spacing: { after: 0 } }),
mkPara(mkRun(''), { spacing: { after: 0 } }),
]
})]})],
}));
children.push(spacer(100));
}
});
});

// -- E. EVALUASI ----------------------------------------------------------
if ((evaluasi.soalEvaluasi || []).length > 0 || (evaluasi.pertanyaanRefleksi || []).length > 0) {
children.push(spacer(200));
children.push(sectionHeading('E.  EVALUASI'));
children.push(spacer(120));

if ((evaluasi.soalEvaluasi || []).length > 0) {
children.push(subHeading('Soal Evaluasi'));
children.push(new Table({
width: { size: 100, type: WidthType.PERCENTAGE },
rows: [
new TableRow({ tableHeader: true, children: [
hCell('No', C.teal, 8),
hCell('Soal', C.teal, 67),
hCell('Bobot', C.teal, 10),
hCell('Kunci Jawaban', C.teal, 15),
]}),
...evaluasi.soalEvaluasi.map((s, i) => new TableRow({ children: [
new TableCell({
shading: { type: CLEAR, fill: i % 2 === 0 ? C.tealPale : C.altRow, color: 'auto' },
borders: subtleBorders(C.border),
width: { size: 8, type: WidthType.PERCENTAGE },
margins: { top: 80, bottom: 80, left: 120, right: 120 },
children: [mkPara(mkRun(String(s.nomor ?? i + 1), { bold: true, color: C.teal, size: 22 }), { alignment: AlignmentType.CENTER, spacing: { after: 0 } })]
}),
new TableCell({
shading: { type: CLEAR, fill: i % 2 === 0 ? C.tealPale : C.altRow, color: 'auto' },
borders: subtleBorders(C.border),
width: { size: 67, type: WidthType.PERCENTAGE },
margins: { top: 80, bottom: 80, left: 120, right: 120 },
children: [mkPara(mkRun(s.soal || '', { size: 22 }), { spacing: { after: 0 } })]
}),
new TableCell({
shading: { type: CLEAR, fill: i % 2 === 0 ? C.tealPale : C.altRow, color: 'auto' },
borders: subtleBorders(C.border),
width: { size: 10, type: WidthType.PERCENTAGE },
margins: { top: 80, bottom: 80, left: 120, right: 120 },
children: [mkPara(mkRun(String(s.bobot ?? ''), { size: 22 }), { alignment: AlignmentType.CENTER, spacing: { after: 0 } })]
}),
new TableCell({
shading: { type: CLEAR, fill: i % 2 === 0 ? C.tealPale : C.altRow, color: 'auto' },
borders: subtleBorders(C.border),
width: { size: 15, type: WidthType.PERCENTAGE },
margins: { top: 80, bottom: 80, left: 120, right: 120 },
children: [mkPara(mkRun(s.kunciJawaban || '', { size: 22, italics: true, color: C.green }), { spacing: { after: 0 } })]
}),
]}))
]
}));

if (evaluasi.totalBobot) {
children.push(spacer(100));
children.push(mkPara([mkRun('Total Bobot: ', { bold: true, color: C.teal }), mkRun(String(evaluasi.totalBobot))]));
}
}

if ((evaluasi.pertanyaanRefleksi || []).length > 0) {
children.push(spacer(200));
children.push(subHeading('Pertanyaan Refleksi'));
evaluasi.pertanyaanRefleksi.forEach((q, i) => {
children.push(new Paragraph({
children: [mkRun(`${i + 1}. `, { bold: true, color: C.teal }), mkRun(q, { italics: true, color: C.subtext })],
spacing: { after: 80 }
}));
children.push(new Table({
width: { size: 100, type: WidthType.PERCENTAGE },
rows: [new TableRow({ children: [new TableCell({
shading: { type: CLEAR, fill: C.white, color: 'auto' },
borders: subtleBorders(C.border),
margins: { top: 60, bottom: 60, left: 160, right: 160 },
children: [
mkPara(mkRun(''), { spacing: { after: 0 } }),
mkPara(mkRun(''), { spacing: { after: 0 } }),
mkPara(mkRun(''), { spacing: { after: 0 } }),
]
})]})],
}));
children.push(spacer(120));
});
}
}

// -- F. SUMBER REFERENSI --------------------------------------------------
if ((materi.sumberReferensi || []).length > 0) {
children.push(spacer(200));
children.push(sectionHeading('F.  SUMBER REFERENSI'));
children.push(spacer(120));
materi.sumberReferensi.forEach((ref, i) => {
children.push(new Paragraph({
children: [mkRun(`[${i + 1}] ${ref}`, { size: 22, color: C.subtext })],
spacing: { after: 80 }
}));
});
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
// TEXT-BASED FALLBACK BUILDER (when no schema)
// ─────────────────────────────────────────────────────────────────────────────

async function buildLKPDFromText(lkpdData, imagesData = []) {
const sections = [
new Paragraph({
children: [new TextRun({ text: 'LEMBAR KERJA PESERTA DIDIK (LKPD)', bold: true, size: 32 })],
heading: HeadingLevel.TITLE,
alignment: AlignmentType.CENTER,
spacing: { after: 400 }
}),
new Paragraph({
children: [new TextRun({ text: lkpdData.judulModul || lkpdData.topik || '', bold: true, size: 28 })],
heading: HeadingLevel.HEADING_1,
alignment: AlignmentType.CENTER,
spacing: { after: 200 }
}),
new Paragraph({
children: [new TextRun({ text: `${lkpdData.mapel || ''} — Kelas ${lkpdData.kelas || ''}`, size: 24 })],
alignment: AlignmentType.CENTER,
spacing: { after: 100 }
}),
new Paragraph({
children: [new TextRun({ text: `Semester ${lkpdData.semester || '1'}`, size: 24 })],
alignment: AlignmentType.CENTER,
spacing: { after: 800 }
}),
new Paragraph({ text: '', pageBreakBefore: true }),
...parseLKPDText(lkpdData.content || lkpdData.modulAjar || '', imagesData)
];

return new Document({ sections: [{ properties: {}, children: sections }] });
}

function parseLKPDText(content, imagesData = []) {
const paragraphs = [];
const lines = content.split('\n');
let imageIndex = 0;

for (let i = 0; i < lines.length; i++) {
const trimmed = lines[i].trim();

if (trimmed.includes('[Image embedded - visible in .docx download]')) {
const img = imagesData[imageIndex];
if (img?.data) {
try {
const buf = Buffer.from(img.data, 'base64');
if (img.caption) {
paragraphs.push(mkPara(mkRun(img.caption, { bold: true, italics: true, size: 20 }), { spacing: { before: 200, after: 100 } }));
}
paragraphs.push(new Paragraph({
children: [new ImageRun({ data: buf, transformation: { width: 500, height: 250 }, type: 'jpg' })],
alignment: AlignmentType.CENTER,
spacing: { before: 100, after: 200 }
}));
imageIndex++;
} catch (err) {
console.error('[Parse LKPD] Error adding image:', err);
}
}
continue;
}

if (!trimmed) { paragraphs.push(spacer(100)); continue; }

const h3 = trimmed.match(/^###\s+(.*)/);
const h2 = trimmed.match(/^##\s+(.*)/);
const h1 = trimmed.match(/^#\s+(.*)/);

if (h1) {
paragraphs.push(new Paragraph({ children: [mkRun(h1[1], { bold: true, size: 28, color: C.tealDark })], heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));
continue;
}
if (h2) {
paragraphs.push(new Paragraph({ children: [mkRun(h2[1], { bold: true, size: 26, color: C.teal })], heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } }));
continue;
}
if (h3) {
paragraphs.push(new Paragraph({ children: [mkRun(h3[1], { bold: true, size: 24, color: C.teal })], heading: HeadingLevel.HEADING_3, spacing: { before: 240, after: 120 } }));
continue;
}

if (trimmed.match(/^\d+\.\s+/) || trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
const text = trimmed.replace(/^\d+\.\s+/, '').replace(/^[-*•]\s+/, '');
paragraphs.push(new Paragraph({ children: [mkRun(text, { size: 22 })], bullet: { level: 0 }, spacing: { after: 100 } }));
continue;
}

const boldItalic = trimmed.match(/^\*\*\*(.*)\*\*\*$/);
const bold = trimmed.match(/^\*\*(.*)\*\*$/);
const italic = trimmed.match(/^\*(.*)\*$/);
const text = boldItalic?.[1] ?? bold?.[1] ?? italic?.[1] ?? trimmed;
paragraphs.push(new Paragraph({
children: [mkRun(text, { size: 23, bold: !!boldItalic || !!bold, italics: !!boldItalic || !!italic })],
spacing: { after: 100 }
}));
}

return paragraphs;
}

function sanitizeFilename(filename) {
return filename.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').substring(0, 100);
}
