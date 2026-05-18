/**
 * API Endpoint untuk Export Modul Ajar ke .docx
 * 
 * Convert modul ajar ke format Microsoft Word Document
 */

import { json } from '@sveltejs/kit';
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, convertInchesToTwip, ImageRun, ShadingType } from 'docx';
import { Packer } from 'docx';

/**
 * POST /api/export-modul-docx
 * Export modul ajar data to .docx format
 */
export async function POST({ request, locals }) {
	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { modulData } = body;

		if (!modulData) {
			return json({ error: 'Data modul ajar tidak ditemukan' }, { status: 400 });
		}

		// Extract images if available
		const images = modulData.images || [];
		console.log('[Export DOCX] Received images:', images.length);
		if (images.length > 0) {
			console.log('[Export DOCX] First image structure:', {
				hasData: !!images[0].data,
				dataLength: images[0].data?.length,
				mimeType: images[0].mimeType,
				caption: images[0].caption
			});
		}

		// Build Word document
		const doc = await buildModulAjarDocument(modulData, images);

		// Convert to buffer
		const buffer = await Packer.toBuffer(doc);

		// Return as downloadable file
		return new Response(buffer, {
			status: 200,
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				'Content-Disposition': `attachment; filename="Modul_Ajar_${sanitizeFilename(modulData.judulModul || 'Document')}.docx"`
			}
		});

	} catch (error) {
		console.error('Export docx error:', error);
		return json(
			{
				success: false,
				error: 'Gagal export dokumen. Silakan coba lagi.'
			},
			{ status: 500 }
		);
	}
}

/**
 * Build complete Word document for Modul Ajar
 */
