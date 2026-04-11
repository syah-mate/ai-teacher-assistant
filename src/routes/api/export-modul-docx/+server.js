/**
 * API Endpoint untuk Export Modul Ajar ke .docx
 * 
 * Convert modul ajar ke format Microsoft Word Document
 */

import { json } from '@sveltejs/kit';
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, convertInchesToTwip, ImageRun } from 'docx';
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
		
		// Detect section headers
		if (trimmed.match(/^[A-Z]\.\s*INFORMASI\s*UMUM/i)) {
			if (currentSection) sections[currentSection] = currentContent.join('\n');
			currentSection = 'informasiUmum';
			currentContent = [];
		} else if (trimmed.match(/^[A-Z]\.\s*CAPAIAN\s*(&|DAN)?\s*TUJUAN\s*PEMBELAJARAN/i)) {
			// Combined section "B. CAPAIAN & TUJUAN PEMBELAJARAN"
			if (currentSection) sections[currentSection] = currentContent.join('\n');
			currentSection = 'capaianTujuan';
			currentContent = [];
		} else if (trimmed.match(/^[A-Z]\.\s*CAPAIAN\s*PEMBELAJARAN/i)) {
			if (currentSection) sections[currentSection] = currentContent.join('\n');
			currentSection = 'capaianPembelajaran';
			currentContent = [];
		} else if (trimmed.match(/^[A-Z]\.\s*TUJUAN\s*PEMBELAJARAN/i)) {
			if (currentSection) sections[currentSection] = currentContent.join('\n');
			currentSection = 'tujuanPembelajaran';
			currentContent = [];
		} else if (trimmed.match(/^[A-Z]\.\s*PROFIL\s*PELAJAR\s*PANCASILA/i)) {
			if (currentSection) sections[currentSection] = currentContent.join('\n');
			currentSection = 'profilPelajarPancasila';
			currentContent = [];
		} else if (trimmed.match(/^[A-Z]\.\s*DETAIL\s*KEGIATAN\s*PEMBELAJARAN/i) || trimmed.match(/^[A-Z]\.\s*KEGIATAN\s*PEMBELAJARAN/i)) {
			if (currentSection) sections[currentSection] = currentContent.join('\n');
			currentSection = 'kegiatanPembelajaran';
			currentContent = [];
		} else if (trimmed.match(/^[A-Z]\.\s*RENCANA\s*ASESMEN/i) || trimmed.match(/^[A-Z]\.\s*ASESMEN/i)) {
			if (currentSection) sections[currentSection] = currentContent.join('\n');
			currentSection = 'asesmen';
			currentContent = [];
		} else if (trimmed.match(/^[A-Z]\.\s*MEDIA\s*(DAN|&)?\s*SUMBER\s*BELAJAR/i)) {
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

/**
 * Sanitize filename for safe file download
 */
function sanitizeFilename(filename) {
	return filename
		.replace(/[^a-z0-9_\-\.]/gi, '_')
		.replace(/_{2,}/g, '_')
		.substring(0, 100);
}
