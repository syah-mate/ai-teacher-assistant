import { writable } from 'svelte/store';

/**
 * @typedef {Object} Section
 * @property {'text'|'image'} type
 * @property {string} [content]
 * @property {string} [prompt]
 * @property {string|null} [imageUrl]
 * @property {boolean} [error]
 */

/**
 * @typedef {Object} StreamState
 * @property {Section[]} sections
 * @property {boolean} isStreaming
 * @property {string} status
 * @property {string|null} error
 */

export function createStreamStore() {
	/** @type {import('svelte/store').Writable<StreamState>} */
	const { subscribe, update, set } = writable({
		sections: [],
		isStreaming: false,
		status: '',
		error: null
	});

	/**
	 * Mulai stream dari endpoint generate-stream
	 * @param {string} prompt
	 * @param {string} [context]
	 */
	async function startStream(prompt, context = '') {
		set({ sections: [], isStreaming: true, status: 'Memulai...', error: null });

		try {
			const response = await fetch('/api/generate-stream', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt, context })
			});

			if (!response.ok || !response.body) {
				throw new Error(`HTTP ${response.status}`);
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n\n');
				buffer = lines.pop() ?? ''; // simpan incomplete chunk

				for (const line of lines) {
					if (!line.startsWith('data: ')) continue;
					try {
						const event = JSON.parse(line.slice(6));
						handleEvent(event);
					} catch (e) {
						console.warn('[streamStore] Parse SSE error:', e);
					}
				}
			}
		} catch (err) {
			update((s) => ({ ...s, isStreaming: false, error: /** @type {Error} */ (err).message }));
			return;
		}

		update((s) => ({ ...s, isStreaming: false }));
	}

	/** @param {object} event */
	function handleEvent(event) {
		update((state) => {
			switch (event.type) {
				case 'status':
					return { ...state, status: event.message };

				case 'section':
					return { ...state, sections: [...state.sections, event.section] };

				case 'image_ready':
					return {
						...state,
						sections: state.sections.map((s) =>
							s.type === 'image' && s.prompt === event.prompt
								? { ...s, imageUrl: event.imageUrl }
								: s
						)
					};

				case 'image_error':
					return {
						...state,
						sections: state.sections.map((s) =>
							s.type === 'image' && s.prompt === event.prompt ? { ...s, error: true } : s
						)
					};

				case 'done':
					return { ...state, isStreaming: false, status: '' };

				case 'error':
					return { ...state, isStreaming: false, error: event.message };

				default:
					return state;
			}
		});
	}

	function reset() {
		set({ sections: [], isStreaming: false, status: '', error: null });
	}

	return { subscribe, startStream, reset };
}

export const streamStore = createStreamStore();
