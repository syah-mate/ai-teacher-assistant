import { error } from '@sveltejs/kit';

export async function load({ params, fetch, locals }) {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const res = await fetch(`/api/history/${params.id}`);
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw error(res.status, body.error || 'Data tidak ditemukan');
	}

	const { data } = await res.json();
	return { item: data };
}
