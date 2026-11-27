(() => {
  "use strict";

  const conteudoSacola = document.getElementById("sacola-conteudo");
  if (!conteudoSacola || !window.DindaStore) return;

  const modeloVazio = document.getElementById("modelo-sacola-vazia");
  const modeloComItens = document.getElementById("modelo-sacola-com-itens");
  const modeloItem = document.getElementById("modelo-item-sacola");
  const modeloDetalhe = document.getElementById("modelo-detalhe-item");
  let focoPendente = null;

  function restaurarFoco() {
    if (!focoPendente) return;
    const foco = focoPendente;
    focoPendente = null;
    const botoes = Array.from(conteudoSacola.querySelectorAll("[data-unidades][data-id]"));
    const equivalente = botoes.find((botao) => botao.dataset.id === foco.id && botao.dataset.unidades === foco.quantity);
    const alternativa = botoes.find((botao) => botao.dataset.unidades === "1") || conteudoSacola.querySelector("a");
    (equivalente || alternativa)?.focus({ preventScroll: true });
  }

  function preencherItem(item, imagensProdutos) {
    const fragmento = modeloItem.content.cloneNode(true);
    const artigo = fragmento.querySelector(".sacola-item");
    const imagem = fragmento.querySelector("[data-imagem-item]");
    const reserva = fragmento.querySelector("[data-imagem-reserva]");
    const nome = String(item.nome || "Produto");
    const descricao = item.descricao || (item.personalizado ? "Bolo montado especialmente para você." : "Preparado artesanalmente para deixar seu dia mais gostoso.");
    const enderecoImagem = window.DindaStore.safeImage(imagensProdutos.get(item.id) || item.imagem, "");

    fragmento.querySelector("[data-nome-item]").textContent = nome;
    fragmento.querySelector("[data-descricao-item]").textContent = descricao;
    fragmento.querySelector("[data-preco-unitario]").textContent = `${window.DindaStore.money(item.preco)} por unidade`;
    fragmento.querySelector("[data-total-item]").textContent = window.DindaStore.money(item.preco * item.qtd);
    fragmento.querySelector("[data-quantidade]").textContent = item.qtd;
    fragmento.querySelector("[data-grupo-quantidade]").setAttribute("aria-label", `Quantidade de ${nome}`);
    fragmento.querySelectorAll("[data-unidades]").forEach((botao) => {
      botao.dataset.id = item.id;
      botao.setAttribute("aria-label", `${botao.dataset.unidades === "1" ? "Aumentar" : "Diminuir"} quantidade de ${nome}`);
    });
    const botaoRemover = fragmento.querySelector("[data-remover-item]");
    botaoRemover.dataset.id = item.id;
    botaoRemover.setAttribute("aria-label", `Remover ${nome} da sacola`);

    if (enderecoImagem) {
      imagem.src = enderecoImagem;
      imagem.alt = nome;
      imagem.addEventListener("error", () => {
        imagem.hidden = true;
        reserva.hidden = false;
      }, { once: true });
    } else {
      imagem.hidden = true;
      reserva.hidden = false;
    }

    const detalhes = Object.entries(item.detalhes || {}).filter(([, valor]) => String(valor).trim());
    const areaDetalhes = fragmento.querySelector("[data-detalhes-item]");
    if (detalhes.length) {
      areaDetalhes.hidden = false;
      detalhes.forEach(([rotulo, valor]) => {
        const linha = modeloDetalhe.content.cloneNode(true);
        linha.querySelector("b").textContent = `${rotulo}: `;
        linha.querySelector("span").textContent = String(valor);
        areaDetalhes.append(linha);
      });
    }
    return artigo;
  }

  function renderizarSacola() {
    const itens = window.DindaStore.readCart();
    conteudoSacola.setAttribute("aria-busy", "false");
    conteudoSacola.replaceChildren();

    if (!itens.length) {
      conteudoSacola.append(modeloVazio.content.cloneNode(true));
      restaurarFoco();
      return;
    }

    const estrutura = modeloComItens.content.cloneNode(true);
    const lista = estrutura.querySelector("[data-lista-itens]");
    const imagensProdutos = new Map(window.DindaStore.readProducts().map((produto) => [produto.id, produto.imagem]));
    itens.forEach((item) => lista.append(preencherItem(item, imagensProdutos)));
    const quantidade = window.DindaStore.itemCount(itens);
    estrutura.querySelector("[data-total-produtos]").textContent = `${itens.length} ${itens.length === 1 ? "produto" : "produtos"}`;
    estrutura.querySelector("[data-total-unidades]").textContent = `${quantidade} ${quantidade === 1 ? "unidade" : "unidades"}`;
    estrutura.querySelector("[data-subtotal]").textContent = window.DindaStore.money(window.DindaStore.subtotal(itens));
    conteudoSacola.append(estrutura);
    restaurarFoco();
  }

  conteudoSacola.addEventListener("click", (evento) => {
    const botaoQuantidade = evento.target.closest("[data-unidades][data-id]");
    if (botaoQuantidade) {
      const itens = window.DindaStore.readCart();
      const item = itens.find((entrada) => entrada.id === botaoQuantidade.dataset.id);
      if (!item) return;
      item.qtd = Math.max(1, Math.min(99, item.qtd + Number(botaoQuantidade.dataset.unidades)));
      focoPendente = { id: item.id, quantidade: botaoQuantidade.dataset.unidades };
      if (window.DindaStore.saveCart(itens)) {
        window.DindaToast?.(`${item.nome}: ${item.qtd} ${item.qtd === 1 ? "unidade" : "unidades"}. Subtotal: ${window.DindaStore.money(window.DindaStore.subtotal(itens))}.`);
      } else {
        focoPendente = null;
        window.DindaToast?.("Não foi possível salvar a quantidade neste navegador.");
      }
      return;
    }

    const botaoRemover = evento.target.closest("[data-remover-item][data-id]");
    if (botaoRemover) {
      const atuais = window.DindaStore.readCart();
      const indice = atuais.findIndex((item) => item.id === botaoRemover.dataset.id);
      const itens = atuais.filter((item) => item.id !== botaoRemover.dataset.id);
      const proximo = itens[Math.min(indice, itens.length - 1)];
      focoPendente = proximo ? { id: proximo.id, quantidade: "1" } : null;
      if (window.DindaStore.saveCart(itens)) window.DindaToast?.(`Item removido. Subtotal: ${window.DindaStore.money(window.DindaStore.subtotal(itens))}.`);
      else {
        focoPendente = null;
        window.DindaToast?.("Não foi possível remover o item neste navegador.");
      }
    }
  });

  window.addEventListener("dinda:cart-updated", renderizarSacola);
  window.addEventListener("storage", (evento) => {
    if (evento.key === window.DindaStore.CART_KEY) renderizarSacola();
  });
  renderizarSacola();
})();
