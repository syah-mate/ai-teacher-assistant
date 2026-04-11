/**
 * Soal Generator Orchestrator
 * 
 * Main coordinator untuk mengatur eksekusi agents
 * dalam proses pembuatan soal ujian berkualitas
 */

import { SoalGeneratorAgent } from './soal-generator-agent.js';
import { ValidatorAgent } from './validator-agent.js';

export class SoalOrchestrator {
	constructor() {
		this.agents = {
			generator: new SoalGeneratorAgent(),
			validator: new ValidatorAgent()
		};

		this.state = {
			soalGeneration: null,
			validation: null,
			images: null
		};

		this.executionLog = [];
	}

	/**
	 * Generate soal lengkap dengan agentic AI system
	 * 
	 * @param {Object} userInput - Input dari user
	 * @param {Function} onProgress - Callback untuk update progress
	 * @returns {Promise<Object>} Result soal
	 */
	async generateSoal(userInput, onProgress) {
		const totalSteps = 4; // Generator + Validator + Image Generation + Compilation
		let currentStep = 0;

		try {
			// CRITICAL: Start generate session and check rate limit ONCE
			// This ensures 1 user action = 1 quota usage (not per-agent)
			const sessionResponse = await fetch('/api/generate-session/start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			if (!sessionResponse.ok) {
				const errorData = await sessionResponse.json().catch(() => ({}));
				if (sessionResponse.status === 429) {
					throw new Error(errorData.error || 'Batas generate tercapai. Silakan tunggu hingga kuota reset.');
				}
				throw new Error(errorData.error || 'Gagal memulai sesi generate');
			}

			this.log('🚀 Starting Soal generation with Agentic AI');

			// Step 1: Generate Soal
			currentStep++;
			this.log(`[${currentStep}/${totalSteps}] Generating soal...`);
			if (onProgress) {
				onProgress({
					step: currentStep,
					total: totalSteps,
					agent: 'Soal Generator Agent',
					status: 'Menyusun soal berkualitas...'
				});
			}

			const generatorResult = await this.agents.generator.execute(userInput, { 
				userId: userInput.userId 
			});

			if (!generatorResult.success) {
				throw new Error(`Generator failed: ${generatorResult.error}`);
			}

			this.state.soalGeneration = generatorResult.data;
			this.log('✓ Soal generation completed');

			// Step 2: Validate Soal
			currentStep++;
			this.log(`[${currentStep}/${totalSteps}] Validating soal quality...`);
			if (onProgress) {
				onProgress({
					step: currentStep,
					total: totalSteps,
					agent: 'Validator Agent',
					status: 'Memvalidasi kualitas soal...'
				});
			}

			const validatorResult = await this.agents.validator.execute(
				{
					soalContent: generatorResult.data.rawContent,
					userInput
				},
				{ userId: userInput.userId }
			);

			if (!validatorResult.success) {
				// Validation error non-critical, still return generated soal
				this.log('⚠ Validation failed, but proceeding with generated soal');
				this.state.validation = {
					score: 0,
					status: 'NOT VALIDATED',
					passed: false,
					fullReport: 'Validation could not be completed'
				};
			} else {
				this.state.validation = validatorResult.data;
				this.log(`✓ Validation completed: Score ${validatorResult.data.score}/100`);
			}

			// Step 3: Generate Images with Cloudflare Workers AI (conditional)
			currentStep++;
			const hasImageRequirements = generatorResult.data.imageRequirements?.length > 0;
			
			if (hasImageRequirements) {
				this.log(`[${currentStep}/${totalSteps}] Generating AI images for ${generatorResult.data.imageRequirements.length} soal bergambar...`);
				if (onProgress) {
					onProgress({
						step: currentStep,
						total: totalSteps,
						agent: 'Image Generation',
						status: '🎨 Membuat gambar untuk soal bergambar...'
					});
				}

				const imagesResult = await this.generateIllustrationImages(userInput, this.state);
				if (imagesResult.success && imagesResult.data && imagesResult.data.length > 0) {
					this.state.images = imagesResult.data;
					this.log(`✅ Successfully generated ${imagesResult.data.length} AI images`);
				} else {
					// Images generation failed but not critical
					this.log(`⚠️ Image generation failed: ${imagesResult.message || 'Error'}`);
					this.state.images = [];
				}
			} else {
				this.log(`[${currentStep}/${totalSteps}] No image requirements detected - skipping image generation`);
				if (onProgress) {
					onProgress({
						step: currentStep,
						total: totalSteps,
						agent: 'Image Generation',
						status: '⏭️ Tidak ada soal bergambar - skip'
					});
				}
				this.state.images = [];
			}

			// Step 4: Final compilation
			currentStep++;
			this.log(`[${currentStep}/${totalSteps}] Compiling final result...`);
			if (onProgress) {
				onProgress({
					step: currentStep,
					total: totalSteps,
					agent: 'Compilation',
					status: '📦 Menyusun hasil akhir...'
				});
			}
			const finalResult = this.compileFinalResult();

			this.log('✅ Soal generation process completed successfully!');
		// CRITICAL: Decrement quota HANYA setelah generate sukses
		try {
			const completeResponse = await fetch('/api/generate-session/complete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			
			if (completeResponse.ok) {
				const completeData = await completeResponse.json();
				this.log(`✅ Generate counted. Remaining: ${completeData.remaining}/${completeData.limit}`);
			} else {
				this.log('⚠️ Failed to count generate, but result is still valid', 'warn');
			}
		} catch (completeError) {
			// Non-critical error - generate sukses tapi counting gagal
			this.log('⚠️ Failed to count generate (non-critical): ' + completeError.message, 'warn');
		}
			return {
				success: true,
				data: finalResult,
				executionLog: this.executionLog
			};
		} catch (error) {
			this.log(`❌ Error: ${error.message}`);
			return {
				success: false,
				error: error.message,
				executionLog: this.executionLog
			};
		}
	}

	/**
	 * Generate illustration images for Soal using Cloudflare Workers AI
	 */
	async generateIllustrationImages(userInput, state) {
		const startTime = Date.now();

		try {
			// Call server-side API endpoint for image generation
			const response = await fetch('/api/generate-soal-images', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userInput,
					state
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.warn('[Soal Orchestrator] ⚠️ Image generation API error (non-critical):', errorData.error);
				// Return empty images instead of throwing - this is non-critical
				return {
					success: true,
					data: [],
					time: Date.now() - startTime
				};
			}

			const result = await response.json();

			// Handle successful response with or without images
			if (result.success) {
				if (result.images && result.images.length > 0) {
					this.log(`✅ Generated ${result.images.length} AI images successfully`);
					return {
						success: true,
						data: result.images,
						time: Date.now() - startTime
					};
				} else {
					// API returned success but no images (e.g., not configured)
					const message = result.message || 'Image generation skipped';
					this.log(`ℹ️ ${message}`);
					return {
						success: true,
						data: [],
						message: message,
						time: Date.now() - startTime
					};
				}
			}

			// API returned error
			console.warn('[Soal Orchestrator] ⚠️ Image generation failed (non-critical):', result.error);
			return {
				success: true,
				data: [],
				message: result.error || 'Image generation failed',
				time: Date.now() - startTime
			};
		} catch (error) {
			this.log(`⚠️ Image generation error (non-critical): ${error.message}`);
			// Return empty images instead of throwing - allow Soal to be generated without images
			return {
				success: true,
				data: [],
				time: Date.now() - startTime
			};
		}
	}

	/**
	 * Compile final result
	 */
	compileFinalResult() {
		const { soalGeneration, validation, images } = this.state;

		// Replace image markers with placeholders for display/download
		let formattedContent = soalGeneration.fullOutput;
		const imageRequirements = soalGeneration.imageRequirements || [];
		
		if (images && images.length > 0) {
			// Replace each marker with image placeholder
			imageRequirements.forEach((req, index) => {
				if (index < images.length) {
					const placeholder = `\n\n📸 [Gambar: ${images[index].caption || req.description}]\n[Image embedded - visible in .docx download]\n`;
					formattedContent = formattedContent.replace(req.marker, placeholder);
				}
			});
		}

		return {
			// Main soal content (with image placeholders)
			content: formattedContent,
			rawContent: soalGeneration.rawContent,

			// Images (AI-generated for soal bergambar)
			images: images || [],
			imageRequirements: imageRequirements,

			// Metadata
			metadata: {
				...soalGeneration.metadata,
				validation: {
					score: validation.score,
					status: validation.status,
					passed: validation.passed,
					needsImprovement: validation.needsImprovement
				},
				imageCount: images?.length || 0
			},

			// Validation report (optional, bisa ditampilkan atau disembunyikan)
			validationReport: validation.fullReport,

			// Quality indicator untuk UI
			qualityIndicator: this.getQualityIndicator(validation.score),

			// Execution summary
			executionSummary: {
				totalAgents: 2,
				agentsExecuted: ['Soal Generator Agent', 'Validator Agent'],
				timestamp: new Date().toISOString()
			}
		};
	}

	/**
	 * Get quality indicator based on validation score
	 */
	getQualityIndicator(score) {
		if (score >= 90) {
			return {
				level: 'excellent',
				label: 'Kualitas Sangat Baik',
				color: 'emerald',
				icon: '⭐'
			};
		} else if (score >= 80) {
			return {
				level: 'good',
				label: 'Kualitas Baik',
				color: 'green',
				icon: '✓'
			};
		} else if (score >= 70) {
			return {
				level: 'fair',
				label: 'Kualitas Cukup',
				color: 'yellow',
				icon: '○'
			};
		} else {
			return {
				level: 'poor',
				label: 'Perlu Perbaikan',
				color: 'red',
				icon: '!'
			};
		}
	}

	/**
	 * Log execution steps
	 */
	log(message) {
		const logEntry = {
			timestamp: new Date().toISOString(),
			message
		};
		this.executionLog.push(logEntry);
		console.log(`[SoalOrchestrator] ${message}`);
	}

	/**
	 * Get current state (for debugging)
	 */
	getState() {
		return { ...this.state };
	}

	/**
	 * Get execution log
	 */
	getExecutionLog() {
		return [...this.executionLog];
	}
}
