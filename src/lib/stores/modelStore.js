
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

// ---------------------------------------------------------------------------
// NOTE: AI model & thinking effort sekarang dikelola oleh admin melalui
// halaman /dashboard/pengaturan/config dan disimpan di MongoDB app_config.
// File ini sekarang hanya berisi data referensi untuk UI (daftar model).
// ---------------------------------------------------------------------------
