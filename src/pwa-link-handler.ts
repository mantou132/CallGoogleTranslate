/**
 * PWA Link Handler
 *
 * This content script hijacks link opening behaviors in PWA mode
 * and sends them to the background script via IPC.
 */

import { runtime } from 'webextension-polyfill';

// Only activate in PWA mode
if (window.matchMedia('not (display-mode: browser)').matches) {
  // Store original window.open
  const originalWindowOpen = window.open;

  // Hijack window.open
  window.open = function(url?: string | URL, target?: string, features?: string): Window | null {
    if (url && target === '_blank') {
      const urlString = url.toString();
      // Send IPC message to background
      runtime.sendMessage({
        type: 'open-url',
        data: urlString,
      });
      return null;
    }
    return originalWindowOpen.call(window, url, target, features);
  };

  // Hijack <a> tag clicks
  document.addEventListener(
    'click',
    (event: MouseEvent) => {
      // Find the closest anchor element
      let target = event.target as HTMLElement | null;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }

      if (target instanceof HTMLAnchorElement) {
        const href = target.href;
        if (href && target.target === '_blank') {
          // Prevent default behavior
          event.preventDefault();
          event.stopPropagation();

          // Send IPC message to background
          runtime.sendMessage({
            type: 'open-url',
            data: href,
          });
        }
      }
    },
    true,
  ); // Use capture phase to ensure we get the event first

  console.log('[PWA Link Handler] Activated in PWA mode');
}
