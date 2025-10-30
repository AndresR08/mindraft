document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("generateBtn");
  const input = document.getElementById("inputText");
  const output = document.getElementById("output");

  btn.addEventListener("click", () => {
    const text = input.value.trim();
    if (!text) {
      output.textContent = "⚠️ Escribe algo primero.";
      return;
    }

    output.textContent = "⏳ Generando texto...";

    chrome.runtime.sendMessage(
      { action: "generate_text", prompt: text },
      (response) => {
        if (!response) {
          output.textContent = "💥 No hubo respuesta del fondo.";
          return;
        }
        if (response.success) {
          output.textContent = response.text;
        } else {
          output.textContent = "⚠️ Error: " + response.error;
        }
      }
    );
  });
});
