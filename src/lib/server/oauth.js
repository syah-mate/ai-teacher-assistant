import { Google } from 'arctic';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { env } from '$env/dynamic/private';

const REDIRECT_URI =
	env.GOOGLE_REDIRECT_URI ||
	(process.env.NODE_ENV === 'production'
		? 'https://aiteacher.healtyhappiness.com/login/google/callback'
		: 'http://localhost:5173/login/google/callback');

export const google = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
