/**
 * schema-formatter.js
 * Konversi schema JSON dari sub-agents ke teks yang bisa ditampilkan.
 */

export function formatSchemaToText(jenis, schema, meta = {}) {
	if (jenis === 'modul_ajar') return formatModulAjar(schema, meta);
	if (jenis === 'lkpd') return formatLKPD(schema);
	if (jenis === 'soal') return formatSoal(schema);
	return JSON.stringify(schema, null, 2);
}

function formatModulAjar(schema, meta = {}) {
	const identitas = schema.identitas || {};
	const capaian = schema.capaian || {};
	const kegiatan = schema.kegiatan || {};
	const asesmen = schema.asesmen || {};
	const id = identitas.identitas || {};
	let text = '';

	text += `# ${identitas.judul || 'MODUL AJAR'}\n\n`;
	text += `## A. INFORMASI UMUM\n\n`;
	text += `| | |\n|---|---|\n`;
	text += `| Satuan Pendidikan | ${id.satuan || ''} |\n`;
	text += `| Mata Pelajaran | ${id.mataPelajaran || ''} |\n`;
	text += `| Fase | ${id.fase || ''} |\n`;
	text += `| Kelas | ${id.kelas || ''} |\n`;
	text += `| Penulis | ${id.penulis || ''} |\n`;
	text += `| Instansi | ${id.instansi || ''} |\n`;
	text += `| Durasi Total | ${identitas.durasiTotal || ''} |\n`;
	text += `| Alokasi Waktu | ${identitas.alokasiWaktu || ''} |\n`;
	text += `| Model Pembelajaran | ${meta.metode || ''} |\n`;
	text += `| Mode Pembelajaran | ${meta.modePembelajaran || ''} |\n\n`;
	text += `**Deskripsi Umum:**\n${identitas.deskripsiUmum || ''}\n\n`;

	text += `## B. KEMAMPUAN PRASYARAT & TUJUAN PEMBELAJARAN\n\n`;
	text += `**Kemampuan Prasyarat / Prasyarat Kompetensi:**\n${capaian.kemampuanPrasyarat || ''}\n\n`;
	if ((capaian.tujuanPembelajaran || []).length > 0) {
		text += `**Tujuan Pembelajaran:**\n`;
		capaian.tujuanPembelajaran.forEach((t) => {
			text += `${t.nomor}. ${t.tujuan} *(${t.levelBloom || ''})*\n`;
		});
		text += '\n';
	}
	if ((capaian.profilPelajarPancasila || []).length > 0) {
		text += `**Profil Pelajar Pancasila:**\n`;
		capaian.profilPelajarPancasila.forEach((p) => {
			text += `- **${p.dimensi}**: ${p.implementasi}\n`;
		});
		text += '\n';
	}

	text += `## C. KEGIATAN PEMBELAJARAN\n\n`;
	(kegiatan.pertemuan || []).forEach((p) => {
		text += `### Pertemuan ke-${p.ke}: ${p.tujuanPertemuan || ''}\n\n`;
		if ((p.pertanyaanPemantik || []).length > 0) {
			text += `**Pertanyaan Pemantik:**\n`;
			p.pertanyaanPemantik.forEach((q) => {
				text += `- ${q}\n`;
			});
			text += '\n';
		}
		const lp = p.langkahPembelajaran || {};
		text += `**Pembuka:**\n`;
		(lp.pembuka || []).forEach((l) => text += `- ${l.aktivitas} *(${l.durasi || ''})*\n`);
		text += `\n**Inti:**\n`;
		(lp.inti || []).forEach((l) => text += `- ${l.aktivitas} *(${l.durasi || ''})*\n`);
		text += `\n**Penutup:**\n`;
		(lp.penutup || []).forEach((l) => text += `- ${l.aktivitas} *(${l.durasi || ''})*\n`);
		const dif = p.diferensiasi || {};
		text += `\n**Diferensiasi:**\n- Konten: ${dif.konten || ''}\n- Proses: ${dif.proses || ''}\n- Produk: ${dif.produk || ''}\n\n---\n\n`;
	});

	text += `## D. ASESMEN\n\n`;
	const diagn = asesmen.asesmenDiagnostik || {};
	text += `**Asesmen Diagnostik:**\n${diagn.tujuan || ''}\n`;
	if ((diagn.instrumen || []).length > 0) {
		diagn.instrumen.forEach((i) => text += `- ${i}\n`);
	}
	text += '\n';
	if ((asesmen.asesmenFormatif || []).length > 0) {
		text += `**Asesmen Formatif:**\n`;
		asesmen.asesmenFormatif.forEach((a) => {
			text += `- Pertemuan ${a.pertemuan}: ${a.teknik} — ${a.instrumen}\n`;
		});
		text += '\n';
	}
	const sumatif = asesmen.asesmenSumatif || {};
	text += `**Asesmen Sumatif:** ${sumatif.bentuk || ''} (Bobot: ${sumatif.bobot || ''})\n${sumatif.instrumen || ''}\n\n`;
	if ((asesmen.rubrikPenilaian || []).length > 0) {
		text += `**Rubrik Penilaian:**\n`;
		asesmen.rubrikPenilaian.forEach((r) => {
			text += `\n*${r.aspek}*\n`;
			const k = r.kriteria || {};
			text += `| Sangat Baik | Baik | Cukup | Perlu Bimbingan |\n|---|---|---|---|\n`;
			text += `| ${k.sangat_baik || ''} | ${k.baik || ''} | ${k.cukup || ''} | ${k.perlu_bimbingan || ''} |\n`;
		});
	}

	return text;
}

