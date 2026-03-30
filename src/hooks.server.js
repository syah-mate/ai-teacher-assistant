import { lucia } from '$lib/server/auth';

export async function handle({ event, resolve }) {
	// Authentication handling
	const sessionId = event.cookies.get(lucia.sessionCookieName);

	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
	} else {
		try {
			const { session, user } = await lucia.validateSession(sessionId);

			if (session && session.fresh) {
				const sessionCookie = lucia.createSessionCookie(session.id);
				event.cookies.set(sessionCookie.name, sessionCookie.value, {
					path: '.',
					...sessionCookie.attributes
				});
			}

			if (!session) {
				const sessionCookie = lucia.createBlankSessionCookie();
				event.cookies.set(sessionCookie.name, sessionCookie.value, {
					path: '.',
					...sessionCookie.attributes
				});
			}

			event.locals.user = user;
			event.locals.session = session;
		} catch (error) {
			event.locals.user = null;
			event.locals.session = null;
		}
	}

	const response = await resolve(event);

	// Security headers
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
	response.headers.set(
		'Content-Security-Policy',
		"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
	);

	return response;
}
