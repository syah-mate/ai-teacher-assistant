import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const HARDCODED = {
	username: 'guru@TwinLabs.id',
	password: 'guru123',
	name: 'User Guru',
	role: 'Akun Premium eSolusi'
};

function createAuthStore() {
	const initial = browser
		? (() => {
				const s = localStorage.getItem('asisten_guru_auth');
				return s ? JSON.parse(s) : null;
			})()
		: null;

	const { subscribe, set } = writable(initial);

	return {
		subscribe,
		login(username, password) {
			if (username === HARDCODED.username && password === HARDCODED.password) {
				const user = { name: HARDCODED.name, role: HARDCODED.role, username };
				if (browser) localStorage.setItem('asisten_guru_auth', JSON.stringify(user));
				set(user);
				return { success: true };
			}
			return { success: false, error: 'Username atau password salah. Coba lagi.' };
		},
		logout() {
			if (browser) localStorage.removeItem('asisten_guru_auth');
			set(null);
		}
	};
}

export const auth = createAuthStore();
