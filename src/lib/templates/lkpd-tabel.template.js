// Template LKPD Tabel — layout compact untuk dicetak
import { lkpdStandarTemplate } from './lkpd-standar.template.js';

export const lkpdTabelTemplate = {
	...lkpdStandarTemplate,
	templateId:  'lkpd-tabel',
	label:       'LKPD — Layout Tabel Compact',
	description: 'Semua section disajikan dalam format tabel yang compact dan padat. Cocok untuk dicetak dan dibagikan ke siswa.',
};
