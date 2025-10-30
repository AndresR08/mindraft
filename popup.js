const generateBtn = document.getElementById('generate');
const proofBtn = document.getElementById('proofread');
const pasteBtn = document.getElementById('paste');
const promptEl = document.getElementById('prompt');
const toneEl = document.getElementById('tone');
const outputEl = document.getElementById('output');

function mockGenerate(prompt, tone) {
  return `Subject: Meeting request about ${prompt}\n\nHi,\n\nI hope you're well. I would like to request a meeting to discuss ${prompt}. Please let me know your availability.\n\nBest regards,\nAndrés`;
}

function mockProofread(text) {
  // placeholder: simple cleanup
  return text.replace(/\s+/g, ' ').replace(' ,', ',').trim();
}

generateBtn.addEventListener('click', async () => {
  const prompt = promptEl.value.trim();
  const tone = toneEl.value;
  if (!prompt) { alert('Write a prompt first'); return; }

  outputEl.textContent = 'Generating...';

  try {
    // TODO: Replace with real Chrome built-in AI call when available.
    const outputText = mockGenerate(prompt, tone);
    outputEl.textContent = outputText;
  } catch (err) {
    outputEl.textContent = 'Error generating text: ' + err.message;
  }
});

proofBtn.addEventListener('click', async () => {
  const current = outputEl.textContent;
  if (!current) { alert('Generate first'); return; }
  outputEl.textContent = 'Proofreading...';
  try {
    const fixed = mockProofread(current);
    outputEl.textContent = fixed;
  } catch (err) {
    outputEl.textContent = 'Error proofreading: ' + err.message;
  }
});

pasteBtn.addEventListener('click', async () => {
  const text = outputEl.textContent;
  if (!text) { alert('Nothing to paste'); return; }
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'paste', text});
  });
});
