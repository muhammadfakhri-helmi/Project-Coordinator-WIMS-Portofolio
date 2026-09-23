// Enlarge a sanitized screenshot in a native <dialog>.
export function initViewer() {
  const dialog = document.querySelector('[data-viewer]');
  const img = dialog.querySelector('[data-viewer-img]');
  const cap = dialog.querySelector('[data-viewer-caption]');
  let opener = null;

  document.querySelectorAll('[data-zoom]').forEach((btn) => {
    const source = btn.querySelector('img');
    btn.setAttribute('aria-label', `Enlarge screenshot: ${source.alt}`);
    btn.addEventListener('click', () => {
      opener = btn;
      img.src = source.currentSrc || source.src;
      img.alt = source.alt;
      cap.textContent = btn.closest('figure')?.querySelector('figcaption')?.textContent ?? '';
      dialog.showModal();
    });
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => opener?.focus());
}
