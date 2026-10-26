import { database, transaction } from './db.js';
import { HttpError, requireValue, uuid } from './validation.js';

function text(value, maximum, label) {
  requireValue(typeof value === 'string' && value.trim().length > 0 && value.length <= maximum,
    label + ' inválido ou muito longo.');
  return value.trim();
}

const blocked = `NOT EXISTS (SELECT 1 FROM social_blocks b WHERE
  (b.owner_id = $1 AND b.blocked_id = u.id) OR (b.blocked_id = $1 AND b.owner_id = u.id))`;

async function pair(client, owner, other) {
  other = uuid(other).toLowerCase();
  requireValue(owner !== other, 'Escolha outra pessoa.');
  const ids = [owner, other].sort();
  await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [ids.join(':')]);
  const found = await client.query('SELECT id FROM users WHERE id = $1', [other]);
  requireValue(found.rowCount, 'Pessoa não encontrada.', 404);
  return ids;
}

async function canContact(client, owner, other) {
  const result = await client.query(`SELECT 1 FROM social_blocks WHERE
    (owner_id = $1 AND blocked_id = $2) OR (owner_id = $2 AND blocked_id = $1)`, [owner, other]);
  requireValue(!result.rowCount, 'Contato indisponível.', 403);
}

async function limit(client, owner, table, column, maximum, retryId) {
  await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 1))', [owner]);
  const result = await client.query(`SELECT count(*)::int AS total FROM ${table}
    WHERE ${column} = $1 AND created_at > now() - interval '1 minute'`, [owner]);
  if (result.rows[0].total < maximum) return;
  // Reenvio confirmado não consome uma nova operação, mesmo na cota.
  const receipt = retryId && await client.query(`SELECT 1 FROM ${table} WHERE id = $1 AND ${column} = $2`, [retryId, owner]);
  requireValue(receipt?.rowCount, 'Muitas operações. Aguarde um minuto.', 429);
}

