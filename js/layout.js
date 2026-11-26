(() => {
  "use strict";

  const paginaAdministrativa = document.body.classList.contains("administracao-pagina");
  const arquivoAtual = (
    window.location.pathname.split("/").pop() || "index.html"
  ).toLowerCase();

  // O cabeçalho já está escrito diretamente no HTML; aqui só acompanha a rolagem.
  const cabecalho = document.querySelector(".site-cabecalho");
  if (cabecalho) {
    const atualizarCabecalho = () =>
      cabecalho.classList.toggle("rolado", window.scrollY > 12);
    atualizarCabecalho();
    window.addEventListener("scroll", atualizarCabecalho, { passive: true });
  }

  // O botão de voltar ao topo também existe no HTML de cada página pública.
  const botaoTopo = document.querySelector(".voltar-para-superior");
  if (botaoTopo) {
    const atualizarBotaoTopo = () =>
      botaoTopo.classList.toggle("visivel", window.scrollY > 420);
    botaoTopo.addEventListener("click", () => {
      const movimentoReduzido = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      window.scrollTo({
        top: 0,
        behavior: movimentoReduzido ? "auto" : "smooth",
      });
    });
    atualizarBotaoTopo();
    window.addEventListener("scroll", atualizarBotaoTopo, { passive: true });
  }

  // Indica a página atual sem criar ou substituir links.
  document
    .querySelectorAll(
      ".computador-navegacao a, .movel-menu a, .rodape-coluna a, .administracao-barra-lateral nav a",
    )
    .forEach((link) => {
      const endereco = link.getAttribute("href") || "";
      const arquivoDoLink = endereco.split("#")[0].split("/").pop();
      const corresponde =
        arquivoDoLink === arquivoAtual ||
        ((arquivoAtual === "" || arquivoAtual === "index.html") &&
          arquivoDoLink === "index.html" &&
          endereco.includes("#inicio"));
      if (corresponde && !endereco.includes("#")) {
        link.setAttribute("aria-current", "page");
      }
    });

  // Menu lateral administrativo: abre e fecha em telas menores.
  if (paginaAdministrativa) {
    const barraLateral = document.querySelector(".administracao-barra-lateral");
    const botaoMenu = document.getElementById("administracao-menu-alternar");
    const sobreposicao = document.getElementById("administracao-navegacao-sobreposicao");
    const botaoTema = document.getElementById("tema-alternar");
    const menuTema = document.getElementById("tema-menu");

    if (barraLateral && botaoMenu && sobreposicao) {
      const consultaCelular = window.matchMedia("(max-width: 960px)");
      const fecharMenu = (devolverFoco = false) => {
        document.body.classList.remove("administracao-navegacao-aberta");
        botaoMenu.setAttribute("aria-expanded", "false");
        botaoMenu.setAttribute("aria-label", "Abrir navegação administrativa");
        sobreposicao.hidden = true;
        sobreposicao.setAttribute("aria-hidden", "true");
        barraLateral.inert = consultaCelular.matches;
        barraLateral.setAttribute(
          "aria-hidden",
          String(consultaCelular.matches),
        );
        if (devolverFoco) botaoMenu.focus();
      };

      const abrirMenu = () => {
        if (!consultaCelular.matches) return;
        if (menuTema && !menuTema.hidden) {
          menuTema.hidden = true;
          botaoTema?.setAttribute("aria-expanded", "false");
        }
        document.body.classList.add("administracao-navegacao-aberta");
        botaoMenu.setAttribute("aria-expanded", "true");
        botaoMenu.setAttribute("aria-label", "Fechar navegação administrativa");
        sobreposicao.hidden = false;
        sobreposicao.setAttribute("aria-hidden", "false");
        barraLateral.inert = false;
        barraLateral.setAttribute("aria-hidden", "false");
        barraLateral.querySelector("nav a, a[href]")?.focus();
      };

      const ajustarParaTela = () => {
        if (!consultaCelular.matches) {
          fecharMenu(false);
          barraLateral.inert = false;
          barraLateral.setAttribute("aria-hidden", "false");
        } else if (!document.body.classList.contains("administracao-navegacao-aberta")) {
          fecharMenu(false);
        }
      };

      botaoMenu.addEventListener("click", () => {
        if (botaoMenu.getAttribute("aria-expanded") === "true") {
          fecharMenu(true);
        } else {
          abrirMenu();
        }
      });
      sobreposicao.addEventListener("click", () => fecharMenu(true));
      barraLateral.querySelectorAll("a[href]").forEach((link) => {
        link.addEventListener("click", () => fecharMenu(false));
      });
      document.addEventListener("keydown", (evento) => {
        const menuAberto =
          consultaCelular.matches &&
          document.body.classList.contains("administracao-navegacao-aberta");
        if (!menuAberto) return;
        if (evento.key === "Escape") {
          evento.preventDefault();
          fecharMenu(true);
          return;
        }
        if (evento.key !== "Tab") return;
        const elementosFocaveis = [
          ...barraLateral.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ].filter(
          (elemento) =>
            !elemento.hidden && elemento.getAttribute("aria-hidden") !== "true",
        );
        if (!elementosFocaveis.length) {
          evento.preventDefault();
          botaoMenu.focus();
          return;
        }
        const primeiro = elementosFocaveis[0];
        const ultimo = elementosFocaveis[elementosFocaveis.length - 1];
        if (
          evento.shiftKey &&
          (document.activeElement === primeiro ||
            document.activeElement === barraLateral)
        ) {
          evento.preventDefault();
          ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
          evento.preventDefault();
          primeiro.focus();
        }
      });
      window.addEventListener("resize", ajustarParaTela);
      ajustarParaTela();
    }
  }
})();
