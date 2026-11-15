// Remembers which control opened a panel so focus can go back to it when the panel closes.
let opener = null;

export function rememberOpener() {
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
}

export function restoreFocus() {
  if (opener && document.contains(opener)) opener.focus();
  opener = null;
}
