/**
 * Shared AI model configuration.
 * Single source of truth untuk ALLOWED_MODELS, DEFAULT_MODEL, dan model capabilities.
 */

export const ALLOWED_MODELS = [
	'google/gemini-3.5-flash',
	'x-ai/grok-4.3',
	'openai/gpt-5.5',
	'openai/gpt-5.4-nano'
];

export const DEFAULT_MODEL = 'google/gemini-3.5-flash';

/** Models yang mendukung reasoning / thinking effort */
export const MODELS_SUPPORTING_REASONING = new Set([
	'google/gemini-3.5-flash',
	'x-ai/grok-4.3',
	'openai/gpt-5.4-nano'
]);

export const ALLOWED_THINKING_EFFORTS = new Set(['low', 'medium', 'high']);
