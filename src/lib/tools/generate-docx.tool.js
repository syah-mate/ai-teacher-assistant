/**
 * generate-docx.tool.js — Pure Tool (no LLM)
 *
 * Memformat schema JSON menjadi teks konten yang dapat diproses
 * oleh endpoint export DOCX yang sudah ada, lalu mengembalikan buffer.
 */

/**
 * Format schema modul ajar menjadi teks konten
 */
function formatModulAjarSchema(schema, input) {
	const identitas = schema.identitas || {};
	const capaian = schema.capaian || {};
	const kegiatan = schema.kegiatan || {};
	const asesmen = schema.asesmen || {};
	const id = identitas.identitas || {};

	let text = '';

	// A. Informasi Umum
	text += `A. INFORMASI UMUM\n`;
	text += `─────────────────\n`;
	text += `Satuan Pendidikan : ${id.satuan || ''}\n`;
	text += `Mata Pelajaran    : ${id.mataPelajaran || input.mapel || ''}\n`;
	text += `Fase              : ${id.fase || ''}\n`;
	text += `Kelas             : ${id.kelas || input.kelas || ''}\n`;
	text += `Penulis           : ${id.penulis || input.penulis || ''}\n`;
	text += `Instansi          : ${id.instansi || input.instansi || ''}\n`;
	text += `Durasi Total      : ${identitas.durasiTotal || ''}\n`;
	text += `Alokasi Waktu     : ${identitas.alokasiWaktu || ''}\n\n`;
	text += `Deskripsi:\n${identitas.deskripsiUmum || ''}\n\n`;

	// B. Capaian & Tujuan
	text += `B. CAPAIAN & TUJUAN PEMBELAJARAN\n`;
	text += `──────────────────────────────────\n`;
	text += `Capaian Pembelajaran:\n${capaian.capaianPembelajaran || ''}\n\n`;
	text += `Tujuan Pembelajaran:\n`;
	(capaian.tujuanPembelajaran || []).forEach((t) => {
		text += `${t.nomor}. ${t.tujuan} (${t.levelBloom || ''})\n`;
	});
	text += `\nProfil Pelajar Pancasila:\n`;
	(capaian.profilPelajarPancasila || []).forEach((p) => {
		text += `• ${p.dimensi}: ${p.implementasi}\n`;
	});
	text += '\n';

	// C. Kegiatan Pembelajaran
	text += `C. KEGIATAN PEMBELAJARAN\n`;
	text += `─────────────────────────\n`;
	(kegiatan.pertemuan || []).forEach((p) => {
		text += `\nPertemuan ke-${p.ke}: ${p.tujuanPertemuan || ''}\n`;
		text += `Pertanyaan Pemantik:\n`;
		(p.pertanyaanPemantik || []).forEach((q) => {
			text += `• ${q}\n`;
		});
		const lp = p.langkahPembelajaran || {};
		text += `\nPEMBUKA:\n`;
		(lp.pembuka || []).forEach((l) => {
			text += `• ${l.aktivitas} (${l.durasi || ''})\n`;
		});
		text += `\nINTI:\n`;
		(lp.inti || []).forEach((l) => {
			text += `• ${l.aktivitas} (${l.durasi || ''})\n`;
		});
		text += `\nPENUTUP:\n`;
		(lp.penutup || []).forEach((l) => {
			text += `• ${l.aktivitas} (${l.durasi || ''})\n`;
		});
		const dif = p.diferensiasi || {};
		text += `\nDiferensiasi:\n`;
		text += `- Konten : ${dif.konten || ''}\n`;
		text += `- Proses : ${dif.proses || ''}\n`;
		text += `- Produk : ${dif.produk || ''}\n`;
		text += `\n---\n`;
	});

	// D. Asesmen
	text += `\nD. ASESMEN\n`;
	text += `───────────\n`;
	const diagn = asesmen.asesmenDiagnostik || {};
	text += `Asesmen Diagnostik:\nTujuan: ${diagn.tujuan || ''}\n`;
	text += `Instrumen: ${(diagn.instrumen || []).join(', ')}\n\n`;
	text += `Asesmen Formatif:\n`;
	(asesmen.asesmenFormatif || []).forEach((a) => {
		text += `• Pertemuan ${a.pertemuan}: ${a.teknik} – ${a.instrumen}\n`;
	});
	const sumatif = asesmen.asesmenSumatif || {};
	text += `\nAsesmen Sumatif:\nBentuk: ${sumatif.bentuk || ''}\nBobot: ${sumatif.bobot || ''}\nInstrumen: ${sumatif.instrumen || ''}\n\n`;
	text += `Rubrik Penilaian:\n`;
	(asesmen.rubrikPenilaian || []).forEach((r) => {
		text += `Aspek: ${r.aspek}\n`;
		const k = r.kriteria || {};
		text += `  Sangat Baik    : ${k.sangat_baik || ''}\n`;
		text += `  Baik           : ${k.baik || ''}\n`;
		text += `  Cukup          : ${k.cukup || ''}\n`;
		text += `  Perlu Bimbingan: ${k.perlu_bimbingan || ''}\n\n`;
	});
	text += `Refleksi Guru:\n`;
	(asesmen.refleksiGuru || []).forEach((r) => {
		text += `• ${r}\n`;
	});

	return text;
}

