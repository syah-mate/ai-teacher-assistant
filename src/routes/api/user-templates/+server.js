/**
 * GET  /api/user-templates  – List semua template milik user
 * POST /api/user-templates  – Buat template baru
 */

import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/server/db.js';
import { DEFAULT_IMAGE_MODEL } from '$lib/server/model-config.js';

export async function GET({ locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const col = await getCollection('user_templates');
		const docs = await col
			.find(
				{},
				{
					projection: {
						_id: 1,
						name: 1,
						description: 1,
						templatePrompt: 1,
						inputSchema: 1,
						kategoriId: 1,
						userId: 1,
						sectionCount: { $size: '$sections' },
						createdAt: 1
					}
				}
			)
			.sort({ createdAt: -1 })
			.toArray();

		const templates = docs.map((doc) => ({
			_id: doc._id.toString(),
		type: doc.type || 'document',
			templatePrompt: doc.templatePrompt || '',
			inputSchema: doc.inputSchema || [],
			kategoriId: doc.kategoriId || null,
			userId: doc.userId || null,
			sectionCount: doc.sectionCount || 0,
			createdAt: doc.createdAt
		}));

		return json({ templates });
	} catch (error) {
		console.error('[user-templates] GET error:', error);
		return json({ error: 'Gagal mengambil template' }, { status: 500 });
	}
}

export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = locals.user.id || locals.user._id?.toString() || null;
	if (!userId) {
		return json({ error: 'User ID tidak ditemukan' }, { status: 400 });
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Request body tidak valid' }, { status: 400 });
	}

	const { name, description, templatePrompt, sections, inputSchema, kategoriId, type, context, imageModel } = body;

	const TEMPLATE_TYPES = new Set(['document', 'image']);
	const resolvedType = TEMPLATE_TYPES.has(type) ? type : 'document';

	// Validasi name
	if (!name || typeof name !== 'string' || !name.trim()) {
		return json({ error: 'Nama template wajib diisi' }, { status: 400 });
	}

	// Validasi inputSchema (opsional, boleh array kosong)
	const INPUT_SCHEMA_TYPES = new Set(['text', 'textarea', 'number', 'select', 'multiselect']);
	if (inputSchema !== undefined) {
		if (!Array.isArray(inputSchema)) {
			return json({ error: 'inputSchema harus berupa array' }, { status: 400 });
		}
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
				return json({ error: `inputSchema "${f.key}": type tidak valid. Pilih: ${[...INPUT_SCHEMA_TYPES].join(', ')}` }, { status: 400 });
			}
			if ((f.type === 'select' || f.type === 'multiselect') && (!Array.isArray(f.options) || f.options.length < 2)) {
				return json({ error: `inputSchema "${f.key}": type "${f.type}" memerlukan minimal 2 options` }, { status: 400 });
			}
		}
	}

	// Validasi image-specific
	if (resolvedType === 'image') {
		if (!context || typeof context !== 'string' || !context.trim()) {
			return json({ error: 'Context wajib diisi untuk template image' }, { status: 400 });
		}
		if (!templatePrompt || typeof templatePrompt !== 'string' || !templatePrompt.trim()) {
			return json({ error: 'Prompt template wajib diisi untuk template image' }, { status: 400 });
		}
	}

	// Validasi sections (hanya untuk document)
	if (resolvedType === 'document') {
		if (!Array.isArray(sections) || sections.length === 0) {
			return json({ error: 'Minimal 1 section diperlukan' }, { status: 400 });
		}

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
				return json({ error: `Section "${s.title}": key "${f.key}" duplikat dalam satu section` }, { status: 400 });
			}
			keys.add(f.key.trim());

			if (!f.label || typeof f.label !== 'string' || !f.label.trim()) {
				return json({ error: `Section "${s.title}", field "${f.key}": label wajib diisi` }, { status: 400 });
			}

			const allowedTypes = ['text', 'array', 'array-object', 'keyvalue', 'richtext', 'number'];
			if (f.type && !allowedTypes.includes(f.type)) {
				return json({ error: `Section "${s.title}", field "${f.key}": type tidak valid. Pilih: ${allowedTypes.join(', ')}` }, { status: 400 });
			}
		}
	}
	} // close resolvedType === 'document'

	try {
		const col = await getCollection('user_templates');
		const doc = {
			userId,
			type: resolvedType,
			name: name.trim(),
			description: description?.trim() ?? '',
			templatePrompt: templatePrompt?.trim() ?? '',
			context: resolvedType === 'image' ? (context?.trim() ?? '') : undefined,
			imageModel: resolvedType === 'image' ? (imageModel?.trim() || DEFAULT_IMAGE_MODEL) : undefined,
			kategoriId: kategoriId?.trim() || null,
			inputSchema: (inputSchema ?? []).map((f, i) => ({
				id: crypto.randomUUID(),
				order: i,
				key: f.key.trim(),
				label: f.label.trim(),
				type: f.type,
				placeholder: f.placeholder?.trim() ?? '',
				required: f.required !== false,
				options: ['select', 'multiselect'].includes(f.type) ? (f.options ?? []) : []
			})),
			sections: resolvedType === 'document' ? sections.map((s, si) => ({
				id: crypto.randomUUID(),
				order: si,
				title: s.title.trim(),
				sectionPrompt: s.sectionPrompt?.trim() ?? '',
				fields: s.fields.map((f, fi) => ({
					id: crypto.randomUUID(),
					order: fi,
					key: f.key.trim(),
					label: f.label.trim(),
					type: f.type ?? 'text',
					fieldPrompt: f.fieldPrompt?.trim() ?? ''
				}))
			})) : [],
			createdAt: new Date()
		};

		const result = await col.insertOne(doc);
		return json({ success: true, _id: result.insertedId.toString() });
	} catch (error) {
		console.error('[user-templates] POST error:', error);
		return json({ error: 'Gagal membuat template' }, { status: 500 });
	}
}
