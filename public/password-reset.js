import { pauseForm } from './form-focus.js';

export function setupPasswordReset({ api }) {
  const $ = id => document.getElementById('recovery-' + id);
  const dialog = $('dialog');
  const form = $('form');
  let token = null;
  let busy = false;
  let complete = false;
  function open(resetToken = null) {
    token = resetToken;
    complete = false;
    form.reset(); form.hidden = false;
    const resetting = token !== null;
    $('heading').textContent = resetting ? 'Nova senha da conta' : 'Recuperar acesso';
    $('email-field').hidden = resetting; $('email').disabled = resetting;
    $('password-fields').hidden = !resetting; $('password-fields').disabled = !resetting;
    $('submit').textContent = resetting ? 'Alterar senha' : 'Enviar link';
    $('close').textContent = 'Cancelar';
    $('retry').hidden = !resetting;
    $('status').textContent = '';
    if (!dialog.open) dialog.showModal();
    (resetting ? $('password') : $('email')).focus();
  }
  $('open').addEventListener('click', () => open());
  $('retry').addEventListener('click', () => { if (!busy) open(); });
  dialog.addEventListener('close', () => { token = null; form.reset(); });
  $('close').addEventListener('click', () => {
    if (complete) location.replace('/');
    else dialog.close();
  });
  dialog.addEventListener('cancel', event => { if (busy || complete) event.preventDefault(); });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    if (token !== null && $('password').value !== $('confirmation').value) {
      $('status').textContent = 'As senhas não coincidem.';
      $('confirmation').focus();
      return;
    }
    const resumeForm = pauseForm(form);
    let failed = false;
    busy = true; $('close').disabled = true; $('retry').disabled = true;
    $('status').textContent = token !== null ? 'Alterando senha…' : 'Solicitando link…';
    try {
      const result = token !== null
        ? await api('/api/password-reset/complete', { token, password: $('password').value })
        : await api('/api/password-reset/request', { email: $('email').value });
      $('status').textContent = result.message;
      if (token !== null) {
        token = null; complete = true; form.reset(); form.hidden = true;
        $('close').textContent = 'Entrar'; $('retry').hidden = true;
      }
    } catch (error) { failed = true; $('status').textContent = error.message; }
    finally { busy = false; $('close').disabled = false; $('retry').disabled = false; resumeForm(failed); }
  });
  api('/api/auth-options').then(value => { $('open').hidden = !value.recovery; }).catch(error => {
    document.getElementById('auth-error').textContent = 'Não foi possível verificar a recuperação de acesso. ' + error.message;
  });
  const requested = location.hash.startsWith('#reset=');
  if (requested) {
    const value = location.hash.slice(7);
    history.replaceState(null, '', location.pathname + location.search);
    if (/^[a-f0-9]{64}$/.test(value)) open(value);
    else { open(); $('status').textContent = 'Link inválido. Solicite outro e-mail de recuperação.'; }
  }
  return requested;
}
