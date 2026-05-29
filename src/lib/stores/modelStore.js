import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const AI_MODELS = [
	{
		id: 'google/gemini-3.5-flash',
		label: 'Gemini 3.5 Flash',
		provider: 'Google',
		supportsReasoning: true
	},
	{
		id: 'x-ai/grok-4.3',
		label: 'Grok 4.3',
		provider: 'xAI',
		supportsReasoning: true
	},
	{
		id: 'openai/gpt-5.5',
		label: 'GPT-5.5',
		provider: 'OpenAI',
		supportsReasoning: false
	},
	{
		id: 'openai/gpt-5.4-nano',
		label: 'GPT-5.4 Nano',
		provider: 'OpenAI',
		supportsReasoning: true
	}
];

export const THINKING_LEVELS = [
	{
		id: 'low',
		label: 'Low',
		description: 'Lebih cepat, token lebih hemat. Cocok untuk konten sederhana.',
		icon: '⚡'
	},
	{
		id: 'medium',
		label: 'Medium',
		description: 'Keseimbangan kecepatan dan kualitas. Rekomendasi default.',
		icon: '⚖️'
	},
	{
		id: 'high',
		label: 'High',
		description: 'Reasoning mendalam. Lebih lambat, hasil lebih akurat dan detail.',
		icon: '🧠'
	}
];

const MODEL_STORAGE_KEY = 'ai_selected_model';
const THINKING_STORAGE_KEY = 'ai_thinking_effort';

const DEFAULT_MODEL = AI_MODELS[0].id;
const DEFAULT_THINKING = 'medium';

function createModelStore() {
	const initial = browser
		? (localStorage.getItem(MODEL_STORAGE_KEY) ?? DEFAULT_MODEL)
		: DEFAULT_MODEL;

	const { subscribe, set } = writable(initial);

	return {
		subscribe,
		select(modelId) {
			const valid = AI_MODELS.find((m) => m.id === modelId);
			const value = valid ? modelId : DEFAULT_MODEL;
			if (browser) localStorage.setItem(MODEL_STORAGE_KEY, value);
			set(value);
		}
	};
}

function createThinkingStore() {
	const initial = browser
		? (localStorage.getItem(THINKING_STORAGE_KEY) ?? DEFAULT_THINKING)
		: DEFAULT_THINKING;

	const { subscribe, set } = writable(initial);

	return {
		subscribe,
		select(level) {
			const valid = THINKING_LEVELS.find((l) => l.id === level);
			const value = valid ? level : DEFAULT_THINKING;
			if (browser) localStorage.setItem(THINKING_STORAGE_KEY, value);
			set(value);
		}
	};
}

export const selectedModel = createModelStore();
export const selectedThinking = createThinkingStore();
