import { MongoClient } from 'mongodb';
import { MONGODB_URI } from '$env/static/private';

let client;
let clientPromise;
let db;

/**
 * Get MongoDB client instance (singleton pattern)
 * Reuses the same connection across all requests
 */
export async function getMongoClient() {
	if (!client) {
		client = new MongoClient(MONGODB_URI);
		clientPromise = client.connect();
	}
	await clientPromise;
	return client;
}

/**
 * Get database instance
 */
export async function getDatabase() {
	if (!db) {
		const mongoClient = await getMongoClient();
		db = mongoClient.db('ai-asisten-guru');
	}
	return db;
}

/**
 * Get a specific collection
 */
export async function getCollection(collectionName) {
	const database = await getDatabase();
	return database.collection(collectionName);
}

/**
 * Close MongoDB connection (for cleanup in tests or graceful shutdown)
 */
export async function closeMongoConnection() {
	if (client) {
		await client.close();
		client = null;
		clientPromise = null;
		db = null;
	}
}

export { client, db };
