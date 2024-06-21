import { runtime, scripting, Runtime, contextMenus, tabs } from 'webextension-polyfill';

class PortManager {
  connected = false;
  port: Runtime.Port;

  start = () => {
    // parameter application must match /^\w+(\.\w+)*$/ for runtime.connectNative.
    this.port = runtime.connectNative('google_translate_bridge');

    this.port.onMessage.addListener(({ type }) => {
      if (type === 'connected') {
        console.log('connected');
        this.createMenu();
      }
    });

    this.port.onDisconnect.addListener(() => {
      console.log('disconnect, will try again later');
      this.removeMenu();
      setTimeout(() => {
        this.start();
        console.log('retrying');
      }, 1_000);
    });
  };

  createMenu = () => {
    this.connected = true;
    contextMenus.create({
      id: 'googletranslate',
      title: 'Google Translate',
      contexts: ['selection'],
      documentUrlPatterns: ['<all_urls>'], // limiting to supported schemes
    });
  };

  removeMenu = () => {
    this.connected = false;
    contextMenus.remove('googletranslate');
  };
}

const portManager = new PortManager();
portManager.start();

contextMenus.onClicked.addListener(async function(info) {
  switch (info.menuItemId) {
    case 'googletranslate':
      const [tab] = await tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) break;
      scripting
        .executeScript({
          target: { frameIds: info.frameId ? [info.frameId] : undefined, tabId: tab.id },
          func: () => {
            let node = document.activeElement;
            while (true) {
              const shadow = node?.shadowRoot?.activeElement;
              if (!shadow) break;
              node = shadow;
            }
            console.log(node);
            return node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement
              ? node.value.slice(node.selectionStart || 0, node.selectionEnd || -1)
              : getSelection()?.toString() || '';
          },
        })
        .then((result = []) => {
          result[0].result &&
            portManager.port.postMessage({
              type: 'translate-text',
              data: result[0].result,
            });
        });
      break;
  }
});

runtime.onInstalled.addListener(({ reason }) => {
  setTimeout(() => {
    if (reason === 'install' && !portManager.connected) {
      tabs.create({ url: runtime.getURL('welcome.html') });
    }
  }, 1_000);
});
