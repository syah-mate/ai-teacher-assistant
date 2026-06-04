import { MongodbAdapter } from '@lucia-auth/adapter-mongodb';
import { Lucia } from 'lucia';
import { dev } from '$app/environment';
import { getMongoClient, getDatabase } from './db.js';

// Use singleton MongoDB connection
const client = await getMongoClient();
const db = await getDatabase();
const users = db.collection('users');
const sessions = db.collection('sessions');

// Create indexes for better performance
await sessions.createIndex({ expires_at: 1 });

async function ensureUserIndexes() {
	// Create collections explicitly so createIndex works on fresh/empty databases
	await db.createCollection('users').catch(() => {});
	await db.createCollection('sessions').catch(() => {});

	const indexes = await users.indexes();
	const usernameIndex = indexes.find((index) => index.name === 'username_1');

	// Migrate legacy unique index to partial unique so multiple null values do not collide.
	if (usernameIndex?.unique && !usernameIndex.partialFilterExpression) {
		await users.dropIndex('username_1');
	}

	await users.createIndex(
		{ username: 1 },
		{
			name: 'username_1',
			unique: true,
			partialFilterExpression: { username: { $type: 'string' } }
		}
	);

	await users.createIndex(
		{ google_id: 1 },
		{
			name: 'google_id_1',
			unique: true,
			partialFilterExpression: { google_id: { $type: 'string' } }
		}
	);
}

await ensureUserIndexes();

const adapter = new MongodbAdapter(sessions, users);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: !dev
		}
	},
	getUserAttributes: (dbUser) => {
		return {
			id: dbUser._id,
			username: dbUser.username ?? dbUser.email ?? 'google-user',
			name: dbUser.name,
			role: dbUser.role ?? 'guru',
			email: dbUser.email ?? null,
			picture: dbUser.picture ?? null,
			provider: dbUser.google_id ? 'google' : 'credentials'
		};
	}
});

// Export MongoDB client for use in other files
export { client, db };
