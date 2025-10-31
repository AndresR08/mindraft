const GEMINI_API_KEY = "AIzaSyBUWkzsKJR-UBinxgTm4WcCWn5Kp2uPzzY";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "generate_text") {
    console.log("🧠 Prompt recibido:", message.prompt);

    const prompt = `
Eres un asistente experto en redacción de correos y mensajes profesionales.
Redacta el texto de forma clara, natural y profesional sin explicaciones.
Entrega exactamente 3 opciones distintas.
Usa etiquetas HTML para formato (por ejemplo, <b> para negrilla, <h2> o <h3> para títulos o subtítulos).
No uses símbolos, emojis ni asteriscos.
No incluyas texto adicional fuera de las tres opciones.

Texto a reescribir:
"${message.prompt}"
`;

    fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("📦 Respuesta de Gemini:", data);
        const generatedText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "⚠️ No se generó texto.";
        sendResponse({ success: true, text: generatedText });
      })
      .catch((err) => {
        console.error("💥 Error al generar texto:", err);
        sendResponse({ success: false, error: err.message });
      });

    return true; // Espera la respuesta asíncrona
  }
});
