<script>
import { Orchestrator } from '$lib/agents/orchestrator.js';
import { formatSchemaToText } from '$lib/utils/schema-formatter.js';
import AgentConsole from '$lib/components/AgentConsole.svelte';

let form = $state({
sekolah: '',
mapel: '',
kelas: 'VII',
semester: '1',
topik: '',
tujuan: '',
model: 'Discovery Learning',
waktu: '2x40 menit',
jenisKegiatan: 'pembelajaran umum',
polaBelajar: 'berkelompok',
penulis: '',
instansi: ''
});

let isGenerating = $state(false);
let output = $state('');
let error = $state('');

// Progress tracking for agentic mode
let progress = $state({
step: 0,
total: 6,
phase: '',
message: '',
status: 'idle' // idle, running, completed, error
});

let qualityScore = $state(0);
let rawData = $state(null);
let agentLogs = $state([]);

const kelasList = [
{ val: 'I', fase: 'Fase A' },
{ val: 'II', fase: 'Fase A' },
{ val: 'III', fase: 'Fase B' },
{ val: 'IV', fase: 'Fase B' },
{ val: 'V', fase: 'Fase C' },
{ val: 'VI', fase: 'Fase C' },
{ val: 'VII', fase: 'Fase D' },
{ val: 'VIII', fase: 'Fase D' },
{ val: 'IX', fase: 'Fase D' },
{ val: 'X', fase: 'Fase E' },
{ val: 'XI', fase: 'Fase F' },
{ val: 'XII', fase: 'Fase F' }
];

async function handleGenerate(e) {
e.preventDefault();
if (!form.mapel || !form.topik) return;

isGenerating = true;
output = '';
error = '';
qualityScore = 0;
rawData = null;
agentLogs = [];

await generateWithAgenticAI();
}

async function generateWithAgenticAI() {
try {
progress = {
step: 0,
total: 6,
phase: 'starting',
message: 'Memulai sistem Agentic AI untuk LKPD...',
status: 'running'
};

const orchestrator = new Orchestrator();

const userInput = {
jenis: 'lkpd',
judul: form.topik,
mapel: form.mapel,
kelas: form.kelas,
semester: form.semester,
jenjang: getJenjangFromKelas(form.kelas),
alokasiWaktu: form.waktu,
jenisKegiatan: form.jenisKegiatan,
polaBelajar: form.polaBelajar,
topikMateri: form.topik,
deskripsiMateri: form.tujuan,
penulis: form.penulis || 'Guru Mata Pelajaran',
instansi: form.instansi || form.sekolah || 'Sekolah',
metode: form.model
};

const result = await orchestrator.generate(userInput, (progressData) => {
progress = {
...progress,
phase: progressData.phase || progressData.action || '',
message: progressData.message || '',
status: progressData.action === 'completed' ? 'completed' : 'running'
};
agentLogs = [...agentLogs, { ...progressData, timestamp: new Date() }];
});

if (result.success) {
const formattedOutput = formatSchemaToText('lkpd', result.schema);
output = formattedOutput;
qualityScore = result.qualityScore || 0;
rawData = result.schema;

// Store in-memory on window to avoid localStorage quota limits
window.__lkpdHasil = {
output: formattedOutput,
schema: result.schema,
images: result.images || [],
topik: form.topik,
mapel: form.mapel,
kelas: form.kelas,
semester: form.semester,
sekolah: form.sekolah,
penulis: form.penulis || 'Guru Mata Pelajaran',
instansi: form.instansi || form.sekolah || 'Sekolah',
qualityScore: result.qualityScore || 0
};
window.open('/dashboard/lkpd/hasil', '_blank');

// Dispatch event to update rate limit indicator
window.dispatchEvent(new Event('generate-success'));
} else {
error = result.error;
progress = {
...progress,
status: 'error',
message: 'Gagal: ' + result.error
};
}
} catch (err) {
error = 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.';
console.error('Agentic AI error:', err);
progress = {
...progress,
status: 'error',
message: 'Error: ' + err.message
};
} finally {
isGenerating = false;
}
}

function getJenjangFromKelas(kelas) {
const kelasMap = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };
const kelasNum = kelasMap[kelas] || 7;
if (kelasNum >= 1 && kelasNum <= 6) return 'SD';
if (kelasNum >= 7 && kelasNum <= 9) return 'SMP';
return 'SMA';
}
</script>

<svelte:head>
<title>LKPD Generator - Asisten Guru AI</title>
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

<!-- Feature Banner -->
<div class="mb-6 rounded-xl border-2 border-emerald-200 bg-linear-to-r from-emerald-50 to-teal-50 p-4">
<div class="flex items-start gap-3">
<div class="shrink-0">
<svg class="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
</svg>
</div>
<div class="flex-1">
<h3 class="mb-1 font-semibold text-emerald-900">Export ke Word & PDF</h3>
<p class="text-sm text-emerald-700">
LKPD yang dihasilkan dapat di-download sebagai file <strong>.docx</strong> atau <strong>PDF</strong> dengan format dokumen yang rapi dan profesional. Siap untuk dicetak atau diserahkan!
</p>
</div>
</div>
</div>

