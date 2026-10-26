import { randomBytes } from 'node:crypto';
import { database, transaction } from './db.js';
import { tokenHash, hashPassword } from './auth.js';
import { emailAddress, accountPassword, requireValue } from './validation.js';

export async function requestPasswordReset(body, sendResetEmail, waitUntil) {
  const email = emailAddress(body.email);
  requireValue(sendResetEmail, 'A recuperação por e-mail ainda não está configurada.', 503);
  const delivery = await transaction(async client => {
    await client.query("DELETE FROM password_resets WHERE created_at < now() - interval '24 hours'");
    const owner = (await client.query('SELECT id FROM users WHERE email = $1 FOR UPDATE', [email])).rows[0];
    if (!owner) return null;
    const count = await client.query("SELECT count(*)::integer AS total FROM password_resets WHERE owner_id = $1 AND created_at > now() - interval '1 hour'", [owner.id]);
    if (count.rows[0].total >= 3) return null;
    const token = randomBytes(32).toString('hex');
    await client.query('UPDATE password_resets SET consumed_at = now() WHERE owner_id = $1 AND consumed_at IS NULL', [owner.id]);
    await client.query('INSERT INTO password_resets (token_hash, owner_id) VALUES ($1,$2)', [tokenHash(token), owner.id]);
    return { email, token };
  });
  // shortcut: envio em memória pode se perder no reinício; adotar fila durável quando exigir entrega garantida.
  // A resposta não espera o provedor: existência da conta não é revelada pela latência de envio.
  if (delivery) {
    const sending = Promise.resolve().then(() => sendResetEmail(delivery)).catch(() => {
      console.error('Falha no envio de recuperação por e-mail; verifique o provedor.');
    });
    waitUntil?.(sending);
  }
  return { message: 'Se houver uma conta com esse e-mail, você receberá um link para redefinir a senha.' };
}

export async function resetPassword(body) {
  const password = accountPassword(body.password);
  const token = body.token;
  requireValue(typeof token === 'string' && /^[a-f0-9]{64}$/.test(token), 'Link inválido ou expirado. Solicite outro.');
  const hash = tokenHash(token);
  const valid = await database().query('SELECT owner_id FROM password_resets WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > now()', [hash]);
  requireValue(valid.rowCount, 'Link inválido ou expirado. Solicite outro.');
  const passwordHash = await hashPassword(password);
  await transaction(async client => {
    const owner = (await client.query(
      'SELECT u.id FROM users u JOIN password_resets r ON r.owner_id = u.id WHERE r.token_hash = $1 FOR UPDATE OF u', [hash])).rows[0];
    requireValue(owner, 'Link inválido ou expirado. Solicite outro.');
    const consumed = await client.query(
      'UPDATE password_resets SET consumed_at = now() WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > now() RETURNING owner_id', [hash]);
    requireValue(consumed.rowCount, 'Link inválido ou expirado. Solicite outro.');
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, owner.id]);
    await client.query('DELETE FROM sessions WHERE owner_id = $1', [owner.id]);
    await client.query('UPDATE password_resets SET consumed_at = now() WHERE owner_id = $1 AND consumed_at IS NULL', [owner.id]);
  });
  return { message: 'Senha da conta alterada. Entre novamente e use a mesma senha de conteúdo para desbloquear seus cadernos.' };
}
