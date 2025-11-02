// background.js - Service Worker for MinDraft with Gemini API
// Handles AI text generation based on user tone and style

//aqui

const GEMINI_API_KEY = "AIzaSyBUWkzsKJR-UBinxgTm4WcCWn5Kp2uPzzY";

// Map of available tones
const toneMap = {
  formal: "If the user is writing or replying to an email, write a formal and professional response. If it's a general question or request, respond helpfully and clearly in the same tone. Respond only in the language used by the user.",
  casual: "If the user is writing or replying to an email, write a casual and friendly response. If it's a general question or request, reply naturally and conversationally. Respond only in the language used by the user.",
  brief: "If the user is writing or replying to an email, write a short and polite response. If it's a general question or request, reply concisely and directly. Respond only in the language used by the user."
};


// --- Call Gemini API ---
async function callGemini(prompt, tone) {
  try {
    const { userSamples = [] } = await chrome.storage.local.get("userSamples");
    const styleExamples = userSamples.join("\n---\n") || "No user examples yet.";

    const fullPrompt = `
${toneMap[tone] || toneMap.formal}

Consider the user's style:
${styleExamples}

Write a response to the following message:
"${prompt}"
`;

    const body = { contents: [{ parts: [{ text: fullPrompt }] }] };
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
      data?.candidates?.[0]?.content?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.output?.[0]?.content?.[0]?.text ||
      data?.text ||
      JSON.stringify(data);

    return { ok: true, text };
  } catch (e) {
    console.error("Error in callGemini:", e);
    return { ok: false, error: e.message || String(e) };
  }
}

// --- Main listener ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action !== "generate_text") return;

  const { prompt = "", tone = "formal" } = message;

  (async () => {
    if (!GEMINI_API_KEY) {
      sendResponse({
        success: true,
        text: `✍️ (${tone.toUpperCase()})\n${prompt}\n\n💡 (Simulated response — add your API Key in background.js)`,
      });
      return;
    }

    const res = await callGemini(prompt, tone);
    if (res.ok) sendResponse({ success: true, text: res.text });
    else sendResponse({ success: false, error: res.error });
  })();

  return true;
});