/**
 * Format schema LKPD menjadi teks konten
 */
function formatLKPDSchema(schema, input) {
	const identitas = schema.identitas || {};
	const capaian = schema.capaian || {};
	const materi = schema.materi || {};
	const langkah = schema.langkah || {};
	const evaluasi = schema.evaluasi || {};
	const id = identitas.identitas || {};

	let text = '';

	text += `A. IDENTITAS\n`;
	text += `─────────────\n`;
	text += `Mata Pelajaran: ${id.mataPelajaran || input.mapel || ''}\n`;
	text += `Kelas         : ${id.kelas || input.kelas || ''}\n`;
	text += `Fase          : ${id.fase || ''}\n`;
	text += `Penulis       : ${id.penulis || input.penulis || ''}\n`;
	text += `Instansi      : ${id.instansi || input.instansi || ''}\n\n`;

	text += `B. CAPAIAN PEMBELAJARAN\n`;
	text += `────────────────────────\n`;
	text += `${capaian.capaianPembelajaran || ''}\n\n`;
	text += `Tujuan Pembelajaran:\n`;
	(capaian.tujuanPembelajaran || []).forEach((t) => {
		text += `${t.nomor}. ${t.tujuan}\n`;
	});
	text += '\n';

	text += `C. RINGKASAN MATERI\n`;
	text += `────────────────────\n`;
	text += `${materi.ringkasanMateri || ''}\n\n`;
	text += `Konsep Kunci:\n`;
	(materi.konsepKunci || []).forEach((k) => {
		text += `• ${k.konsep}: ${k.definisi}\n`;
	});
	text += `\nFakta Penting:\n`;
	(materi.faktaPenting || []).forEach((f) => {
		text += `• ${f}\n`;
	});
	text += `\nContoh Aplikasi:\n`;
	(materi.contohAplikasi || []).forEach((c) => {
		text += `• ${c}\n`;
	});
	text += '\n';

	text += `D. LANGKAH KERJA\n`;
	text += `─────────────────\n`;
	(langkah.langkahKerja || []).forEach((bag) => {
		text += `\n${bag.bagian}\n`;
		text += `Tujuan: ${bag.tujuanBagian || ''}\n`;
		(bag.langkah || []).forEach((l) => {
			text += `${l.nomor}. ${l.instruksi}`;
			if (l.estimasiWaktu) text += ` (${l.estimasiWaktu})`;
			text += '\n';
			if (l.ruangJawaban) text += `   [ Ruang Jawaban ]\n`;
		});
	});
	text += '\n';

	text += `E. EVALUASI\n`;
	text += `────────────\n`;
	(evaluasi.soalEvaluasi || []).forEach((s) => {
		text += `\nSoal ${s.nomor} (Bobot ${s.bobot}):\n`;
		text += `${s.soal}\n`;
		text += `Kunci Jawaban: ${s.kunciJawaban || ''}\n`;
	});
	text += `\nPertanyaan Refleksi:\n`;
	(evaluasi.pertanyaanRefleksi || []).forEach((p) => {
		text += `• ${p}\n`;
	});
	text += `\nTotal Bobot: ${evaluasi.totalBobot || 100}\n`;

	return text;
}

/**
 * Format schema soal menjadi teks konten
 */
