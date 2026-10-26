import { createHash } from 'node:crypto';
import { database, transaction } from './db.js';
import { envelope, requireValue, revision, uuid } from './validation.js';

export async function listNotebooks(ownerId) {
  const result = await database().query(
    `SELECT id, keyset_id, wrapped_key, encrypted_metadata, revision, updated_at,
       EXISTS (SELECT 1 FROM shared_notebooks s WHERE s.notebook_id=notebooks.id) AS is_shared
     FROM notebooks WHERE owner_id = $1 ORDER BY updated_at DESC`, [ownerId]);
  return result.rows;
}

export async function readNotebook(ownerId, notebookId) {
  return transaction(async client => {
  await client.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const book = await client.query('SELECT * FROM notebooks WHERE id = $1 AND owner_id = $2',
    [uuid(notebookId), ownerId]);
  requireValue(book.rowCount, 'Caderno não encontrado.', 404);
  const pages = await client.query(
    `SELECT p.id, p.position, p.current_revision AS revision, v.encrypted_payload
     FROM pages p JOIN page_versions v ON v.page_id = p.id AND v.revision = p.current_revision
     WHERE p.notebook_id = $1 ORDER BY p.position`, [notebookId]);
  const tasks = await client.query('SELECT id, position, revision, encrypted_payload FROM tasks WHERE notebook_id = $1 ORDER BY position', [notebookId]);
  return { ...book.rows[0], pages: pages.rows, tasks: tasks.rows };
  });
}

export async function createNotebook(ownerId, body) {
  uuid(body.id);
  uuid(body.keysetId);
  uuid(body.page?.id);
  const metadata = envelope(body.metadata, 600000);
  const wrappedKey = envelope(body.wrappedKey);
  const pageContent = envelope(body.page.envelope);
  const requestHash = createHash('sha256').update(JSON.stringify({
    id: body.id, keysetId: body.keysetId, wrappedKey, metadata, page: { id: body.page.id, envelope: pageContent },
  })).digest('hex');
  return transaction(async client => {
    const keyset = await client.query('SELECT id FROM user_keysets WHERE id = $1 AND owner_id = $2', [body.keysetId, ownerId]);
    requireValue(keyset.rowCount, 'Chaves da conta não encontradas.', 404);
    const inserted = await client.query(
      `INSERT INTO notebooks (id, owner_id, keyset_id, wrapped_key, encrypted_metadata, revision)
       VALUES ($1, $2, $3, $4, $5, 1) ON CONFLICT (id) DO NOTHING RETURNING id`,
      [body.id, ownerId, body.keysetId, wrappedKey, metadata]);
    if (!inserted.rowCount) {
      const receipt = await client.query(
        `SELECT m.request_hash, m.result FROM notebook_mutations m JOIN notebooks n ON n.id=m.notebook_id
         WHERE n.id=$1 AND n.owner_id=$2 AND m.mutation_id=$1`, [body.id, ownerId]);
      requireValue(receipt.rowCount && receipt.rows[0].request_hash === requestHash,
        'Este identificador já foi usado por outra criação.', 409);
      return receipt.rows[0].result;
    }
    await client.query('INSERT INTO pages (id, notebook_id, position, current_revision) VALUES ($1, $2, 0, 1)', [body.page.id, body.id]);
    await client.query('INSERT INTO page_versions (page_id, revision, encrypted_payload) VALUES ($1, 1, $2)', [body.page.id, pageContent]);
    const result = { id: body.id, revision: 1, pageRevision: 1 };
    await client.query(
      'INSERT INTO notebook_mutations (notebook_id, mutation_id, request_hash, accepted_revision, result) VALUES ($1, $1, $2, 1, $3)',
      [body.id, requestHash, result]);
    return result;
  });
}

function validateItems(items, maximum, label) {
  requireValue(Array.isArray(items) && items.length <= maximum, `${label}: limite de ${maximum} itens por caderno.`);
  const ids = new Set();
  for (const item of items) {
    requireValue(item && typeof item === 'object' && !Array.isArray(item), `${label}: item inválido.`);
    uuid(item.id);
    requireValue(!ids.has(item.id), `${label}: identificador repetido.`);
    ids.add(item.id);
    revision(item.revision);
    if (item.envelope) envelope(item.envelope);
    requireValue(item.revision > 0 || item.envelope, `${label}: novo item precisa de conteúdo criptografado.`);
  }
}

