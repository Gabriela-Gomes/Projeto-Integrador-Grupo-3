(() => {
  "use strict";

  const form = document.getElementById("personalizado-formulario");
  if (!form || !window.DindaStore) return;

  const dateInput = document.getElementById("entrega-data");
  const notesInput = document.getElementById("personalizado-notas");
  const error = document.getElementById("personalizado-erro");
  const success = document.getElementById("personalizado-sucesso");

  const localDate = new Date();
  localDate.setHours(0, 0, 0, 0);
  localDate.setDate(localDate.getDate() + 3);
  const minDate = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;
  if (dateInput) dateInput.min = minDate;

  const selected = (name) =>
    form.querySelector(`input[name="${name}"]:checked`);
  const money = window.DindaStore.money;
  let currentTotal = 45;
  let currentDetails = {};

  const cakePreview = document.getElementById("bolo-previsualizacao");
  const cakeIllustration = document.getElementById("personalizado-bolo-ilustracao");
  const cakeBodyGroup = document.getElementById("bolo-corpo-grupo");
  const cakePreviewDescription = document.getElementById(
    "bolo-previsualizacao-descricao",
  );
  const cakeSizeBadge = document.getElementById("bolo-tamanho-selo");
  const doughColors = {
    "Baunilha caseira": "#ead3ad",
    "Chocolate belga": "#79503c",
    "Red Velvet": "#bd5b60",
    "Cenoura com especiarias": "#d98645",
    "Limão siciliano": "#ead568",
  };
  const fillingColors = {
    "Sem recheio": "#ffffff",
    "Brigadeiro tradicional": "#4b2d26",
    "Doce de leite": "#bd7940",
    "Leite Ninho": "#efe1ca",
    "Ninho com creme de avelã": "#70412e",
  };
  const toppingColors = {
    "Ganache de chocolate": "#59382d",
    "Goiabada cremosa": "#b83f4f",
    "Creme de Ninho": "#f5e9d5",
    "Buttercream rosa": "#e6a2b6",
    "Calda de frutas vermelhas": "#963e56",
  };
  const cakeScales = {
    "1 kg": [0.82, 0.88],
    "1,5 kg": [0.9, 0.93],
    "2 kg": [1, 1],
    "3 kg": [1.1, 1.08],
    "4 kg": [1.18, 1.14],
  };
  const decorationGroups = [
    ["Morangos frescos", "bolo-extra-morangos"],
    ["Nozes picadas", "bolo-extra-castanhas"],
    ["Gotas de chocolate", "bolo-extra-gotas"],
    ["Granulado belga", "bolo-extra-confeitos"],
    ["Mini brigadeiros", "bolo-extra-brigadeiros"],
    ["Topo personalizado", "bolo-extra-decoracao"],
  ];

  function updateCakePreview(size, dough, filling, topping, extras) {
    if (
      !cakePreview ||
      !cakeIllustration ||
      !cakeBodyGroup ||
      !cakePreviewDescription
    )
      return;
    const sizeLabel = size?.value || "1 kg · aprox. 10 fatias";
    const sizeKey = sizeLabel.split("·")[0].trim();
    const [scaleX, scaleY] = cakeScales[sizeKey] || [1, 1];
    const doughName = dough?.value || "Baunilha caseira";
    const fillingName = filling?.value || "Sem recheio";
    const toppingName = topping?.value || "Ganache de chocolate";
    const selectedExtras = extras.map((input) => input.value);

    cakePreview.style.setProperty(
      "--cake-dough",
      doughColors[doughName] || doughColors["Baunilha caseira"],
    );
    cakePreview.style.setProperty(
      "--cake-filling",
      fillingColors[fillingName] || fillingColors["Sem recheio"],
    );
    cakePreview.style.setProperty(
      "--cake-topping",
      toppingColors[toppingName] || toppingColors["Ganache de chocolate"],
    );
    cakePreview.style.setProperty(
      "--cake-topping-highlight",
      toppingName === "Buttercream rosa"
        ? "#fff0f5"
        : toppingName === "Creme de Ninho"
          ? "#fffaf0"
          : toppingName === "Goiabada cremosa"
            ? "#e98a8e"
            : toppingName === "Calda de frutas vermelhas"
              ? "#d77b91"
              : "#a77b68",
    );
    cakeIllustration.dataset.preenchido =
      fillingName === "Sem recheio" ? "false" : "true";
    cakeIllustration.dataset.topping = toppingName;
    cakeBodyGroup.style.transform = `scale(${scaleX}, ${scaleY})`;
    if (cakeSizeBadge) cakeSizeBadge.textContent = sizeKey;
    decorationGroups.forEach(([label, id]) => {
      document
        .getElementById(id)
        ?.classList.toggle("visivel", selectedExtras.includes(label));
    });

    const extrasDescription = selectedExtras.length
      ? ` Adicionais: ${selectedExtras.join(", ")}.`
      : " Sem itens adicionais.";
    cakePreviewDescription.textContent = `Prévia ilustrativa ao vivo: ${sizeLabel}, massa ${doughName}, recheio ${fillingName}, cobertura ${toppingName}.${extrasDescription}`;
  }

  function formatLocalInputDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ""));
    return match ? `${match[3]}/${match[2]}/${match[1]}` : "A combinar";
  }

  function updateSummary() {
    const size = selected("size");
    const dough = selected("dough");
    const filling = selected("filling");
    const topping = selected("topping");
    const extras = Array.from(
      form.querySelectorAll('input[name="extra"]:checked'),
    );
    const base = Number(size?.dataset.preco || 45);
    const doughPrice = Number(dough?.dataset.preco || 0);
    const fillingPrice = Number(filling?.dataset.preco || 0);
    const toppingPrice = Number(topping?.dataset.preco || 0);
    const extrasPrice = extras.reduce(
      (sum, input) => sum + Number(input.dataset.preco || 0),
      0,
    );
    currentTotal =
      base + doughPrice + fillingPrice + toppingPrice + extrasPrice;
    currentDetails = {
      Tamanho: size?.value || "1 kg · aprox. 10 fatias",
      Massa: dough?.value || "Baunilha caseira",
      Recheio: filling?.value || "Sem recheio",
      Cobertura: topping?.value || "Ganache de chocolate",
      Extras: extras.map((input) => input.value).join(", ") || "Nenhum",
      "Data desejada": dateInput?.value
        ? formatLocalInputDate(dateInput.value)
        : "A combinar",
    };
    const ids = {
      size: "resumo-tamanho",
      dough: "resumo-massa",
      filling: "resumo-recheio",
      topping: "resumo-cobertura",
      extras: "resumo-extras",
    };
    Object.entries(ids).forEach(([key, id]) => {
      const node = document.getElementById(id);
      if (node)
        node.textContent =
          currentDetails[
            key === "size"?"Tamanho"
              : key === "dough"?"Massa"
                : key === "filling"?"Recheio"
                  : key === "topping"?"Cobertura"
                    : "Extras"
          ];
    });
    const total = document.getElementById("personalizado-total");
    if (total) total.textContent = money(currentTotal);
    updateCakePreview(size, dough, filling, topping, extras);
  }

  form.addEventListener("change", () => {
    if (error) error.hidden = true;
    if (success) success.hidden = true;
    updateSummary();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    updateSummary();
    if (!form.reportValidity()) return;
    if (!dateInput.value || dateInput.value < minDate) {
      if (error) {
        error.textContent =
          "Escolha uma data com pelo menos 3 dias de antecedência.";
        error.hidden = false;
      }
      dateInput.focus();
      return;
    }

    const size = selected("size")?.value || "1 kg · aprox. 10 fatias";
    const item = {
      id: `custom-${Date.now()}`,
      nome: `Bolo personalizado — ${size}`,
      descricao: "Uma criação montada especialmente para sua ocasião.",
      preco: currentTotal,
      qtd: 1,
      imagem: "img/bolo-4.jpg",
      personalizado: true,
      detalhes: currentDetails,
    };

    if (!window.DindaStore.addItem(item)) {
      if (error) {
        error.textContent =
          "Não foi possível salvar sua criação na sacola deste navegador.";
        error.hidden = false;
      }
      return;
    }
    if (notesInput) notesInput.value = "";
    if (success) {
      success.hidden = false;
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    window.DindaToast?.("Seu bolo personalizado foi adicionado à sacola.");
  });

  updateSummary();
})();
