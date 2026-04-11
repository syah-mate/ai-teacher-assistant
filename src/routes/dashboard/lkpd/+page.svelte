<script>
	import { getKurikulumMerdekaContext, getModelPembelajaran } from '$lib/prompts/kurikulum-merdeka-base.js';
	import { callGeminiAPI, buildPrompt } from '$lib/utils/gemini-client.js';
	import { LKPDOrchestrator } from '$lib/agents/lkpd/index.js';

	let form = $state({
		sekolah: '',
		mapel: '',
		kelas: 'VII',
		semester: '1',
		topik: '',
		tujuan: '',
		model: 'Discovery Learning',
		waktu: '2x40 menit',
		jenisKegiatan: 'pembelajaran umum', // eksperimen/observasi/diskusi/latihan
		polaBelajar: 'berkelompok',
		penulis: '',
		instansi: ''
	});

	let generationMode = $state('agentic'); // 'agentic' or 'single'
	let isGenerating = $state(false);
	let output = $state('');
	let copied = $state(false);
	let error = $state('');
	
	// Progress tracking for agentic mode
	let progress = $state({
		step: 0,
		total: 8,
		phase: '',
		message: '',
		status: 'idle' // idle, running, completed, error
	});
	
	let qualityScore = $state(0);
	let rawData = $state(null);
	let isDownloading = $state(false);

	/**
	 * Render output with embedded images
	 */
	function renderOutputWithImages(textOutput, imagesData) {
		if (!textOutput) return '';
		if (!imagesData || imagesData.length === 0) return textOutput;

		let result = textOutput;
		
		// Find and replace image placeholders with actual images
		imagesData.forEach(img => {
			const placeholder = `[Image embedded - visible in .docx download]`;
			const imgTag = `<img src="data:${img.mimeType};base64,${img.data}" alt="${img.caption}" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />`;
			
			// Replace first occurrence of placeholder with actual image
			result = result.replace(placeholder, imgTag);
		});

		return result;
	}

	function buildLKPDPrompt() {
		const { sekolah, mapel, kelas, topik, tujuan, model, waktu, semester } = form;
		
		// Convert Roman numeral to number
		const kelasMap = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };
		const kelasNumber = kelasMap[kelas];
		
		// Get curriculum context
		const systemContext = getKurikulumMerdekaContext(kelasNumber, mapel);
		
		// Get model pembelajaran details
		const modelKey = model.includes('Discovery') ? 'discoveryLearning' : 
		                 model.includes('Problem') ? 'pbl' :
		                 model.includes('Project') ? 'projectBased' : 
		                 model.includes('Inquiry') ? 'inquiryLearning' : 'discoveryLearning';
		const modelDetail = getModelPembelajaran(modelKey);

		const outputFormat = `
FORMAT:

━━ LKPD ${topik} ━━

Sekolah: ${sekolah || '___'} | ${mapel} | Kls ${kelas}/${semester} | ${waktu}
Nama: _____ No: _____ Tgl: _____

A. TUJUAN
${tujuan || '• 3 tujuan untuk ' + topik}

B. KEGIATAN (${model})
${modelDetail.sintak.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Detail: stimulus menarik, pertanyaan bertingkat, aktivitas hands-on, tempat jawaban.

C. EVALUASI
4-5 soal: 2 soal C1-C2, 2 soal C3-C4, 1 soal C5-C6 (jika sesuai kelas)

D. REFLEKSI
[ ] Paham konsep
[ ] Bisa beri contoh  
[ ] Indikator lain
Skor: _____/100

Konten spesifik ${topik}, praktis, mendorong berpikir kritis.`;

		const userInput = {
			mataPelajaran: mapel,
			kelas: `${kelas} (Semester ${semester})`,
			topik: topik,
			alokasiWaktu: waktu,
			modelPembelajaran: `${model} (${modelDetail.deskripsi})`,
			tujuanKhusus: tujuan || 'Buat tujuan pembelajaran yang sesuai'
		};

		return buildPrompt(systemContext, userInput, outputFormat);
	}

	async function handleGenerate(e) {
		e.preventDefault();
		if (!form.mapel || !form.topik) return;
		
		isGenerating = true;
		output = '';
		error = '';
		qualityScore = 0;
		rawData = null;
		
		if (generationMode === 'agentic') {
			await generateWithAgenticAI();
		} else {
			await generateWithSinglePrompt();
		}
	}
	
	/**
	 * Generate using Agentic AI System (multi-step with specialized agents)
	 */
	async function generateWithAgenticAI() {
		try {
			progress = {
				step: 0,
				total: 8,
				phase: 'starting',
				message: '🚀 Memulai sistem Agentic AI untuk LKPD...',
				status: 'running'
			};
			
			const orchestrator = new LKPDOrchestrator();
			
			const userInput = {
				judulLKPD: form.topik,
				mapel: form.mapel,
				kelas: form.kelas,
				semester: form.semester,
				jenjang: getJenjangFromKelas(form.kelas),
				alokasiWaktu: form.waktu,
				jenisKegiatan: form.jenisKegiatan,
				polaBelajar: form.polaBelajar,
				topikMateri: form.topik,
				deskripsiMateri: form.tujuan, // Bisa digunakan untuk deskripsi tambahan
				penulis: form.penulis || 'Guru Mata Pelajaran',
				instansi: form.instansi || form.sekolah || 'Sekolah',
				metode: form.model
			};
			
			const result = await orchestrator.generateLKPD(userInput, (progressData) => {
				progress = progressData;
			});
			
			if (result.success) {
				// Format output for display
				output = formatLKPDOutput(result.data);
				qualityScore = result.metadata.qualityScore;
				rawData = result.data;
				
				console.log('[LKPD] Generation complete - Images:', rawData?.images?.length || 0);
				if (rawData?.images?.length > 0) {
					console.log('[LKPD] First image preview:', {
						caption: rawData.images[0].caption,
						dataLength: rawData.images[0].data?.length,
						mimeType: rawData.images[0].mimeType
					});
				}
				
				progress = {
					...progress,
					status: 'completed',
					message: `✅ LKPD berhasil dibuat! (Quality Score: ${result.metadata.qualityScore}/100)`
				};

				// Dispatch event to update rate limit indicator
				window.dispatchEvent(new Event('generate-success'));
			} else {
				error = result.error;
				progress = {
					...progress,
					status: 'error',
					message: '❌ ' + result.error
				};
			}
		} catch (err) {
			error = 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.';
			console.error('Agentic AI error:', err);
			progress = {
				...progress,
				status: 'error',
				message: '❌ ' + err.message
			};
		} finally {
			isGenerating = false;
		}
	}
	
	/**
	 * Generate using single prompt (legacy mode)
	 */
	async function generateWithSinglePrompt() {
		try {
			const prompt = buildLKPDPrompt();
			const result = await callGeminiAPI(prompt, {
				maxRetries: 3,
				timeout: 45000
			});
			
			if (result.success) {
				output = result.data;
			} else {
				error = result.error;
			}
		} catch (err) {
			error = 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.';
			console.error('Generate error:', err);
		} finally {
			isGenerating = false;
		}
	}
	
	/**
	 * Format LKPD data to readable text
	 */
	function formatLKPDOutput(data) {
		let output = '';
		
		// Header & Identitas
		output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
		output += `   LEMBAR KERJA PESERTA DIDIK (LKPD)\n`;
		output += `   ${data.identitas?.judulLKPD || ''}\n`;
		output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
		
		// Identitas
		const id = data.identitas?.identitas;
		if (id) {
			output += `📋 IDENTITAS LKPD\n`;
			output += `Mata Pelajaran : ${id.mataPelajaran}\n`;
			output += `Kelas/Semester : ${id.kelas} / ${id.semester}\n`;
			output += `Fase           : ${id.fase}\n`;
			output += `Alokasi Waktu  : ${id.alokasiWaktu}\n`;
			if (form.sekolah) output += `Sekolah        : ${form.sekolah}\n`;
			output += `\nNama  : _____________________  No: _____  Tgl: _____\n\n`;
		}
		
		// Capaian Pembelajaran
		if (data.capaianPembelajaran) {
			output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
			output += `🎯 A. CAPAIAN PEMBELAJARAN\n`;
			output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
			output += `${data.capaianPembelajaran.capaianUtama}\n\n`;
		}
		
		// Tujuan Pembelajaran
		if (data.tujuanPembelajaran?.length > 0) {
			output += `📌 TUJUAN PEMBELAJARAN:\n`;
			data.tujuanPembelajaran.forEach((tp, i) => {
				output += `${i + 1}. ${tp.tujuan}\n`;
			});
			output += `\n`;
		}
		
		// Petunjuk Belajar
		if (data.petunjukBelajar) {
			output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
			output += `📖 B. PETUNJUK BELAJAR\n`;
			output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
			
			const pb = data.petunjukBelajar.petunjukUmum;
			if (pb) {
				output += `Pola Belajar: ${pb.polaBelajar}\n`;
				output += `Waktu: ${pb.waktuPengerjaan}\n\n`;
				output += `INSTRUKSI UMUM:\n`;
				pb.instruksiUmum?.forEach((instr, i) => {
					output += `${i + 1}. ${instr}\n`;
				});
				output += `\n`;
			}
			
			if (data.petunjukBelajar.petunjukKhusus?.length > 0) {
				output += `LANGKAH-LANGKAH:\n`;
				data.petunjukBelajar.petunjukKhusus.forEach((pk) => {
					output += `${pk.langkah}. ${pk.instruksi}\n`;
					if (pk.tips) output += `   💡 Tips: ${pk.tips}\n`;
				});
				output += `\n`;
			}
		}
		
		// Materi Pendukung
		if (data.materiPendukung) {
			output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
			output += `📚 C. MATERI PENDUKUNG\n`;
			output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
			
			// Add first image if available (main topic)
			if (data.images && data.images.length > 0 && data.images[0].position === 'main') {
				output += `\n📸 [Gambar: ${data.images[0].caption}]\n`;
				output += `${data.images[0].description}\n`;
				output += `[Image embedded - visible in .docx download]\n\n`;
			}
			
			const rm = data.materiPendukung.ringkasanMateri;
			if (rm?.konsepKunci) {
				output += `🔑 KONSEP KUNCI:\n\n`;
				rm.konsepKunci.forEach((kk, i) => {
					output += `${i + 1}. ${kk.nama}\n`;
					output += `   ${kk.definisi}\n`;
					if (kk.penjelasan) output += `   ${kk.penjelasan}\n`;
					output += `\n`;
					
					// Add concept image if available
					if (i === 0 && data.images) {
						const conceptImg = data.images.find(img => img.position === 'concept');
						if (conceptImg) {
							output += `\n📸 [Gambar: ${conceptImg.caption}]\n`;
							output += `${conceptImg.description}\n`;
							output += `[Image embedded - visible in .docx download]\n\n`;
						}
					}
				});
			}
			
			if (rm?.poinPenting) {
				output += `⭐ POIN PENTING:\n`;
				rm.poinPenting.forEach((pp, i) => {
					output += `• ${pp}\n`;
				});
				output += `\n`;
			}
		}
		
		// Langkah Kerja
		if (data.langkahKerja?.bagianUtama?.length > 0) {
			output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
			output += `✏️ D. LANGKAH KERJA & TUGAS\n`;
			output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
			
			// Add activity image if available
			if (data.images) {
				const activityImg = data.images.find(img => img.position === 'activity');
				if (activityImg) {
					output += `\n📸 [Gambar: ${activityImg.caption}]\n`;
					output += `${activityImg.description}\n`;
					output += `[Image embedded - visible in .docx download]\n\n`;
				}
			}
			
			data.langkahKerja.bagianUtama.forEach((bagian, idx) => {
				output += `${bagian.bagian}\n`;
				if (bagian.tujuanBagian) output += `Tujuan: ${bagian.tujuanBagian}\n\n`;
				
				bagian.langkahKerja?.forEach((lk) => {
					output += `${lk.nomor}. ${lk.instruksi}\n`;
					
					if (lk.pertanyaanPemandu?.length > 0) {
						output += `\n   PERTANYAAN:\n`;
						lk.pertanyaanPemandu.forEach((p, i) => {
							output += `   ${String.fromCharCode(97 + i)}. ${p}\n`;
						});
					}
					
					output += `\n   Jawaban:\n`;
					output += `   ${'_'.repeat(70)}\n`;
					output += `   ${'_'.repeat(70)}\n`;
					output += `   ${'_'.repeat(70)}\n\n`;
				});
				
				// Add worksheet image after first section if available
				if (idx === 0 && data.images) {
					const worksheetImg = data.images.find(img => img.position === 'worksheet');
					if (worksheetImg) {
						output += `\n📸 [Gambar: ${worksheetImg.caption}]\n`;
						output += `${worksheetImg.description}\n`;
						output += `[Image embedded - visible in .docx download]\n\n`;
					}
				}
				
				output += `\n`;
			});
		}
		
		// Evaluasi
		if (data.evaluasi?.soalEvaluasi?.length > 0) {
			output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
			output += `📊 E. EVALUASI\n`;
			output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
			
			data.evaluasi.soalEvaluasi.forEach((soal, i) => {
				output += `${i + 1}. ${soal.soal}\n`;
				output += `   (${soal.levelKognitif} - ${soal.skorMaksimal} poin)\n\n`;
				output += `   Jawaban:\n`;
				output += `   ${'_'.repeat(70)}\n`;
				output += `   ${'_'.repeat(70)}\n\n`;
			});
			
			output += `\nTotal Skor: _____ / ${data.evaluasi.totalSkor || 100}\n\n`;
		}
		
		// Refleksi
		if (data.refleksiDiri) {
			output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
			output += `💭 F. REFLEKSI DIRI\n`;
			output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
			
			data.refleksiDiri.pertanyaanRefleksi?.forEach((pr, i) => {
				output += `${i + 1}. ${pr}\n`;
				output += `   ${'_'.repeat(70)}\n\n`;
			});
		}
		
		// Quality Info
		if (data.validasi) {
			output += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
			output += `✅ VALIDASI KUALITAS LKPD\n`;
			output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
			output += `Kualitas Keseluruhan: ${data.validasi.kualitasKeseluruhan}/100\n\n`;
			
			if (data.validasi.syaratDidaktik) {
				output += `• Syarat Didaktik: ${data.validasi.syaratDidaktik.status} (${data.validasi.syaratDidaktik.score}/100)\n`;
			}
			if (data.validasi.syaratKonstruksi) {
				output += `• Syarat Konstruksi: ${data.validasi.syaratKonstruksi.status} (${data.validasi.syaratKonstruksi.score}/100)\n`;
			}
			if (data.validasi.syaratTeknis) {
				output += `• Syarat Teknis: ${data.validasi.syaratTeknis.status} (${data.validasi.syaratTeknis.score}/100)\n`;
			}
			
			if (data.validasi.rekomendasi?.length > 0) {
				output += `\nREKOMENDASI PERBAIKAN:\n`;
				data.validasi.rekomendasi.forEach((rek, i) => {
					output += `${i + 1}. ${rek}\n`;
				});
			}
		}
		
		output += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
		output += `Generated by LKPD Agentic AI System\n`;
		output += `${new Date().toLocaleString('id-ID')}\n`;
		output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
		
		return output;
	}
	
	function getJenjangFromKelas(kelas) {
		const kelasMap = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };
		const kelasNum = kelasMap[kelas] || 7;
		if (kelasNum >= 1 && kelasNum <= 6) return 'SD';
		if (kelasNum >= 7 && kelasNum <= 9) return 'SMP';
		return 'SMA';
	}

	async function copyOutput() {
		await navigator.clipboard.writeText(output);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	async function downloadDocx() {
		if (!output) return;
		
		isDownloading = true;
		try {
			const lkpdData = {
				judulModul: form.topik || 'LKPD',
				mapel: form.mapel,
				kelas: form.kelas,
				semester: form.semester,
				content: output,
				modulAjar: output,
				penulis: form.penulis || 'Guru Mata Pelajaran',
				instansi: form.instansi || form.sekolah || 'Sekolah',
				images: rawData?.images || [] // Include images if available
			};

			console.log('[Download LKPD DOCX] Images count:', lkpdData.images?.length);
			if (lkpdData.images?.length > 0) {
				console.log('[Download LKPD DOCX] First image data length:', lkpdData.images[0]?.data?.length);
			}

			const response = await fetch('/api/export-lkpd-docx', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ lkpdData })
			});

			if (!response.ok) {
				throw new Error('Gagal export dokumen');
			}

			// Download file
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			const filename = `LKPD_${form.mapel}_${form.topik}`.replace(/[^a-z0-9]/gi, '_');
			a.download = `${filename}.docx`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (err) {
			console.error('Download error:', err);
			alert('Gagal download dokumen. Silakan coba lagi.');
		} finally {
			isDownloading = false;
		}
	}
