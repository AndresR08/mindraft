// background.js - service worker para MinDraft
// Usa Gemini API con aprendizaje de estilo del usuario

const GEMINI_API_KEY = "AIzaSyBUWkzsKJR-UBinxgTm4WcCWn5Kp2uPzzY"; 

// Mapa de tonos disponibles
const toneMap = {
  formal: "Redacta una respuesta formal y profesional.",
  casual: "Redacta una respuesta casual, cercana y amable.",
  brief: "Redacta una respuesta breve y directa.",
};

// --- Llamada a la API de Gemini ---
async function callGemini(prompt, tone) {
  try {
    // Recuperar ejemplos del estilo del usuario desde almacenamiento local
    const styleData = await chrome.storage.local.get("userSamples");
    const styleExamples = styleData.userSamples?.join("\n---\n") || "Ningún ejemplo aún.";

    // Crear prompt completo con tono y estilo
    const fullPrompt = `
${toneMap[tone] || toneMap.formal}

Ten en cuenta el estilo del usuario (así suele escribir):
${styleExamples}

Ahora redacta una respuesta al siguiente mensaje:
"${prompt}"
`;

    // Armar cuerpo de solicitud según el endpoint actual de Gemini
    const body = {
      contents: [
        {
          parts: [{ text: fullPrompt }],
        },
      ],
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return { ok: false, error: `HTTP ${resp.status}: ${txt}` };
    }

    const data = await resp.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.content?.[0]?.text ||
      data?.output?.[0]?.content?.[0]?.text ||
      data?.text ||
      JSON.stringify(data);

    return { ok: true, text };
  } catch (e) {
    console.error("Error en callGemini:", e);
    return { ok: false, error: e.message || String(e) };
  }
}

// --- Listener principal ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "generate_text") {
    const { prompt = "", tone = "formal" } = message;

    (async () => {
      if (!GEMINI_API_KEY) {
        sendResponse({
          success: true,
          text: `✍️ (${tone.toUpperCase()})\n${prompt}\n\n💡 (Respuesta simulada — agrega tu API Key en background.js)`,
        });
        return;
      }

      const res = await callGemini(prompt, tone);
      if (res.ok) {
        sendResponse({ success: true, text: res.text });
      } else {
        sendResponse({ success: false, error: res.error });
      }
    })();

    return true;
  }
});
