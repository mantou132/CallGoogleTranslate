/*
On startup, connect to the "ping_pong" app.
*/
const port = chrome.runtime.connectNative('google_translate');

/*
Listen for messages from the app.
*/
port.onMessage.addListener((response) => {
  console.log('Received: ' + response);
});


// ----------------- Context Menu --------------------------
chrome.contextMenus.create({
  id: 'copyplaintext',
  title: 'Google Translate',
  contexts: ['selection'],
  documentUrlPatterns: ['<all_urls>'],                      // limiting to supported schemes
  onclick : process
});

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
