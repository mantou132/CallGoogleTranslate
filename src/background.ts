import { browser, Menus, Runtime } from 'webextension-polyfill-ts';

class PortManager {
  connected = false;
  port: Runtime.Port;

  start = () => {
    // parameter application must match /^\w+(\.\w+)*$/ for runtime.connectNative.
    this.port = browser.runtime.connectNative('google_translate_bridge');

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

  process = ({ frameId }: Menus.OnClickData) => {
    const code = `(() => {
      const node = document.activeElement;
      return node && ['TEXTAREA', 'INPUT'].includes(node.nodeName) ?
              node.value.slice(node.selectionStart, node.selectionEnd) :
              window.getSelection().toString();
    })();`;

    browser.tabs.executeScript({ code, frameId }).then((result = []) => {
      result[0] &&
        this.port.postMessage({
          type: 'translate-text',
          data: result[0],
        });
    });
  };

  createMenu = () => {
    this.connected = true;
    browser.contextMenus.create({
      id: 'googletranslate',
      title: 'Google Translate',
      contexts: ['selection'],
      documentUrlPatterns: ['<all_urls>'], // limiting to supported schemes
      onclick: this.process,
    });
  };

  removeMenu = () => {
    this.connected = false;
    browser.contextMenus.remove('googletranslate');
  };
}

const portManager = new PortManager();
portManager.start();

browser.runtime.onInstalled.addListener(({ reason }) => {
  setTimeout(() => {
    if (reason === 'install' && !portManager.connected) {
      browser.tabs.create({ url: browser.runtime.getURL('welcome.html') });
    }
  }, 1_000);
});