async function buildModulAjarDocument(modulData, imagesData = []) {
	// Use structured schema builder when available — produces much richer output
	if (modulData.schema) {
		console.log('[Export DOCX] Using schema-based builder');
		return buildModulAjarFromSchema(modulData.schema, modulData, imagesData);
	}

	console.log('[Export DOCX] Falling back to text-based builder (no schema)');
	const sections = [];

	// Title Page
	sections.push(
		new Paragraph({
			children: [
				new TextRun({
					text: 'MODUL AJAR',
					bold: true,
					size: 32 // 16pt (size is in half-points, so 32 = 16pt)
				})
			],
			heading: HeadingLevel.TITLE,
			alignment: AlignmentType.CENTER,
			spacing: { after: 400 }
		}),
		new Paragraph({
			children: [
				new TextRun({
					text: modulData.judulModul || 'Judul Modul',
					bold: true,
					size: 28 // 14pt
				})
			],
			heading: HeadingLevel.HEADING_1,
			alignment: AlignmentType.CENTER,
			spacing: { after: 200 }
		}),
		new Paragraph({
			children: [
				new TextRun({
					text: `${modulData.mapel || ''} - Kelas ${modulData.kelas || ''}`,
					size: 24 // 12pt
				})
			],
			alignment: AlignmentType.CENTER,
			spacing: { after: 100 }
		}),
		new Paragraph({
			children: [
				new TextRun({
					text: `Kurikulum Merdeka`,
					size: 24 // 12pt
				})
			],
			alignment: AlignmentType.CENTER,
			spacing: { after: 800 }
		})
	);

	// Add page break
	sections.push(
		new Paragraph({
			text: '',
			pageBreakBefore: true
		})
	);

	// Parse modul content
	const content = modulData.content || modulData.modulAjar || '';
	const contentSections = parseModulContent(content);

	// A. INFORMASI UMUM
	if (contentSections.informasiUmum) {
		sections.push(
			new Paragraph({
				children: [
					new TextRun({
						text: 'A. INFORMASI UMUM',
						bold: true,
						size: 28 // 14pt for main headings
					})
				],
				heading: HeadingLevel.HEADING_1,
				spacing: { before: 400, after: 200 }
			})
		);
		sections.push(...formatContentSection(contentSections.informasiUmum));
	}

	// B. CAPAIAN & TUJUAN PEMBELAJARAN (combined section)
	if (contentSections.capaianPembelajaran || contentSections.capaianTujuan) {
		sections.push(
			new Paragraph({
				children: [
					new TextRun({
						text: 'B. CAPAIAN & TUJUAN PEMBELAJARAN',
						bold: true,
						size: 28 // 14pt
					})
				],
				heading: HeadingLevel.HEADING_1,
				spacing: { before: 400, after: 200 }
			})
		);
		const contentToUse = contentSections.capaianTujuan || contentSections.capaianPembelajaran;
		sections.push(...formatContentSection(contentToUse));
	}

	// E. KEGIATAN PEMBELAJARAN (with embedded images)
	if (contentSections.kegiatanPembelajaran) {
		console.log('[Export DOCX] Processing Kegiatan Pembelajaran section...');
		sections.push(
			new Paragraph({
				children: [
					new TextRun({
						text: 'C. DETAIL KEGIATAN PEMBELAJARAN',
						bold: true,
						size: 28 // 14pt
					})
				],
				heading: HeadingLevel.HEADING_1,
				spacing: { before: 400, after: 200 }
			})
		);
		
		// Parse content and embed images inline
		const kegiatanWithImages = formatContentWithInlineImages(
			contentSections.kegiatanPembelajaran,
			imagesData
		);
		sections.push(...kegiatanWithImages);
	} else {
		console.warn('[Export DOCX] ⚠️ Kegiatan Pembelajaran section not found in content!');
	}
	
	// D. ASESMEN
	if (contentSections.asesmen) {
		sections.push(
			new Paragraph({
				children: [
					new TextRun({
						text: 'D. RENCANA ASESMEN',
						bold: true,
						size: 28 // 14pt
					})
				],
				heading: HeadingLevel.HEADING_1,
				spacing: { before: 400, after: 200 }
			})
		);
		sections.push(...formatContentSection(contentSections.asesmen));
	}

	// G. MEDIA DAN SUMBER BELAJAR
	if (contentSections.mediaSumberBelajar) {
		sections.push(
			new Paragraph({
				children: [
					new TextRun({
						text: 'G. MEDIA DAN SUMBER BELAJAR',
						bold: true,
						size: 28 // 14pt
					})
				],
				heading: HeadingLevel.HEADING_1,
				spacing: { before: 400, after: 200 }
			})
		);
		sections.push(...formatContentSection(contentSections.mediaSumberBelajar));
	}

	// Create document
	const doc = new Document({
		sections: [
			{
				properties: {},
				children: sections
			}
		]
	});

	return doc;
}

/**
 * Parse modul content into sections
 */
