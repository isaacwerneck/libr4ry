import { database, transaction } from './db.js';
import { HttpError, requireValue, uuid } from './validation.js';

export function moderatorIds(value) {
  if (!value) return new Set();
  return new Set(value.split(',').map(id => uuid(id.trim()).toLowerCase()));
}

export async function purgeResolvedReports() {
  const result = await database().query("DELETE FROM social_reports WHERE resolved_at < now() - interval '90 days'");
  return result.rowCount;
}

export async function moderation(user, method, url, body, moderators) {
  const path = url.pathname;
  if (method === 'POST' && path === '/api/social/reports') {
    uuid(body.id); uuid(body.post);
    requireValue(['abuse', 'spam', 'privacy', 'other'].includes(body.reason), 'Escolha um motivo válido.');
    requireValue(typeof body.details === 'string' && body.details.length <= 2000, 'Use até 2000 caracteres nos detalhes.');
    return transaction(async client => {
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 2))', [user.id]);
      const existing = await client.query('SELECT id, post_id FROM social_reports WHERE reporter_id = $1 AND (id = $2 OR post_id = $3)', [user.id, body.id, body.post]);
      if (existing.rowCount) {
        requireValue(existing.rows.every(row => row.post_id === body.post.toLowerCase()), 'Identificador já usado em outra denúncia.', 409);
        return { ok: true };
      }
      const count = await client.query("SELECT count(*)::int AS total FROM social_reports WHERE reporter_id = $1 AND created_at > now() - interval '1 minute'", [user.id]);
      requireValue(count.rows[0].total < 5, 'Muitas denúncias. Aguarde um minuto.', 429);
      const post = (await client.query(`SELECT p.id, p.title, p.content FROM social_posts p
        WHERE p.id = $1 AND p.owner_id <> $2 AND NOT EXISTS (SELECT 1 FROM social_blocks b WHERE
          (b.owner_id = $2 AND b.blocked_id = p.owner_id) OR (b.blocked_id = $2 AND b.owner_id = p.owner_id))
        FOR SHARE`, [body.post, user.id])).rows[0];
      requireValue(post, 'Publicação indisponível para denúncia.', 404);
      const inserted = await client.query(`INSERT INTO social_reports (id, reporter_id, post_id, post_title, post_content, reason, details)
        VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`, [body.id, user.id, post.id, post.title, post.content, body.reason, body.details.trim()]);
      requireValue(inserted.rowCount, 'Identificador indisponível. Atualize e tente novamente.', 409);
      return { ok: true };
    });
  }
  requireValue(moderators.has(user.id), 'Acesso restrito à moderação.', 403);
  await purgeResolvedReports();
  if (method === 'GET' && path === '/api/moderation/reports') {
    const result = await database().query(`SELECT id, post_id, post_title, post_content, reason, details, created_at
      FROM social_reports WHERE resolved_at IS NULL ORDER BY created_at, id LIMIT 50`);
    return { reports: result.rows };
  }
  if (method === 'POST' && path === '/api/moderation/reports/resolve') {
    uuid(body.id);
    requireValue(['dismiss', 'remove'].includes(body.action), 'Escolha uma resolução válida.');
    return transaction(async client => {
      const report = (await client.query('SELECT post_id, resolution FROM social_reports WHERE id = $1 FOR UPDATE', [body.id])).rows[0];
      requireValue(report, 'Denúncia não encontrada.', 404);
      if (report.resolution) return { ok: true };
      if (body.action === 'remove' && report.post_id) await client.query('DELETE FROM social_posts WHERE id = $1', [report.post_id]);
      await client.query('UPDATE social_reports SET resolved_at = now(), resolved_by = $2, resolution = $3 WHERE id = $1', [body.id, user.id, body.action]);
      return { ok: true };
    });
  }
  throw new HttpError(404, 'Operação de moderação não encontrada.');
}
