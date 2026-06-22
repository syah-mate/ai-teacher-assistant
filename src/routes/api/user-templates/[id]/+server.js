/**
 * GET    /api/user-templates/[id]  – Ambil detail template
 * PUT    /api/user-templates/[id]  – Update template
 * DELETE /api/user-templates/[id]  – Hapus template
 */

import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/server/db.js';
import { ObjectId } from 'mongodb';

export async function GET({ params, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = locals.user.id || locals.user._id?.toString() || null;
	if (!userId) {
		return json({ error: 'User ID tidak ditemukan' }, { status: 400 });
	}

	const { id } = params;

	let objectId;
	try {
		objectId = new ObjectId(id);
	} catch {
		return json({ error: 'ID tidak valid' }, { status: 400 });
	}

	try {
		const col = await getCollection('user_templates');
		const doc = await col.findOne({ _id: objectId, userId });

		if (!doc) {
			return json({ error: 'Template tidak ditemukan' }, { status: 404 });
		}

		return json({
			template: {
				...doc,
				_id: doc._id.toString()
			}
		});
	} catch (error) {
		console.error('[user-templates] GET/[id] error:', error);
		return json({ error: 'Gagal mengambil template' }, { status: 500 });
	}
}

export async function PUT({ params, request, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = locals.user.id || locals.user._id?.toString() || null;
	if (!userId) {
		return json({ error: 'User ID tidak ditemukan' }, { status: 400 });
	}

	const { id } = params;

	let objectId;
	try {
		objectId = new ObjectId(id);
	} catch {
		return json({ error: 'ID tidak valid' }, { status: 400 });
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Request body tidak valid' }, { status: 400 });
	}

	const { name, description, templatePrompt, sections, inputSchema, kategoriId } = body;

	const updateFields = { updatedAt: new Date() };

	if (name !== undefined) {
		if (typeof name !== 'string' || !name.trim()) {
			return json({ error: 'Nama template tidak boleh kosong' }, { status: 400 });
		}
		updateFields.name = name.trim();
	}

	if (description !== undefined) {
		updateFields.description = description?.trim() ?? '';
	}

	if (templatePrompt !== undefined) {
		updateFields.templatePrompt = templatePrompt?.trim() ?? '';
	}

	if (kategoriId !== undefined) {
		updateFields.kategoriId = kategoriId?.trim() || null;
	}

	if (inputSchema !== undefined) {
		if (!Array.isArray(inputSchema)) {
			return json({ error: 'inputSchema harus berupa array' }, { status: 400 });
		}
		const INPUT_SCHEMA_TYPES = new Set(['text', 'textarea', 'number', 'select', 'multiselect']);
		const inputKeys = new Set();
		for (let i = 0; i < inputSchema.length; i++) {
			const f = inputSchema[i];
			if (!f.key || typeof f.key !== 'string' || !f.key.trim()) {
				return json({ error: `inputSchema #${i + 1}: key wajib diisi` }, { status: 400 });
			}
			if (!/^[a-z0-9_]+$/.test(f.key.trim())) {
				return json({ error: `inputSchema "${f.key}": key hanya boleh huruf kecil, angka, underscore` }, { status: 400 });
			}
			if (inputKeys.has(f.key.trim())) {
				return json({ error: `inputSchema: key "${f.key}" duplikat` }, { status: 400 });
			}
			inputKeys.add(f.key.trim());
			if (!f.label || typeof f.label !== 'string' || !f.label.trim()) {
				return json({ error: `inputSchema "${f.key}": label wajib diisi` }, { status: 400 });
			}
			if (!f.type || !INPUT_SCHEMA_TYPES.has(f.type)) {
				return json({ error: `inputSchema "${f.key}": type tidak valid` }, { status: 400 });
			}
			if ((f.type === 'select' || f.type === 'multiselect') && (!Array.isArray(f.options) || f.options.length < 2)) {
				return json({ error: `inputSchema "${f.key}": type "${f.type}" memerlukan minimal 2 options` }, { status: 400 });
			}
		}
		updateFields.inputSchema = inputSchema.map((f, i) => ({
			id: f.id || crypto.randomUUID(),
			order: i,
			key: f.key.trim(),
			label: f.label.trim(),
			type: f.type,
			placeholder: f.placeholder?.trim() ?? '',
			required: f.required !== false,
			options: ['select', 'multiselect'].includes(f.type) ? (f.options ?? []) : []
		}));
	}

	if (sections !== undefined) {
		if (!Array.isArray(sections) || sections.length === 0) {
			return json({ error: 'Minimal 1 section diperlukan' }, { status: 400 });
		}

		// Validasi sections
		for (let si = 0; si < sections.length; si++) {
			const s = sections[si];

			if (!s.title || typeof s.title !== 'string' || !s.title.trim()) {
				return json({ error: `Section #${si + 1}: title wajib diisi` }, { status: 400 });
			}

			if (!Array.isArray(s.fields) || s.fields.length === 0) {
				return json({ error: `Section "${s.title}": minimal 1 field diperlukan` }, { status: 400 });
			}

			const keys = new Set();
			for (let fi = 0; fi < s.fields.length; fi++) {
				const f = s.fields[fi];

				if (!f.key || typeof f.key !== 'string' || !f.key.trim()) {
					return json({ error: `Section "${s.title}", field #${fi + 1}: key wajib diisi` }, { status: 400 });
				}

				if (!/^[a-z0-9_]+$/.test(f.key.trim())) {
					return json({ error: `Section "${s.title}", field "${f.key}": key hanya boleh huruf kecil, angka, dan underscore` }, { status: 400 });
				}

				if (keys.has(f.key.trim())) {
					return json({ error: `Section "${s.title}": key "${f.key}" duplikat` }, { status: 400 });
				}
				keys.add(f.key.trim());

				if (!f.label || typeof f.label !== 'string' || !f.label.trim()) {
					return json({ error: `Section "${s.title}", field "${f.key}": label wajib diisi` }, { status: 400 });
				}
			}
		}

		// Replace seluruh sections
		updateFields.sections = sections.map((s, si) => ({
			id: s.id || crypto.randomUUID(),
			order: si,
			title: s.title.trim(),
			sectionPrompt: s.sectionPrompt?.trim() ?? '',
			fields: s.fields.map((f, fi) => ({
				id: f.id || crypto.randomUUID(),
				order: fi,
				key: f.key.trim(),
				label: f.label.trim(),
				type: f.type ?? 'text',
				fieldPrompt: f.fieldPrompt?.trim() ?? ''
			}))
		}));
	}

	try {
		const col = await getCollection('user_templates');
		const result = await col.updateOne(
			{ _id: objectId, userId },
			{ $set: updateFields }
		);

		if (result.matchedCount === 0) {
			return json({ error: 'Template tidak ditemukan' }, { status: 404 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('[user-templates] PUT/[id] error:', error);
		return json({ error: 'Gagal update template' }, { status: 500 });
	}
}

export async function DELETE({ params, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = locals.user.id || locals.user._id?.toString() || null;
	if (!userId) {
		return json({ error: 'User ID tidak ditemukan' }, { status: 400 });
	}

	const { id } = params;

	let objectId;
	try {
		objectId = new ObjectId(id);
	} catch {
		return json({ error: 'ID tidak valid' }, { status: 400 });
	}

	try {
		const col = await getCollection('user_templates');
		const result = await col.deleteOne({ _id: objectId, userId });

		if (result.deletedCount === 0) {
			return json({ error: 'Template tidak ditemukan' }, { status: 404 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('[user-templates] DELETE/[id] error:', error);
		return json({ error: 'Gagal menghapus template' }, { status: 500 });
	}
}
