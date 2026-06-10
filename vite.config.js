import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({ 
	plugins: [
		tailwindcss(), 
		sveltekit({
			onwarn: (warning, handler) => {
				// Suppress a11y warnings
				if (warning.code === 'a11y_label_has_associated_control' || 
				    warning.code === 'a11y_consider_explicit_label') {
					return;
				}
				handler(warning);
			}
		})
	] 
});
