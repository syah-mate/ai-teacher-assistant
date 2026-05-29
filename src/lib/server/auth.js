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
