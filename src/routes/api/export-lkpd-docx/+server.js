/**
 * API Endpoint untuk Export LKPD ke .docx
 * 
 * Convert LKPD ke format Microsoft Word Document
 */

import { json } from '@sveltejs/kit';
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, convertInchesToTwip } from 'docx';
import { Packer } from 'docx';

/**
 * POST /api/export-lkpd-docx
 * Export LKPD data to .docx format
 */
export async function POST({ request, locals }) {
	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { lkpdData } = body;

		if (!lkpdData) {
			return json({ error: 'Data LKPD tidak ditemukan' }, { status: 400 });
		}

		// Extract images if available
		const images = lkpdData.images || [];
		console.log('[Export LKPD DOCX] Received images:', images.length);
		if (images.length > 0) {
			console.log('[Export LKPD DOCX] First image structure:', {
				hasData: !!images[0].data,
				dataLength: images[0].data?.length,
				mimeType: images[0].mimeType,
				caption: images[0].caption
			});
		}

		// Build Word document
		const doc = await buildLKPDDocument(lkpdData, images);

		// Convert to buffer
		const buffer = await Packer.toBuffer(doc);

		// Return as downloadable file
		return new Response(buffer, {
			status: 200,
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				'Content-Disposition': `attachment; filename="LKPD_${sanitizeFilename(lkpdData.judulModul || 'Document')}.docx"`
			}
		});

	} catch (error) {
		console.error('Export LKPD docx error:', error);
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
 * Build complete Word document for LKPD
 */
async function buildLKPDDocument(lkpdData, imagesData = []) {
	const sections = [];

	// Title Page
	sections.push(
		new Paragraph({
			children: [
				new TextRun({
					text: 'LEMBAR KERJA PESERTA DIDIK (LKPD)',
					bold: true,
					size: 32 // 16pt
				})
			],
			heading: HeadingLevel.TITLE,
			alignment: AlignmentType.CENTER,
			spacing: { after: 400 }
		}),
		new Paragraph({
			children: [
				new TextRun({
					text: lkpdData.judulModul || 'Judul LKPD',
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
					text: `${lkpdData.mapel || ''} - Kelas ${lkpdData.kelas || ''}`,
					size: 24 // 12pt
				})
			],
			alignment: AlignmentType.CENTER,
			spacing: { after: 100 }
		}),
		new Paragraph({
			children: [
				new TextRun({
					text: `Semester ${lkpdData.semester || '1'}`,
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

	// Parse LKPD content
	const content = lkpdData.content || lkpdData.modulAjar || '';
	const parsedContent = parseLKPDContent(content, imagesData);

	// Add all parsed content sections
	sections.push(...parsedContent);

	// Create and return document
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
 * Parse LKPD content text and convert to Word paragraphs with embedded images
 */
function parseLKPDContent(content, imagesData = []) {
	const paragraphs = [];
	const lines = content.split('\n');
	let imageIndex = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Skip empty lines at the start
		if (!line.trim() && paragraphs.length === 0) continue;

		// Check for image placeholder
		if (line.includes('[Image embedded - visible in .docx download]')) {
			// Find the previous lines for image caption
			let caption = '';
			let description = '';
			
			if (i > 0 && lines[i - 1].includes('📸 [Gambar:')) {
				caption = lines[i - 1].replace('📸 [Gambar:', '').replace(']', '').trim();
			}
			if (i > 1 && !lines[i - 2].includes('━') && !lines[i - 2].includes('🎯') && !lines[i - 2].includes('📖') && !lines[i - 2].includes('📚') && !lines[i - 2].includes('✏️')) {
				description = lines[i - 2].trim();
			}

			// Find matching image from imagesData
			const image = imagesData[imageIndex];
			if (image && image.data) {
				try {
					// Convert base64 to buffer
					const imageBuffer = Buffer.from(image.data, 'base64');
					
					// Add image caption
					if (caption || image.caption) {
						paragraphs.push(
							new Paragraph({
								children: [
									new TextRun({
										text: caption || image.caption,
										bold: true,
										italics: true,
										size: 20
									})
								],
								spacing: { before: 200, after: 100 }
							})
						);
					}

					// Add image
					paragraphs.push(
						new Paragraph({
							children: [
								new ImageRun({
									data: imageBuffer,
									transformation: {
										width: 400,
										height: 300
									}
								})
							],
							alignment: AlignmentType.CENTER,
							spacing: { before: 100, after: 200 }
						})
					);

					// Add description if available
					if (description || image.description) {
						paragraphs.push(
							new Paragraph({
								children: [
									new TextRun({
										text: description || image.description,
										italics: true,
										size: 18,
										color: '666666'
									})
								],
								alignment: AlignmentType.CENTER,
								spacing: { after: 200 }
							})
						);
					}

					imageIndex++;
				} catch (err) {
					console.error('[Parse LKPD] Error adding image:', err);
				}
			}
			continue;
		}

		// Skip image caption and description lines (already handled above)
		if (line.includes('📸 [Gambar:')) {
			continue;
		}

		// Handle separators (━━━)
		if (line.includes('━━━━')) {
			paragraphs.push(
				new Paragraph({
					text: '',
					spacing: { before: 100, after: 100 }
				})
			);
			continue;
		}

		// Handle main headings (with emoji indicators)
		if (line.match(/^(🎯|📖|📚|✏️|📊|💭|✅|📋)\s+[A-Z]\./) || line.includes('LEMBAR KERJA PESERTA DIDIK')) {
			const cleanLine = line.replace(/^(🎯|📖|📚|✏️|📊|💭|✅|📋)\s+/, '');
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: cleanLine,
							bold: true,
							size: 28,
							color: '1a472a' // Dark green
						})
					],
					heading: HeadingLevel.HEADING_1,
					spacing: { before: 400, after: 200 }
				})
			);
			continue;
		}

		// Handle sub-headings (KONSEP KUNCI, POIN PENTING, etc.)
		if (line.match(/^(🔑|⭐|📌)\s+[A-Z\s]+:$/)) {
			const cleanLine = line.replace(/^(🔑|⭐|📌)\s+/, '').replace(':', '');
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: cleanLine,
							bold: true,
							size: 24,
							color: '047857' // Green
						})
					],
					heading: HeadingLevel.HEADING_2,
					spacing: { before: 300, after: 150 }
				})
			);
			continue;
		}

		// Handle IDENTITAS LKPD section
		if (line.includes('📋 IDENTITAS LKPD')) {
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: 'IDENTITAS LKPD',
							bold: true,
							size: 24,
							color: '047857'
						})
					],
					heading: HeadingLevel.HEADING_2,
					spacing: { before: 300, after: 150 }
				})
			);
			continue;
		}

		// Handle numbered lists (1., 2., etc.)
		if (line.match(/^\d+\.\s+/)) {
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: line,
							size: 22
						})
					],
					bullet: {
						level: 0
					},
					spacing: { after: 100 }
				})
			);
			continue;
		}

		// Handle bullet points (•)
		if (line.trim().startsWith('•')) {
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: line.replace('•', '').trim(),
							size: 22
						})
					],
					bullet: {
						level: 0
					},
					spacing: { after: 100 }
				})
			);
			continue;
		}

		// Handle indented content (starts with spaces)
		if (line.startsWith('   ') && line.trim()) {
			const cleanLine = line.trim();
			const isBold = cleanLine.includes(':') || cleanLine.match(/^[A-Z]/);
			
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: cleanLine,
							size: 22,
							bold: isBold
						})
					],
					indent: {
						left: convertInchesToTwip(0.5)
					},
					spacing: { after: 100 }
				})
			);
			continue;
		}

		// Handle empty lines
		if (!line.trim()) {
			paragraphs.push(
				new Paragraph({
					text: '',
					spacing: { after: 100 }
				})
			);
			continue;
		}

		// Regular text
		const isBold = line.includes(':') && !line.includes('_____');
		const text = line.trim();
		
		if (text) {
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: text,
							size: 22,
							bold: isBold
						})
					],
					spacing: { after: 120 }
				})
			);
		}
	}

	return paragraphs;
}

/**
 * Sanitize filename for safe file system usage
 */
function sanitizeFilename(filename) {
	return filename
		.replace(/[^a-z0-9]/gi, '_')
		.replace(/_+/g, '_')
		.replace(/^_|_$/g, '')
		.substring(0, 100);
}
