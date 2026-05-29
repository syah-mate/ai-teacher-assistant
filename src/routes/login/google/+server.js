import { google } from '$lib/server/oauth';
import { redirect } from '@sveltejs/kit';
import { generateState, generateCodeVerifier } from 'arctic';

export async function GET({ cookies }) {
	// Generate state dan code verifier untuk PKCE
	const state = generateState();
	const codeVerifier = generateCodeVerifier();

	// Buat URL authorization Google
	const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);

	// Simpan state dan code verifier di cookie (berlaku 10 menit)
	cookies.set('google_oauth_state', state, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		maxAge: 60 * 10,
		sameSite: 'lax'
	});

	cookies.set('google_code_verifier', codeVerifier, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		maxAge: 60 * 10,
		sameSite: 'lax'
	});

	// Redirect ke halaman login Google
	throw redirect(302, url.toString());
}