function parseModulContent(content) {
	const sections = {};
	
	// Split by major headings
	const lines = content.split('\n');
	let currentSection = null;
	let currentContent = [];

	for (const line of lines) {
		const trimmed = line.trim();
		// Strip leading markdown heading markers (##, ###, etc.) for matching
		const stripped = trimmed.replace(/^#+\s*/, '');
		
		// Detect section headers
		if (stripped.match(/^[A-Z]\.\s*INFORMASI\s*UMUM/i)) {
			if (currentSection) sections[currentSection] = currentContent.join('\n');
			currentSection = 'informasiUmum';
			currentContent = [];
		} else if (stripped.match(/^[A-Z]\.\s*CAPAIAN\s*(&|DAN)?\s*TUJUAN\s*PEMBELAJARAN/i)) {
			// Combined section "B. CAPAIAN & TUJUAN PEMBELAJARAN"
			if (currentSection) sections[currentSection] = currentContent.join('\n');
			currentSection = 'capaianTujuan';
			currentContent = [];
		} else if (stripped.match(/^[A-Z]\.\s*CAPAIAN\s*PEMBELAJARAN/i)) {
			if (currentSection) sections[currentSection] = currentContent.join('\n');
			currentSection = 'capaianPembelajaran';
			currentContent = [];
		} else if (stripped.match(/^[A-Z]\.\s*TUJUAN\s*PEMBELAJARAN/i)) {
			if (currentSection) sections[currentSection] = currentContent.join('\n');
			currentSection = 'tujuanPembelajaran';
			currentContent = [];
		} else if (stripped.match(/^[A-Z]\.\s*PROFIL\s*PELAJAR\s*PANCASILA/i)) {
			if (currentSection) sections[currentSection] = currentContent.join('\n');
			currentSection = 'profilPelajarPancasila';
			currentContent = [];
		} else if (stripped.match(/^[A-Z]\.\s*DETAIL\s*KEGIATAN\s*PEMBELAJARAN/i) || stripped.match(/^[A-Z]\.\s*KEGIATAN\s*PEMBELAJARAN/i)) {
			if (currentSection) sections[currentSection] = currentContent.join('\n');
			currentSection = 'kegiatanPembelajaran';
			currentContent = [];
		} else if (stripped.match(/^[A-Z]\.\s*RENCANA\s*ASESMEN/i) || stripped.match(/^[A-Z]\.\s*ASESMEN/i)) {
			if (currentSection) sections[currentSection] = currentContent.join('\n');
			currentSection = 'asesmen';
			currentContent = [];
		} else if (stripped.match(/^[A-Z]\.\s*MEDIA\s*(DAN|&)?\s*SUMBER\s*BELAJAR/i)) {
			if (currentSection) sections[currentSection] = currentContent.join('\n');
			currentSection = 'mediaSumberBelajar';
			currentContent = [];
		} else if (currentSection && trimmed) {
			currentContent.push(line);
		}
	}

	// Save last section
	if (currentSection) {
		sections[currentSection] = currentContent.join('\n');
	}

	return sections;
}

/**
 * Format content section into paragraphs
 */
function formatContentSection(content) {
	const paragraphs = [];
	const lines = content.split('\n');

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) continue;

		// Check if it's a subheading (bold text with colon or all caps)
		if (trimmed.match(/^[•\-\*]\s/) || trimmed.match(/^\d+\.\s/)) {
			// Bullet or numbered list
			const text = trimmed.replace(/^[•\-\*]\s/, '').replace(/^\d+\.\s/, '');
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: text,
							size: 24 // 12pt for list items
						})
					],
					bullet: { level: 0 },
					spacing: { after: 100 }
				})
			);
		} else if (trimmed.match(/^[A-Z\s]{5,}:?$/)) {
			// All caps subheading
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: trimmed,
							bold: true,
							size: 26 // 13pt for subheadings
						})
					],
					heading: HeadingLevel.HEADING_2,
					spacing: { before: 200, after: 100 }
				})
			);
		} else if (trimmed.includes(':') && trimmed.split(':')[0].length < 50) {
			// Label: Value format
			const [label, ...valueParts] = trimmed.split(':');
			const value = valueParts.join(':').trim();
			
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: label + ': ',
							bold: true,
							size: 24 // 12pt
						}),
						new TextRun({
							text: value,
							size: 24 // 12pt
						})
					],
					spacing: { after: 100 }
				})
			);
		} else {
			// Regular paragraph
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: trimmed,
							size: 24 // 12pt for body text
						})
					],
					spacing: { after: 100 }
				})
			);
		}
	}

	return paragraphs;
}

/**
 * Format content section with inline images embedded at placeholder positions
 */
