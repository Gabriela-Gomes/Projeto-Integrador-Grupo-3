(() => {
  "use strict";

  const KEY = "dinda_blog_posts_demo";
  const MAX_POSTS = 15;
  const MAX_RAW_IMAGE_BYTES = 12 * 1024 * 1024;
  const MAX_IMAGE_DATA_URL_CHARS = 350_000;
  const GALLERY_IMAGES = [
    { src: "img/bolo-2.jpg", label: "Bolo caseiro" },
    { src: "img/bolo-3.jpg", label: "Bolo artesanal" },
    { src: "img/bolo-4.jpg", label: "Bolo decorado" },
    { src: "img/bolo-limao.jpg", label: "Bolo de limão" },
    { src: "img/bolo5.jpg", label: "Bolo de chocolate" },
    { src: "img/bolo7.jpg", label: "Bolo com morangos" },
    { src: "img/brigadeiro.jpg", label: "Brigadeiros" },
    { src: "img/coxinha.jpg", label: "Salgado artesanal" },
    { src: "img/docinhos.jpg", label: "Docinhos" },
    { src: "img/docinhos1.jpg", label: "Docinhos variados" },
    { src: "img/salgados.jpg", label: "Salgados" },
    { src: "img/salgados1.jpg", label: "Mini salgados" },
  ];
  const GALLERY_SOURCES = new Set(GALLERY_IMAGES.map((image) => image.src));
  let refreshAdmin = () => {};
  let canvasRedimensionamento = null;

  const safeText = (value, limit) =>
    String(value ?? "")
      .trim()
      .slice(0, limit);
  const makeId = () =>
    window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `recado-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const validDate = (value) =>
    typeof value === "string" && Number.isFinite(Date.parse(value));

  function safeImage(value) {
    const source = String(value || "");
    if (GALLERY_SOURCES.has(source)) return source;
    if (
      source.length <= MAX_IMAGE_DATA_URL_CHARS &&
      /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/]+=*$/i.test(source)
    )
      return source;
    return "";
  }

  function sanitizePost(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const id = safeText(raw.id, 80);
    const title = safeText(raw.title, 90);
    const description = safeText(raw.description, 700);
    const image = safeImage(raw.image);
    const createdAt = validDate(raw.createdAt)
      ? raw.createdAt
      : new Date().toISOString();
    const updatedAt = validDate(raw.updatedAt) ? raw.updatedAt : createdAt;
    if (
      !/^[A-Za-z0-9_-]{1,80}$/.test(id) ||
      title.length < 2 ||
      description.length < 12 ||
      !image
    )
      return null;
    return {
      id,
      title,
      description,
      image,
      createdAt,
      updatedAt,
      published: raw.published === true,
    };
  }

  function read() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (!Array.isArray(parsed)) return [];
      const seen = new Set();
      return parsed
        .map(sanitizePost)
        .filter((post) => {
          if (!post || seen.has(post.id)) return false;
          seen.add(post.id);
          return true;
        })
        .slice(0, MAX_POSTS)
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    } catch {
      return [];
    }
  }

  function save(posts) {
    if (!Array.isArray(posts) || posts.length > MAX_POSTS) return false;
    const normalized = [];
    const seen = new Set();
    for (const raw of posts) {
      const post = sanitizePost(raw);
      if (!post || seen.has(post.id)) return false;
      seen.add(post.id);
      normalized.push(post);
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(normalized));
      window.dispatchEvent(new CustomEvent("dinda:blog-updated"));
      return true;
    } catch {
      return false;
    }
  }

  function formattedDate(value) {
    const date = new Date(value);
    return Number.isFinite(date.getTime())
      ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date)
      : "";
  }

  function clonarModelo(id) {
    const modelo = document.getElementById(id);
    return modelo?.content?.firstElementChild?.cloneNode(true) || null;
  }

  function renderHome() {
    const grade = document.getElementById("blog-publicacao-grade");
    if (!grade) return;
    const publicacoes = read().filter((post) => post.published).slice(0, 6);
    grade.replaceChildren();
    if (!publicacoes.length) {
      const vazio = clonarModelo("modelo-vazio-blog-publico");
      if (vazio) grade.append(vazio);
      return;
    }
    publicacoes.forEach((post) => {
      const cartao = clonarModelo("modelo-cartao-blog-publico");
      if (!cartao) return;
      const imagem = cartao.querySelector("[data-imagem-blog-publico]");
      imagem.src = post.image;
      imagem.alt = `Imagem do recado: ${post.title}`;
      cartao.querySelector("[data-data-blog-publico]").textContent = formattedDate(post.createdAt);
      cartao.querySelector("[data-titulo-blog-publico]").textContent = post.title;
      cartao.querySelector("[data-descricao-blog-publico]").textContent = post.description;
      grade.append(cartao);
    });
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (
        !file ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      )
        return reject(new Error("Escolha uma imagem JPG, PNG ou WebP."));
      if (file.size > MAX_RAW_IMAGE_BYTES)
        return reject(new Error("A imagem original deve ter até 12 MB."));

      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = async () => {
        URL.revokeObjectURL(objectUrl);
        try {
          const encode = async (maxDimension, quality) => {
            const scale = Math.min(
              1,
              maxDimension / Math.max(image.naturalWidth, image.naturalHeight),
            );
            const canvas = canvasRedimensionamento;
            if (!canvas) throw new Error("O processamento de imagem não está disponível nesta página.");
            canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
            canvas.height = Math.max(
              1,
              Math.round(image.naturalHeight * scale),
            );
            const context = canvas.getContext("2d", { alpha: false });
            if (!context)
              throw new Error(
                "Não foi possível processar a imagem neste navegador.",
              );
            context.fillStyle = "#fff";
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise((resolveBlob) =>
              canvas.toBlob(resolveBlob, "image/jpeg", quality),
            );
            if (!blob) throw new Error("Não foi possível reduzir a imagem.");
            return blob;
          };
          let blob = await encode(960, 0.76);
          if (blob.size > 180_000) blob = await encode(760, 0.64);
          if (blob.size > 245_000)
            throw new Error(
              "A imagem ainda ficou grande. Escolha uma foto mais leve ou use uma imagem da galeria.",
            );
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () =>
            reject(new Error("Não foi possível ler a imagem escolhida."));
          reader.readAsDataURL(blob);
        } catch (error) {
          reject(error);
        }
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Não foi possível abrir esse arquivo de imagem."));
      };
      image.src = objectUrl;
    });
  }

  function mountHome() {
    renderHome();
  }

  function mountAdmin() {
    const form = document.getElementById("blog-publicacao-formulario");
    const list = document.getElementById("blog-publicacao-lista");
    if (!form || !list) return;
    const modeloCanvas = document.getElementById("modelo-canvas-blog");
    const recipienteCanvas = modeloCanvas?.content?.firstElementChild?.cloneNode(true);
    if (recipienteCanvas) {
      document.body.append(recipienteCanvas);
      canvasRedimensionamento = recipienteCanvas.querySelector("[data-canvas-redimensionamento]");
    }

    const titleInput = document.getElementById("blog-titulo");
    const descriptionInput = document.getElementById("blog-descricao");
    const galleryInput = document.getElementById("blog-galeria-imagem");
    const fileInput = document.getElementById("blog-imagem-arquivo");
    const publishedInput = document.getElementById("blog-publicar-agora");
    const preview = document.getElementById("blog-imagem-previsualizacao");
    const feedback = document.getElementById("blog-comentario");
    const cancelButton = document.getElementById("blog-cancelar-editar");
    const countNode = document.getElementById("blog-publicacao-contagem");
    const submitButton = form.querySelector('[type="submit"]');
    let previewObjectUrl = "";

    function message(text, error = false) {
      if (!feedback) return;
      feedback.textContent = text;
      feedback.hidden = !text;
      feedback.classList.toggle("form-error", error);
      feedback.classList.toggle("form-success", Boolean(text) && !error);
    }

    function renderAdmin() {
      const publicacoes = read();
      if (countNode) countNode.textContent = `${publicacoes.filter((post) => post.published).length} publicados · ${publicacoes.length} no total`;
      list.replaceChildren();
      if (!publicacoes.length) {
        const vazio = clonarModelo("modelo-vazio-blog-administracao");
        if (vazio) list.append(vazio);
        return;
      }
      const modelo = document.getElementById("modelo-cartao-blog-administracao")?.content?.firstElementChild;
      if (!modelo) return;
      publicacoes.forEach((post) => {
        const cartao = modelo.cloneNode(true);
        const imagem = cartao.querySelector("[data-imagem-blog-administracao]");
        imagem.src = post.image;
        const estado = cartao.querySelector("[data-situacao-blog-administracao]");
        estado.classList.toggle("publicado", post.published);
        estado.textContent = post.published ? "Publicado na home deste navegador" : "Rascunho oculto";
        cartao.querySelector("[data-titulo-blog-administracao]").textContent = post.title;
        cartao.querySelector("[data-descricao-blog-administracao]").textContent = post.description;
        cartao.querySelector("[data-data-blog-administracao]").textContent = `Criado em ${formattedDate(post.createdAt)}`;
        cartao.querySelectorAll("[data-blog-acao]").forEach((botao) => {
          botao.dataset.blogId = post.id;
          if (botao.dataset.blogAcao === "toggle") {
            botao.textContent = post.published ? "Ocultar" : "Publicar";
            botao.setAttribute("aria-label", `${post.published ? "Ocultar" : "Publicar"} ${post.title}`);
          } else if (botao.dataset.blogAcao === "delete") {
            botao.setAttribute("aria-label", `Remover ${post.title}`);
          }
        });
        list.append(cartao);
      });
    }

    refreshAdmin = renderAdmin;

    function setPreview(source, alt = "Pré-visualização da imagem do recado") {
      if (!preview) return;
      previewObjectUrl && URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = "";
      if (!source) {
        preview.removeAttribute("src");
        preview.hidden = true;
        return;
      }
      preview.src = source;
      preview.alt = alt;
      preview.hidden = false;
    }

    function resetEditor() {
      form.reset();
      form.dataset.editingId = "";
      form.dataset.currentImage = "";
      if (cancelButton) cancelButton.hidden = true;
      if (submitButton) submitButton.textContent = "Salvar recado";
      setPreview("");
      message("");
    }

    galleryInput?.addEventListener("change", () => {
      if (galleryInput.value) {
        if (fileInput) fileInput.value = "";
        setPreview(galleryInput.value);
      } else {
        setPreview(form.dataset.currentImage || "");
      }
    });

    fileInput?.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (!file) {
        setPreview(galleryInput?.value || form.dataset.currentImage || "");
        return;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        fileInput.value = "";
        message("Escolha um arquivo de imagem válido.", true);
        return;
      }
      previewObjectUrl && URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = URL.createObjectURL(file);
      if (preview) {
        preview.src = previewObjectUrl;
        preview.alt = "Pré-visualização da imagem escolhida";
        preview.hidden = false;
      }
      if (galleryInput) galleryInput.value = "";
      message("A imagem será reduzida e guardada neste navegador ao salvar.");
    });

    cancelButton?.addEventListener("click", resetEditor);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const title = safeText(titleInput?.value, 90);
      const description = safeText(descriptionInput?.value, 700);
      const editingId = form.dataset.editingId || "";
      const previous = editingId
        ? read().find((post) => post.id === editingId)
        : null;
      const file = fileInput?.files?.[0];
      if (title.length < 2 || description.length < 12) {
        message(
          "Informe um título e uma descrição com pelo menos 12 caracteres.",
          true,
        );
        (title.length < 2 ? titleInput : descriptionInput)?.focus();
        return;
      }
      if (!previous && read().length >= MAX_POSTS) {
        message(
          `O limite local é de ${MAX_POSTS} recados. Remova um antigo antes de criar outro.`,
          true,
        );
        return;
      }
      if (!file && !galleryInput?.value && !previous?.image) {
        message("Escolha uma foto da galeria ou envie uma imagem.", true);
        galleryInput?.focus();
        return;
      }

      if (submitButton) submitButton.disabled = true;
      message("Salvando recado neste navegador…");
      try {
        const imageSource = file
          ? await fileToDataUrl(file)
          : galleryInput?.value ||
            previous?.image ||
            form.dataset.currentImage ||
            "";
        const now = new Date().toISOString();
        const post = {
          id: previous?.id || makeId(),
          title,
          description,
          image: imageSource,
          createdAt: previous?.createdAt || now,
          updatedAt: now,
          published: Boolean(publishedInput?.checked),
        };
        const posts = read();
        const nextPosts = previous
          ? posts.map((item) => (item.id === previous.id ? post : item))
          : [post, ...posts];
        if (!save(nextPosts))
          throw new Error(
            "O navegador não conseguiu guardar o recado. Remova algumas imagens ou use uma foto da galeria.",
          );
        resetEditor();
        message(
          post.published
            ? "Recado publicado na página inicial deste navegador."
            : "Rascunho salvo neste navegador. Você pode publicá-lo quando quiser.",
        );
      } catch (error) {
        message(
          error instanceof Error
            ? error.message
            : "Não foi possível salvar o recado.",
          true,
        );
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });

    list.addEventListener("click", (event) => {
      const button = event.target.closest("[data-blog-acao]");
      if (!button) return;
      const post = read().find((item) => item.id === button.dataset.blogId);
      if (!post) return;
      const action = button.dataset.blogAcao;

      if (action === "edit") {
        form.dataset.editingId = post.id;
        form.dataset.currentImage = post.image;
        if (titleInput) titleInput.value = post.title;
        if (descriptionInput) descriptionInput.value = post.description;
        if (publishedInput) publishedInput.checked = post.published;
        if (galleryInput)
          galleryInput.value = GALLERY_SOURCES.has(post.image)
            ? post.image
            : "";
        if (fileInput) fileInput.value = "";
        if (cancelButton) cancelButton.hidden = false;
        if (submitButton) submitButton.textContent = "Salvar alterações";
        setPreview(post.image, `Pré-visualização de ${post.title}`);
        message(
          `Editando “${post.title}”. A publicação atual permanece na home até salvar alterações.`,
        );
        titleInput?.focus();
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (action === "toggle") {
        const updated = {
          ...post,
          published: !post.published,
          updatedAt: new Date().toISOString(),
        };
        const posts = read().map((item) =>
          item.id === post.id ? updated : item,
        );
        if (!save(posts))
          message(
            "Não foi possível atualizar a publicação neste navegador.",
            true,
          );
        else
          message(
            updated.published
              ? "Recado publicado na home deste navegador."
              : "Recado ocultado da home neste navegador.",
          );
      } else if (action === "delete") {
        if (
          !window.confirm(`Remover o recado “${post.title}” deste navegador?`)
        )
          return;
        if (!save(read().filter((item) => item.id !== post.id)))
          message("Não foi possível remover o recado.", true);
        else message("Recado removido deste navegador.");
      }
    });

    renderAdmin();
  }

  window.DindaBlog = Object.freeze({
    KEY,
    GALLERY_IMAGES,
    read,
    save,
    renderHome,
  });
  window.addEventListener("dinda:blog-updated", () => {
    renderHome();
    refreshAdmin();
  });
  window.addEventListener("storage", (event) => {
    if (event.key === KEY) {
      renderHome();
      refreshAdmin();
    }
  });
  mountHome();
  mountAdmin();
})();
