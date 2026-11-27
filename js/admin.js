(() => {
  "use strict";

  const ORDERS_KEY = "dinda_pedidos_demo";
  const STATUSES = [
    "Recebido",
    "Confirmado",
    "Em produção",
    "Pronto",
    "Concluído",
    "Cancelado",
  ];
  const ALLOWED_DETAILS = [
    "Tamanho",
    "Massa",
    "Recheio",
    "Cobertura",
    "Extras",
    "Data desejada",
  ];
  const safeText = (value, limit = 180) =>
    String(value ?? "")
      .trim()
      .slice(0, limit);
  const READ_ERROR_MESSAGE =
    "Não foi possível confirmar e persistir a limpeza dos registros antigos. Por segurança, nenhum pedido foi exibido nem alterado. Dados antigos podem continuar neste navegador; limpe os dados deste site nas configurações do navegador e não use informações reais neste painel.";
  let ordersReadError = "";

  function sanitizeOrder(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const referencia = safeText(raw.referencia || raw.reference, 48);
    const criadoEm = safeText(raw.criadoEm || raw.createdAt || raw.data, 40);
    const subtotal = Number(raw.subtotal);
    if (
      !referencia ||
      !Number.isFinite(Date.parse(criadoEm)) ||
      !Number.isFinite(subtotal)
    )
      return null;
    const itens = Array.isArray(raw.itens || raw.items)
      ? (raw.itens || raw.items)
          .slice(0, 50)
          .map((item) => {
            if (!item || typeof item !== "object" || Array.isArray(item))
              return null;
            const preco = Number(item.preco ?? item.price);
            const qtd = Number(item.qtd ?? item.quantity);
            const nome = safeText(
              item.nome || item.name || "Produto Dinda",
              180,
            );
            if (!Number.isFinite(preco) || preco < 0) return null;
            const cleanItem = {
              nome,
              preco: Math.round((preco + Number.EPSILON) * 100) / 100,
              qtd: Number.isFinite(qtd)
                ? Math.max(1, Math.min(99, Math.round(qtd)))
                : 1,
            };
            const cleanDetails = {};
            const details =
              item.detalhes &&
              typeof item.detalhes === "object" &&
              !Array.isArray(item.detalhes)
                ? item.detalhes
                : {};
            for (const key of ALLOWED_DETAILS) {
              const value = details[key];
              if (typeof value === "string" && value.trim())
                cleanDetails[key] = safeText(value, 160);
            }
            if (Object.keys(cleanDetails).length)
              cleanItem.detalhes = cleanDetails;
            return cleanItem;
          })
          .filter(Boolean)
      : [];
    if (!itens.length) return null;
    const status = STATUSES.includes(raw.status) ? raw.status : "Recebido";
    const clean = {
      referencia,
      criadoEm,
      subtotal: Math.max(
        0,
        Math.round((subtotal + Number.EPSILON) * 100) / 100,
      ),
      itens,
      status,
    };
    if (raw.limpezaPendente === true) clean.limpezaPendente = true;
    return clean;
  }

  function setOrdersReadError(message) {
    ordersReadError = message;
    if (typeof document === "undefined" || !document.querySelectorAll) return;
    document
      .querySelectorAll("[data-administracao-armazenamento-aviso]")
      .forEach((node) => {
        node.textContent = message;
        node.hidden = !message;
      });
  }

  function readOrders() {
    setOrdersReadError("");
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      if (!raw) return [];
      const stored = JSON.parse(raw);
      if (!Array.isArray(stored)) {
        setOrdersReadError(READ_ERROR_MESSAGE);
        return [];
      }
      const clean = stored
        .map(sanitizeOrder)
        .filter(Boolean)
        .slice(-100)
        .reverse();
      const normalized = JSON.stringify(clean.slice().reverse());
      if (raw !== normalized) {
        try {
          localStorage.setItem(ORDERS_KEY, normalized);
        } catch {
          setOrdersReadError(READ_ERROR_MESSAGE);
          return [];
        }
      }
      return clean;
    } catch {
      setOrdersReadError(READ_ERROR_MESSAGE);
      return [];
    }
  }

  function saveOrders(orders) {
    if (!Array.isArray(orders)) return false;
    const clean = orders.map(sanitizeOrder).filter(Boolean).slice(-100);
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(clean));
      window.dispatchEvent(new CustomEvent("dinda:orders-updated"));
      return true;
    } catch {
      return false;
    }
  }

  function updateStatus(reference, status) {
    if (!STATUSES.includes(status)) return false;
    const orders = readOrders().reverse();
    if (ordersReadError) return false;
    const order = orders.find((item) => item.referencia === String(reference));
    if (!order) return false;
    order.status = status;
    return saveOrders(orders);
  }

  function removeOrder(reference) {
    const orders = readOrders().reverse();
    if (ordersReadError) return false;
    return saveOrders(
      orders.filter((order) => order.referencia !== String(reference)),
    );
  }

  function formatDate(value) {
    const date = new Date(value);
    return Number.isFinite(date.getTime())
      ? new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(date)
      : "Data não disponível";
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (caractere) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[caractere],
    );
  }

  function clonarModelo(id) {
    const modelo = document.getElementById(id);
    return modelo?.content?.firstElementChild?.cloneNode(true) || null;
  }

  function refreshDashboard() {
    const orders = readOrders();
    const reviews = window.DindaReviews?.read?.() || [];
    const products = window.DindaStore?.readProducts?.() || [];
    const definir = (id, valor) => {
      const no = document.getElementById(id);
      if (no) no.textContent = valor;
    };
    definir("metrica-pedidos", String(orders.length));
    definir("metrica-abrir", String(orders.filter((pedido) => !["Concluído", "Cancelado"].includes(pedido.status)).length));
    definir("metrica-producao", String(orders.filter((pedido) => pedido.status === "Em produção").length));
    definir("metrica-subtotal", window.DindaStore?.money(orders.reduce((soma, pedido) => soma + pedido.subtotal, 0)) || "R$ 0,00");
    definir("metrica-produtos", String(products.length));
    definir("metrica-pendente-avaliacoes", String(reviews.filter((avaliacao) => avaliacao.status === "pendente").length));
    definir("metrica-avaliado", String(reviews.filter((avaliacao) => avaliacao.status === "aprovada").length));

    const recentes = document.getElementById("recente-pedidos");
    if (recentes) {
      recentes.replaceChildren();
      if (!orders.length) {
        const vazio = clonarModelo("modelo-vazio-pedidos");
        if (vazio) recentes.append(vazio);
      } else {
        const lista = clonarModelo("modelo-lista-pedidos");
        const modelo = document.getElementById("modelo-pedido-recente");
        const conteudo = modelo?.content?.firstElementChild;
        if (lista && conteudo) {
          orders.slice(0, 4).forEach((pedido) => {
            const cartao = conteudo.cloneNode(true);
            cartao.querySelector("[data-referencia-pedido]").textContent = pedido.reference;
            cartao.querySelector("[data-data-pedido]").textContent = formatDate(pedido.criadoEm);
            const status = cartao.querySelector("[data-situacao-pedido]");
            status.textContent = pedido.status;
            status.dataset.situacao = pedido.status;
            cartao.querySelector("[data-subtotal-pedido]").textContent = `Subtotal estimado: ${window.DindaStore.money(pedido.subtotal)}`;
            lista.append(cartao);
          });
          recentes.append(lista);
        }
      }
    }

    const grafico = document.getElementById("pedidos-grafico");
    const colunaModelo = document.getElementById("modelo-coluna-grafico")?.content?.firstElementChild;
    if (grafico && colunaModelo) {
      grafico.replaceChildren();
      const dias = Array.from({ length: 7 }, (_, indice) => {
        const dia = new Date(); dia.setHours(0, 0, 0, 0); dia.setDate(dia.getDate() - (6 - indice)); return dia;
      });
      const valores = dias.map((dia) => orders.filter((pedido) => new Date(pedido.criadoEm).toDateString() === dia.toDateString()).length);
      const maximo = Math.max(1, ...valores);
      const nomes = dias.map((dia) => new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(dia).replace(".", ""));
      valores.forEach((valor, indice) => {
        const coluna = colunaModelo.cloneNode(true);
        coluna.querySelector("[data-valor-grafico]").textContent = String(valor);
        coluna.querySelector("[data-dia-grafico]").textContent = nomes[indice];
        coluna.querySelector("[data-barra-grafico]").style.height = `${Math.max(3, Math.round((valor / maximo) * 100))}%`;
        grafico.append(coluna);
      });
      grafico.setAttribute("aria-label", `Solicitações locais nos últimos sete dias: ${valores.join(", ")}`);
    }
  }

  window.DindaAdmin = Object.freeze({
    ORDERS_KEY,
    STATUSES,
    sanitizeOrder,
    readOrders,
    saveOrders,
    updateStatus,
    removeOrder,
    formatDate,
    escapeHtml,
    refreshDashboard,
  });
  window.addEventListener("dinda:orders-updated", refreshDashboard);
  window.addEventListener("dinda:products-updated", refreshDashboard);
  window.addEventListener("dinda:reviews-updated", refreshDashboard);
  window.addEventListener("storage", (event) => {
    if (
      [
        ORDERS_KEY,
        window.DindaStore?.PRODUCTS_KEY,
        window.DindaReviews?.KEY,
      ].includes(event.key)
    )
      refreshDashboard();
  });
  document.addEventListener("DOMContentLoaded", refreshDashboard);
  document
    .querySelectorAll("[data-atualizar-painel]")
    .forEach((button) => button.addEventListener("click", refreshDashboard));
  document
    .querySelectorAll("[data-imprimir-pagina]")
    .forEach((button) =>
      button.addEventListener("click", () => window.print()),
    );
})();
