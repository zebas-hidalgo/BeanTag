// Branded, accessible replacement for window.confirm / window.alert.
// Returns Promise<boolean>. Escape = cancel, Enter on focused button.
export function confirmDialog(message, { okText = 'Aceptar', cancelText = 'Cancelar', alertOnly = false } = {}) {
  return new Promise((resolve) => {
    const prevFocus = document.activeElement;
    const overlay = document.createElement('div');
    overlay.className = 'bt-dialog-overlay';

    const box = document.createElement('div');
    box.className = 'bt-dialog';
    box.setAttribute('role', alertOnly ? 'alertdialog' : 'dialog');
    box.setAttribute('aria-modal', 'true');

    const p = document.createElement('p');
    p.id = `bt-dialog-msg-${Date.now()}`;
    p.textContent = String(message ?? '');
    box.setAttribute('aria-describedby', p.id);

    const actions = document.createElement('div');
    actions.className = 'bt-dialog-actions';

    const close = (value) => {
      document.removeEventListener('keydown', onKey, true);
      overlay.remove();
      if (prevFocus && prevFocus.focus) prevFocus.focus();
      resolve(value);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(false); }
    };

    if (!alertOnly) {
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.textContent = cancelText;
      cancel.setAttribute('aria-label', cancelText);
      cancel.onclick = () => close(false);
      actions.appendChild(cancel);
    }
    const ok = document.createElement('button');
    ok.type = 'button';
    ok.className = 'bt-dialog-ok';
    ok.textContent = okText;
    ok.onclick = () => close(true);
    actions.appendChild(ok);

    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
    box.append(p, actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKey, true);
    ok.focus();
  });
}

export const alertDialog = (message) => confirmDialog(message, { alertOnly: true });
