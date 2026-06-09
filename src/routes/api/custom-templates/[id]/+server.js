// src/routes/api/custom-templates/[id]/+server.js
import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/server/db.js';
import { ObjectId } from 'mongodb';

async function getOwnedTemplate(id, userId, col) {
	try {
		return await col.findOne({ _id: new ObjectId(id), userId });
	} catch {
		return null;
	}
}

// GET — ambil satu template lengkap dengan sections
export async function GET({ params, locals }) {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
	const userId = locals.user.id || locals.user._id?.toString();

	const col = await getCollection('custom_templates');
	const template = await getOwnedTemplate(params.id, userId, col);
	if (!template) return json({ error: 'Template tidak ditemukan' }, { status: 404 });

	return json({ template: { ...template, _id: template._id.toString() } });
}

// PUT — update template (name, description, sections)
export async function PUT({ params, request, locals }) {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
	const userId = locals.user.id || locals.user._id?.toString();

	const col = await getCollection('custom_templates');
	const existing = await getOwnedTemplate(params.id, userId, col);
	if (!existing) return json({ error: 'Template tidak ditemukan' }, { status: 404 });

	const body = await request.json();
	const { name, description, sections } = body;

	const update = { updatedAt: new Date() };
	if (name?.trim()) update.name = name.trim();
	if (description !== undefined) update.description = description.trim();
	if (sections?.length > 0) {
		update.sections = sections.map((s, i) => ({
			id: s.id || crypto.randomUUID(),
			agentKey: s.agentKey,
			title: s.title,
			order: i,
			batch: s.batch ?? 2,
			critical: s.critical ?? false,
			promptMode: s.promptMode ?? 'default',
		customFieldInstruksi: s.customFieldInstruksi ?? {},
			displayType: s.displayType ?? 'description_bullets'
		}));
	}

	await col.updateOne({ _id: existing._id }, { $set: update });
	return json({ success: true });
}

// DELETE — hapus template
export async function DELETE({ params, locals }) {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
	const userId = locals.user.id || locals.user._id?.toString();

	const col = await getCollection('custom_templates');
	const existing = await getOwnedTemplate(params.id, userId, col);
	if (!existing) return json({ error: 'Template tidak ditemukan' }, { status: 404 });

	await col.deleteOne({ _id: existing._id });
	return json({ success: true });
}
