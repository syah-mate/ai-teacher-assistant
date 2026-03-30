/**
 * Setup Script - Create Initial Admin User
 * 
 * Script ini digunakan untuk membuat user admin pertama kali.
 * Jalankan dengan: node scripts/setup-admin.js
 * 
 * PENTING: 
 * - Pastikan MongoDB sudah running
 * - Set MONGODB_URI di .env file
 */

import { MongoClient } from 'mongodb';
import { hash } from '@node-rs/argon2';
import * as readline from 'readline';
import { randomBytes } from 'crypto';

// Generate a random user ID (15 characters, Lucia convention)
function generateUserId() {
	return randomBytes(10).toString('hex').slice(0, 15);
}

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

function question(query) {
	return new Promise((resolve) => {
		rl.question(query, resolve);
	});
}

async function setupAdmin() {
	console.log('\n🔧 Setup Admin User - Asisten AI Guru\n');
	console.log('=' .repeat(50));

	// Get MongoDB URI from environment or use default
	const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-asisten-guru';

	console.log(`\n📦 Connecting to MongoDB...`);
	console.log(`   URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}\n`);

	const client = new MongoClient(MONGODB_URI);

	try {
		await client.connect();
		console.log('✅ Connected to MongoDB successfully\n');

		const db = client.db('ai-asisten-guru');
		const usersCollection = db.collection('users');

		// Check if admin exists
		const existingAdmin = await usersCollection.findOne({ username: 'admin' });
		
		if (existingAdmin) {
			console.log('⚠️  Admin user already exists!');
			const overwrite = await question('Do you want to create a new admin? (yes/no): ');
			
			if (overwrite.toLowerCase() !== 'yes') {
				console.log('\n❌ Setup cancelled.');
				rl.close();
				await client.close();
				return;
			}
		}

		// Get user input
		console.log('\n📝 Enter admin details:\n');
		
		const username = await question('Username (default: admin): ') || 'admin';
		const name = await question('Full Name (default: Administrator): ') || 'Administrator';
		const role = await question('Role (default: Admin Premium): ') || 'Admin Premium';
		
		// Password with confirmation
		let password, confirmPassword;
		do {
			password = await question('Password (min 6 characters): ');
			
			if (password.length < 6) {
				console.log('❌ Password must be at least 6 characters!\n');
				continue;
			}
			
			confirmPassword = await question('Confirm Password: ');
			
			if (password !== confirmPassword) {
				console.log('❌ Passwords do not match! Try again.\n');
			}
		} while (password !== confirmPassword || password.length < 6);

		console.log('\n🔐 Hashing password...');
		
		// Hash password with Argon2
		const passwordHash = await hash(password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		console.log('✅ Password hashed successfully\n');

		// Create or update user
		const userData = {
			_id: generateUserId(), // Generate string ID for Lucia compatibility
			username: username.toLowerCase(),
			password_hash: passwordHash,
			name: name,
			role: role,
			created_at: new Date(),
			updated_at: new Date()
		};

		if (existingAdmin) {
			// Don't change _id on update, only update other fields
			delete userData._id;
			await usersCollection.updateOne(
				{ username: username.toLowerCase() },
				{ $set: userData }
			);
			console.log('✅ Admin user updated successfully!\n');
		} else {
			const result = await usersCollection.insertOne(userData);
			console.log('✅ Admin user created successfully!\n');
		}

		console.log('=' .repeat(50));
		console.log('\n📋 User Details:');
		console.log(`   Username: ${username}`);
		console.log(`   Name: ${name}`);
		console.log(`   Role: ${role}`);
		console.log('\n🎉 Setup completed! You can now login with these credentials.\n');

	} catch (error) {
		console.error('\n❌ Error:', error.message);
		console.error('\nTroubleshooting:');
		console.error('1. Make sure MongoDB is running');
		console.error('2. Check MONGODB_URI in .env file');
		console.error('3. Verify network connectivity');
	} finally {
		rl.close();
		await client.close();
	}
}

// Run setup
setupAdmin().catch(console.error);
