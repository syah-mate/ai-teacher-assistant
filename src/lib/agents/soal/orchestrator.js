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
			validation: null
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
		const totalSteps = 2; // Generator + Validator
		let currentStep = 0;

		try {
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

			// Final compilation
			this.log('📦 Compiling final result...');
			const finalResult = this.compileFinalResult();

			this.log('✅ Soal generation process completed successfully!');

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
	 * Compile final result
	 */
	compileFinalResult() {
		const { soalGeneration, validation } = this.state;

		return {
			// Main soal content
			content: soalGeneration.fullOutput,
			rawContent: soalGeneration.rawContent,

			// Metadata
			metadata: {
				...soalGeneration.metadata,
				validation: {
					score: validation.score,
					status: validation.status,
					passed: validation.passed,
					needsImprovement: validation.needsImprovement
				}
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
