export function pauseForm(form) {
  const focused = form.contains(document.activeElement) ? document.activeElement : form.querySelector('[type=submit]');
  form.inert = true;
  return failed => {
    form.inert = false;
    if (failed && (document.activeElement === document.body || document.activeElement === form.closest('dialog'))) {
      focused?.focus({ preventScroll: true });
    }
  };
}