function formatContentWithInlineImages(content, imagesData = []) {
	const paragraphs = [];
	const lines = content.split('\n');
	let imageIndex = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();
		if (!trimmed) continue;

		// Check if this line is an image placeholder
		if (trimmed.includes('[Image embedded - visible in .docx download]')) {
			// Skip this placeholder line and look for image to embed
			if (imagesData && imageIndex < imagesData.length) {
				const img = imagesData[imageIndex];
				imageIndex++;

				try {
					if (img.data) {
						// Convert base64 to buffer
						const imageBuffer = Buffer.from(img.data, 'base64');
						console.log('[Export DOCX] Embedding image inline:', {
							caption: img.caption,
							bufferSize: imageBuffer.length,
							mimeType: img.mimeType
						});

						// Add image description (without emoji to avoid Word compatibility issues)
						paragraphs.push(
							new Paragraph({
								children: [
									new TextRun({
										text: img.description || 'Ilustrasi pembelajaran',
										size: 22,
										bold: true,
										color: '444444'
									})
								],
								spacing: { before: 300, after: 100 }
							})
						);

						// Add image with explicit type
						paragraphs.push(
							new Paragraph({
								children: [
									new ImageRun({
										data: imageBuffer,
										transformation: {
											width: 500,
											height: 375
										},
										type: img.mimeType === 'image/png' ? 'png' : 'jpg'
									})
								],
								alignment: AlignmentType.CENTER,
								spacing: { after: 200 }
							})
						);

						// Add caption
						paragraphs.push(
							new Paragraph({
								children: [
									new TextRun({
										text: img.caption || 'Ilustrasi',
										size: 20,
										italics: true,
										color: '666666'
									})
								],
								alignment: AlignmentType.CENTER,
								spacing: { after: 400 }
							})
						);

						console.log('[Export DOCX] ✅ Image embedded inline successfully');
					}
				} catch (imgError) {
					console.error('[Export DOCX] ❌ Error embedding inline image:', imgError.message);
				}
			}
			continue; // Skip the placeholder line
		}

		// Check if line contains image marker text (e.g., "[Gambar: ...]")
		if (trimmed.match(/^\[Gambar:/)) {
			continue; // Skip this line as it's part of image placeholder
		}

		// Regular content formatting (same as formatContentSection)
		if (trimmed.match(/^[•\-\*]\s/) || trimmed.match(/^\d+\.\s/)) {
			// Bullet or numbered list
			const text = trimmed.replace(/^[•\-\*]\s/, '').replace(/^\d+\.\s/, '');
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: text,
							size: 24 // 12pt for list items
						})
					],
					bullet: { level: 0 },
					spacing: { after: 100 }
				})
			);
		} else if (trimmed.match(/^[A-Z\s]{5,}:?$/) || trimmed.match(/^─+/) || trimmed.match(/^═+/)) {
			// All caps subheading or separator lines
			if (!trimmed.match(/^[─═]+$/)) {
				paragraphs.push(
					new Paragraph({
						children: [
							new TextRun({
								text: trimmed,
								bold: true,
								size: 26 // 13pt for subheadings
							})
						],
						heading: HeadingLevel.HEADING_2,
						spacing: { before: 200, after: 100 }
					})
				);
			}
		} else if (trimmed.includes(':') && trimmed.split(':')[0].length < 50) {
			// Label: Value format
			const [label, ...valueParts] = trimmed.split(':');
			const value = valueParts.join(':').trim();
			
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: label + ': ',
							bold: true,
							size: 24 // 12pt
						}),
						new TextRun({
							text: value,
							size: 24 // 12pt
						})
					],
					spacing: { after: 100 }
				})
			);
		} else {
			// Regular paragraph
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: trimmed,
							size: 24 // 12pt for body text
						})
					],
					spacing: { after: 100 }
				})
			);
		}
	}

	console.log('[Export DOCX] Formatted content with', imageIndex, 'images embedded inline');
	return paragraphs;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA-BASED DOCUMENT BUILDER (beautiful, structured output)
// ─────────────────────────────────────────────────────────────────────────────

const C = {
	blue: '1D4ED8',
	blueDark: '1E3A8A',
	blueLight: 'DBEAFE',
	bluePale: 'EFF6FF',
	green: '16A34A',
	greenLight: 'D1FAE5',
	amber: 'D97706',
	amberLight: 'FEF3C7',
	red: 'DC2626',
	redLight: 'FEE2E2',
	border: 'CBD5E1',
	altRow: 'F1F5F9',
	white: 'FFFFFF',
	text: '1E293B',
	subtext: '475569'
};

