import { Contact } from '../types/contact.ts';

export function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getAvatarColor(name: string): string {
  const colors = [
    'bg-sky-600 text-white',
    'bg-indigo-600 text-white',
    'bg-emerald-600 text-white',
    'bg-amber-600 text-white',
    'bg-violet-600 text-white',
    'bg-rose-600 text-white',
    'bg-teal-600 text-white',
    'bg-cyan-600 text-white',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function formatWhatsAppUrl(phone: string): string | null {
  if (!phone) return null;
  // Remove non-digit characters
  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  // If it's a Brazilian phone without country code (10 or 11 digits), prepend 55
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }
  return `https://wa.me/${digits}`;
}

export function exportToCSV(contacts: Contact[], filename = 'contatos_supabase.csv'): void {
  const headers = ['Nome', 'Email', 'Telefone', 'Empresa', 'Cargo', 'Categoria', 'Favorito', 'Endereco', 'Tags', 'Notas'];
  const rows = contacts.map(c => [
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.email || '').replace(/"/g, '""')}"`,
    `"${(c.phone || '').replace(/"/g, '""')}"`,
    `"${(c.company || '').replace(/"/g, '""')}"`,
    `"${(c.role || '').replace(/"/g, '""')}"`,
    `"${(c.category || '').replace(/"/g, '""')}"`,
    c.favorite ? 'Sim' : 'Não',
    `"${(c.address || '').replace(/"/g, '""')}"`,
    `"${(c.tags || []).join('; ').replace(/"/g, '""')}"`,
    `"${(c.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToVCard(contacts: Contact[], filename = 'contatos_agenda.vcf'): void {
  const vcards = contacts.map(c => {
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${c.name}`,
    ];
    if (c.email) lines.push(`EMAIL;TYPE=INTERNET:${c.email}`);
    if (c.phone) lines.push(`TEL;TYPE=CELL:${c.phone}`);
    if (c.company) lines.push(`ORG:${c.company}`);
    if (c.role) lines.push(`TITLE:${c.role}`);
    if (c.address) lines.push(`ADR;TYPE=WORK:;;${c.address};;;;`);
    if (c.notes) lines.push(`NOTE:${c.notes.replace(/\n/g, '\\n')}`);
    if (c.category) lines.push(`CATEGORIES:${c.category}`);
    lines.push('END:VCARD');
    return lines.join('\r\n');
  }).join('\r\n');

  const blob = new Blob([vcards], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseCSV(content: string): Partial<Contact>[] {
  const lines = content.split(/\r\n|\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const parseRow = (rowStr: string): string[] => {
    const result: string[] = [];
    let current = '';
    let insideQuotes = false;
    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      if (char === '"') {
        if (insideQuotes && rowStr[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const rawHeaders = parseRow(lines[0]).map(h => h.toLowerCase().replace(/["']/g, ''));
  const headerMap: Record<string, number> = {};

  rawHeaders.forEach((h, index) => {
    if (h.includes('nom') || h.includes('name')) headerMap.name = index;
    else if (h.includes('mail')) headerMap.email = index;
    else if (h.includes('tel') || h.includes('fon') || h.includes('cel') || h.includes('phone')) headerMap.phone = index;
    else if (h.includes('emp') || h.includes('comp')) headerMap.company = index;
    else if (h.includes('carg') || h.includes('fun') || h.includes('role')) headerMap.role = index;
    else if (h.includes('cat')) headerMap.category = index;
    else if (h.includes('fav')) headerMap.favorite = index;
    else if (h.includes('end') || h.includes('addr')) headerMap.address = index;
    else if (h.includes('tag')) headerMap.tags = index;
    else if (h.includes('not') || h.includes('obs')) headerMap.notes = index;
  });

  const parsedContacts: Partial<Contact>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    const name = headerMap.name !== undefined ? row[headerMap.name] : row[0];
    if (!name) continue;

    const email = headerMap.email !== undefined ? row[headerMap.email] : (row[1] || '');
    const phone = headerMap.phone !== undefined ? row[headerMap.phone] : (row[2] || '');
    const company = headerMap.company !== undefined ? row[headerMap.company] : (row[3] || '');
    const role = headerMap.role !== undefined ? row[headerMap.role] : (row[4] || '');
    const categoryRaw = headerMap.category !== undefined ? row[headerMap.category] : '';
    const favoriteRaw = headerMap.favorite !== undefined ? row[headerMap.favorite] : '';
    const address = headerMap.address !== undefined ? row[headerMap.address] : '';
    const tagsRaw = headerMap.tags !== undefined ? row[headerMap.tags] : '';
    const notes = headerMap.notes !== undefined ? row[headerMap.notes] : '';

    const validCategories = ['Trabalho', 'Pessoal', 'Cliente', 'Fornecedor', 'Parceiro', 'Outro'];
    const category = validCategories.includes(categoryRaw) ? categoryRaw as any : 'Trabalho';
    const favorite = favoriteRaw.toLowerCase() === 'sim' || favoriteRaw.toLowerCase() === 'true' || favoriteRaw === '1';
    const tags = tagsRaw ? tagsRaw.split(/[;,]/).map(t => t.trim()).filter(Boolean) : [];

    parsedContacts.push({
      name,
      email,
      phone,
      company,
      role,
      category,
      favorite,
      address,
      tags,
      notes,
    });
  }

  return parsedContacts;
}
