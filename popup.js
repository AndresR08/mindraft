document.getElementById("generate").addEventListener("click", () => {
  const promptValue = document.getElementById("prompt").value.trim();
  const output = document.getElementById("output");
  const loading = document.getElementById("loading");

  if (!promptValue) {
    output.textContent = "Por favor, escribe algo para generar.";
    return;
  }

  output.innerHTML = "";
  loading.classList.remove("hidden");

  chrome.runtime.sendMessage(
    { action: "generate_text", prompt: promptValue },
    (response) => {
      loading.classList.add("hidden");

      if (response.success) {
        output.innerHTML = response.text; // 👈 Renderiza HTML real
      } else {
        output.textContent = "Error: " + response.error;
      }
    }
  );
});
