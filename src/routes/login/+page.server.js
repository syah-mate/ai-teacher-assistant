import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	// Redirect if already logged in
	if (locals.user) {
		throw redirect(302, '/dashboard');
	}
	return {};
};
