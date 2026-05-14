/**
 * Image Tool
 *
 * Mengekstrak logika generateIllustrationImages() dari semua orchestrator lama
 * menjadi 1 tool generik.
 *
 * Non-critical: selalu return success:true meski gagal.
 */

import { BaseAgent } from '../base-agent.js';

export class ImageTool extends BaseAgent {
	constructor() {
		super(
			'ImageTool',
			'Generator Ilustrasi AI',
			'Membuat ilustrasi pembelajaran via Cloudflare Workers AI'
		);
	}

	/**
	 * @param {Object} input  - input.jenis menentukan endpoint yang dipanggil
	 * @param {Object} context - context berisi semua output tool sebelumnya
	 */
	async execute(input, context = {}) {
		const startTime = Date.now();
		this.log(`Starting image generation for: ${input.judul} [${input.jenis}]`);

		// Pilih endpoint berdasarkan jenis dokumen
		const endpointMap = {
			modul_ajar: '/api/generate-modul-images',
			lkpd: '/api/generate-lkpd-images',
			soal: '/api/generate-soal-images'
		};

		const endpoint = endpointMap[input.jenis] || '/api/generate-modul-images';

		// Untuk soal, hanya generate jika ada image requirements
		if (input.jenis === 'soal') {
			const soalData = context.soal;
			const hasImageRequirements = soalData?.imageRequirements?.length > 0;

			if (!hasImageRequirements) {
				this.log('No image requirements detected for soal - skipping');
				return { success: true, data: [], agentName: this.name, metadata: this.getMetadata() };
			}
		}

		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userInput: input,
					state: context
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				this.log(`Image generation API error (non-critical): ${errorData.error}`, 'warn');
				return {
					success: true,
					data: [],
					agentName: this.name,
					metadata: this.getMetadata()
				};
			}

			const result = await response.json();

			if (result.success && result.images && result.images.length > 0) {
				this.log(`Successfully generated ${result.images.length} images`);
				return {
					success: true,
					data: result.images,
					agentName: this.name,
					metadata: this.getMetadata()
				};
			}

			// Success but no images (not configured)
			this.log(result.message || 'Image generation skipped - API not configured', 'info');
			return {
				success: true,
				data: [],
				agentName: this.name,
				metadata: this.getMetadata()
			};
		} catch (error) {
			this.log(`Image generation error (non-critical): ${error.message}`, 'warn');
			return {
				success: true,
				data: [],
				agentName: this.name,
				metadata: this.getMetadata()
			};
		}
	}
}
