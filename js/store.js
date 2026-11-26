(() => {
  "use strict";

  const CART_KEY = "dinda_carrinho";
  const PRODUCTS_KEY = "dinda_produtos_demo";
  const CATEGORIES = ["bolos", "salgados", "doces"];
  const DEFAULT_PRODUCTS = [
    {
      id: "bolo-1",
      nome: "Bolo Supremo de Chocolate",
      descricao: "Massa fofinha, chocolate e recheio especial.",
      preco: 49.9,
      categoria: "bolos",
      imagem: "img/bolo5.jpg",
      ativo: true,
    },
    {
      id: "bolo-2",
      nome: "Bolo Caseiro de Cenoura com Chocolate",
      descricao: "Leve, macio e perfeito para o café da tarde.",
      preco: 42.9,
      categoria: "bolos",
      imagem: "img/bolo-5.jpg",
      ativo: true,
    },
    {
      id: "bolo-3",
      nome: "Bolo de Limão",
      descricao: "Camadas delicadas com recheio cremoso.",
      preco: 59.9,
      categoria: "bolos",
      imagem: "img/bolo-limao.jpg",
      ativo: true,
    },
    {
      id: "bolo-4",
      nome: "Bolo de Ninho com Morango",
      descricao: "Recheio cremoso e morangos frescos.",
      preco: 64.9,
      categoria: "bolos",
      imagem: "img/bolo7.jpg",
      ativo: true,
    },
    {
      id: "salgado-1",
      nome: "Coxinha Artesanal",
      descricao: "Crocante por fora e recheada com capricho.",
      preco: 8.9,
      categoria: "salgados",
      imagem: "img/salgados.jpg",
      ativo: true,
    },
    {
      id: "salgado-2",
      nome: "Mini Salgados para Festa",
      descricao: "Uma seleção variada para compartilhar.",
      preco: 39.9,
      categoria: "salgados",
      imagem: "img/salgados1.jpg",
      ativo: true,
    },
    {
      id: "salgado-3",
      nome: "Empadinha Especial",
      descricao: "Massa delicada e recheio bem cremoso.",
      preco: 7.9,
      categoria: "salgados",
      imagem: "img/coxinha.jpg",
      ativo: true,
    },
    {
      id: "doce-1",
      nome: "Brigadeiro Gourmet",
      descricao: "Chocolate intenso e acabamento delicado.",
      preco: 4.9,
      categoria: "doces",
      imagem: "img/brigadeiro.jpg",
      ativo: true,
    },
    {
      id: "doce-2",
      nome: "Torta Cremosa",
      descricao: "Uma sobremesa cremosa para dividir.",
      preco: 54.9,
      categoria: "doces",
      imagem: "img/docinhos.jpg",
      ativo: true,
    },
    {
      id: "doce-3",
      nome: "Docinhos Gourmet",
      descricao: "Pequenos detalhes para adoçar o seu dia.",
      preco: 34.9,
      categoria: "doces",
      imagem: "img/docinhos1.jpg",
      ativo: true,
    },
  ].map((product) => Object.freeze(product));

  const money = (value) =>
    Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  function safeImage(value, fallback = DEFAULT_PRODUCTS[0].imagem) {
    const path = String(value || "");
    return /^(?:\/manus-storage\/|\/?img\/)[a-zA-Z0-9._-]+$/.test(path) ||
      (/^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/]+=*$/i.test(path) &&
        path.length <= 1900000)
      ? path
      : fallback;
  }

  function normalizeProduct(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const id = String(raw.id || "").trim();
    const nome = String(raw.nome || "")
      .trim()
      .slice(0, 90);
    const preco = Number(raw.preco);
    const categoria = String(raw.categoria || "").toLowerCase();
    if (
      !/^[A-Za-z0-9_-]{1,48}$/.test(id) ||
      nome.length < 2 ||
      !Number.isFinite(preco) ||
      preco < 0 ||
      preco > 100000 ||
      !CATEGORIES.includes(categoria)
    )
      return null;
    const fallback =
      DEFAULT_PRODUCTS.find((item) => item.id === id)?.imagem ||
      DEFAULT_PRODUCTS[0].imagem;
    return {
      id,
      nome,
      descricao: String(raw.descricao || "")
        .trim()
        .slice(0, 240),
      preco: Math.round((preco + Number.EPSILON) * 100) / 100,
      categoria,
      imagem: safeImage(raw.imagem, fallback),
      ativo: raw.ativo !== false,
    };
  }

  function readProducts() {
    try {
      const raw = localStorage.getItem(PRODUCTS_KEY);
      if (raw === null) return DEFAULT_PRODUCTS.map((item) => ({ ...item }));
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed))
        return DEFAULT_PRODUCTS.map((item) => ({ ...item }));
      const seen = new Set();
      return parsed.map(normalizeProduct).filter((item) => {
        if (!item || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    } catch {
      return DEFAULT_PRODUCTS.map((item) => ({ ...item }));
    }
  }

  function saveProducts(items) {
    if (!Array.isArray(items)) return false;
    const normalized = [];
    const ids = new Set();
    for (const raw of items) {
      const product = normalizeProduct(raw);
      if (!product || ids.has(product.id)) return false;
      ids.add(product.id);
      normalized.push(product);
    }
    try {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(normalized));
      window.dispatchEvent(new CustomEvent("dinda:products-updated"));
      return true;
    } catch {
      return false;
    }
  }

  function saveProduct(raw) {
    const product = normalizeProduct(raw);
    if (!product) return false;
    const products = readProducts();
    const index = products.findIndex((entry) => entry.id === product.id);
    if (index < 0) products.unshift(product);
    else products[index] = product;
    return saveProducts(products);
  }

  function removeProduct(id) {
    return saveProducts(
      readProducts().filter((product) => product.id !== String(id)),
    );
  }

  function readCart() {
    try {
      const stored = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (!Array.isArray(stored)) return [];
      return stored
        .map((item, index) => {
          if (!item || typeof item !== "object" || Array.isArray(item))
            return null;
          const price = Number(item.preco);
          const quantity = Number(item.qtd ?? item.quantidade);
          return {
            id: String(item.id ?? `item-${index}`).slice(0, 72),
            nome: String(item.nome || "Produto Dinda").slice(0, 180),
            descricao: String(item.descricao || "").slice(0, 500),
            preco: Number.isFinite(price) ? Math.max(0, price) : 0,
            qtd: Number.isFinite(quantity)
              ? Math.max(1, Math.min(99, Math.round(quantity)))
              : 1,
            imagem: safeImage(item.imagem, ""),
            personalizado: Boolean(item.personalizado),
            detalhes:
              item.detalhes &&
              typeof item.detalhes === "object" &&
              !Array.isArray(item.detalhes)
                ? item.detalhes
                : {},
          };
        })
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  function saveCart(items) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent("dinda:cart-updated"));
      return true;
    } catch {
      return false;
    }
  }

  function addItem(item) {
    if (!item || !item.id || !item.nome || !Number.isFinite(Number(item.preco)))
      return false;
    const cart = readCart();
    const existing = item.personalizado
      ? null
      : cart.find((entry) => String(entry.id) === String(item.id));
    if (existing)
      existing.qtd = Math.min(
        99,
        existing.qtd + Math.max(1, Number(item.qtd) || 1),
      );
    else
      cart.push({
        ...item,
        qtd: Math.max(1, Math.min(99, Number(item.qtd) || 1)),
      });
    return saveCart(cart);
  }

  function getProduct(id) {
    return (
      readProducts().find(
        (product) => product.id === String(id) && product.ativo,
      ) || null
    );
  }

  function itemCount(items = readCart()) {
    return items.reduce((sum, item) => sum + (Number(item.qtd) || 0), 0);
  }

  function subtotal(items = readCart()) {
    return items.reduce(
      (sum, item) => sum + (Number(item.preco) || 0) * (Number(item.qtd) || 0),
      0,
    );
  }

  window.DindaStore = Object.freeze({
    CART_KEY,
    PRODUCTS_KEY,
    products: DEFAULT_PRODUCTS,
    money,
    safeImage,
    normalizeProduct,
    readProducts,
    saveProducts,
    saveProduct,
    removeProduct,
    readCart,
    saveCart,
    addItem,
    getProduct,
    itemCount,
    subtotal,
  });
})();