function formatSoalSchema(schema) {
	const pg = schema['soal-pg'] || {};
	const esai = schema['soal-esai'] || {};
	let text = '';

	if ((pg.soalPilihanGanda || []).length > 0) {
		text += `SOAL PILIHAN GANDA\n${'─'.repeat(40)}\n\n`;
		pg.soalPilihanGanda.forEach((s) => {
			text += `${s.nomor}. ${s.soal}\n`;
			const p = s.pilihan || {};
			text += `   A. ${p.A || ''}\n`;
			text += `   B. ${p.B || ''}\n`;
			text += `   C. ${p.C || ''}\n`;
			text += `   D. ${p.D || ''}\n`;
			text += `   Kunci: ${s.kunci || ''}\n`;
			if (s.pembahasan) text += `   Pembahasan: ${s.pembahasan}\n`;
			text += `   Level Bloom: ${s.levelBloom || ''}\n\n`;
		});
	}

	if ((esai.soalEsai || []).length > 0) {
		text += `\nSOAL ESAI\n${'─'.repeat(40)}\n\n`;
		esai.soalEsai.forEach((s) => {
			text += `${s.nomor}. ${s.soal} (Bobot: ${s.bobot})\n`;
			text += `Kunci Jawaban: ${s.kunciJawaban || ''}\n`;
			const r = s.rubrik || {};
			text += `Rubrik:\n`;
			text += `  Skor 4: ${r.skor_4 || ''}\n`;
			text += `  Skor 3: ${r.skor_3 || ''}\n`;
			text += `  Skor 2: ${r.skor_2 || ''}\n`;
			text += `  Skor 1: ${r.skor_1 || ''}\n`;
			text += `Level Bloom: ${s.levelBloom || ''}\n\n`;
		});
	}

	return text;
}

/**
 * Generate DOCX via export endpoint
 * Mengirim schema yang sudah diformat ke endpoint export yang ada.
 *
 * @param {{ jenis: string, schema: Object, input: Object }} params
 * @returns {Promise<{ success: boolean, buffer?: ArrayBuffer, error?: string }>}
 */
export async function generateDocx({ jenis, schema, input = {}, images = [] }) {
	// When running inside a background job (server-side), skip DOCX generation.
	// The schema is persisted to MongoDB by the job runner; DOCX is built on-demand
	// from the export endpoints when the user downloads it from Riwayat.
	if (globalThis.__isJobServerContext?.()) {
		return { success: true, skipped: true };
	}

	try {
		if (jenis === 'modul_ajar') {
			const content = formatModulAjarSchema(schema, input);
			const id = schema.identitas?.identitas || {};
			const res = await fetch('/api/export-modul-docx', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					modulData: {
						judulModul: schema.identitas?.judul || input.judul || '',
						mapel: id.mataPelajaran || input.mapel || '',
						kelas: id.kelas || input.kelas || '',
						penulis: id.penulis || input.penulis || '',
						instansi: id.instansi || input.instansi || '',
						content,
						modulAjar: content,
						schema,
						images
					}
				})
			});
			if (!res.ok) return { success: false, error: 'Gagal generate DOCX modul ajar' };
			const buffer = await res.arrayBuffer();
			return { success: true, buffer };
		}

		if (jenis === 'lkpd') {
			const content = formatLKPDSchema(schema, input);
			const id = schema.identitas?.identitas || {};
			const res = await fetch('/api/export-lkpd-docx', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					lkpdData: {
						judulModul: schema.identitas?.judul || input.judul || '',
						mapel: id.mataPelajaran || input.mapel || '',
						kelas: id.kelas || input.kelas || '',
						penulis: id.penulis || input.penulis || '',
						instansi: id.instansi || input.instansi || '',
						content,
						modulAjar: content,
						images
					}
				})
			});
			if (!res.ok) return { success: false, error: 'Gagal generate DOCX LKPD' };
			const buffer = await res.arrayBuffer();
			return { success: true, buffer };
		}

		if (jenis === 'soal') {
			const content = formatSoalSchema(schema);
			const res = await fetch('/api/export-soal-docx', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					soalData: {
						judulSoal: input.judul || '',
						mapel: input.mapel || '',
						kelas: input.kelas || '',
						topik: input.judul || '',
						jenis: input.jenisSoal || '',
						jumlah: input.jumlahSoal || '',
						tingkat: input.tingkat || '',
						level: input.levelBloom || '',
						content,
						images: []
					}
				})
			});
			if (!res.ok) return { success: false, error: 'Gagal generate DOCX soal' };
			const buffer = await res.arrayBuffer();
			return { success: true, buffer };
		}

		return { success: false, error: `Jenis tidak dikenal: ${jenis}` };
	} catch (error) {
		return { success: false, error: error.message };
	}
}
