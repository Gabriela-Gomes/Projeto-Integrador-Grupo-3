(() => {
  "use strict";
  const lista = document.getElementById("avaliacao-administracao-lista");
  const modeloCartao = document.getElementById("avaliacao-cartao-template");
  const modeloVazio = document.getElementById("avaliacao-vazio-template");
  if (!lista || !modeloCartao || !modeloVazio || !window.DindaReviews) return;
  const busca = document.getElementById("avaliacao-administracao-buscar");
  const filtros = Array.from(document.querySelectorAll("[data-avaliacao-filtro]"));
  const totalExibido = document.getElementById("avaliacao-administracao-contagem");
  let filtroAtivo = "todas";

  function renderizar() {
    const termo = String(busca?.value || "")
      .trim()
      .toLocaleLowerCase("pt-BR");
    const todas = window.DindaReviews.read();
    const correspondentes = todas.filter(
      (avaliacao) =>
        (filtroAtivo === "todas" || avaliacao.status === filtroAtivo) &&
        (!termo || avaliacao.texto.toLocaleLowerCase("pt-BR").includes(termo)),
    );
    const definirTexto = (id, valor) => {
      const no = document.getElementById(id);
      if (no) no.textContent = valor;
    };
    definirTexto("avaliacao-total", String(todas.length));
    definirTexto(
      "avaliacao-pendente",
      String(todas.filter((item) => item.status === "pendente").length),
    );
    definirTexto(
      "avaliacao-aprovado",
      String(todas.filter((item) => item.status === "aprovada").length),
    );
    if (totalExibido)
      totalExibido.textContent = `${correspondentes.length} ${correspondentes.length === 1 ? "avaliação local" : "avaliações locais"}`;

    if (!correspondentes.length) {
      lista.replaceChildren(modeloVazio.content.cloneNode(true));
      return;
    }

    const cartoes = correspondentes.map((avaliacao) => {
      const fragmento = modeloCartao.content.cloneNode(true);
      const campo = (nome) => fragmento.querySelector(`[data-avaliacao-campo="${nome}"]`);
      const aprovar = fragmento.querySelector("[data-aprovar-avaliacao]");
      const retirar = fragmento.querySelector("[data-desaprovar-avaliacao]");
      const excluir = fragmento.querySelector("[data-excluir-avaliacao]");
      const nota = Math.max(0, Math.min(5, Number(avaliacao.nota) || 0));

      campo("cliente").textContent = "Cliente Dinda";
      campo("data").textContent = window.DindaAdmin.formatDate(avaliacao.criadaEm);
      campo("status").textContent = avaliacao.status === "aprovada"?"Aprovada" : "Pendente";
      campo("estrelas").setAttribute("aria-label", `${nota} de 5 estrelas`);
      campo("estrelas").textContent = "★".repeat(nota) + "☆".repeat(5 - nota);
      campo("texto").textContent = avaliacao.texto;
      aprovar.dataset.aprovarAvaliacao = avaliacao.id;
      retirar.dataset.desaprovarAvaliacao = avaliacao.id;
      excluir.dataset.excluirAvaliacao = avaliacao.id;
      aprovar.hidden = avaliacao.status !== "pendente";
      retirar.hidden = avaliacao.status !== "aprovada";
      return fragmento;
    });
    lista.replaceChildren(...cartoes);
  }

  filtros.forEach((botao) =>
    botao.addEventListener("click", () => {
      filtroAtivo = botao.dataset.avaliacaoFiltro || "todas";
      filtros.forEach((item) =>
        item.setAttribute("aria-pressed", String(item === botao)),
      );
      renderizar();
    }),
  );
  busca?.addEventListener("input", renderizar);
  lista.addEventListener("click", (evento) => {
    const aprovar = evento.target.closest("[data-aprovar-avaliacao]");
    const retirar = evento.target.closest("[data-desaprovar-avaliacao]");
    const excluir = evento.target.closest("[data-excluir-avaliacao]");
    const id =
      aprovar?.dataset.aprovarAvaliacao ||
      retirar?.dataset.desaprovarAvaliacao ||
      excluir?.dataset.excluirAvaliacao;
    if (!id) return;
    const avaliacoes = window.DindaReviews.read();
    const atualizadas = avaliacoes
      .filter((item) => !excluir || item.id !== id)
      .map((item) =>
        item.id === id && !excluir
          ? { ...item, status: aprovar ? "aprovada" : "pendente" }
          : item,
      );
    if (
      excluir &&
      !window.confirm(
        "Excluir este comentário local? Esta ação remove a avaliação deste navegador.",
      )
    )
      return;
    const salvo = window.DindaReviews.save(atualizadas);
    window.DindaToast?.(
      salvo
        ? excluir
          ? "Avaliação removida."
          : aprovar
            ? "Avaliação aprovada e publicada na home local."
            : "Avaliação retirada da página pública."
        : "Não foi possível salvar a alteração local.",
    );
    renderizar();
  });
  window.addEventListener("dinda:reviews-updated", renderizar);
  window.addEventListener("storage", (evento) => {
    if (evento.key === window.DindaReviews.KEY) renderizar();
  });
  renderizar();
})();
