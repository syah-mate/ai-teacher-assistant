/**
 * read-db.tool.js — Pure Tool (no LLM)
 * Membaca data dari database via API endpoint.
 * Menggunakan fetch karena tool ini dijalankan di sisi client.
 */

export async function readDB(collection, query, options = {}) {
	try {
		const res = await fetch('/api/db-read', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ collection, query, options })
		});
		if (!res.ok) return { success: false, error: 'DB read gagal' };
		const result = await res.json();
		return { success: true, data: result.data };
	} catch (error) {
		return { success: false, error: error.message };
	}
}