// ShadingType.CLEAR = background fill only (no pattern overlay — prevents black rendering)
const CLEAR = ShadingType.CLEAR;

function noBorders() {
	const s = { style: BorderStyle.NONE, size: 0, color: 'auto' };
	return { top: s, bottom: s, left: s, right: s, insideH: s, insideV: s };
}

function subtleBorders(color = C.border) {
	const s = { style: BorderStyle.SINGLE, size: 4, color };
	return { top: s, bottom: s, left: s, right: s };
}

function mkPara(runs, opts = {}) {
	return new Paragraph({ children: Array.isArray(runs) ? runs : [runs], spacing: { after: 100 }, ...opts });
}

function mkRun(text, opts = {}) {
	return new TextRun({ text: String(text ?? ''), font: 'Calibri', size: 24, color: C.text, ...opts });
}

function sectionHeading(text) {
	return new Paragraph({
		children: [new TextRun({ text, bold: true, size: 28, color: C.blueDark, font: 'Calibri' })],
		// shading: { type: CLEAR, fill: C.blueDark, color: 'auto' },
		spacing: { before: 480, after: 0 },
		indent: { left: 200, right: 200 }
	});
}

function subHeading(text, color = C.blue) {
	return new Paragraph({
		children: [new TextRun({ text, bold: true, size: 24, color, font: 'Calibri' })],
		border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.blueLight } },
		spacing: { before: 280, after: 120 }
	});
}

