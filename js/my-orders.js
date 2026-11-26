(() => {
  "use strict";

  const lista = document.getElementById("local-pedidos-lista");
  const modeloVazio = document.getElementById("estado-vazio-pedidos-template");
  const modeloPedido = document.getElementById("pedido-local-template");
  const modeloItem = document.getElementById("item-pedido-template");
  const modeloDetalhe = document.getElementById("detalhe-item-template");
  if (
    !lista ||
    !window.DindaAdmin ||
    !modeloVazio ||
    !modeloPedido ||
    !modeloItem ||
    !modeloDetalhe
  )
    return;

  function limparLista() {
    while (lista.firstChild) lista.removeChild(lista.firstChild);
  }

  function renderizarItem(item) {
    const fragmento = modeloItem.content.cloneNode(true);
    const linha = fragmento.querySelector("li");
    const detalhes = item.detalhes || {};

    linha.querySelector("[data-item-resumo]").textContent =
      `${item.qtd} × ${item.nome} — `;
    linha.querySelector("[data-item-valor]").textContent =
      window.DindaStore.money(item.preco * item.qtd);

    const recipienteDetalhes = linha.querySelector("[data-item-detalhes]");
    Object.entries(detalhes).forEach(([chave, valor]) => {
      const detalhe = modeloDetalhe.content.cloneNode(true);
      detalhe.querySelector("[data-item-detalhe]").textContent =
        `${chave}: ${valor}`;
      recipienteDetalhes.appendChild(detalhe);
    });

    return fragmento;
  }

  function renderizar() {
    const pedidos = window.DindaAdmin.readOrders();
    lista.setAttribute("aria-busy", "false");
    limparLista();

    if (!pedidos.length) {
      lista.appendChild(modeloVazio.content.cloneNode(true));
      return;
    }

    pedidos.forEach((pedido) => {
      const fragmento = modeloPedido.content.cloneNode(true);
      const cartao = fragmento.querySelector("article");
      cartao.querySelector("[data-pedido-referencia]").textContent =
        pedido.referencia;
      cartao.querySelector("[data-pedido-data]").textContent =
        window.DindaAdmin.formatDate(pedido.criadoEm);

      const estado = cartao.querySelector("[data-pedido-status]");
      estado.textContent = pedido.status;
      estado.setAttribute("data-situacao", pedido.status);

      const listaItens = cartao.querySelector("[data-pedido-itens]");
      pedido.itens.forEach((item) => {
        listaItens.appendChild(renderizarItem(item));
      });

      cartao.querySelector("[data-pedido-subtotal]").textContent =
        window.DindaStore.money(pedido.subtotal);
      cartao.querySelector("[data-pedido-link]").setAttribute(
        "href",
        `rastreio.html?referencia=${encodeURIComponent(pedido.referencia)}`,
      );
      lista.appendChild(fragmento);
    });
  }

  window.addEventListener("dinda:orders-updated", renderizar);
  window.addEventListener("storage", (evento) => {
    if (evento.key === window.DindaAdmin.ORDERS_KEY) renderizar();
  });
  renderizar();
})();
