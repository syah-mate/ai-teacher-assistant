import { error } from '@sveltejs/kit';

export function load({ locals }) {
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Akses ditolak. Hanya admin yang dapat mengakses halaman ini.');
	}
	return {};
}
