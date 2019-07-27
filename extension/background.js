/*
On startup, connect to the "ping_pong" app.
*/
// parameter application must match /^\w+(\.\w+)*$/ for runtime.connectNative.
const port = chrome.runtime.connectNative('google_translate_bridge');

// ----------------- Context Menu --------------------------
function createMenu() {
  chrome.contextMenus.create({
    id: 'googletranslate',
    title: 'Google Translate',
    contexts: ['selection'],
    documentUrlPatterns: ['<all_urls>'],                      // limiting to supported schemes
    onclick : process
  });
}

function removeMenu() {
  chrome.contextMenus.remove('googletranslate');
}

function process({frameId}, tab, command) {
  const code = `(() => {
    const node = document.activeElement;
    return node && ['TEXTAREA', 'INPUT'].includes(node.nodeName) ?
            node.value.slice(node.selectionStart, node.selectionEnd) :
            window.getSelection().toString();
  })();`

  chrome.tabs.executeScript({code, frameId}, (result = []) => {
    result[0] && port.postMessage({
      type: 'translate-text',
      data: result[0]
    });
  });
}


/*
Listen for messages from the app.
*/
port.onMessage.addListener(({ type }) => {
  if (type === 'connected') {
    createMenu();
  }
});

port.onDisconnect.addListener(removeMenu);
