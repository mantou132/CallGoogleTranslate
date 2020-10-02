import { browser, Menus, Runtime } from 'webextension-polyfill-ts';

// https://github.com/mantou132/web-ext-native-message/#node-ipc-%E9%80%9A%E4%BF%A1%E8%A7%84%E8%8C%83
interface Msg {
  type: 'translate-text' | 'connected';
  data: string;
}

interface SafariMsg {
  name: string;
  userInfo: Msg;
}

const NATIVE_HOST_ID = 'google_translate_bridge';
const MENU_ID = 'googletranslate';

class PortManager {
  isSafari = false;
  connected = false;
  port: Runtime.Port;

  start = () => {
    // parameter application must match /^\w+(\.\w+)*$/ for runtime.connectNative.
    // safari ignores the application.id
    this.port = browser.runtime.connectNative(NATIVE_HOST_ID);

    browser.runtime
      .sendNativeMessage('NATIVE_HOST_ID', 'ext-ready')
      .then(() => {
        // safari
        this.isSafari = true;
        console.log('connected');
        this.createMenu();
      })
      .catch(() => {
        // other browser
      });

    this.port.onMessage.addListener((msg: Msg | SafariMsg) => {
      const { type } = 'userInfo' in msg ? msg.userInfo : msg;
      if (type === 'connected') {
        console.log('connected');
        this.createMenu();
      } else {
        console.log(msg);
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

  process = async ({ frameId }: Menus.OnClickData) => {
    const code = `(() => {
      const node = document.activeElement;
      return node && ['TEXTAREA', 'INPUT'].includes(node.nodeName) ?
              node.value.slice(node.selectionStart, node.selectionEnd) :
              window.getSelection().toString();
    })();`;

    const [text] = await browser.tabs.executeScript({ code, frameId });
    if (!text) return;
    const msg: Msg = {
      type: 'translate-text',
      data: text,
    };
    if (this.isSafari) {
      browser.runtime.sendNativeMessage('NATIVE_HOST_ID', msg).then(console.log);
    } else {
      this.port.postMessage(msg);
    }
  };

  createMenu = () => {
    this.connected = true;
    browser.contextMenus.create(
      {
        id: MENU_ID,
        title: 'Translate "%s"',
        contexts: ['selection'],
        documentUrlPatterns: ['<all_urls>'], // limiting to supported schemes
        onclick: this.process,
      },
      function() {
        if (browser.runtime.lastError) {
          console.log('error creating item:' + browser.runtime.lastError);
        }
      },
    );
  };

  removeMenu = () => {
    this.connected = false;
    browser.contextMenus.remove(MENU_ID).catch(() => {
      //
    });
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
