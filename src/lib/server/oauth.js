import { Google } from 'arctic';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';

const REDIRECT_URI =
	process.env.NODE_ENV === 'production'
		? 'https://DOMAIN_KAMU/login/google/callback'
		: 'http://localhost:5173/login/google/callback';

export const google = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
