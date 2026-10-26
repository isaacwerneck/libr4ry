import { emailAddress } from './validation.js';

export function recoveryMailer({ publicOrigin, key = process.env.RESEND_API_KEY, from = process.env.RECOVERY_FROM, send = fetch }) {
  if (!key && !from) return null;
  if (!key || !from || /[\r\n]/.test(from) || from.length > 320) throw new Error('Configure RESEND_API_KEY e RECOVERY_FROM para recuperação por e-mail.');
  emailAddress(/<([^<>]+)>$/.exec(from)?.[1] || from);
  const origin = new URL(publicOrigin || 'http://invalid');
  if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== publicOrigin || (origin.protocol !== 'https:' && !['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname))) {
    throw new Error('Configure PUBLIC_ORIGIN com HTTPS; HTTP é permitido somente no ensaio local.');
  }
  return async ({ email, token }) => {
    const response = await send('https://api.resend.com/emails', {
      method: 'POST', signal: AbortSignal.timeout(10000),
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from, to: [email], subject: 'Redefinir a senha da sua conta libr4ry',
        text: 'Use o link abaixo para redefinir a senha da conta. Ele vale por 30 minutos e só pode ser usado uma vez.\n\n'
          + publicOrigin + '/#reset=' + token
          + '\n\nA senha de conteúdo dos cadernos permanece a mesma. Se você não solicitou esta alteração, ignore este e-mail.',
      }),
    });
    if (!response.ok) throw new Error('EMAIL_DELIVERY_FAILED');
  };
}
