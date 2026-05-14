/**
 * Compiler Tool
 *
 * Menggabungkan semua compile method dari orchestrator lama:
 * - compileModulAjar() → untuk modul_ajar
 * - compileLKPD()      → untuk lkpd
 * - compileSoal()      → untuk soal
 *
 * Routing berdasarkan input.jenis.
 */

import { BaseAgent } from '../base-agent.js';

export class CompilerTool extends BaseAgent {
	constructor() {
		super(
			'CompilerTool',
			'Penyusun Dokumen Final',
			'Compile semua output tool menjadi dokumen pembelajaran siap pakai'
		);
	}

	/**
	 * @param {Object} input   - input.jenis menentukan format output
	 * @param {Object} context - semua output tool sebelumnya
	 */
	async execute(input, context = {}) {
		this.log(`Compiling document for: ${input.judul} [${input.jenis}]`);

		try {
			let dokumen;

			if (input.jenis === 'modul_ajar') {
				dokumen = this.compileModulAjar(input, context);
			} else if (input.jenis === 'lkpd') {
				dokumen = this.compileLKPD(input, context);
			} else if (input.jenis === 'soal') {
				dokumen = this.compileSoal(input, context);
			} else {
				return {
					success: false,
					error: `Jenis dokumen tidak dikenal: ${input.jenis}`,
					agentName: this.name
				};
			}

			return { success: true, data: dokumen, agentName: this.name, metadata: this.getMetadata() };
		} catch (error) {
			this.log(error.message, 'error');
			return { success: false, error: error.message, agentName: this.name };
		}
	}

	// ─────────────────────────────────────────────────────
	// MODUL AJAR
	// ─────────────────────────────────────────────────────