</script>

<svelte:head>
	<title>LKPD Generator — Asisten Guru AI</title>
</svelte:head>

<div class="p-6">
	<!-- Breadcrumb -->
	<div class="mb-4 flex items-center gap-2 text-sm text-gray-500">
		<a href="/dashboard" class="hover:text-emerald-600">Dashboard</a>
		<span>/</span>
		<span class="font-medium text-gray-800">LKPD Generator</span>
	</div>

	<!-- Page header -->
	<div class="mb-6 flex items-center gap-4">
		<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
			<svg class="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
				/>
			</svg>
		</div>
		<div>
			<h1 class="text-2xl font-bold text-gray-800">LKPD Generator</h1>
			<p class="text-sm text-gray-500">
				Buat Lembar Kerja Peserta Didik yang interaktif dan terstruktur
			</p>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
		<!-- Form -->
		<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
			<h2 class="mb-5 text-base font-semibold text-gray-700">Data LKPD</h2>
			<form onsubmit={handleGenerate} class="space-y-4">
				<!-- Mode Selection -->
				<div class="col-span-2 rounded-lg bg-emerald-50 p-3">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="mb-2 block text-sm font-medium text-emerald-900">Mode Generasi</label>
					<div class="flex gap-3">
						<label class="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border-2 {generationMode === 'agentic' ? 'border-emerald-500 bg-emerald-100' : 'border-gray-200 bg-white'} p-3 transition-all">
							<input type="radio" bind:group={generationMode} value="agentic" class="text-emerald-600" />
							<div>
								<div class="text-sm font-semibold text-gray-800">🤖 Agentic AI</div>
								<div class="text-xs text-gray-600">Multi-step, validasi kualitas</div>
							</div>
						</label>
						<label class="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border-2 {generationMode === 'single' ? 'border-emerald-500 bg-emerald-100' : 'border-gray-200 bg-white'} p-3 transition-all">
							<input type="radio" bind:group={generationMode} value="single" class="text-emerald-600" />
							<div>
								<div class="text-sm font-semibold text-gray-800">⚡ Single Prompt</div>
								<div class="text-xs text-gray-600">Cepat, sederhana</div>
							</div>
						</label>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="col-span-2">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Nama Sekolah</label>
						<input
							type="text"
							bind:value={form.sekolah}
							placeholder="cth: SMP Negeri 1 Jakarta"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
						/>
					</div>
					<div class="col-span-2">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Mata Pelajaran *</label>
						<input
							type="text"
							bind:value={form.mapel}
							placeholder="cth: IPA, Matematika, B. Indonesia..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
							required
						/>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Kelas</label>
						<select
							bind:value={form.kelas}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
						>
							{#each ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'] as k}
								<option value={k} selected={form.kelas === k}>{k}</option>
							{/each}
						</select>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Semester</label>
						<select
							bind:value={form.semester}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
						>
							<option value="1">Semester 1 (Ganjil)</option>
							<option value="2">Semester 2 (Genap)</option>
						</select>
					</div>
					<div class="col-span-2">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Topik / Materi *</label>
						<input
							type="text"
							bind:value={form.topik}
							placeholder="cth: Fotosintesis, Sistem Persamaan Linear..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
							required
						/>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Model Pembelajaran</label>
						<select
							bind:value={form.model}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
						>
							<option>Discovery Learning</option>
							<option>Problem Based Learning</option>
							<option>Project Based Learning</option>
							<option>Inquiry Learning</option>
						</select>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700">Alokasi Waktu</label>
						<select
							bind:value={form.waktu}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
						>
							<option>1x40 menit</option>
							<option>2x40 menit</option>
							<option>1x45 menit</option>
							<option>2x45 menit</option>
						</select>
					</div>
					<div class="col-span-2">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-sm font-medium text-gray-700"
							>Tujuan Pembelajaran <span class="text-gray-400">(opsional)</span></label
						>
						<textarea
							bind:value={form.tujuan}
							rows="3"
							placeholder="Kosongkan untuk dibuat otomatis..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
						></textarea>
					</div>
				</div>

				<button
					type="submit"
					disabled={isGenerating}
					class="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:bg-emerald-400"
				>
					{#if isGenerating}
						<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Sedang Membuat LKPD...
					{:else}
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
						Generate LKPD
					{/if}
				</button>
				
				<!-- Progress Tracker (Agentic Mode) -->
				{#if isGenerating && generationMode === 'agentic' && progress.status === 'running'}
					<div class="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
						<div class="mb-2 flex items-center justify-between text-sm">
							<span class="font-medium text-emerald-900">{progress.message}</span>
							<span class="text-emerald-700">{progress.step}/{progress.total}</span>
						</div>
						<div class="h-2 overflow-hidden rounded-full bg-emerald-200">
							<div
								class="h-full bg-emerald-500 transition-all duration-500"
								style="width: {(progress.step / progress.total) * 100}%"
							></div>
						</div>
						<div class="mt-2 text-xs text-emerald-700">
							{#if progress.phase === 'identitas'}
								📋 Menyusun identitas dan informasi umum...
							{:else if progress.phase === 'capaian-kompetensi'}
								🎯 Mengidentifikasi capaian pembelajaran...
							{:else if progress.phase === 'petunjuk-belajar'}
								📖 Membuat petunjuk kerja...
							{:else if progress.phase === 'materi-pendukung'}
								📚 Menyiapkan materi pendukung...
							{:else if progress.phase === 'langkah-kerja'}
								✏️ Merancang aktivitas dan tugas...
							{:else if progress.phase === 'evaluasi-refleksi'}
								📊 Membuat evaluasi dan refleksi...
							{:else if progress.phase === 'image-generation'}
								🎨 Membuat ilustrasi gambar AI...
							{:else if progress.phase === 'validation'}
								✅ Memvalidasi kualitas LKPD...
							{:else if progress.phase === 'compilation'}
								📦 Menyusun LKPD final...
							{/if}
						</div>
					</div>
				{/if}
			</form>
		</div>

		<!-- Output -->
		<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<h2 class="text-base font-semibold text-gray-700">Hasil Generate</h2>
					{#if qualityScore > 0 && generationMode === 'agentic'}
						<span class="rounded-full px-3 py-1 text-xs font-semibold {qualityScore >= 85 ? 'bg-emerald-100 text-emerald-700' : qualityScore >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}">
							Quality: {qualityScore}/100
						</span>
					{/if}
				</div>
				{#if output}
					<div class="flex items-center gap-2">
						<button
							onclick={copyOutput}
							class="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
						>
							{#if copied}
								<svg class="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								Tersalin!
							{:else}
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
								Salin Teks
							{/if}
						</button>
						<button
							onclick={downloadDocx}
							disabled={isDownloading}
							class="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:bg-emerald-400"
						>
							{#if isDownloading}
								<svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							{:else}
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
							{/if}
							Download .docx
						</button>
					</div>
				{/if}
			</div>

			{#if isGenerating}
				<div class="flex flex-col items-center justify-center py-20 text-gray-400">
					<svg class="mb-3 h-8 w-8 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<p class="text-sm">AI sedang menyusun LKPD...</p>
					<p class="mt-1 text-xs text-gray-400">Mohon tunggu 10-30 detik</p>
				</div>
			{:else if error}
				<div class="flex flex-col items-center justify-center rounded-xl bg-red-50 px-6 py-16 text-center">
					<svg class="mb-3 h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
					<p class="mb-2 font-medium text-red-800">Gagal Generate LKPD</p>
					<p class="text-sm text-red-600">{error}</p>
					<button
						onclick={() => { error = ''; handleGenerate(new Event('submit')); }}
						class="mt-4 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
					>
						Coba Lagi
					</button>
				</div>
			{:else if output}
				<div
					class="max-h-150 overflow-y-auto whitespace-pre-wrap rounded-xl bg-gray-50 p-5 font-mono text-xs leading-relaxed text-gray-700"
				>{@html renderOutputWithImages(output, rawData?.images)}</div>
				
				<!-- Display Generated Images -->
				{#if rawData?.images && rawData.images.length > 0}
					<div class="mt-6">
						<h3 class="mb-3 text-sm font-semibold text-gray-700">
							🎨 Ilustrasi AI Generated ({rawData.images.length} gambar)
						</h3>
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							{#each rawData.images as image, idx}
								<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
									<img 
										src="data:{image.mimeType};base64,{image.data}" 
										alt={image.caption || `Ilustrasi ${idx + 1}`}
										class="h-48 w-full object-cover"
									/>
									<div class="p-3">
										<p class="text-xs font-medium text-gray-700">{image.caption || image.description}</p>
										{#if image.description && image.description !== image.caption}
											<p class="mt-1 text-xs text-gray-500">{image.description}</p>
										{/if}
									</div>
								</div>
							{/each}
						</div>
						<p class="mt-3 text-xs text-gray-500">
							💡 Gambar-gambar ini akan disertakan saat download sebagai .docx
						</p>
					</div>
				{/if}
			{:else}
				<div class="flex flex-col items-center justify-center py-20 text-gray-300">
					<svg class="mb-3 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						/>
					</svg>
					<p class="text-sm">Hasil LKPD akan muncul di sini</p>
					<p class="mt-1 text-xs">Isi form dan klik Generate</p>
				</div>
			{/if}
		</div>
	</div>
</div>