function formatLKPD(schema) {
	const identitas  = schema.identitas || {};
	const capaian    = schema.capaian_lkpd || {};
	const materi     = schema.ringkasan_materi || {};
	const langkah    = schema.langkah_kerja || {};
	const penilaian  = schema.penilaian_lkpd || {};
	const id         = identitas.identitas || {};
	let text = '';

	// ── HEADER ──
	text += `# LKPD: ${identitas.judul || ''}\n\n`;
	text += `**Mapel:** ${id.mataPelajaran || ''} | **Kelas:** ${id.kelas || ''} | **Fase:** ${id.fase || ''}\n`;
	text += `**Jenis Kegiatan:** ${identitas.jenisKegiatan || ''} | **Pola Belajar:** ${identitas.polaBelajar || ''}\n`;
	text += `**Penulis:** ${id.penulis || ''} — ${id.instansi || ''}\n\n`;
	text += `---\n\n`;

	// ── A. CAPAIAN PEMBELAJARAN ──
	text += `## A. CAPAIAN PEMBELAJARAN\n\n`;
	if ((capaian.tujuanPembelajaran || []).length > 0) {
		text += `**Tujuan Pembelajaran:**\n`;
		capaian.tujuanPembelajaran.forEach((t) =>
			text += `${t.nomor}. ${t.tujuan} *(${t.levelBloom || ''})*\n`
		);
		text += '\n';
	}
	if ((capaian.indikatorKetercapaian || []).length > 0) {
		text += `**Indikator Ketercapaian:**\n`;
		capaian.indikatorKetercapaian.forEach((i) => text += `- ${i}\n`);
		text += '\n';
	}

	// ── B. RINGKASAN MATERI ──
	text += `## B. RINGKASAN MATERI\n\n`;
	text += `${materi.materiSingkat || ''}\n\n`;
	if ((materi.konsepKunci || []).length > 0) {
		text += `**Konsep Kunci:**\n`;
		materi.konsepKunci.forEach((k) => text += `- **${k.konsep}**: ${k.definisi}\n`);
		text += '\n';
	}
	if ((materi.faktaPenting || []).length > 0) {
		text += `**Fakta Penting:**\n`;
		materi.faktaPenting.forEach((f) => text += `- ${f}\n`);
		text += '\n';
	}

	// ── C. LANGKAH KERJA ──
	text += `## C. LANGKAH KERJA\n\n`;
	if ((langkah.alatBahan || []).length > 0) {
		text += `**Alat & Bahan:**\n`;
		langkah.alatBahan.forEach((a) => text += `- ${a}\n`);
		text += '\n';
	}
	(langkah.langkahKerja || []).forEach((bag) => {
		text += `### ${bag.bagian}\n`;
		if (bag.tujuanBagian) text += `*${bag.tujuanBagian}*\n\n`;
		(bag.langkah || []).forEach((l) => {
			text += `**${l.nomor}.** ${l.instruksi}`;
			if (l.estimasiWaktu) text += ` *(${l.estimasiWaktu})*`;
			text += '\n';
			if (l.ruangJawaban) text += `\n> *Ruang Jawaban:* ____________________________________\n`;
			text += '\n';
		});
	});
	const tabel = langkah.tabelPengamatan;
	if (tabel?.judul) {
		text += `### ${tabel.judul}\n\n`;
		if ((tabel.kolom || []).length > 0) {
			text += `| ${tabel.kolom.join(' | ')} |\n`;
			text += `| ${tabel.kolom.map(() => '---').join(' | ')} |\n`;
			text += `| ${tabel.kolom.map(() => '').join(' | ')} |\n\n`;
		}
		if (tabel.keterangan) text += `*${tabel.keterangan}*\n\n`;
	}

	// ── D. PENILAIAN ──
	text += `## D. PENILAIAN\n\n`;
	if ((penilaian.rubrikPenilaian || []).length > 0) {
		text += `**Rubrik Penilaian:**\n\n`;
		text += `| Aspek | Sangat Baik | Baik | Cukup | Perlu Bimbingan | Bobot |\n`;
		text += `|---|---|---|---|---|---|\n`;
		penilaian.rubrikPenilaian.forEach((r) => {
			const k = r.kriteria || {};
			text += `| ${r.aspek} | ${k.sangat_baik || ''} | ${k.baik || ''} | ${k.cukup || ''} | ${k.perlu_bimbingan || ''} | ${r.bobot || ''} |\n`;
		});
		text += '\n';
	}
	if ((penilaian.evaluasiRefleksi || []).length > 0) {
		text += `**Evaluasi & Refleksi Siswa:**\n`;
		penilaian.evaluasiRefleksi.forEach((e, i) => text += `${i + 1}. ${e}\n`);
		text += '\n';
	}

	return text;
}

