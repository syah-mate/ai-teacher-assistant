/**
 * Shared utility — kelasToFase mapping.
 * Digunakan oleh semua domain agent untuk mapping kelas ke fase Kurikulum Merdeka.
 */

const KELAS_TO_FASE = {
	I: 'Fase A', II: 'Fase A', III: 'Fase B', IV: 'Fase B', V: 'Fase C', VI: 'Fase C',
	VII: 'Fase D', VIII: 'Fase D', IX: 'Fase D', X: 'Fase E', XI: 'Fase F', XII: 'Fase F'
};

/**
 * @param {string} kelas - Kelas dalam angka romawi (I-XII)
 * @returns {string} Fase Kurikulum Merdeka
 */
export function kelasToFase(kelas) {
	return KELAS_TO_FASE[kelas] || '';
}

/**
 * Bangun identitas schema dari userInput (no AI call).
 * Semua field berasal dari form frontend.
 * @param {Object} input - userInput dari form
 * @returns {Object} identitas schema
 */
export function buildIdentitasFromInput(input) {
	const fase = input.fase || kelasToFase(input.kelas);

	return {
		judul: input.judul,
		identitas: {
			satuan: input.jenjang,
			fase,
			kelas: `Kelas ${input.kelas}`,
			mataPelajaran: input.mapel,
			penulis: input.penulis || 'Guru Mata Pelajaran',
			instansi: input.instansi || 'Sekolah'
		},
		durasiTotal: `${input.jumlahPertemuan || 1} pertemuan`,
		alokasiWaktu: input.alokasiPerPertemuan,
		deskripsiUmum: ''
	};
}
