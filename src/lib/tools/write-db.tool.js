/**
 * write-db.tool.js — Pure Tool (no LLM)
 * Menulis data ke database via API endpoint.
 * Menggunakan fetch karena tool ini dijalankan di sisi client.
 */

export async function writeDB(collection, data) {
	try {
		const res = await fetch('/api/db-write', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ collection, data })
		});
		if (!res.ok) return { success: false, error: 'DB write gagal' };
		const result = await res.json();
		return { success: true, id: result.id };
	} catch (error) {
		return { success: false, error: error.message };
	}
}
