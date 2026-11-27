(() => {
  "use strict";
  const lista = document.getElementById("pedidos-lista");
  if (!lista || !window.DindaAdmin) return;
  const busca = document.getElementById("pedidos-buscar");
  const filtros = Array.from(document.querySelectorAll("[data-pedido-filtro]"));
  const contador = document.getElementById("pedidos-contagem");
  const modeloCartao = document.getElementById("modelo-cartao-pedido");
  const modeloItem = document.getElementById("modelo-item-pedido");
  const modeloDetalhe = document.getElementById("modelo-detalhe-item");
  const modeloOpcao = document.getElementById("modelo-opcao-status");
  const modeloVazio = document.getElementById("modelo-pedido-vazio");
  let filtroAtivo = "todos";

  if (!modeloCartao || !modeloItem || !modeloDetalhe || !modeloOpcao || !modeloVazio) return;

  function preencherCartao(pedido) {
    const cartao = modeloCartao.content.firstElementChild.cloneNode(true);
    const referencia = String(pedido.referencia);
    const status = String(pedido.status);
    cartao.dataset.situacao = status;
    cartao.querySelector("[data-codigo-pedido]").textContent = referencia;
    cartao.querySelector("[data-data-do-pedido]").textContent = window.DindaAdmin.formatDate(pedido.criadoEm);
    cartao.querySelector("[data-situacao-pedido]").textContent = status;
    cartao.querySelector("[data-situacao-pedido]").dataset.situacao = status;

    const seletor = cartao.querySelector("[data-situacao-selecionar]");
    seletor.id = `situacao-${referencia}`;
    seletor.dataset.situacaoSelecionar = referencia;
    cartao.querySelector("[data-situacao-rotulo]").htmlFor = seletor.id;
    window.DindaAdmin.STATUSES.forEach((opcaoStatus) => {
      const opcao = modeloOpcao.content.firstElementChild.cloneNode(true);
      opcao.value = opcaoStatus;
      opcao.textContent = opcaoStatus;
      opcao.selected = opcaoStatus === status;
      seletor.appendChild(opcao);
    });

    cartao.querySelector("[data-pedido-total]").textContent = `Subtotal estimado: ${window.DindaStore.money(pedido.subtotal)}`;
    cartao.querySelector("[data-salvar-status]").dataset.salvarStatus = referencia;
    cartao.querySelector("[data-excluir-pedido]").dataset.excluirPedido = referencia;

    const listaItens = cartao.querySelector("[data-produtos-do-pedido]");
    pedido.itens.forEach((itemPedido) => {
      const item = modeloItem.content.firstElementChild.cloneNode(true);
      item.querySelector("[data-item-descricao]").textContent = `${itemPedido.qtd} × ${itemPedido.nome}`;
      const detalhes = item.querySelector("[data-detalhamento-item]");
      Object.entries(itemPedido.detalhes || {}).forEach(([chave, valor]) => {
        const detalhe = modeloDetalhe.content.firstElementChild.cloneNode(true);
        detalhe.textContent = `${chave}: ${valor}`;
        detalhes.appendChild(detalhe);
      });
      listaItens.appendChild(item);
    });
    return cartao;
  }

  function renderizar() {
    const termo = String(busca?.value || "")
      .trim()
      .toLocaleLowerCase("pt-BR");
    const pedidos = window.DindaAdmin.readOrders().filter((pedido) => {
      const detalhes = pedido.itens
        .map((itemPedido) => Object.values(itemPedido.detalhes || {}).join(" "))
        .join(" ");
      const combinaStatus = filtroAtivo === "todos" || pedido.status === filtroAtivo;
      const texto = `${pedido.referencia} ${pedido.status} ${pedido.itens.map((itemPedido) => itemPedido.nome).join(" ")} ${detalhes}`.toLocaleLowerCase("pt-BR");
      return combinaStatus && (!termo || texto.includes(termo));
    });
    if (contador)
      contador.textContent = `${pedidos.length} ${pedidos.length === 1 ? "pedido local" : "pedidos locais"}`;
    lista.replaceChildren();
    if (!pedidos.length) {
      lista.appendChild(modeloVazio.content.firstElementChild.cloneNode(true));
      return;
    }
    pedidos.forEach((pedido) => lista.appendChild(preencherCartao(pedido)));
  }

  filtros.forEach((botao) =>
    botao.addEventListener("click", () => {
      filtroAtivo = botao.dataset.pedidoFiltro || "todos";
      filtros.forEach((item) => item.setAttribute("aria-pressed", String(item === botao)));
      renderizar();
    }),
  );
  busca?.addEventListener("input", renderizar);
  lista.addEventListener("click", (evento) => {
    const alvo = evento.target;
    if (!(alvo instanceof Element)) return;
    const salvar = alvo.closest("[data-salvar-status]");
    if (salvar) {
      const referencia = salvar.dataset.salvarStatus;
      const seletor = lista.querySelector(`[data-situacao-selecionar="${CSS.escape(referencia)}"]`);
      const ok = window.DindaAdmin.updateStatus(referencia, seletor?.value);
      window.DindaToast?.(
        ok
          ? "Status local atualizado. O histórico e o rastreio deste navegador refletem a alteração."
          : "Não foi possível atualizar o status local.",
      );
      renderizar();
      return;
    }
    const apagar = alvo.closest("[data-excluir-pedido]");
    if (apagar) {
      if (!window.confirm("Apagar este registro demonstrativo deste navegador? Ele também será removido do histórico e do rastreio locais."))
        return;
      const ok = window.DindaAdmin.removeOrder(apagar.dataset.excluirPedido);
      window.DindaToast?.(
        ok ? "Registro local apagado." : "Não foi possível apagar o registro local.",
      );
      renderizar();
    }
  });
  window.addEventListener("dinda:orders-updated", renderizar);
  window.addEventListener("storage", (evento) => {
    if (evento.key === window.DindaAdmin.ORDERS_KEY) renderizar();
  });
  renderizar();
})();
