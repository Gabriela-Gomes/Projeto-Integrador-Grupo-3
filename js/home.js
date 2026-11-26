(() => {
  "use strict";

  const grid = document.getElementById("produto-grade");
  if (!grid || !window.DindaStore) return;

  const search = document.getElementById("produto-buscar");
  const clearButton = document.getElementById("limpar-buscar");
  const status = document.getElementById("catalogo-status");
  const noResults = document.getElementById("nao-resultados");
  const filters = Array.from(document.querySelectorAll("[data-filtro]"));
  const reviewGrid = document.getElementById("depoimento-grade");
  const reviewForm = document.getElementById("avaliacao-formulario");
  const reviewFeedback = document.getElementById("avaliacao-comentario");
  let activeFilter = "todos";
  let cards = [];

  const modeloProduto = document.getElementById("modelo-cartao-produto");
  const modeloAvaliacao = document.getElementById("modelo-avaliacao-cliente");


  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .trim();
  }

  function renderProducts() {
    if (!modeloProduto) return;
    const produtos = window.DindaStore.readProducts().filter((produto) => produto.ativo);
    const fragmento = document.createDocumentFragment();

    produtos.forEach((produto) => {
      const cartao = modeloProduto.content.cloneNode(true);
      const artigo = cartao.querySelector("[data-produto-cartao]");
      const imagem = cartao.querySelector("[data-imagem-produto]");
      const nome = String(produto.nome || "Produto");
      const categoria = produto.categoria || "doces";
      const rotulos = { bolos: "Bolos", salgados: "Salgados", doces: "Doces" };

      artigo.dataset.id = produto.id;
      artigo.dataset.categoria = categoria;
      artigo.dataset.nome = nome;
      cartao.querySelector("[data-nome-produto]").textContent = nome;
      cartao.querySelector("[data-descricao-produto]").textContent = produto.descricao || "Preparado artesanalmente para deixar seu dia mais gostoso.";
      cartao.querySelector("[data-categoria-produto]").textContent = rotulos[categoria] || "Doces";
      cartao.querySelector("[data-preco-produto]").textContent = window.DindaStore.money(produto.preco);
      const enderecoImagem = window.DindaStore.safeImage(produto.imagem, "");
      if (enderecoImagem) {
        imagem.src = enderecoImagem;
        imagem.alt = nome;
      } else {
        imagem.remove();
      }
      const botao = cartao.querySelector("[data-adicionar-produto]");
      botao.dataset.adicionar = produto.id;
      botao.setAttribute("aria-label", `Adicionar ${nome} à sacola`);
      fragmento.append(cartao);
    });

    grid.replaceChildren(fragmento);
    cards = Array.from(grid.querySelectorAll("[data-produto-cartao]"));
    applyFilters();
  }

  function applyFilters() {
    const term = normalize(search?.value || "");
    let visible = 0;
    cards.forEach((card) => {
      const categoryMatches =
        activeFilter === "todos" || card.dataset.categoria === activeFilter;
      const searchMatches =
        !term ||
        normalize(`${card.dataset.nome} ${card.textContent}`).includes(term);
      const show = categoryMatches && searchMatches;
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (noResults) {
      noResults.hidden = visible !== 0;
      noResults.textContent = cards.length
        ? "Nenhum produto encontrado. Tente outro nome ou categoria."
        : "O cardápio local está vazio no momento. Consulte a central demonstrativa da loja.";
    }
    if (status)
      status.textContent = `${visible} ${visible === 1 ? "produto encontrado" : "produtos encontrados"}${term ? ` para “${search.value.trim()}”` : ""}.`;
    if (clearButton) clearButton.hidden = !search?.value;
  }

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filtro || "todos";
      filters.forEach((filter) => {
        const active = filter === button;
        filter.classList.toggle("ativo", active);
        filter.setAttribute("aria-pressed", String(active));
      });
      applyFilters();
    });
  });

  search?.addEventListener("input", applyFilters);
  clearButton?.addEventListener("click", () => {
    search.value = "";
    search.focus();
    applyFilters();
  });

  const queryCategory = new URLSearchParams(window.location.search).get(
    "categoria",
  );
  if (["bolos", "salgados", "doces"].includes(queryCategory)) {
    const button = filters.find(
      (filter) => filter.dataset.filtro === queryCategory,
    );
    button?.click();
  }

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-adicionar]");
    if (!button) return;
    const product = window.DindaStore.getProduct(button.dataset.adicionar);
    if (!product) return;
    const saved = window.DindaStore.addItem({ ...product, qtd: 1 });
    if (saved) window.DindaToast?.(`${product.nome} adicionado à sacola.`);
    else
      window.DindaToast?.(
        "Não foi possível atualizar a sacola neste navegador.",
      );
  });

  function renderApprovedReviews() {
    if (!reviewGrid || !window.DindaReviews || !modeloAvaliacao) return;
    reviewGrid.querySelectorAll("[data-avaliacao-local]").forEach((elemento) => elemento.remove());
    const fragmento = document.createDocumentFragment();
    window.DindaReviews.read()
      .filter((avaliacao) => avaliacao.status === "aprovada")
      .forEach((avaliacao) => {
        const cartao = modeloAvaliacao.content.cloneNode(true);
        const bloco = cartao.querySelector("[data-avaliacao-local]");
        bloco.dataset.avaliacaoLocal = avaliacao.id;
        const estrelas = cartao.querySelector("[data-estrelas-avaliacao]");
        estrelas.setAttribute("aria-label", `${avaliacao.nota} de 5 estrelas`);
        estrelas.textContent = "★".repeat(avaliacao.nota) + "☆".repeat(5 - avaliacao.nota);
        cartao.querySelector("[data-texto-avaliacao]").textContent = `“${avaliacao.texto}”`;
        fragmento.append(cartao);
      });
    reviewGrid.append(fragmento);
  }

  reviewForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!window.DindaReviews || !reviewFeedback) return;
    const rating = Number(reviewForm.elements.rating.value);
    const text = String(reviewForm.elements.review.value || "").trim();
    if (text.length < 12 || text.length > 500) {
      reviewFeedback.textContent =
        "Escreva uma avaliação entre 12 e 500 caracteres.";
      reviewFeedback.hidden = false;
      reviewForm.elements.review.focus();
      return;
    }
    if (!window.DindaReviews.add(rating, text)) {
      reviewFeedback.textContent =
        "Não foi possível guardar a avaliação neste navegador. Tente novamente.";
      reviewFeedback.hidden = false;
      return;
    }
    reviewForm.reset();
    reviewFeedback.textContent =
      "Avaliação recebida como pendente nesta demonstração local. Ela só ficará pública depois de aprovada na central da loja; nada foi enviado.";
    reviewFeedback.hidden = false;
  });

  window.addEventListener("dinda:products-updated", renderProducts);
  window.addEventListener("dinda:reviews-updated", renderApprovedReviews);
  window.addEventListener("storage", (event) => {
    if (event.key === window.DindaStore.PRODUCTS_KEY) renderProducts();
    if (event.key === window.DindaReviews?.KEY) renderApprovedReviews();
  });

  renderProducts();
  renderApprovedReviews();
})();
