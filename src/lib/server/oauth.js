import { Google } from 'arctic';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';

const REDIRECT_URI =
	env.GOOGLE_REDIRECT_URI ||
	(dev
		? 'http://localhost:5173/login/google/callback'
		: 'https://aiteacher.healtyhappiness.com/login/google/callback');

export const google = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
