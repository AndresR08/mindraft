// content.js - pastes AI-generated text into Gmail or editable areas

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'paste') {
    const text = msg.text;
    const activeEl = document.activeElement;

    if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
      if (activeEl.isContentEditable) activeEl.innerText = text;
      else activeEl.value = text;
      sendResponse({ ok: true });
      return;
    }

    const compose = document.querySelector('[aria-label="Message Body"]') || 
                    document.querySelector('div[contenteditable="true"][role="textbox"]');

    if (compose) {
      compose.innerText = text;
      sendResponse({ ok: true });
    } else {
      alert('⚠️ No editable area found. Click in the text box first.');
      sendResponse({ ok: false });
    }
  }
});
