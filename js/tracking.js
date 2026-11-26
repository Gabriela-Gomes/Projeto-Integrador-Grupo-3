(() => {
  "use strict";
  const formulario = document.getElementById("rastreamento-formulario");
  const campoReferencia = document.getElementById("rastreamento-referencia");
  const resultado = document.getElementById("rastreamento-resultado");
  const retorno = document.getElementById("rastreamento-comentario");
  if (!formulario || !campoReferencia || !resultado || !window.DindaAdmin) return;

  const etapas = ["Recebido", "Confirmado", "Em produção", "Pronto", "Concluído"];

  function clonarModelo(identificador) {
    const modelo = document.getElementById(identificador);
    return modelo?.content?.firstElementChild?.cloneNode(true) || null;
  }

  function preencherEtapas(pedido, destino) {
    if (pedido.status === "Cancelado") {
      const aviso = clonarModelo("modelo-aviso-cancelamento-rastreio");
      if (aviso) destino.append(aviso);
      return;
    }
    const linhaTempo = clonarModelo("modelo-linha-tempo-rastreio");
    const modeloEtapa = document.getElementById("modelo-etapa-rastreio")?.content?.firstElementChild;
    if (!linhaTempo || !modeloEtapa) return;
    const etapaAtual = etapas.indexOf(pedido.status);
    etapas.forEach((nome, indice) => {
      const etapa = modeloEtapa.cloneNode(true);
      etapa.textContent = nome;
      etapa.classList.toggle("concluido", etapaAtual >= indice);
      etapa.classList.toggle("atual", etapaAtual === indice);
      linhaTempo.append(etapa);
    });
    destino.append(linhaTempo);
  }

  function preencherItens(pedido, lista) {
    const modeloItem = document.getElementById("modelo-item-rastreio")?.content?.firstElementChild;
    const modeloDetalhe = document.getElementById("modelo-detalhe-item-rastreio")?.content?.firstElementChild;
    if (!modeloItem) return;
    pedido.itens.forEach((item) => {
      const linha = modeloItem.cloneNode(true);
      linha.querySelector("[data-quantidade-item]").textContent = String(item.qtd);
      linha.querySelector("[data-nome-item]").textContent = item.nome;
      const detalhes = linha.querySelector("[data-detalhes-item]");
      if (modeloDetalhe) {
        Object.entries(item.detalhes || {}).forEach(([chave, valor]) => {
          const detalhe = modeloDetalhe.cloneNode(true);
          detalhe.textContent = `${chave}: ${valor}`;
          detalhes.append(detalhe);
        });
      }
      lista.append(linha);
    });
  }

  function exibirPedido(pedido) {
    const cartao = clonarModelo("modelo-resultado-rastreio");
    if (!cartao) return;
    cartao.querySelector("[data-referencia-rastreio]").textContent = pedido.referencia;
    cartao.querySelector("[data-data-rastreio]").textContent = `Registrado ${window.DindaAdmin.formatDate(pedido.criadoEm)}`;
    const estado = cartao.querySelector("[data-situacao-rastreio]");
    estado.textContent = pedido.status;
    estado.setAttribute("data-situacao", pedido.status);
    preencherEtapas(pedido, cartao.querySelector("[data-linha-tempo-rastreio]"));
    preencherItens(pedido, cartao.querySelector("[data-itens-rastreio]"));
    cartao.querySelector("[data-subtotal-rastreio]").textContent = `Subtotal estimado: ${window.DindaStore.money(pedido.subtotal)}`;
    resultado.replaceChildren(cartao);
    resultado.hidden = false;
    retorno.hidden = true;
  }

  function buscar(referencia) {
    const normalizada = String(referencia || "").trim().toUpperCase();
    if (!normalizada) {
      retorno.textContent = "Digite a referência que aparece no comprovante local.";
      retorno.hidden = false;
      resultado.hidden = true;
      campoReferencia.focus();
      return;
    }
    const pedido = window.DindaAdmin.readOrders().find(
      (item) => item.referencia.toUpperCase() === normalizada,
    );
    if (!pedido) {
      retorno.textContent = "Não encontramos essa referência neste navegador. O rastreio demonstrativo não consulta pedidos da loja nem pesquisa por telefone.";
      retorno.hidden = false;
      resultado.hidden = true;
      campoReferencia.focus();
      return;
    }
    exibirPedido(pedido);
  }

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    buscar(campoReferencia.value);
  });
  window.addEventListener("dinda:orders-updated", () => {
    if (!resultado.hidden && campoReferencia.value.trim()) buscar(campoReferencia.value);
  });
  window.addEventListener("storage", (evento) => {
    if (evento.key === window.DindaAdmin.ORDERS_KEY && campoReferencia.value.trim())
      buscar(campoReferencia.value);
  });
  const referenciaInicial = new URLSearchParams(window.location.search).get("referencia");
  if (referenciaInicial) {
    campoReferencia.value = referenciaInicial;
    buscar(referenciaInicial);
  }
})();
