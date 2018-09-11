/*
On startup, connect to the "ping_pong" app.
*/
const port = chrome.runtime.connectNative('google_translate');

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

function process(info, tab, command) {
  const code = `(() => {
    const node = document.activeElement;
    return node && ['TEXTAREA', 'INPUT'].includes(node.nodeName) ?
            node.value.slice(node.selectionStart, node.selectionEnd) :
            window.getSelection().toString();
  })();`

  chrome.tabs.executeScript({code}, (result = []) => {
    result[0] && port.postMessage(result[0]);
  });
}


/*
Listen for messages from the app.
*/
port.onMessage.addListener((response) => {
  switch (response) {
    case 'connect':
      return createMenu();
    case 'disconnect':
      return removeMenu();
  }
});
