import { browser, Menus } from 'webextension-polyfill-ts';

// parameter application must match /^\w+(\.\w+)*$/ for runtime.connectNative.
const port = browser.runtime.connectNative('google_translate_bridge');

function process({ frameId }: Menus.OnClickData) {
  const code = `(() => {
    const node = document.activeElement;
    return node && ['TEXTAREA', 'INPUT'].includes(node.nodeName) ?
            node.value.slice(node.selectionStart, node.selectionEnd) :
            window.getSelection().toString();
  })();`;

  browser.tabs.executeScript({ code, frameId }).then((result = []) => {
    result[0] &&
      port.postMessage({
        type: 'translate-text',
        data: result[0],
      });
  });
}

function createMenu() {
  browser.contextMenus.create({
    id: 'googletranslate',
    title: 'Google Translate',
    contexts: ['selection'],
    documentUrlPatterns: ['<all_urls>'], // limiting to supported schemes
    onclick: process,
  });
}

function removeMenu() {
  browser.contextMenus.remove('googletranslate');
}

port.onMessage.addListener(({ type }) => {
  if (type === 'connected') {
    createMenu();
  }
});

port.onDisconnect.addListener(removeMenu);
