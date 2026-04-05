import { lucia } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { verify } from '@node-rs/argon2';
import { getCollection } from '$lib/server/db.js';
import { z } from 'zod';

const loginSchema = z.object({
	username: z.string().min(3, 'Username minimal 3 karakter').max(50),
	password: z.string().min(6, 'Password minimal 6 karakter')
});

export const load = async ({ locals }) => {
	// Redirect if already logged in
	if (locals.user) {
		throw redirect(302, '/dashboard');
	}
	return {};
};

export const actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		// Validation
		const validationResult = loginSchema.safeParse({ username, password });
		
		if (!validationResult.success) {
			return fail(400, {
				error: validationResult.error.errors[0].message,
				username
			});
		}

		try {
			// Use singleton connection
			const usersCollection = await getCollection('users');

			// Find user
			const existingUser = await usersCollection.findOne({
				username: username.toLowerCase()
			});

			if (!existingUser) {
				return fail(400, {
					error: 'Username atau password salah',
					username
				});
			}

			// Verify password
			const validPassword = await verify(existingUser.password_hash, password, {
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});

			if (!validPassword) {
				return fail(400, {
					error: 'Username atau password salah',
					username
				});
			}

			// Create session with user ID as string
			const userId = existingUser._id.toString();
			
			const session = await lucia.createSession(userId, {});
			const sessionCookie = lucia.createSessionCookie(session.id);

			cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});

		} catch (error) {
			return fail(500, {
				error: 'Terjadi kesalahan saat login. Silakan coba lagi.',
				username
			});
		}

		// Redirect after successful login
		throw redirect(302, '/dashboard');
	}
};
