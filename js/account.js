(() => {
  "use strict";
  document.querySelectorAll("[data-conta-formulario]").forEach((form) => {
    const demonstrateOnly = () => {
      if (!form.reportValidity()) return;
      const feedback = form.querySelector("[data-conta-comentario]");
      const password = form.querySelector(
        'input[type="password"], input[data-senha-campo]',
      );
      if (feedback) {
        feedback.textContent =
          "Esta demonstração não autentica nem cria contas. Nenhum dado foi enviado ou guardado. Apague os campos; use apenas informações fictícias até existir um backend seguro.";
        feedback.hidden = false;
      }
      form.querySelectorAll("input").forEach((input) => {
        if (input.type !== "checkbox" && input.type !== "radio")
          input.value = "";
      });
      password?.focus();
    };
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      demonstrateOnly();
    });
  });
  document.querySelectorAll("[data-alternar-senha]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(
        button.getAttribute("aria-controls"),
      );
      if (!input) return;
      const visible = input.type === "password";
      input.type = visible ? "text" : "password";
      button.setAttribute("aria-pressed", String(visible));
      button.textContent = visible ? "Ocultar" : "Mostrar";
      input.focus();
    });
  });
})();
