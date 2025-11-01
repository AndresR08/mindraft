// popup.js - controls UI, voice recognition, history, and Markdown rendering

// --- DOM Elements ---
const inputText = document.getElementById("inputText");
const generateBtn = document.getElementById("generateBtn");
const outputEl = document.getElementById("output");
const loader = document.getElementById("loader");
const copyBtn = document.getElementById("copyBtn");
const useBtn = document.getElementById("useBtn");
const clearOutputBtn = document.getElementById("clearOutputBtn");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const toneSelect = document.getElementById("toneSelect");
const micBtn = document.getElementById("micBtn");
const resetMemoryBtn = document.getElementById("resetMemoryBtn");


const HISTORY_KEY = "minDraft_history";
const MAX_HISTORY = 10;

// --- Helper functions ---

// Show or hide loading indicator
function showLoading(show) {
  loader.classList.toggle("hidden", !show);
  outputEl.classList.toggle("hidden", show);
  if (show) outputEl.textContent = "";
}

// Save entry to history and learn user's writing style
async function saveToHistory(entry) {
  try {
    await learnUserStyle(entry.text);
    const data = await chrome.storage.local.get(HISTORY_KEY);
    const arr = data[HISTORY_KEY] || [];
    arr.unshift(entry);
    if (arr.length > MAX_HISTORY) arr.length = MAX_HISTORY;
    await chrome.storage.local.set({ [HISTORY_KEY]: arr });
    renderHistory();
  } catch (e) {
    console.error("Error saving history:", e);
  }
}

// Save latest text to user style examples
async function learnUserStyle(text) {
  const data = await chrome.storage.local.get("userSamples");
  let samples = data.userSamples || [];
  samples.unshift(text);
  if (samples.length > 5) samples = samples.slice(0, 5);
  await chrome.storage.local.set({ userSamples: samples });
}

