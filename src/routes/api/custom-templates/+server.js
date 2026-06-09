// src/routes/api/custom-templates/+server.js
import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/server/db.js';

// GET — ambil semua template milik user yang sedang login
export async function GET({ locals }) {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
	const userId = locals.user.id || locals.user._id?.toString();

	const col = await getCollection('custom_templates');
	const templates = await col
		.find({ userId })
		.sort({ createdAt: -1 })
		.project({ sections: 1, name: 1, description: 1, createdAt: 1, templateId: 1, isSystemTemplate: 1, jenis: 1 })
		.toArray();

	return json({ templates: templates.map(t => ({ ...t, _id: t._id.toString() })) });
}

// POST — buat template baru
// Body: { name, description, sections[] }
export async function POST({ request, locals }) {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
	const userId = locals.user.id || locals.user._id?.toString();

	const body = await request.json();
	const { name, description = '', sections = [] } = body;

	if (!name?.trim()) return json({ error: 'Nama template wajib diisi' }, { status: 400 });
	if (sections.length === 0) return json({ error: 'Minimal 1 section' }, { status: 400 });

	// Validasi setiap section wajib punya agentKey dan title
	for (const s of sections) {
		if (!s.agentKey || !s.title) {
			return json({ error: 'Setiap section wajib punya agentKey dan title' }, { status: 400 });
		}
	}

	const templateId = `custom-${crypto.randomUUID().slice(0, 8)}`;

	const doc = {
		templateId,
		userId,
		name: name.trim(),
		description: description.trim(),
		jenis: 'modul_ajar',
		isSystemTemplate: false,
		sections: sections.map((s, i) => ({
			id: s.id || crypto.randomUUID(),
			agentKey: s.agentKey,
			title: s.title,
			order: i,
			batch: s.batch ?? 2,
			critical: s.critical ?? false,
			promptMode: s.promptMode ?? 'default',
			customInstruksi: s.customInstruksi ?? '',
			customOutputSchema: s.customOutputSchema ?? '',
			displayType: s.displayType ?? 'description_bullets'
		})),
		createdAt: new Date()
	};

	const col = await getCollection('custom_templates');
	const result = await col.insertOne(doc);

	return json({ success: true, templateId, _id: result.insertedId.toString() }, { status: 201 });
}
