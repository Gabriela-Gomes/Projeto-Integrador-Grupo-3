(() => {
  "use strict";
  const form = document.getElementById("produto-formulario");
  const grid = document.getElementById("administracao-produtos");
  if (!form || !grid || !window.DindaStore) return;
  const search = document.getElementById("produto-administracao-buscar");
  const filters = Array.from(
    document.querySelectorAll("[data-produto-filtro]"),
  );
  const status = document.getElementById("produto-comentario");
  const imageInput = document.getElementById("produto-imagem");
  const imagePreview = document.getElementById("produto-imagem-previsualizacao");
  let activeFilter = "todos";
  let selectedImage = imagePreview?.getAttribute("src") || "img/bolo5.jpg";
  const modeloProduto = document.getElementById("modelo-produto-administrativo");
  const modeloVazio = document.getElementById("modelo-catalogo-vazio");

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type))
        return reject(new Error("Escolha uma imagem JPG, PNG ou WEBP."));
      if (file.size > 8 * 1024 * 1024)
        return reject(new Error("A imagem deve ter até 8 MB."));
      const reader = new FileReader();
      reader.onerror = () =>
        reject(new Error("Não foi possível ler a imagem."));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error("Arquivo de imagem inválido."));
        image.onload = () => {
          const scale = Math.min(1, 1000 / Math.max(image.width, image.height));
          const canvas = document.getElementById("processador-imagem-produto");
          if (!canvas) return reject(new Error("Área de processamento de imagem não encontrada."));
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.76));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  imageInput?.addEventListener("change", async () => {
    const file = imageInput.files?.[0];
    if (!file) return;
    try {
      selectedImage = await compressImage(file);
      imagePreview.src = selectedImage;
      announce("Imagem pronta para salvar.");
    } catch (error) {
      imageInput.value = "";
      announce(error.message);
    }
  });

  function announce(message) {
    status.textContent = message;
    status.hidden = false;
  }
  function resetForm() {
    form.reset();
    document.getElementById("produto-id").value = "";
    document.getElementById("produto-formulario-titulo").textContent = "Novo produto";
    document.getElementById("produto-ativo").checked = true;
    selectedImage = "img/bolo5.jpg";
    imageInput.value = "";
    imagePreview.src = selectedImage;
  }

  function render() {
    const term = String(search?.value || "")
      .trim()
      .toLocaleLowerCase("pt-BR");
    const all = window.DindaStore.readProducts();
    const products = all.filter(
      (product) =>
        (activeFilter === "todos" || product.categoria === activeFilter) &&
        (!term ||
          `${product.nome} ${product.descricao}`
            .toLocaleLowerCase("pt-BR")
            .includes(term)),
    );
    const count = document.getElementById("produto-contagem");
    if (count)
      count.textContent = `${all.length} ${all.length === 1 ? "produto" : "produtos"} locais`;
    const fragmento = document.createDocumentFragment();
    if (!products.length) {
      if (modeloVazio) fragmento.append(modeloVazio.content.cloneNode(true));
      grid.replaceChildren(fragmento);
      return;
    }

    products.forEach((product) => {
      if (!modeloProduto) return;
      const cartao = modeloProduto.content.cloneNode(true);
      const artigo = cartao.querySelector(".administracao-produto-cartao");
      const imagem = cartao.querySelector("[data-imagem-produto]");
      imagem.src = window.DindaStore.safeImage(product.imagem);
      imagem.alt = `Imagem de ${product.nome}`;
      cartao.querySelector("[data-situacao-produto]").textContent = `${product.categoria === "bolos" ? "Bolos" : product.categoria === "salgados" ? "Salgados" : "Doces"} · ${product.ativo ? "Visível" : "Oculto"}`;
      cartao.querySelector("[data-nome-produto]").textContent = product.nome;
      cartao.querySelector("[data-descricao-produto]").textContent = product.descricao || "Sem descrição cadastrada.";
      cartao.querySelector("[data-preco-produto]").textContent = window.DindaStore.money(product.preco);
      cartao.querySelector("[data-editar-produto]").dataset.editarProduto = product.id;
      cartao.querySelector("[data-excluir-produto]").dataset.excluirProduto = product.id;
      artigo.dataset.id = product.id;
      fragmento.append(cartao);
    });
    grid.replaceChildren(fragmento);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = String(form.elements.name.value || "").trim();
    const price = Number(form.elements.price.value);
    if (name.length < 2 || !Number.isFinite(price) || price < 0) {
      announce("Informe nome e preço válidos.");
      form.elements.name.focus();
      return;
    }
    const id =
      document.getElementById("produto-id").value ||
      `produto-${Date.now().toString(36)}`;
    const product = {
      id,
      nome: name,
      descricao: form.elements.description.value,
      preco: price,
      categoria: form.elements.category.value,
      imagem: window.DindaStore.safeImage(selectedImage),
      ativo: document.getElementById("produto-ativo").checked,
    };
    if (!window.DindaStore.saveProduct(product)) {
      announce(
        "Não foi possível salvar o produto neste navegador. Verifique o espaço disponível.",
      );
      return;
    }
    resetForm();
    announce(
      "Produto salvo localmente. O cardápio público deste navegador já foi atualizado.",
    );
    render();
  });

  document
    .getElementById("cancelar-produto-editar")
    ?.addEventListener("click", resetForm);
  document.getElementById("redefinir-produtos")?.addEventListener("click", () => {
    if (
      !window.confirm(
        "Restaurar o catálogo padrão desta demonstração? As alterações locais nos produtos serão apagadas.",
      )
    )
      return;
    try {
      localStorage.removeItem(window.DindaStore.PRODUCTS_KEY);
      window.dispatchEvent(new CustomEvent("dinda:products-updated"));
      resetForm();
      announce("Catálogo padrão restaurado neste navegador.");
      render();
    } catch {
      announce("Não foi possível restaurar o catálogo padrão.");
    }
  });

  grid.addEventListener("click", (event) => {
    const edit = event.target.closest("[data-editar-produto]");
    if (edit) {
      const product = window.DindaStore.readProducts().find(
        (item) => item.id === edit.dataset.editarProduto,
      );
      if (!product) return;
      document.getElementById("produto-id").value = product.id;
      form.elements.name.value = product.nome;
      form.elements.description.value = product.descricao;
      form.elements.price.value = product.preco;
      form.elements.category.value = product.categoria;
      selectedImage = window.DindaStore.safeImage(product.imagem);
      imageInput.value = "";
      imagePreview.src = selectedImage;
      document.getElementById("produto-ativo").checked = product.ativo;
      document.getElementById("produto-formulario-titulo").textContent =
        "Editar produto";
      form.elements.name.focus();
      return;
    }
    const remove = event.target.closest("[data-excluir-produto]");
    if (remove) {
      if (
        !window.confirm(
          "Excluir este produto do catálogo local? A mudança vale apenas neste navegador.",
        )
      )
        return;
      const ok = window.DindaStore.removeProduct(remove.dataset.excluirProduto);
      announce(
        ok
          ? "Produto removido do catálogo local deste navegador."
          : "Não foi possível remover o produto.",
      );
      render();
    }
  });

  filters.forEach((button) =>
    button.addEventListener("click", () => {
      activeFilter = button.dataset.produtoFiltro || "todos";
      filters.forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
      render();
    }),
  );
  search?.addEventListener("input", render);
  window.addEventListener("dinda:products-updated", render);
  window.addEventListener("storage", (event) => {
    if (event.key === window.DindaStore.PRODUCTS_KEY) render();
  });
  render();
})();