// Render history list
async function renderHistory() {
  const data = await chrome.storage.local.get(HISTORY_KEY);
  const arr = data[HISTORY_KEY] || [];
  historyList.innerHTML = "";

  if (arr.length === 0) {
    historyList.innerHTML = `<li style="color:#6b7280;font-size:13px">No history yet.</li>`;
    return;
  }

  arr.forEach((item) => {
    const li = document.createElement("li");
    li.className = "history-item";

    const left = document.createElement("div");
    left.style.flex = "1";

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${item.prompt.slice(0, 60)}${item.prompt.length > 60 ? "…" : ""}`;

    const dateEl = document.createElement("div");
    dateEl.className = "meta";
    dateEl.textContent = new Date(item.t).toLocaleString();

    left.appendChild(meta);
    left.appendChild(dateEl);

    const actions = document.createElement("div");
    actions.className = "actions";

    const copy = document.createElement("button");
    copy.innerHTML = `<img src="icons/copy.png" alt="Copy" width="16" height="16"> Copy`;
    copy.onclick = () => {
      navigator.clipboard.writeText(item.text).then(() => {
        copy.textContent = "Copied";
        setTimeout(() => (copy.textContent = "Copy"), 900);
      });
    };

    const use = document.createElement("button");
    use.innerHTML = `<img src="icons/use.png" alt="Use" width="16" height="16"> Use`;
    use.onclick = () => {
      inputText.value = item.prompt;
      outputEl.textContent = item.text;
      outputEl.classList.remove("hidden");
    };

    actions.appendChild(use);
    actions.appendChild(copy);

    li.appendChild(left);
    li.appendChild(actions);
    historyList.appendChild(li);
  });
}

// --- UI Event Listeners ---

clearHistoryBtn.addEventListener("click", async () => {
  await chrome.storage.local.set({ [HISTORY_KEY]: [] });
  renderHistory();
});

copyBtn.addEventListener("click", async () => {
  const txt = outputEl.textContent || "";
  if (!txt) return;
  await navigator.clipboard.writeText(txt);
  copyBtn.textContent = "Copied";
  setTimeout(() => (copyBtn.textContent = "Copy"), 900);
});

clearOutputBtn.addEventListener("click", () => {
  outputEl.textContent = "";
});

generateBtn.addEventListener("click", async () => {
  const prompt = inputText.value.trim();
  if (!prompt) {
    outputEl.textContent = "✏️ Please write something first.";
    return;
  }

  const tone = toneSelect.value || "formal";
  showLoading(true);

  chrome.runtime.sendMessage({ action: "generate_text", prompt, tone }, async (resp) => {
    showLoading(false);
    if (!resp) {
      outputEl.textContent = "No response from background.";
      return;
    }

    if (resp.success) {
      outputEl.textContent = resp.text;
      await saveToHistory({ prompt, text: resp.text, t: Date.now() });
    } else {
      outputEl.textContent = "⚠️ Error: " + (resp.error || "unknown");
    }
  });
});

// Initialize history on load
document.addEventListener("DOMContentLoaded", renderHistory);

// --- Voice recognition ---
if ("webkitSpeechRecognition" in window) {
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  micBtn.addEventListener("click", () => {
    try {
      recognition.start();
      micBtn.textContent = "🎙️ Listening...";
      outputEl.textContent = "🎧 Waiting for your voice...";
    } catch {
      outputEl.textContent = "⚠️ Cannot start microphone. Check permissions.";
    }
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    inputText.value = inputText.value ? inputText.value + " " + transcript : transcript;
    outputEl.textContent = "✅ Detected: “" + transcript + "”.";
    micBtn.textContent = "🎤";
  };

  recognition.onerror = (event) => {
    const err = event.error;
    let message = "";
    switch (err) {
      case "not-allowed": message = "🚫 Microphone blocked."; break;
      case "no-speech": message = "🎙️ No speech detected."; break;
      case "aborted": message = "⚠️ Recording cancelled."; break;
      case "network": message = "🌐 Network problem during voice recognition."; break;
      default: message = "❌ Recognition error. Try again."; 
    }
    outputEl.textContent = message;
    micBtn.textContent = "🎤";
  };

  recognition.onend = () => { micBtn.textContent = "🎤"; };
} else {
  micBtn.style.display = "none";
  outputEl.textContent = "❌ Your browser does not support voice recognition.";
}

// --- Paste generated text into Gmail ---
async function pasteToGmail(text) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url.includes("mail.google.com")) {
      alert("⚠️ Open Gmail to paste the response.");
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (text) => {
        const active = document.activeElement;
        if (active && (active.isContentEditable || active.tagName === "TEXTAREA")) {
          if (active.isContentEditable) active.innerHTML = text;
          else active.value = text;
        } else {
          const compose = document.querySelector('[aria-label="Message Body"]') || document.querySelector('div[contenteditable="true"][role="textbox"]');
          if (compose) compose.innerHTML = text;
          else alert("⚠️ No editable area found in Gmail.");
        }
      },
      args: [text],
    });
  } catch (err) {
    console.error("Error pasting to Gmail:", err);
  }
}

resetMemoryBtn.addEventListener("click", async () => {
  const confirmReset = confirm("⚠️ This will clear your learned style samples. Are you sure?");
  if (!confirmReset) return;

  try {
    // Clear user style samples
    await chrome.storage.local.set({ userSamples: [] });

    // Optional: clear history as well
    // await chrome.storage.local.set({ userSamples: [], [HISTORY_KEY]: [] });

    alert("✅ Memory cleared. AI will now respond based only on the new prompt.");
    
    // Refresh history display if you cleared history too
    renderHistory();
  } catch (e) {
    console.error("Error clearing memory:", e);
    alert("❌ Failed to clear memory.");
  }
});

useBtn.addEventListener("click", async () => {
  const txt = outputEl.textContent || "";
  if (!txt) return;
  await pasteToGmail(txt);
});
