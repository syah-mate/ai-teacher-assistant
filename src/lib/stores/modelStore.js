import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const AI_MODELS = [
	{ id: 'google/gemini-3.5-flash', label: 'Gemini 3.5 Flash', provider: 'Google' },
	{ id: 'x-ai/grok-4.3', label: 'Grok 4.3', provider: 'xAI' },
	{ id: 'openai/gpt-5.5', label: 'GPT-5.5', provider: 'OpenAI' }
];

const STORAGE_KEY = 'ai_selected_model';
const DEFAULT_MODEL = AI_MODELS[0].id;

function createModelStore() {
	const initial = browser
		? (localStorage.getItem(STORAGE_KEY) ?? DEFAULT_MODEL)
		: DEFAULT_MODEL;

	const { subscribe, set } = writable(initial);

	return {
		subscribe,
		select(modelId) {
			const valid = AI_MODELS.find((m) => m.id === modelId);
			const value = valid ? modelId : DEFAULT_MODEL;
			if (browser) localStorage.setItem(STORAGE_KEY, value);
			set(value);
		}
	};
}

export const selectedModel = createModelStore();
