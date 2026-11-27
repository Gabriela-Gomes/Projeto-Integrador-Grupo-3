(() => {
  "use strict";

  const ORDERS_KEY = "dinda_pedidos_demo";
  const layout = document.getElementById("finalizar-disposicao");
  const form = document.getElementById("finalizar-formulario");
  const lines = document.getElementById("finalizar-linhas");
  const totalOutput = document.getElementById("finalizar-total");
  const addressFields = document.getElementById("endereco-campos");
  const addressInput = document.getElementById("cliente-endereco");
  const error = document.getElementById("finalizar-erro");
  const confirmation = document.getElementById("pedido-confirmacao");
  const confirmationWarning = document.getElementById("confirmacao-aviso");
  const retryCartButton = document.getElementById("tentar-sacola-limpar");
  const submitButton = document.getElementById("enviar-pedido");
  const deleteReceiptsButton = document.getElementById("excluir-local-recibos");
  const receiptsFeedback = document.getElementById("recibos-comentario");
  const receiptsError = document.getElementById("recibos-erro");
  const emptyTemplate = document.getElementById("finalizar-vazio-template");
  const lineTemplate = document.getElementById("finalizar-linha-template");
  const empty = emptyTemplate?.content.firstElementChild.cloneNode(true);
  if (layout?.parentNode && empty) layout.after(empty);
  if (!layout || !form || !window.DindaStore) return;

  let receipts = [];
  let storageReady = true;
  let privacyReady = true;
  let orderFinalized = false;
  let finalizedReference = "";

  function setCheckoutError(message, focusTarget) {
    if (!error) return;
    error.textContent = message;
    error.hidden = false;
    focusTarget?.focus();
  }

  function setReceiptFeedback(message) {
    if (!receiptsFeedback) return;
    receiptsFeedback.textContent = message;
    receiptsFeedback.hidden = !message;
    if (receiptsError) receiptsError.hidden = true;
  }

  function setReceiptError(message) {
    if (receiptsFeedback) receiptsFeedback.hidden = true;
    if (!receiptsError) return;
    receiptsError.textContent = message;
    receiptsError.hidden = !message;
  }

  function normalizeKey(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function isObservationKey(key) {
    return /^(observ|nota|note)/.test(normalizeKey(key));
  }

  function stripCartObservations(items) {
    let changed = false;
    const cleanItems = items.map((item) => {
      const details =
        item?.detalhes &&
        typeof item.detalhes === "object" &&
        !Array.isArray(item.detalhes)
          ? { ...item.detalhes }
          : {};
      for (const key of Object.keys(details)) {
        if (isObservationKey(key)) {
          delete details[key];
          changed = true;
        }
      }
      return changed ? { ...item, detalhes: details } : item;
    });
    return { items: cleanItems, changed };
  }

  function sanitizeItems(items) {
    if (!Array.isArray(items)) return [];
    const allowedDetails = [
      "Tamanho",
      "Massa",
      "Recheio",
      "Cobertura",
      "Extras",
      "Data desejada",
    ];
    return items
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const price = Number(item.preco);
        const quantity = Number(item.qtd ?? item.quantidade);
        const cleanItem = {
          nome: String(item.nome || item.name || "Produto Dinda")
            .trim()
            .slice(0, 180),
          qtd: Number.isFinite(quantity)
            ? Math.max(1, Math.min(99, Math.round(quantity)))
            : 1,
          preco: Number.isFinite(price) ? Math.max(0, price) : 0,
        };
        const details =
          item.detalhes &&
          typeof item.detalhes === "object" &&
          !Array.isArray(item.detalhes)
            ? item.detalhes
            : {};
        const cleanDetails = {};
        for (const key of allowedDetails) {
          const value = details[key];
          if (typeof value === "string" && value.trim())
            cleanDetails[key] = value.trim().slice(0, 160);
        }
        if (Object.keys(cleanDetails).length) cleanItem.detalhes = cleanDetails;
        return cleanItem;
      });
  }

  function sanitizeReceipt(record) {
    if (!record || typeof record !== "object" || Array.isArray(record))
      return null;
    const reference = String(record.referencia || "")
      .trim()
      .slice(0, 48);
    const createdAt = String(record.criadoEm || record.data || "")
      .trim()
      .slice(0, 40);
    const subtotal = Number(record.subtotal);
    const items = sanitizeItems(record.itens ?? record.items);
    const allowedStatuses = [
      "Recebido",
      "Confirmado",
      "Em produção",
      "Pronto",
      "Concluído",
      "Cancelado",
    ];
    const status = allowedStatuses.includes(record.status)
      ? record.status
      : "Recebido";
    if (
      !reference ||
      !createdAt ||
      !Number.isFinite(Date.parse(createdAt)) ||
      !Number.isFinite(subtotal) ||
      !items.length
    )
      return null;
    const cleanReceipt = {
      referencia: reference,
      criadoEm: createdAt,
      subtotal: Math.max(
        0,
        Math.round((subtotal + Number.EPSILON) * 100) / 100,
      ),
      itens: items,
      status,
    };
    if (record.limpezaPendente === true) cleanReceipt.limpezaPendente = true;
    return cleanReceipt;
  }

  function readAndSanitizeReceipts() {
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      if (raw === null) return { ok: true, receipts: [], changed: false };
      const stored = JSON.parse(raw);
      if (!Array.isArray(stored))
        return { ok: false, receipts: [], changed: false };
      const clean = stored.map(sanitizeReceipt).filter(Boolean).slice(-20);
      const serialized = JSON.stringify(clean);
      const changed = raw !== serialized;
      if (changed) localStorage.setItem(ORDERS_KEY, serialized);
      return { ok: true, receipts: clean, changed };
    } catch {
      return { ok: false, receipts: [], changed: false };
    }
  }

  function saveReceipts(nextReceipts) {
    const clean = nextReceipts.map(sanitizeReceipt).filter(Boolean).slice(-20);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(clean));
    receipts = clean;
  }

  function sameItems(first, second) {
    return (
      JSON.stringify(sanitizeItems(first)) ===
      JSON.stringify(sanitizeItems(second))
    );
  }

  function findPendingReceipt(items) {
    return receipts.find(
      (receipt) => receipt.limpezaPendente && sameItems(receipt.itens, items),
    );
  }

  function removePendingFlag(reference) {
    const next = receipts.map((receipt) => {
      if (receipt.referencia !== reference || !receipt.limpezaPendente)
        return receipt;
      const { limpezaPendente, ...cleanReceipt } = receipt;
      return cleanReceipt;
    });
    if (next.every((receipt, index) => receipt === receipts[index]))
      return true;
    saveReceipts(next);
    return true;
  }

  function renderSummary() {
    if (orderFinalized) return;
    const items = window.DindaStore.readCart();
    const pendingReceipt = findPendingReceipt(items);
    if (pendingReceipt) {
      finalizeExistingReceipt(pendingReceipt);
      return;
    }
    const hasItems = items.length > 0;
    empty.hidden = hasItems;
    layout.hidden = !hasItems;
    if (!hasItems) return;
    lines.replaceChildren();
    items.forEach((item) => {
      const line = lineTemplate.content.firstElementChild.cloneNode(true);
      line.querySelector("[data-finalizar-item-nome]").textContent =
        `${item.nome} × ${item.qtd}`;
      line.querySelector("[data-finalizar-item-total]").textContent =
        window.DindaStore.money(item.preco * item.qtd);
      lines.append(line);
    });
    totalOutput.textContent = window.DindaStore.money(
      window.DindaStore.subtotal(items),
    );
  }

  function toggleAddress() {
    const fulfillment = form.querySelector(
      'input[name="fulfillment"]:checked',
    )?.value;
    const needsAddress = fulfillment === "Entrega";
    addressFields.hidden = !needsAddress;
    addressInput.required = needsAddress;
    if (!needsAddress) addressInput.value = "";
  }

  function isValidBrazilianPhone(value) {
    const phone = String(value ?? "").trim();
    if (!phone || !/^\+?[\d\s().-]+$/.test(phone)) return false;
    let digits = phone.replace(/\D/g, "");
    if (phone.startsWith("+")) {
      if (!phone.startsWith("+55") || !digits.startsWith("55")) return false;
      digits = digits.slice(2);
    }
    return /^([1-9]\d)\d{8,9}$/.test(digits);
  }

  function localDateAfterDays(days) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date;
  }

  function parseBrazilianDate(value) {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(
      String(value ?? "").trim(),
    );
    if (!match) return null;
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(0);
    date.setHours(0, 0, 0, 0);
    date.setFullYear(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    )
      return null;
    return date;
  }

  function findInvalidCustomCake(items) {
    const earliestAllowed = localDateAfterDays(3);
    return items.find((item) => {
      const details =
        item?.detalhes && typeof item.detalhes === "object"
          ? item.detalhes
          : {};
      const hasDesiredDate = Object.prototype.hasOwnProperty.call(
        details,
        "Data desejada",
      );
      if (!item?.personalizado && !hasDesiredDate) return false;
      const desiredDate = parseBrazilianDate(details["Data desejada"]);
      return !desiredDate || desiredDate < earliestAllowed;
    });
  }

  function showConfirmation(receipt, warning = "", canRetryCleanup = false) {
    finalizedReference = receipt.referencia;
    orderFinalized = true;
    if (submitButton) submitButton.disabled = true;
    layout.hidden = true;
    empty.hidden = true;
    confirmation.hidden = false;
    document.getElementById("pedido-referencia").textContent = receipt.referencia;
    if (confirmationWarning) {
      confirmationWarning.textContent = warning;
      confirmationWarning.hidden = !warning;
    }
    if (retryCartButton) retryCartButton.hidden = !canRetryCleanup;
    confirmation.focus();
    confirmation.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function finalizeExistingReceipt(receipt) {
    showConfirmation(
      receipt,
      "Esta solicitação já foi registrada neste navegador. Para evitar duplicidade, não será feito outro registro. A sacola pode ainda conter estes itens; tente limpá-la antes de continuar.",
      true,
    );
  }

  function tryClearCart() {
    if (!finalizedReference) return false;
    let cartCleared = false;
    try {
      cartCleared = window.DindaStore.saveCart([]);
    } catch {
      cartCleared = false;
    }
    if (!cartCleared) {
      if (confirmationWarning) {
        confirmationWarning.textContent =
          "A solicitação foi registrada neste navegador, mas não foi possível limpar a sacola. Não registre novamente: use “Tentar limpar a sacola novamente” ou volte à sacola para conferir.";
        confirmationWarning.hidden = false;
      }
      if (retryCartButton) retryCartButton.hidden = false;
      return false;
    }
    try {
      removePendingFlag(finalizedReference);
      if (confirmationWarning) confirmationWarning.hidden = true;
      if (retryCartButton) retryCartButton.hidden = true;
      setReceiptFeedback(
        "A solicitação foi registrada e a sacola foi limpa neste navegador. Nenhum dado foi enviado à loja.",
      );
      return true;
    } catch {
      if (confirmationWarning) {
        confirmationWarning.textContent =
          "A solicitação foi registrada e a sacola foi limpa, mas não foi possível atualizar o controle local contra duplicidade. Não registre esta mesma sacola novamente; apague os comprovantes locais se precisar liberar um novo registro.";
        confirmationWarning.hidden = false;
      }
      if (retryCartButton) retryCartButton.hidden = true;
      return true;
    }
  }

  form.addEventListener("change", (event) => {
    if (orderFinalized) return;
    if (event.target.name === "fulfillment") toggleAddress();
    if (error) error.hidden = true;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (orderFinalized) return;
    if (error) error.hidden = true;

    const items = window.DindaStore.readCart();
    if (!items.length) {
      renderSummary();
      return;
    }

    const pendingReceipt = findPendingReceipt(items);
    if (pendingReceipt) {
      finalizeExistingReceipt(pendingReceipt);
      return;
    }

    if (!storageReady || !privacyReady) {
      const message = privacyReady
        ? "Não foi possível proteger os comprovantes locais. Apague-os pelo controle abaixo ou tente novamente antes de registrar."
        : "A sacola contém observações antigas que não puderam ser removidas. Para proteger esses dados, o registro está bloqueado; tente novamente ou limpe a sacola.";
      setCheckoutError(message, error);
      return;
    }
    if (!form.reportValidity()) return;

    const name = String(form.elements.name.value ?? "").trim();
    if (name.length < 3) {
      setCheckoutError(
        "Informe seu nome, sem deixar o campo em branco ou preenchido apenas com espaços.",
        form.elements.name,
      );
      return;
    }

    if (!isValidBrazilianPhone(form.elements.phone.value)) {
      setCheckoutError(
        "Informe um telefone com DDD e 10 ou 11 dígitos. O código +55 é opcional.",
        form.elements.phone,
      );
      return;
    }

    const invalidCake = findInvalidCustomCake(items);
    if (invalidCake) {
      setCheckoutError(
        "A data desejada de cada bolo personalizado deve estar no formato DD/MM/AAAA e ter pelo menos 3 dias de antecedência, contando a data local. Volte à sacola para remover o item e crie novamente com uma data válida.",
        error,
      );
      return;
    }

    const fulfillment =
      form.querySelector('input[name="fulfillment"]:checked')?.value ||
      "Retirada";
    if (fulfillment === "Entrega" && !addressInput.value.trim()) {
      setCheckoutError("Informe o endereço para entrega.", addressInput);
      return;
    }

    const cleanItems = sanitizeItems(items);
    const reference = `DINDA-${Date.now().toString(36).toUpperCase()}`;
    const subtotal =
      Math.round((window.DindaStore.subtotal(items) + Number.EPSILON) * 100) /
      100;
    const receipt = {
      referencia: reference,
      criadoEm: new Date().toISOString(),
      subtotal,
      itens: cleanItems,
      limpezaPendente: true,
    };

    try {
      saveReceipts([...receipts, receipt]);
    } catch {
      setCheckoutError(
        "Não foi possível registrar o comprovante neste navegador. A sacola foi mantida; tente novamente.",
        submitButton,
      );
      return;
    }

    finalizedReference = reference;
    orderFinalized = true;
    if (submitButton) submitButton.disabled = true;
    const cartCleared = tryClearCart();
    const savedReceipt =
      receipts.find((entry) => entry.referencia === reference) || receipt;
    const warning = cartCleared
      ? confirmationWarning?.hidden
        ? ""
        : confirmationWarning.textContent
      : "A solicitação foi registrada neste navegador, mas não foi possível limpar a sacola. Não registre novamente: use “Tentar limpar a sacola novamente” ou volte à sacola para conferir.";
    showConfirmation(savedReceipt, warning, !cartCleared);
  });

  retryCartButton?.addEventListener("click", () => {
    retryCartButton.disabled = true;
    tryClearCart();
    retryCartButton.disabled = false;
  });

  deleteReceiptsButton?.addEventListener("click", () => {
    try {
      const hadReceipts = receipts.length > 0;
      localStorage.removeItem(ORDERS_KEY);
      receipts = [];
      storageReady = true;
      setReceiptFeedback(
        hadReceipts
          ? "Os comprovantes locais foram apagados deste navegador. Nada foi enviado à loja."
          : "Não havia comprovantes locais; os dados de comprovantes foram apagados deste navegador.",
      );
    } catch {
      setReceiptError(
        "Não foi possível apagar os comprovantes locais. Verifique as permissões ou o espaço disponível neste navegador e tente novamente.",
      );
    }
  });

  window.addEventListener("dinda:cart-updated", renderSummary);
  window.addEventListener("storage", (event) => {
    if (!orderFinalized && event.key === window.DindaStore.CART_KEY)
      renderSummary();
  });

  const cartItems = window.DindaStore.readCart();
  const cartPrivacy = stripCartObservations(cartItems);
  if (cartPrivacy.changed) {
    let observationsRemoved = false;
    try {
      observationsRemoved = window.DindaStore.saveCart(cartPrivacy.items);
    } catch {
      observationsRemoved = false;
    }
    if (!observationsRemoved) {
      privacyReady = false;
      setReceiptError(
        "A sacola contém observações antigas que não puderam ser removidas. Para proteger esses dados, o registro está bloqueado; tente novamente ou limpe a sacola.",
      );
    }
  }

  const receiptState = readAndSanitizeReceipts();
  receipts = receiptState.receipts;
  storageReady = receiptState.ok;
  if (!receiptState.ok) {
    setReceiptError(
      "Não foi possível ler ou proteger os comprovantes locais. Para evitar gravar dados pessoais ou duplicar uma solicitação, o registro está bloqueado. Você pode apagar os comprovantes pelo controle abaixo.",
    );
  } else {
    const startupMessages = [];
    if (cartPrivacy.changed && storageReady)
      startupMessages.push(
        "Observações antigas foram removidas da sacola neste navegador.",
      );
    if (receiptState.changed)
      startupMessages.push(
        "Os comprovantes antigos foram atualizados para remover dados pessoais e observações.",
      );
    if (startupMessages.length && storageReady && privacyReady)
      setReceiptFeedback(startupMessages.join(" "));
  }

  form.elements.phone.setAttribute("aria-describedby", "telefone-ajuda");
  toggleAddress();
  renderSummary();
})();
