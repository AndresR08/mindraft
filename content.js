chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'paste') {
    const text = msg.text;
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
      if (activeEl.isContentEditable) {
        activeEl.innerText = text;
      } else {
        activeEl.value = text;
      }
      sendResponse({ok: true});
    } else {
      const compose = document.querySelector('[aria-label="Message Body"]') || document.querySelector('div[contenteditable="true"]');
      if (compose) {
        compose.innerText = text;
        sendResponse({ok: true});
      } else {
        alert('No editable area found. Click on the compose box first.');
        sendResponse({ok: false});
      }
    }
  }
});