export async function social(user, method, url, body) {
  const owner = user.id;
  const path = url.pathname;
  if (method === 'GET' && path === '/api/social/posts') {
    const before = url.searchParams.get('before');
    if (before) uuid(before);
    const result = await database().query(`SELECT p.id, p.owner_id, u.display_name, p.title, p.content, p.created_at
      FROM social_posts p JOIN users u ON u.id = p.owner_id WHERE ${blocked}
      AND ($2::uuid IS NULL OR (p.created_at, p.id) <
        (SELECT created_at, id FROM social_posts WHERE id = $2))
      ORDER BY p.created_at DESC, p.id DESC LIMIT 21`, [owner, before]);
    return { posts: result.rows.slice(0, 20), more: result.rows.length > 20 };
  }
  if (method === 'POST' && path === '/api/social/posts') {
    uuid(body.id);
    const title = text(body.title, 120, 'Título');
    const content = text(body.content, 12000, 'Publicação');
    return transaction(async client => {
      await limit(client, owner, 'social_posts', 'owner_id', 5, body.id);
      const result = await client.query(`INSERT INTO social_posts (id, owner_id, title, content) VALUES ($1,$2,$3,$4)
        ON CONFLICT (id) DO UPDATE SET title = social_posts.title
        WHERE social_posts.owner_id = EXCLUDED.owner_id AND social_posts.title = EXCLUDED.title
          AND social_posts.content = EXCLUDED.content RETURNING id`, [body.id, owner, title, content]);
      requireValue(result.rowCount, 'Identificador já utilizado por outra publicação.', 409);
      return { ok: true };
    });
  }
  if (method === 'POST' && path === '/api/social/posts/remove') {
    const result = await database().query('DELETE FROM social_posts WHERE id = $1 AND owner_id = $2 RETURNING id', [uuid(body.id), owner]);
    requireValue(result.rowCount, 'Publicação não encontrada.', 404);
    return { ok: true };
  }
  if (method === 'GET' && path === '/api/social/people') {
    const query = (url.searchParams.get('q') || '').trim();
    requireValue(query.length >= 2 && query.length <= 60, 'Digite de 2 a 60 caracteres.');
    const result = await database().query(`SELECT u.id, u.display_name, f.accepted, f.requester_id
      FROM users u LEFT JOIN friendships f ON f.first_id = LEAST($1::uuid,u.id) AND f.second_id = GREATEST($1::uuid,u.id)
      WHERE u.id <> $1 AND position(lower($2) in lower(u.display_name)) > 0 AND ${blocked}
      ORDER BY lower(u.display_name), u.id LIMIT 30`, [owner, query]);
    return { people: result.rows };
  }
  if (method === 'GET' && path === '/api/social/friends') {
    const result = await database().query(`SELECT u.id, u.display_name, f.accepted, f.requester_id
      FROM friendships f JOIN users u ON u.id = CASE WHEN f.first_id = $1 THEN f.second_id ELSE f.first_id END
      WHERE (f.first_id = $1 OR f.second_id = $1) AND ${blocked}
      ORDER BY f.accepted, lower(u.display_name), u.id`, [owner]);
    const blocks = await database().query(`SELECT u.id, u.display_name FROM social_blocks b
      JOIN users u ON u.id = b.blocked_id WHERE b.owner_id = $1 ORDER BY lower(u.display_name)`, [owner]);
    return { friends: result.rows, blocks: blocks.rows };
  }
  if (method === 'POST' && path === '/api/social/friends') {
    requireValue(['invite', 'accept', 'remove', 'block', 'unblock'].includes(body.action), 'Ação inválida.');
    return transaction(async client => {
      const ids = await pair(client, owner, body.id);
      if (body.action === 'block') {
        await client.query('INSERT INTO social_blocks VALUES ($1,$2) ON CONFLICT DO NOTHING', [owner, body.id]);
        await client.query('DELETE FROM friendships WHERE first_id = $1 AND second_id = $2', ids);
      } else if (body.action === 'unblock') {
        await client.query('DELETE FROM social_blocks WHERE owner_id = $1 AND blocked_id = $2', [owner, body.id]);
      } else {
        await canContact(client, owner, body.id);
        if (body.action === 'invite') {
          await limit(client, owner, 'friendships', 'requester_id', 15);
          await client.query(`INSERT INTO friendships (first_id, second_id, requester_id) VALUES ($1,$2,$3)
            ON CONFLICT DO NOTHING`, [...ids, owner]);
        } else if (body.action === 'accept') {
          const result = await client.query(`UPDATE friendships SET accepted = true WHERE first_id = $1
            AND second_id = $2 AND requester_id <> $3 RETURNING first_id`, [...ids, owner]);
          requireValue(result.rowCount, 'Convite recebido não encontrado.', 404);
        } else {
          await client.query('DELETE FROM friendships WHERE first_id = $1 AND second_id = $2', ids);
        }
      }
      return { ok: true };
    });
  }
  if (path === '/api/social/messages' && ['GET', 'POST'].includes(method)) {
    const other = method === 'GET' ? url.searchParams.get('person') : body.person;
    return transaction(async client => {
      const ids = await pair(client, owner, other);
      await canContact(client, owner, other);
      const friendship = await client.query('SELECT 1 FROM friendships WHERE first_id = $1 AND second_id = $2 AND accepted', ids);
      requireValue(friendship.rowCount, 'Aceitem a amizade antes de conversar.', 403);
      if (method === 'POST') {
        const content = text(body.content, 4000, 'Mensagem');
        uuid(body.id);
        await limit(client, owner, 'social_messages', 'sender_id', 30, body.id);
        const result = await client.query(`INSERT INTO social_messages (id, sender_id, recipient_id, content)
          VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO UPDATE SET content = social_messages.content
          WHERE social_messages.sender_id = EXCLUDED.sender_id AND social_messages.recipient_id = EXCLUDED.recipient_id
            AND social_messages.content = EXCLUDED.content RETURNING id`, [body.id, owner, other, content]);
        requireValue(result.rowCount, 'Identificador já utilizado por outra mensagem.', 409);
        return { ok: true };
      }
      const before = url.searchParams.get('before');
      if (before) uuid(before);
      const result = await client.query(`SELECT id, sender_id, content, created_at FROM social_messages
        WHERE LEAST(sender_id,recipient_id) = $1 AND GREATEST(sender_id,recipient_id) = $2
        AND ($3::uuid IS NULL OR (created_at,id) < (SELECT created_at,id FROM social_messages
          WHERE id = $3 AND LEAST(sender_id,recipient_id) = $1 AND GREATEST(sender_id,recipient_id) = $2))
        ORDER BY created_at DESC,id DESC LIMIT 51`, [...ids, before]);
      return { messages: result.rows.slice(0, 50).reverse(), more: result.rows.length > 50 };
    });
  }
  throw new HttpError(404, 'Operação social não encontrada.');
}
