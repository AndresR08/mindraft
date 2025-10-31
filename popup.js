// popup.js - controla UI, voz, copia, historial y formato visual

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

const HISTORY_KEY = "minDraft_history";
const MAX_HISTORY = 10;

// --- Helpers ---
function showLoading(show) {
  loader.classList.toggle("hidden", !show);
  outputEl.classList.toggle("hidden", show);
  if (show) outputEl.textContent = "";
}

// Guardar historial y estilo del usuario
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
    console.error("Error guardando historial:", e);
  }
}

// Aprender estilo del usuario
async function learnUserStyle(text) {
  const data = await chrome.storage.local.get("userSamples");
  let samples = data.userSamples || [];
  samples.unshift(text);
  if (samples.length > 5) samples = samples.slice(0, 5);
  await chrome.storage.local.set({ userSamples: samples });
}

// Renderizar historial
async function renderHistory() {
  const data = await chrome.storage.local.get(HISTORY_KEY);
  const arr = data[HISTORY_KEY] || [];
  historyList.innerHTML = "";

  if (arr.length === 0) {
    historyList.innerHTML = `<li style="color:#6b7280;font-size:13px">No hay historial aún.</li>`;
    return;
  }

  arr.forEach((item) => {
    const li = document.createElement("li");
    li.className = "history-item";

    const left = document.createElement("div");
    left.style.flex = "1";

    const meta = document.createElement("div");
    meta.className = "meta";
    const date = new Date(item.t).toLocaleString();
    meta.textContent = `${item.prompt.slice(0, 60)}${item.prompt.length > 60 ? "…" : ""}`;

    const small = document.createElement("div");
    small.className = "meta";
    small.textContent = date;

    left.appendChild(meta);
    left.appendChild(small);

    const actions = document.createElement("div");
    actions.className = "actions";

    const copy = document.createElement("button");
    copy.textContent = "Copiar";
    copy.onclick = () => {
      navigator.clipboard.writeText(item.text).then(() => {
        copy.textContent = "Copiado";
        setTimeout(() => (copy.textContent = "Copiar"), 900);
      });
    };

    const use = document.createElement("button");
    use.textContent = "Usar";
    use.onclick = () => {
      inputText.value = item.prompt;
      outputEl.innerHTML = markdownToHTML(item.text);
      outputEl.classList.remove("hidden");
    };

    actions.appendChild(use);
    actions.appendChild(copy);

    li.appendChild(left);
    li.appendChild(actions);
    historyList.appendChild(li);
  });
}

// --- Eventos UI ---
clearHistoryBtn.addEventListener("click", async () => {
  await chrome.storage.local.set({ [HISTORY_KEY]: [] });
  renderHistory();
});

copyBtn.addEventListener("click", async () => {
  const txt = outputEl.textContent || "";
  if (!txt) return;
  await navigator.clipboard.writeText(txt);
  copyBtn.textContent = "Copiado";
  setTimeout(() => (copyBtn.textContent = "Copiar"), 900);
});

clearOutputBtn.addEventListener("click", () => {
  outputEl.textContent = "";
});

generateBtn.addEventListener("click", async () => {
  const prompt = inputText.value.trim();
  if (!prompt) {
    outputEl.textContent = "✏️ Escribe algo primero.";
    return;
  }

  const tone = toneSelect.value || "formal";
  showLoading(true);

  chrome.runtime.sendMessage({ action: "generate_text", prompt, tone }, async (resp) => {
    showLoading(false);
    if (!resp) {
      outputEl.textContent = "No hubo respuesta del fondo.";
      return;
    }

    if (resp.success) {
      const html = markdownToHTML(resp.text);
      outputEl.innerHTML = html;
      await saveToHistory({ prompt, text: resp.text, t: Date.now() });
    } else {
      outputEl.textContent = "⚠️ Error: " + (resp.error || "desconocido");
    }
  });
});

// --- Inicializar ---
document.addEventListener("DOMContentLoaded", renderHistory);

// --- Reconocimiento de voz (versión pro) ---
if ("webkitSpeechRecognition" in window) {
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "es-CO";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  micBtn.addEventListener("click", () => {
    try {
      recognition.start();
      micBtn.textContent = "🎙️ Escuchando...";
      outputEl.textContent = "🎧 Esperando tu voz...";
    } catch {
      outputEl.textContent = "⚠️ No se pudo iniciar el micrófono. Verifica los permisos.";
    }
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    inputText.value = inputText.value
      ? inputText.value + " " + transcript
      : transcript;
    outputEl.textContent = "✅ Texto detectado: “" + transcript + "”.";
    micBtn.textContent = "🎤";
  };

  recognition.onerror = (event) => {
    const err = event.error;
    let mensaje = "";

    switch (err) {
      case "not-allowed":
        mensaje = "🚫 El micrófono está bloqueado. Actívalo en los permisos del navegador.";
        break;
      case "no-speech":
        mensaje = "🎙️ No se detectó voz. Intenta hablar más cerca o con menos ruido.";
        break;
      case "aborted":
        mensaje = "⚠️ Grabación cancelada.";
        break;
      case "network":
        mensaje = "🌐 Problema de conexión al procesar la voz.";
        break;
      default:
        mensaje = "❌ Error en el reconocimiento de voz. Intenta de nuevo.";
    }

    outputEl.textContent = mensaje;
    micBtn.textContent = "🎤";
  };

  recognition.onend = () => {
    micBtn.textContent = "🎤";
  };
} else {
  micBtn.style.display = "none";
  outputEl.textContent = "❌ Tu navegador no soporta reconocimiento de voz.";
}


// --- Pegar automáticamente en Gmail ---
async function pasteToGmail(text) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url.includes("mail.google.com")) {
      alert("⚠️ Abre Gmail para pegar la respuesta automáticamente.");
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
          const compose =
            document.querySelector('[aria-label="Cuerpo del mensaje"]') ||
            document.querySelector('div[contenteditable="true"][role="textbox"]');
          if (compose) compose.innerHTML = text;
          else alert("⚠️ No se encontró el área de redacción en Gmail.");
        }
      },
      args: [text],
    });
  } catch (err) {
    console.error("Error al pegar en Gmail:", err);
  }
}

useBtn.addEventListener("click", async () => {
  const txt = outputEl.textContent || "";
  if (!txt) return;
  await pasteToGmail(txt);
});

// --- Conversor de Markdown a HTML bonito ---
function markdownToHTML(md) {
  if (!md) return "";
  return md
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/^- (.*$)/gim, "<li>$1</li>")
    .replace(/\n---\n/gim, "<hr>")
    .replace(/\n$/gim, "<br>")
    .replace(/\n/g, "<br>")
    .replace(/(<li>.*<\/li>)/gim, "<ul>$1</ul>");
}