<div class="mx-auto max-w-3xl">
<!-- Form -->
<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
<h2 class="mb-5 text-base font-semibold text-gray-700">Data LKPD</h2>
<form onsubmit={handleGenerate} class="space-y-4">
<div class="grid grid-cols-2 gap-4">
<div class="col-span-2">
<label for="sekolah-input" class="mb-1 block text-sm font-medium text-gray-700">Nama Sekolah</label>
<input
id="sekolah-input"
type="text"
bind:value={form.sekolah}
placeholder="cth: SMP Negeri 1 Jakarta"
class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
/>
</div>
<div class="col-span-2">
<label for="mapel-input" class="mb-1 block text-sm font-medium text-gray-700">Mata Pelajaran *</label>
<input
id="mapel-input"
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
{#each kelasList as k}
<option value={k.val} selected={form.kelas === k.val}>{k.val}</option>
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
<label for="topik-input" class="mb-1 block text-sm font-medium text-gray-700">Topik / Materi *</label>
<input
id="topik-input"
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
<div>
<!-- svelte-ignore a11y_label_has_associated_control -->
<label class="mb-1 block text-sm font-medium text-gray-700">Jenis Kegiatan</label>
<select
bind:value={form.jenisKegiatan}
class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
>
<option value="pembelajaran umum">Pembelajaran Umum</option>
<option value="eksperimen">Eksperimen</option>
<option value="observasi">Observasi</option>
<option value="diskusi">Diskusi</option>
<option value="latihan">Latihan Soal</option>
</select>
</div>
<div>
<!-- svelte-ignore a11y_label_has_associated_control -->
<label class="mb-1 block text-sm font-medium text-gray-700">Pola Belajar</label>
<select
bind:value={form.polaBelajar}
class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
>
<option value="berkelompok">Berkelompok</option>
<option value="individu">Individu</option>
<option value="berpasangan">Berpasangan</option>
</select>
</div>
<div>
<!-- svelte-ignore a11y_label_has_associated_control -->
<label class="mb-1 block text-sm font-medium text-gray-700">Nama Penulis <span class="text-gray-400">(opsional)</span></label>
<input
type="text"
bind:value={form.penulis}
placeholder="Nama guru / penulis"
class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
/>
</div>
<div>
<!-- svelte-ignore a11y_label_has_associated_control -->
<label class="mb-1 block text-sm font-medium text-gray-700">Instansi <span class="text-gray-400">(opsional)</span></label>
<input
type="text"
bind:value={form.instansi}
placeholder="Nama instansi / sekolah"
class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
/>
</div>
<div class="col-span-2">
<!-- svelte-ignore a11y_label_has_associated_control -->
<label class="mb-1 block text-sm font-medium text-gray-700">
Tujuan Pembelajaran <span class="text-gray-400">(opsional)</span>
</label>
<textarea
bind:value={form.tujuan}
rows="3"
placeholder="Kosongkan untuk dibuat otomatis..."
class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
></textarea>
</div>
</div>

<!-- Progress Indicator -->
{#if isGenerating && progress.status === 'running'}
<div class="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4">
<div class="mb-2 flex items-center justify-between text-sm">
<span class="font-semibold text-emerald-900">{progress.message}</span>
<span class="text-emerald-700">{progress.step}/{progress.total}</span>
</div>
<div class="h-2 w-full overflow-hidden rounded-full bg-emerald-200">
<div
class="h-full bg-emerald-600 transition-all duration-500"
style="width: {(progress.step / progress.total) * 100}%"
></div>
</div>
<div class="mt-2 flex items-center gap-2 text-xs text-emerald-700">
<svg class="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
</svg>
<span>Phase: {progress.phase || 'processing'}</span>
</div>
</div>
{/if}

<button
type="submit"
disabled={isGenerating}
class="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:bg-emerald-400"
>
{#if isGenerating}
<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
</svg>
Sedang Membuat LKPD...
{:else}
<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
</svg>
Generate LKPD
{/if}
</button>
</form>

<!-- Error alert -->
{#if error}
<div class="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
<svg class="mt-0.5 h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
</svg>
<div class="flex-1">
<p class="font-medium text-red-800">Gagal Generate</p>
<p class="mt-0.5 text-sm text-red-600">{error}</p>
</div>
<!-- svelte-ignore a11y_consider_explicit_label -->
<button onclick={() => (error = '')} class="text-red-400 hover:text-red-600">
<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
</svg>
</button>
</div>
{/if}

<!-- Success notification -->
{#if output && !isGenerating}
<div class="mt-4 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
<svg class="h-5 w-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
<div class="flex-1">
<p class="font-medium text-green-800">LKPD berhasil dibuat!</p>
<p class="mt-0.5 text-sm text-green-600">Dokumen sudah terbuka di tab baru. Jika belum terbuka, klik tombol di samping.</p>
</div>
<button
onclick={() => window.open('/dashboard/lkpd/hasil', '_blank')}
class="shrink-0 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
>
Buka Hasil
</button>
</div>

{/if}
</div>

<!-- Agent Console Monitor -->
<AgentConsole logs={agentLogs} isVisible={agentLogs.length > 0} />
</div>
</div>