async function savePages(client, notebookId, items) {
  const previous = await client.query('SELECT id, current_revision FROM pages WHERE notebook_id = $1', [notebookId]);
  const existing = new Map(previous.rows.map(row => [row.id, Number(row.current_revision)]));
  requireValue(previous.rows.every(row => items.some(item => item.id === row.id)), 'Não é permitido descartar páginas ao salvar.');
  const result = [];
  for (const [position, item] of items.entries()) {
    const current = existing.get(item.id) || 0;
    requireValue(current === item.revision, 'Esta página mudou em outra sessão. Preserve seu rascunho e recarregue.', 409);
    const next = item.envelope ? current + 1 : current;
    if (!current) {
      await client.query('INSERT INTO pages (id, notebook_id, position, current_revision) VALUES ($1, $2, $3, $4)', [item.id, notebookId, position, next]);
    } else {
      await client.query('UPDATE pages SET position = $1, current_revision = $2, updated_at = now() WHERE id = $3 AND notebook_id = $4',
        [position, next, item.id, notebookId]);
    }
    if (item.envelope) {
      await client.query('INSERT INTO page_versions (page_id, revision, encrypted_payload) VALUES ($1, $2, $3)',
        [item.id, next, envelope(item.envelope)]);
      await client.query(`DELETE FROM page_versions WHERE page_id = $1 AND revision IN (
        SELECT revision FROM page_versions WHERE page_id = $1 ORDER BY revision DESC OFFSET 50)`, [item.id]);
    }
    result.push({ id: item.id, revision: next });
  }
  return result;
}

async function saveTasks(client, notebookId, items) {
  const previous = await client.query('SELECT id, revision FROM tasks WHERE notebook_id = $1', [notebookId]);
  const existing = new Map(previous.rows.map(row => [row.id, Number(row.revision)]));
  requireValue(previous.rows.every(row => items.some(item => item.id === row.id)), 'Não é permitido descartar metas ao salvar.');
  const result = [];
  for (const [position, item] of items.entries()) {
    const current = existing.get(item.id) || 0;
    requireValue(current === item.revision, 'Esta meta mudou em outra sessão. Preserve seu rascunho e recarregue.', 409);
    const next = item.envelope ? current + 1 : current;
    if (!current) {
      await client.query('INSERT INTO tasks (id, notebook_id, position, revision, encrypted_payload) VALUES ($1, $2, $3, $4, $5)',
        [item.id, notebookId, position, next, envelope(item.envelope)]);
    } else {
      await client.query('UPDATE tasks SET position = $1, revision = $2, encrypted_payload = COALESCE($3, encrypted_payload) WHERE id = $4 AND notebook_id = $5',
        [position, next, item.envelope ? envelope(item.envelope) : null, item.id, notebookId]);
    }
    result.push({ id: item.id, revision: next });
  }
  return result;
}

export async function saveNotebook(ownerId, notebookId, body) {
  uuid(notebookId);
  uuid(body.mutationId);
  revision(body.revision);
  envelope(body.metadata, 600000);
  validateItems(body.pages, 500, 'Páginas');
  validateItems(body.tasks, 100, 'Metas');
  requireValue(body.pages.length > 0, 'O caderno precisa manter pelo menos uma página.');
  const requestHash = createHash('sha256').update(JSON.stringify(body)).digest('hex');
  return transaction(async client => {
    const notebook = await client.query('SELECT revision FROM notebooks WHERE id = $1 AND owner_id = $2 FOR UPDATE', [notebookId, ownerId]);
    requireValue(notebook.rowCount, 'Caderno não encontrado.', 404);
    const receipt = await client.query('SELECT request_hash, result FROM notebook_mutations WHERE notebook_id = $1 AND mutation_id = $2',
      [notebookId, body.mutationId]);
    if (receipt.rowCount) {
      requireValue(receipt.rows[0].request_hash === requestHash, 'Uma mutação confirmada não pode receber conteúdo diferente.', 409);
      return receipt.rows[0].result;
    }
    const shared = await client.query('SELECT 1 FROM shared_notebooks WHERE notebook_id=$1', [notebookId]);
    requireValue(!shared.rowCount, 'Este caderno usa colaboração. Reabra-o antes de continuar a edição.', 409);
    requireValue(Number(notebook.rows[0].revision) === body.revision, 'O caderno mudou em outra sessão. Seu rascunho continua neste dispositivo.', 409);
    const result = {
      revision: body.revision + 1,
      pages: await savePages(client, notebookId, body.pages),
      tasks: await saveTasks(client, notebookId, body.tasks),
    };
    await client.query('UPDATE notebooks SET revision = $1, encrypted_metadata = $2, updated_at = now() WHERE id = $3',
      [result.revision, envelope(body.metadata, 600000), notebookId]);
    await client.query('INSERT INTO notebook_mutations (notebook_id, mutation_id, request_hash, accepted_revision, result) VALUES ($1, $2, $3, $4, $5)',
      [notebookId, body.mutationId, requestHash, result.revision, result]);
    await client.query("DELETE FROM notebook_mutations WHERE notebook_id = $1 AND created_at < now() - interval '7 days'", [notebookId]);
    return result;
  });
}

export async function pageVersions(ownerId, pageId) {
  const result = await database().query(
    `SELECT v.revision, v.encrypted_payload, v.created_at, p.notebook_id FROM page_versions v
     JOIN pages p ON p.id = v.page_id JOIN notebooks n ON n.id = p.notebook_id
     WHERE p.id = $1 AND n.owner_id = $2 ORDER BY v.revision DESC LIMIT 50`, [uuid(pageId), ownerId]);
  requireValue(result.rowCount, 'Página não encontrada.', 404);
  return result.rows;
}
