import { google } from '$lib/server/oauth';
import { lucia } from '$lib/server/auth';
import { getCollection } from '$lib/server/db';
import { redirect, error } from '@sveltejs/kit';
import { generateIdFromEntropySize } from 'lucia';

function getGoogleUsername(googleSub) {
	return `google_${String(googleSub || '').toLowerCase()}`;
}

export async function GET({ url, cookies }) {
	// Ambil parameter dari URL callback
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	// Ambil state yang tersimpan di cookie
	const storedState = cookies.get('google_oauth_state');
	const codeVerifier = cookies.get('google_code_verifier');

	// Validasi state (mencegah CSRF attack)
	if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
		throw error(400, 'OAuth state tidak valid. Silakan coba login kembali.');
	}

	// Hapus cookie OAuth setelah dipakai
	cookies.delete('google_oauth_state', { path: '/' });
	cookies.delete('google_code_verifier', { path: '/' });

	try {
		// Tukar authorization code dengan access token
		const tokens = await google.validateAuthorizationCode(code, codeVerifier);

		// Ambil data user dari Google
		const googleUserResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
			headers: {
				Authorization: `Bearer ${tokens.accessToken()}`
			}
		});

		if (!googleUserResponse.ok) {
			throw error(500, 'Gagal mengambil data user dari Google.');
		}

		const googleUser = await googleUserResponse.json();
		// googleUser berisi: sub (Google ID), email, name, picture, email_verified

		// Akses koleksi users MongoDB
		const usersCollection = await getCollection('users');

		// Cari user berdasarkan google_id
		let user = await usersCollection.findOne({ google_id: googleUser.sub });
		const googleUsername = getGoogleUsername(googleUser.sub);

		if (!user) {
			// Cek apakah email sudah terdaftar via credentials
			const existingEmailUser = await usersCollection.findOne({ email: googleUser.email });

			if (existingEmailUser) {
				// Hubungkan akun Google ke akun credentials yang sudah ada
				await usersCollection.updateOne(
					{ _id: existingEmailUser._id },
					{
						$set: {
							google_id: googleUser.sub,
							username: existingEmailUser.username || googleUsername,
							picture: googleUser.picture,
							email_verified: googleUser.email_verified,
							updated_at: new Date()
						}
					}
				);
				user = existingEmailUser;
			} else {
				// Buat user baru dari Google dengan string ID (Lucia-compatible)
				const newUserId = generateIdFromEntropySize(10); // 16-char string
				await usersCollection.insertOne({
					_id: newUserId,
					username: googleUsername,
					google_id: googleUser.sub,
					email: googleUser.email,
					name: googleUser.name,
					picture: googleUser.picture,
					email_verified: googleUser.email_verified ?? false,
					role: 'guru', // default role untuk user baru
					quota_remaining: 2,
					quota_total: 2,
					created_at: new Date(),
					updated_at: new Date()
				});

				user = { _id: newUserId };
			}
		} else {
			// Update foto profil jika user sudah ada (foto Google bisa berubah)
			await usersCollection.updateOne(
				{ _id: user._id },
				{
					$set: {
						username: user.username || googleUsername,
						picture: googleUser.picture,
						updated_at: new Date()
					}
				}
			);
		}

		// Buat session Lucia
		const session = await lucia.createSession(user._id.toString(), {});
		const sessionCookie = lucia.createSessionCookie(session.id);

		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	} catch (err) {
		console.error('Google OAuth callback error:', err);
		throw redirect(302, '/login?error=oauth_failed');
	}

	// Redirect ke dashboard setelah login berhasil
	throw redirect(302, '/dashboard');
}