	compileModulAjar(input, context) {
		const identitas = context.identitas || {};
		const capaian = context.capaian || {};
		const kegiatan = context.kegiatan || {};
		const asesmen = context.asesmen || {};
		const validation = context.validator || { qualityScore: 0, recommendations: [] };
		const images = context.image || [];

		const judulModul = identitas.judulModul || input.judul;

		let modul = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         MODUL AJAR KURIKULUM MERDEKA
         ${(judulModul || '').toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

		// A. INFORMASI UMUM
		modul += `
═══════════════════════════════════════════════════
A. INFORMASI UMUM
═══════════════════════════════════════════════════

Judul Modul      : ${judulModul}
Mata Pelajaran   : ${identitas.identitas?.mataPelajaran || input.mapel}
Kelas/Fase       : ${identitas.identitas?.kelas || input.kelas} (${identitas.identitas?.fase || ''})
Jenjang          : ${identitas.identitas?.jenjang || ''}
Penulis          : ${identitas.identitas?.penulis || input.penulis || 'Guru Mata Pelajaran'}
Instansi         : ${identitas.identitas?.instansi || input.instansi || 'Sekolah'}
Durasi Total     : ${identitas.durasiTotal || ''}
Alokasi Waktu    : ${identitas.alokasiWaktu || input.alokasiPerPertemuan || ''}

DESKRIPSI MODUL:
${identitas.deskripsiUmum || ''}

${identitas.identitas?.faseDeskripsi || ''}

`;

		// B. CAPAIAN & TUJUAN PEMBELAJARAN
		modul += `
═══════════════════════════════════════════════════
B. CAPAIAN & TUJUAN PEMBELAJARAN
═══════════════════════════════════════════════════

▸ CAPAIAN PEMBELAJARAN (CP)
${capaian.capaianPembelajaran || '-'}

▸ TUJUAN PEMBELAJARAN
${(capaian.tujuanPembelajaran || []).map((tp, i) =>
	`${tp.nomor || i + 1}. ${tp.tujuan} ${tp.levelBloom ? `(${tp.levelBloom})` : ''}`
).join('\n') || '-'}

▸ ALUR TUJUAN PEMBELAJARAN (ATP)
${(capaian.alurTujuanPembelajaran || []).map((atp, i) =>
	`Tahap ${atp.tahap || i + 1}: ${atp.judulTahap}\n   ${atp.deskripsi}`
).join('\n\n') || '-'}

▸ PROFIL PELAJAR PANCASILA
${(capaian.profilPelajarPancasila || []).map((ppp) =>
	`• ${ppp.dimensi}\n  ${ppp.deskripsi}\n  Implementasi: ${ppp.implementasi}`
).join('\n\n') || '-'}

`;

		// C. DETAIL KEGIATAN PEMBELAJARAN
		modul += `
═══════════════════════════════════════════════════
C. DETAIL KEGIATAN PEMBELAJARAN
═══════════════════════════════════════════════════

Model Pembelajaran: ${input.metode || 'Problem Based Learning'}
Mode Pembelajaran : ${input.modePembelajaran || 'Luring (Tatap Muka)'}

`;

		(kegiatan.pertemuan || []).forEach((pertemuan, idx) => {
			modul += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERTEMUAN ${pertemuan.nomorPertemuan || idx + 1}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Judul          : ${pertemuan.judulPertemuan || ''}
Alokasi Waktu  : ${pertemuan.alokasiWaktu || ''}
Tujuan         : ${pertemuan.tujuanPertemuan || ''}

Indikator Keberhasilan:
${(pertemuan.indikatorKeberhasilan || []).map((ind, i) => `${i + 1}. ${ind}`).join('\n') || '-'}

PERTANYAAN PEMANTIK:
${(pertemuan.pertanyaanPemantik || []).map((p, i) => `${i + 1}. ${p}`).join('\n') || '-'}

MEDIA & SUMBER BELAJAR:
Media          : ${pertemuan.perlengkapan?.media?.join(', ') || '-'}
Bahan Ajar     : ${pertemuan.perlengkapan?.bahanAjar?.join(', ') || '-'}
Sumber Belajar : ${pertemuan.perlengkapan?.sumberBelajar?.join(', ') || '-'}

┌─────────────────────────────────────────────────┐
│  LANGKAH PEMBELAJARAN                            │
└─────────────────────────────────────────────────┘

▸ KEGIATAN PEMBUKA (${pertemuan.langkahPembelajaran?.pembuka?.waktu || '15 menit'})
${this.formatAktivitas(pertemuan.langkahPembelajaran?.pembuka?.aktivitas)}

▸ KEGIATAN INTI (${pertemuan.langkahPembelajaran?.inti?.waktu || '60 menit'})
${this.formatFase(pertemuan.langkahPembelajaran?.inti?.fase)}

▸ KEGIATAN PENUTUP (${pertemuan.langkahPembelajaran?.penutup?.waktu || '15 menit'})
${this.formatAktivitas(pertemuan.langkahPembelajaran?.penutup?.aktivitas)}

DIFERENSIASI PEMBELAJARAN:
• Untuk Siswa Berkesulitan: ${pertemuan.diferensiasi?.untukSiswaBerkesulitan || '-'}
• Untuk Siswa Advanced: ${pertemuan.diferensiasi?.untukSiswaAdvanced || '-'}
• Gaya Belajar: ${pertemuan.diferensiasi?.gayaBelajar || '-'}
`;

			// Sisipkan ilustrasi AI jika ada
			if (images && images.length > 0) {
				const pertemuanImages = images.filter(
					(img) => img.position === `pertemuan-${pertemuan.nomorPertemuan || idx + 1}`
				);
				if (pertemuanImages.length > 0) {
					modul += `\n\n📸 ILUSTRASI PEMBELAJARAN:\n`;
					pertemuanImages.forEach((img) => {
						modul += `\n[Gambar: ${img.caption}]\n${img.description}\n[Image embedded - visible in .docx download]\n`;
					});
				}
			}

			modul += `\n`;
		});

		// D. ASESMEN
		modul += `
═══════════════════════════════════════════════════
D. RENCANA ASESMEN
═══════════════════════════════════════════════════

▸ ASESMEN DIAGNOSTIK
Tujuan : ${asesmen.asesmenDiagnostik?.tujuan || '-'}
Waktu  : ${asesmen.asesmenDiagnostik?.waktu || '-'}
Format : ${asesmen.asesmenDiagnostik?.format || '-'}

Instrumen:
${(asesmen.asesmenDiagnostik?.instrumen || []).map((ins, i) =>
	`${ins.nomor || i + 1}. ${ins.pertanyaan}\n   Tujuan: ${ins.tujuan}`
).join('\n') || '-'}

▸ ASESMEN FORMATIF (Selama Pembelajaran)
${(asesmen.asesmenFormatif || []).map((af) =>
	`Pertemuan ${af.pertemuan}: ${af.teknik}\n${af.deskripsi}\nKriteria: ${af.kriteria}`
).join('\n\n') || '-'}

▸ ASESMEN SUMATIF (Akhir Pembelajaran)
Jenis  : ${asesmen.asesmenSumatif?.jenis || '-'}
Waktu  : ${asesmen.asesmenSumatif?.waktu || '-'}

${asesmen.asesmenSumatif?.deskripsi || ''}

Komponen Penilaian:
${(asesmen.asesmenSumatif?.komponenPenilaian || []).map((k) =>
	`• ${k.komponen} (${k.bobot}): ${k.deskripsi}`
).join('\n') || '-'}

▸ RUBRIK PENILAIAN
${this.formatRubrik(asesmen.rubrikPenilaian)}

▸ REFLEKSI PEMBELAJARAN
Refleksi Siswa:
${(asesmen.refleksi?.refleksiSiswa?.pertanyaanPanduan || []).map((p, i) => `${i + 1}. ${p}`).join('\n') || '-'}

Refleksi Guru:
${(asesmen.refleksi?.refleksiGuru?.aspekRefleksi || []).map((a, i) => `${i + 1}. ${a}`).join('\n') || '-'}

`;

		// E. METADATA
		modul += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
METADATA DOKUMEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated by    : AI Asisten Guru (Single Orchestrator)
Generated at    : ${new Date().toLocaleString('id-ID')}
Quality Score   : ${validation.qualityScore || 0}/100

${(validation.recommendations || []).length > 0 ? `
REKOMENDASI PERBAIKAN:
${validation.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

		// Return dalam format kompatibel dengan frontend & export modul DOCX
		return {
			modulAjar: modul.trim(),
			images: images || [],
			// Juga sediakan rawData (state) untuk DOCX export yang membutuhkannya
			rawData: {
				informasiUmum: identitas,
				capaianTujuan: capaian,
				kegiatanPembelajaran: kegiatan,
				asesmen,
				validation,
				images: images || []
			}
		};
	}

	// ─────────────────────────────────────────────────────
	// LKPD
	// ─────────────────────────────────────────────────────

	compileLKPD(input, context) {
		const identitas = context.identitas || {};
		const capaian = context.capaian || {};
		const lkpdContent = context.lkpdContent || {};
		const validation = context.validator || { qualityScore: 0, recommendations: [] };
		const images = context.image || [];

		return {
			metadata: {
				generatedAt: new Date().toISOString(),
				generatedBy: 'AI Asisten Guru (Single Orchestrator)',
				version: '2.0.0'
			},

			// Identitas LKPD
			identitas,

			// Capaian & Kompetensi (LKPD format)
			capaianPembelajaran: capaian.capaianPembelajaran,
			tujuanPembelajaran: capaian.tujuanPembelajaran,

			// Konten LKPD
			petunjukBelajar: lkpdContent.petunjukBelajar,
			materiPendukung: lkpdContent.materiPendukung,
			langkahKerja: lkpdContent.langkahKerja,

			// Evaluasi & Refleksi
			evaluasi: lkpdContent.evaluasiRefleksi?.evaluasi,
			rubrikPenilaian: lkpdContent.evaluasiRefleksi?.rubrikPenilaian,
			refleksiDiri: lkpdContent.evaluasiRefleksi?.refleksiDiri,
			kesimpulan: lkpdContent.evaluasiRefleksi?.kesimpulan,

			// Gambar AI
			images: images || [],

			// Validasi & Kualitas
			validasi: {
				kualitasKeseluruhan: validation.qualityScore || 0,
				qualityChecks: validation.qualityChecks || [],
				rekomendasi: validation.recommendations || []
			}
		};
	}

	// ─────────────────────────────────────────────────────
	// SOAL
	// ─────────────────────────────────────────────────────

	compileSoal(input, context) {
		const soalData = context.soal || {};
		const validation = context.validator || {
			score: 0,
			status: 'NOT VALIDATED',
			passed: false,
			fullReport: ''
		};
		const images = context.image || [];

		// Replace image markers jika ada
		let formattedContent = soalData.fullOutput || '';
		const imageRequirements = soalData.imageRequirements || [];

		if (images.length > 0) {
			imageRequirements.forEach((req, index) => {
				if (index < images.length) {
					const placeholder = `\n\n📸 [Gambar: ${images[index].caption || req.description}]\n[Image embedded - visible in .docx download]\n`;
					formattedContent = formattedContent.replace(req.marker, placeholder);
				}
			});
		}

		// Hitung quality indicator
		const score = validation.score ?? validation.qualityScore ?? 0;
		let qualityIndicator;
		if (score >= 90) qualityIndicator = { label: 'Sangat Baik', color: 'green', emoji: '🌟' };
		else if (score >= 75) qualityIndicator = { label: 'Baik', color: 'blue', emoji: '✅' };
		else if (score >= 60) qualityIndicator = { label: 'Cukup', color: 'yellow', emoji: '⚠️' };
		else qualityIndicator = { label: 'Perlu Perbaikan', color: 'red', emoji: '❌' };

		return {
			content: formattedContent,
			rawContent: soalData.rawContent || '',
			images: images || [],
			imageRequirements,
			qualityIndicator,
			validationReport: validation.fullReport || '',
			metadata: {
				...(soalData.metadata || {}),
				validation: {
					score,
					status: validation.status || 'VALIDATED',
					passed: validation.passed ?? score >= 70,
					fullReport: validation.fullReport || ''
				}
			}
		};
	}

	// ─────────────────────────────────────────────────────
	// HELPER METHODS
	// ─────────────────────────────────────────────────────

	formatAktivitas(aktivitas) {
		if (!aktivitas || !Array.isArray(aktivitas)) return '-';
		return aktivitas
			.map(
				(akt) =>
					`${akt.tahap}:\n   Guru  : ${akt.aktivitasGuru}\n   Siswa : ${akt.aktivitasSiswa}`
			)
			.join('\n\n');
	}

	formatFase(fase) {
		if (!fase || !Array.isArray(fase)) return '-';
		return fase
			.map(
				(f, i) =>
					`Fase ${i + 1}: ${f.namaFase} (${f.waktu})\n` +
					`Guru  : ${f.aktivitasGuru}\n` +
					`Siswa : ${f.aktivitasSiswa}\n` +
					(f.instruksi ? `Instruksi: ${f.instruksi}` : '')
			)
			.join('\n\n');
	}

	formatRubrik(rubrik) {
		if (!rubrik || !Array.isArray(rubrik)) return '-';
		return rubrik
			.map(
				(r) =>
					`\n${r.jenisAsesmen} - ${r.aspekYangDinilai}:\n` +
					r.kriteria.map((k) => `  • ${k.level}: ${k.deskriptor}`).join('\n')
			)
			.join('\n');
	}
}
