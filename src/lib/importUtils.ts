export type ImportType = 'membres' | 'terrains' | 'logements';

export interface RowResult {
  prenom: string;
  nom: string;
  extra: [string, string]; // 2 extra fields depending on type
  errors: string[];
}

function splitLine(line: string): string[] {
  const sep = line.includes(';') ? ';' : line.includes('\t') ? '\t' : ',';
  return line.split(sep).map(c => c.trim().replace(/^["']|["']$/g, ''));
}

function isHeaderRow(row: string[]): boolean {
  return row.some(c => /^(prenom|prénom|nom|type|date|nb|nbre)/i.test(c));
}

export function parseRows(text: string): string[][] {
  return text.split('\n').map(l => l.trim()).filter(Boolean).map(splitLine);
}

export const TEMPLATES: Record<ImportType, { header: string; example: string }> = {
  membres: {
    header:  'prenom,nom,telephone,email',
    example: 'Ibrahima,DIALLO,77 123 4567,ibrahima@exemple.com\nFatou,FALL,78 234 5678,',
  },
  terrains: {
    header:  'prenom,nom,nb_terrains,date_souscription',
    example: 'Ibrahima,DIALLO,2,2024-07-15\nFatou,FALL,1,2024-08-01',
  },
  logements: {
    header:  'prenom,nom,type_villa,date_souscription',
    example: 'Ibrahima,DIALLO,F2,2024-07-15\nFatou,FALL,F3,2024-08-01\nMoussa,SOW,TF,2024-09-01',
  },
};

export const COL_HEADERS: Record<ImportType, [string, string, string, string]> = {
  membres:   ['Prénom', 'Nom', 'Téléphone', 'Email'],
  terrains:  ['Prénom', 'Nom', 'Nb parcelles', 'Date'],
  logements: ['Prénom', 'Nom', 'Type villa', 'Date'],
};

const today = () => new Date().toISOString().slice(0, 10);

export function parseImport(text: string, type: ImportType): RowResult[] {
  const all = parseRows(text);
  if (all.length === 0) return [];
  const start = isHeaderRow(all[0]) ? 1 : 0;

  return all.slice(start).map(cells => {
    const prenom = (cells[0] ?? '').trim();
    const nom    = (cells[1] ?? '').trim().toUpperCase();
    const errors: string[] = [];
    if (!prenom) errors.push('Prénom manquant');
    if (!nom)    errors.push('Nom manquant');

    if (type === 'membres') {
      return { prenom, nom, extra: [cells[2]?.trim() ?? '', cells[3]?.trim() ?? ''], errors };
    }

    if (type === 'terrains') {
      const nb = parseInt(cells[2] ?? '', 10);
      if (isNaN(nb) || nb < 1) errors.push('Nombre de terrains invalide (entier ≥ 1)');
      const date = cells[3]?.trim() || today();
      return { prenom, nom, extra: [String(isNaN(nb) ? '' : nb), date], errors };
    }

    // logements
    const raw = (cells[2] ?? '').trim().toUpperCase();
    const validTypes = ['F2', 'F3', 'TF', 'TERRAIN'];
    if (!validTypes.includes(raw)) errors.push('Type invalide — utiliser F2, F3 ou TF');
    const date = cells[3]?.trim() || today();
    return { prenom, nom, extra: [raw || '', date], errors };
  });
}
