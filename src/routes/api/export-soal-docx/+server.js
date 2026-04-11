/**
 * API Endpoint untuk Export Soal ke .docx
 * 
 * Convert Bank Soal ke format Microsoft Word Document
 */

import { json } from '@sveltejs/kit';
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, convertInchesToTwip } from 'docx';
import { Packer } from 'docx';

/**
 * POST /api/export-soal-docx
 * Export Soal data to .docx format
 */
export async function POST({ request, locals }) {
	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { soalData } = body;

		if (!soalData) {
			return json({ error: 'Data Soal tidak ditemukan' }, { status: 400 });
		}

		// Extract images if available
		const images = soalData.images || [];
		console.log('[Export Soal DOCX] Received images:', images.length);
		if (images.length > 0) {
			console.log('[Export Soal DOCX] First image structure:', {
				hasData: !!images[0].data,
				dataLength: images[0].data?.length,
				mimeType: images[0].mimeType,
				caption: images[0].caption
			});
		}

		// Build Word document
		const doc = await buildSoalDocument(soalData, images);

		// Convert to buffer
		const buffer = await Packer.toBuffer(doc);

		// Return as downloadable file
		return new Response(buffer, {
			status: 200,
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				'Content-Disposition': `attachment; filename="Soal_${sanitizeFilename(soalData.judulSoal || 'Document')}.docx"`
			}
		});

	} catch (error) {
		console.error('Export Soal docx error:', error);
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
 * Build complete Word document for Soal
 */
async function buildSoalDocument(soalData, imagesData = []) {
	const sections = [];

	// Title Page
	sections.push(
		new Paragraph({
			children: [
				new TextRun({
					text: 'BANK SOAL DAN UJIAN',
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
					text: soalData.judulSoal || 'Bank Soal',
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
					text: `${soalData.mapel || ''} - Kelas ${soalData.kelas || ''}`,
					size: 24 // 12pt
				})
			],
			alignment: AlignmentType.CENTER,
			spacing: { after: 100 }
		}),
		new Paragraph({
			children: [
				new TextRun({
					text: `${soalData.jenis || 'Pilihan Ganda'} • ${soalData.jumlah || 10} Soal`,
					size: 22
				})
			],
			alignment: AlignmentType.CENTER,
			spacing: { after: 100 }
		}),
		new Paragraph({
			children: [
				new TextRun({
					text: `Tingkat: ${soalData.tingkat || 'Sedang'} • ${soalData.level || 'C2 – Memahami'}`,
					size: 20,
					italics: true,
					color: '666666'
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

	// Parse Soal content
	const content = soalData.content || '';
	const parsedContent = parseSoalContent(content, imagesData);

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
 * Parse Soal content text and convert to Word paragraphs with embedded images
 */
function parseSoalContent(content, imagesData = []) {
	const paragraphs = [];
	const lines = content.split('\n');
	let imageIndex = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Skip empty lines at the start
		if (!line.trim() && paragraphs.length === 0) continue;

		// Check for image placeholder
		if (line.includes('[Image embedded - visible in .docx download]')) {
			// Find the previous line for image caption
			let caption = '';
			
			if (i > 0 && lines[i - 1].includes('📸 [Gambar:')) {
				caption = lines[i - 1].replace('📸 [Gambar:', '').replace(']', '').trim();
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

					imageIndex++;
				} catch (err) {
					console.error('[Parse Soal] Error adding image:', err);
				}
			}
			continue;
		}

		// Skip image caption lines (already handled above)
		if (line.includes('📸 [Gambar:')) {
			continue;
		}

		// Handle separators (━━━)
		if (line.includes('━━━')) {
			paragraphs.push(
				new Paragraph({
					text: '',
					spacing: { before: 100, after: 100 }
				})
			);
			continue;
		}

		// Handle main headings (BANK SOAL, BAGIAN A, etc.)
		if (line.match(/^(▌\s+)?BAGIAN\s+[A-Z]/) || line.includes('BANK SOAL DAN UJIAN') || line.includes('KUNCI JAWABAN')) {
			const cleanLine = line.replace(/^▌\s+/, '');
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: cleanLine,
							bold: true,
							size: 26,
							color: '7c3aed' // Violet
						})
					],
					heading: HeadingLevel.HEADING_1,
					spacing: { before: 400, after: 200 }
				})
			);
			continue;
		}

		// Handle section info (Mata Pelajaran, Kelas, etc.)
		if (line.match(/^\s+(Mata Pelajaran|Kelas|Topik|Jenis Soal|Jumlah Soal|Tingkat|Level)/)) {
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: line.trim(),
							size: 22
						})
					],
					indent: {
						left: convertInchesToTwip(0.3)
					},
					spacing: { after: 80 }
				})
			);
			continue;
		}

		// Handle Petunjuk
		if (line.includes('Petunjuk:')) {
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: line,
							bold: true,
							size: 22,
							italics: true
						})
					],
					spacing: { before: 200, after: 150 }
				})
			);
			continue;
		}

		// Handle question numbers (Soal 1., Soal 2., etc.)
		if (line.match(/^Soal\s+\d+\./)) {
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: line,
							bold: true,
							size: 22
						})
					],
					spacing: { before: 250, after: 120 }
				})
			);
			continue;
		}

		// Handle answer options (A., B., C., D., E.)
		if (line.match(/^\s+[A-E]\.\s+/)) {
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: line.trim(),
							size: 22
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

		// Handle Rubrik Penilaian
		if (line.includes('Rubrik Penilaian:') || line.includes('Kunci Jawaban:')) {
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: line,
							bold: true,
							size: 21,
							color: '047857'
						})
					],
					spacing: { before: 150, after: 100 }
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
							size: 21
						})
					],
					bullet: {
						level: 0
					},
					spacing: { after: 80 }
				})
			);
			continue;
		}

		// Handle numbered answer keys (1. A, 2. B, etc.)
		if (line.match(/^\d+\.\s+[A-E]\s+/)) {
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: line,
							size: 21
						})
					],
					indent: {
						left: convertInchesToTwip(0.3)
					},
					spacing: { after: 80 }
				})
			);
			continue;
		}

		// Handle indented content (starts with spaces)
		if (line.startsWith('   ') && line.trim()) {
			const cleanLine = line.trim();
			
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: cleanLine,
							size: 21
						})
					],
					indent: {
						left: convertInchesToTwip(0.4)
					},
					spacing: { after: 90 }
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
		const text = line.trim();
		
		if (text) {
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: text,
							size: 22
						})
					],
					spacing: { after: 110 }
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
