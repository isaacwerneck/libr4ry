const shelfKey = name => name.normalize('NFC').toLocaleLowerCase('pt-BR');

export function organization(value = {}) {
  const names = value?.shelves ?? [];
  if (!Array.isArray(names) || names.length > 12) throw new Error('Use até 12 estantes por caderno.');
  const shelves = [];
  for (const name of names) {
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 60 || /[,\r\n]/.test(name)) {
      throw new Error('Cada estante precisa de um nome de até 60 caracteres, sem vírgulas ou quebras de linha.');
    }
    const normalized = name.trim().normalize('NFC');
    if (!shelves.some(shelf => shelfKey(shelf) === shelfKey(normalized))) shelves.push(normalized);
  }
  return { shelves, favorite: value?.favorite === true };
}

export function collectionShelves(books) {
  const shelves = new Map();
  for (const book of books) for (const name of organization(book.organization).shelves) {
    const key = shelfKey(name);
    const shelf = shelves.get(key) || { key, name, count: 0 };
    shelf.count++;
    shelves.set(key, shelf);
  }
  return [...shelves.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export function collectionBooks(books, filter = 'all', query = '') {
  const text = query.trim().toLocaleLowerCase('pt-BR');
  const result = books.filter(book => {
    const value = organization(book.organization);
    if (filter === 'favorites' && !value.favorite) return false;
    if (filter.startsWith('shelf:') && !value.shelves.some(name => shelfKey(name) === filter.slice(6))) return false;
    return !text || [book.title, book.subject, ...book.tags, ...value.shelves]
      .some(value => value.toLocaleLowerCase('pt-BR').includes(text));
  });
  // shortcut: recentes usam a última posição registrada, sem inventar histórico anterior à captura.
  return filter === 'recent' ? result.sort((a, b) => (b.position?.at || 0) - (a.position?.at || 0)) : result;
}