function formatSoal(schema) {
	const pg = schema['soal-pg'] || {};
	const esai = schema['soal-esai'] || {};
	let text = '';

	if ((pg.soalPilihanGanda || []).length > 0) {
		text += `# SOAL PILIHAN GANDA\n\n`;
		pg.soalPilihanGanda.forEach((s) => {
			text += `**${s.nomor}.** ${s.soal}\n\n`;
			const p = s.pilihan || {};
			text += `A. ${p.A || ''}  \nB. ${p.B || ''}  \nC. ${p.C || ''}  \nD. ${p.D || ''}\n\n`;
			text += `**Kunci:** ${s.kunci || ''} | **Level Bloom:** ${s.levelBloom || ''}\n\n`;
			if (s.pembahasan) text += `> *Pembahasan: ${s.pembahasan}*\n\n`;
			text += `---\n\n`;
		});
	}

	if ((esai.soalEsai || []).length > 0) {
		text += `# SOAL ESAI\n\n`;
		esai.soalEsai.forEach((s) => {
			text += `**${s.nomor}.** ${s.soal} *(Bobot: ${s.bobot})*\n\n`;
			if (s.kunciJawaban) text += `**Kunci Jawaban:**\n${s.kunciJawaban}\n\n`;
			const r = s.rubrik || {};
			text += `**Rubrik:**\n`;
			text += `| Skor 4 | Skor 3 | Skor 2 | Skor 1 |\n|---|---|---|---|\n`;
			text += `| ${r.skor_4 || ''} | ${r.skor_3 || ''} | ${r.skor_2 || ''} | ${r.skor_1 || ''} |\n\n`;
			text += `**Level Bloom:** ${s.levelBloom || ''}\n\n---\n\n`;
		});
	}

	return text;
}
