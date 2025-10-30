const GEMINI_API_KEY = "AIzaSyBUWkzsKJR-UBinxgTm4WcCWn5Kp2uPzzY"; 

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "generate_text") {
    console.log("🧠 Recibido mensaje:", message.prompt);

    fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Eres un asistente experto en redacción de correos y mensajes. Redacta de forma clara, profesional y natural el siguiente texto: "${message.prompt}"`,
                },
              ],
            },
          ],
        }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("📦 Respuesta API:", data);
        const generatedText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "⚠️ No se generó texto.";
        sendResponse({ success: true, text: generatedText });
      })
      .catch((err) => {
        console.error("💥 Error generando texto:", err);
        sendResponse({ success: false, error: err.message });
      });

    // Necesario para que espere la respuesta asíncrona
    return true;
  }
});