// Phase heading for PEMBUKA / INTI / PENUTUP
function phaseHeading(text, color) {
	return new Paragraph({
		children: [new TextRun({ text, bold: true, size: 22, color, font: 'Calibri' })],
		spacing: { before: 200, after: 80 }
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

function infoRow(label, value, labelFill = C.bluePale, valueFill = C.white) {
	return new TableRow({ children: [
		new TableCell({
			shading: { type: CLEAR, fill: labelFill, color: 'auto' },
			borders: subtleBorders(C.border),
			width: { size: 35, type: WidthType.PERCENTAGE },
			margins: { top: 100, bottom: 100, left: 160, right: 160 },
			children: [mkPara(mkRun(label, { bold: true, color: C.blue, size: 22 }), { spacing: { after: 0 } })]
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

function rubricCell(text, fill) {
	return new TableCell({
		shading: { type: CLEAR, fill, color: 'auto' },
		borders: subtleBorders(C.border),
		margins: { top: 80, bottom: 80, left: 120, right: 120 },
		children: [mkPara(mkRun(text ?? '', { size: 21 }), { spacing: { after: 0 } })]
	});
}

function spacer(size = 200) {
	return new Paragraph({ children: [new TextRun('')], spacing: { after: size } });
}

async function buildModulAjarFromSchema(schema, modulData, imagesData = []) {
	const identitas = schema.identitas || {};
	const id = identitas.identitas || {};
	const capaian = schema.capaian || {};
	const kegiatan = schema.kegiatan || {};
	const asesmen = schema.asesmen || {};

	const children = [];

	// ── COVER ────────────────────────────────────────────────────────────────
	children.push(
		new Paragraph({
			children: [new TextRun({ text: 'MODUL AJAR', bold: true, size: 64, color: C.blueDark, font: 'Calibri' })],
			alignment: AlignmentType.CENTER,
			spacing: { before: 800, after: 160 }
		}),
		new Paragraph({
			children: [new TextRun({ text: 'KURIKULUM MERDEKA', size: 28, color: C.subtext, font: 'Calibri' })],
			alignment: AlignmentType.CENTER,
			spacing: { after: 600 }
		})
	);

	// Title box
	children.push(new Table({
		width: { size: 100, type: WidthType.PERCENTAGE },
		rows: [new TableRow({ children: [new TableCell({
			shading: { type: CLEAR, fill: C.blueDark, color: 'auto' },
			borders: noBorders(),
			margins: { top: 240, bottom: 240, left: 360, right: 360 },
			children: [new Paragraph({
				children: [new TextRun({ text: identitas.judul || modulData.judulModul || 'MODUL AJAR', bold: true, size: 40, color: C.white, font: 'Calibri' })],
				alignment: AlignmentType.CENTER
			})]
		})]})],
	}));

	children.push(spacer(400));

	// Cover info mini-table
	children.push(new Table({
		width: { size: 70, type: WidthType.PERCENTAGE },
		alignment: AlignmentType.CENTER,
		rows: [
			infoRow('Mata Pelajaran', id.mataPelajaran || modulData.mapel || '', C.bluePale, C.white),
			infoRow('Kelas / Fase', `${id.kelas || modulData.kelas || ''} / ${id.fase || ''}`, C.altRow, C.white),
			infoRow('Penulis', id.penulis || modulData.penulis || '', C.bluePale, C.white),
			infoRow('Instansi', id.instansi || modulData.instansi || '', C.altRow, C.white),
		]
	}));

	// Page break
	children.push(new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: true }));

	// ── A. INFORMASI UMUM ────────────────────────────────────────────────────
	children.push(sectionHeading('A.  INFORMASI UMUM'));
	children.push(spacer(120));

	children.push(new Table({
		width: { size: 100, type: WidthType.PERCENTAGE },
		rows: [
			new TableRow({ tableHeader: true, children: [hCell('IDENTITAS', C.blue, 35), hCell('KETERANGAN', C.blue, 65)] }),
			infoRow('Satuan Pendidikan', id.satuan || '',              C.bluePale, C.white),
			infoRow('Mata Pelajaran',    id.mataPelajaran || '',        C.altRow,   C.white),
			infoRow('Fase',             id.fase || '',                 C.bluePale, C.white),
			infoRow('Kelas',            id.kelas || '',                C.altRow,   C.white),
			infoRow('Penulis',          id.penulis || '',              C.bluePale, C.white),
			infoRow('Instansi',         id.instansi || '',             C.altRow,   C.white),
			infoRow('Durasi Total',     identitas.durasiTotal || '',   C.bluePale, C.white),
			infoRow('Alokasi Waktu',    identitas.alokasiWaktu || '',  C.altRow,   C.white),
		]
	}));

	if (identitas.deskripsiUmum) {
		children.push(spacer(160));
		children.push(subHeading('Deskripsi Umum'));
		children.push(mkPara(mkRun(identitas.deskripsiUmum)));
	}

	// ── B. CAPAIAN & TUJUAN ──────────────────────────────────────────────────
	children.push(spacer(200));
	children.push(sectionHeading('B.  CAPAIAN & TUJUAN PEMBELAJARAN'));
	children.push(spacer(120));

	if (capaian.capaianPembelajaran) {
		children.push(subHeading('Capaian Pembelajaran'));
		children.push(mkPara(mkRun(capaian.capaianPembelajaran)));
	}

	if ((capaian.tujuanPembelajaran || []).length > 0) {
		children.push(subHeading('Tujuan Pembelajaran'));
		capaian.tujuanPembelajaran.forEach(t => {
			children.push(new Paragraph({
				children: [
					mkRun(`${t.nomor}. `, { bold: true, color: C.blue }),
					mkRun(t.tujuan),
					...(t.levelBloom ? [mkRun(` (${t.levelBloom})`, { italics: true, color: C.subtext, size: 22 })] : [])
				],
				spacing: { after: 100 }
			}));
		});
	}

	// Profil Pelajar Pancasila — bullet list (matches HTML)
	if ((capaian.profilPelajarPancasila || []).length > 0) {
		children.push(subHeading('Profil Pelajar Pancasila'));
		capaian.profilPelajarPancasila.forEach(p => {
			children.push(new Paragraph({
				children: [
					mkRun(`${p.dimensi || ''}`, { bold: true, color: C.green }),
					mkRun(p.implementasi ? `: ${p.implementasi}` : '')
				],
				bullet: { level: 0 },
				spacing: { after: 100 }
			}));
		});
		children.push(spacer(80));
	}

	// ── C. KEGIATAN PEMBELAJARAN ─────────────────────────────────────────────
	children.push(spacer(200));
	children.push(sectionHeading('C.  KEGIATAN PEMBELAJARAN'));

	const pertemuan = kegiatan.pertemuan || [];
	pertemuan.forEach((p, idx) => {
		children.push(spacer(240));

		// Pertemuan header box
		children.push(new Table({
			width: { size: 100, type: WidthType.PERCENTAGE },
			rows: [new TableRow({ children: [new TableCell({
				// shading: { type: CLEAR, fill: C.blue, color: 'auto' },
				borders: noBorders(),
				margins: { top: 160, bottom: 160, left: 200, right: 200 },
				children: [new Paragraph({
					children: [new TextRun({ text: `Pertemuan ke-${p.ke}:  ${p.tujuanPertemuan || ''}`, bold: true, size: 26, color: C.black, font: 'Calibri' })]
				})]
			})]})],
		}));

		// Image
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
				console.warn('[Export DOCX] Failed to embed image:', e.message);
			}
		}

		// Pertanyaan pemantik — bullet list
		if ((p.pertanyaanPemantik || []).length > 0) {
			children.push(subHeading('Pertanyaan Pemantik'));
			p.pertanyaanPemantik.forEach(q => {
				children.push(new Paragraph({
					children: [mkRun(q, { italics: true, color: C.subtext })],
					bullet: { level: 0 },
					spacing: { after: 80 }
				}));
			});
		}

		// Langkah Pembelajaran — 3 sections with bullet lists (matches HTML)
		const lp = p.langkahPembelajaran || {};
		const pembuka = lp.pembuka || [];
		const inti = lp.inti || [];
		const penutup = lp.penutup || [];
		if (pembuka.length || inti.length || penutup.length) {
			children.push(subHeading('Langkah Pembelajaran'));

			if (pembuka.length > 0) {
				children.push(phaseHeading('PEMBUKA', C.green));
				pembuka.forEach(l => {
					children.push(new Paragraph({
						children: [
							mkRun(l.aktivitas || '', { size: 23 }),
							...(l.durasi ? [mkRun(` (${l.durasi})`, { size: 21, italics: true, color: C.subtext })] : [])
						],
						bullet: { level: 0 },
						spacing: { after: 80 }
					}));
				});
			}

			if (inti.length > 0) {
				children.push(phaseHeading('INTI', C.blue));
				inti.forEach(l => {
					children.push(new Paragraph({
						children: [
							mkRun(l.aktivitas || '', { size: 23 }),
							...(l.durasi ? [mkRun(` (${l.durasi})`, { size: 21, italics: true, color: C.subtext })] : [])
						],
						bullet: { level: 0 },
						spacing: { after: 80 }
					}));
				});
			}

			if (penutup.length > 0) {
				children.push(phaseHeading('PENUTUP', C.amber));
				penutup.forEach(l => {
					children.push(new Paragraph({
						children: [
							mkRun(l.aktivitas || '', { size: 23 }),
							...(l.durasi ? [mkRun(` (${l.durasi})`, { size: 21, italics: true, color: C.subtext })] : [])
						],
						bullet: { level: 0 },
						spacing: { after: 80 }
					}));
				});
			}
		}

		// Diferensiasi — bullet list (matches HTML)
		const dif = p.diferensiasi || {};
		if (dif.konten || dif.proses || dif.produk) {
			children.push(subHeading('Diferensiasi'));
			[['Konten', dif.konten], ['Proses', dif.proses], ['Produk', dif.produk]].forEach(([label, val]) => {
				if (!val) return;
				children.push(new Paragraph({
					children: [mkRun(`${label}: `, { bold: true, color: C.blue }), mkRun(val)],
					bullet: { level: 0 },
					spacing: { after: 80 }
				}));
			});
		}
	});

	// ── D. ASESMEN ───────────────────────────────────────────────────────────
	children.push(spacer(200));
	children.push(sectionHeading('D. ASESMEN'));
	children.push(spacer(120));

	const diagn = asesmen.asesmenDiagnostik || {};
	if (diagn.tujuan) {
		children.push(subHeading('Asesmen Diagnostik'));
		children.push(mkPara([mkRun(diagn.tujuan)]));
		if ((diagn.instrumen || []).length > 0) {
			children.push(mkPara([mkRun('Instrumen: ', { bold: true, color: C.blue }), mkRun(diagn.instrumen.join(', '))]));
		}
	}

	if ((asesmen.asesmenFormatif || []).length > 0) {
		children.push(subHeading('Asesmen Formatif'));
		asesmen.asesmenFormatif.forEach(a => {
			// Build bullet text: "Pertemuan 1: Teknik — Instrumen"
			const parts = [];
			if (a.teknik) parts.push(a.teknik);
			if (a.instrumen) parts.push(a.instrumen);
			const detail = parts.join(' — ');
			children.push(new Paragraph({
				children: [
					mkRun(`Pertemuan ${a.pertemuan}: `, { bold: true }),
					mkRun(detail)
				],
				bullet: { level: 0 },
				spacing: { after: 100 }
			}));
		});
		children.push(spacer(160));
	}

	const sumatif = asesmen.asesmenSumatif || {};
	if (sumatif.bentuk) {
		children.push(subHeading('Asesmen Sumatif'));
		// Header line: "Bentuk (Bobot: X%)"
		const sumatifHeader = [
			mkRun('Asesmen Sumatif: ', { bold: true }),
			mkRun(sumatif.bentuk, { bold: true, color: C.blue }),
			...(sumatif.bobot ? [mkRun(` (Bobot: ${sumatif.bobot})`, { color: C.blue })] : [])
		];
		children.push(mkPara(sumatifHeader, { spacing: { after: 120 } }));
		if (sumatif.instrumen) {
			children.push(mkPara(mkRun(sumatif.instrumen), { spacing: { after: 80 } }));
		}
		children.push(spacer(160));
	}

	if ((asesmen.rubrikPenilaian || []).length > 0) {
		children.push(subHeading('Rubrik Penilaian'));
		asesmen.rubrikPenilaian.forEach(r => {
			children.push(mkPara(mkRun(`Aspek: ${r.aspek}`, { bold: true, color: C.blue }), { spacing: { before: 160, after: 80 } }));
			const k = r.kriteria || {};
			children.push(new Table({
				width: { size: 100, type: WidthType.PERCENTAGE },
				rows: [
					new TableRow({ tableHeader: true, children: [hCell('Sangat Baik (4)', C.green, 25), hCell('Baik (3)', C.blue, 25), hCell('Cukup (2)', C.amber, 25), hCell('Perlu Bimbingan (1)', C.red, 25)] }),
					new TableRow({ children: [rubricCell(k.sangat_baik, C.greenLight), rubricCell(k.baik, C.blueLight), rubricCell(k.cukup, C.amberLight), rubricCell(k.perlu_bimbingan, C.redLight)] })
				]
			}));
			children.push(spacer(120));
		});
	}

	if ((asesmen.refleksiGuru || []).length > 0) {
		children.push(subHeading('Refleksi Guru'));
		asesmen.refleksiGuru.forEach(r => {
			children.push(new Paragraph({ children: [mkRun(r)], bullet: { level: 0 }, spacing: { after: 80 } }));
		});
	}

	return new Document({
		styles: {
			default: {
				document: { run: { font: 'Calibri', size: 24, color: C.text } }
			}
		},
		sections: [{ properties: {}, children }]
	});
}

/**
 * Sanitize filename for safe file download
 */
function sanitizeFilename(filename) {
	return filename
		.replace(/[^a-z0-9_\-\.]/gi, '_')
		.replace(/_{2,}/g, '_')
		.substring(0, 100);
}
