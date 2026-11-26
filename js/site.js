(() => {
  "use strict";

  const allowedThemes = ["marrom", "preto", "rosa", "rosa-preto"];
  const themeToggle = document.getElementById("tema-alternar");
  const themeMenu = document.getElementById("tema-menu");
  const menuToggle = document.getElementById("menu-alternar");
  const mobileMenu = document.getElementById("movel-menu");
  let toastTimer;

  function readTheme() {
    try {
      const saved = localStorage.getItem("dinda-novo-tema");
      return allowedThemes.includes(saved) ? saved : "marrom";
    } catch {
      return "marrom";
    }
  }

  function updateThemeAssets(theme) {
    // A marca original é mantida em todos os temas; apenas a paleta do site muda.
    document
      .querySelectorAll(".marca img, .rodape-marca img, .administracao-marca img")
      .forEach((image) => {
        image.src = "img/logo-dinda.png";
      });
    document.querySelectorAll("[data-tema-escolha]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.temaEscolha === theme),
      );
    });
  }

  function setTheme(theme) {
    if (!allowedThemes.includes(theme)) return;
    document.documentElement.dataset.tema = theme;
    try {
      localStorage.setItem("dinda-novo-tema", theme);
    } catch {
      /* Tema continua aplicado nesta página. */
    }
    updateThemeAssets(theme);
    closeThemeMenu(true);
  }

  function closeThemeMenu(returnFocus) {
    if (!themeMenu || !themeToggle || themeMenu.hidden) return;
    themeMenu.hidden = true;
    themeToggle.setAttribute("aria-expanded", "false");
    if (returnFocus) themeToggle.focus();
  }

  function closeMobileMenu(returnFocus) {
    if (!mobileMenu || !menuToggle || mobileMenu.hidden) return;
    mobileMenu.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
    if (returnFocus) menuToggle.focus();
  }

  function showToast(message) {
    const toast = document.getElementById("site-notificacao");
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 3200);
  }

  function updateCartCount() {
    if (!window.DindaStore) return;
    const count = window.DindaStore.itemCount();
    document.querySelectorAll("#sacola-contagem").forEach((badge) => {
      badge.textContent = String(count);
      badge.setAttribute(
        "aria-label",
        `${count} ${count === 1 ? "item" : "itens"} na sacola`,
      );
    });
    document.querySelectorAll(".sacola-link").forEach((link) => {
      link.setAttribute(
        "aria-label",
        `Sacola, ${count} ${count === 1 ? "item" : "itens"}`,
      );
    });
  }

  document.documentElement.dataset.tema = readTheme();
  updateThemeAssets(document.documentElement.dataset.tema);
  document.querySelectorAll("[data-tema-escolha]").forEach((button) => {
    button.addEventListener("click", () =>
      setTheme(button.dataset.temaEscolha),
    );
  });

  if (themeToggle && themeMenu) {
    themeToggle.addEventListener("click", () => {
      const open = themeToggle.getAttribute("aria-expanded") === "true";
      if (!open) closeMobileMenu(false);
      themeToggle.setAttribute("aria-expanded", String(!open));
      themeMenu.hidden = open;
      if (!open) themeMenu.querySelector("[data-tema-escolha]")?.focus();
    });
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
      const open = menuToggle.getAttribute("aria-expanded") === "true";
      if (!open) closeThemeMenu(false);
      menuToggle.setAttribute("aria-expanded", String(!open));
      menuToggle.setAttribute(
        "aria-label",
        open ? "Abrir menu" : "Fechar menu",
      );
      mobileMenu.hidden = open;
      if (!open) mobileMenu.querySelector("a")?.focus();
    });
    mobileMenu
      .querySelectorAll("a")
      .forEach((link) =>
        link.addEventListener("click", () => closeMobileMenu(false)),
      );
  }

  document.addEventListener("click", (event) => {
    if (
      themeMenu &&
      !themeMenu.hidden &&
      !event.target.closest(".tema-seletor")
    )
      closeThemeMenu(false);
    if (
      mobileMenu &&
      !mobileMenu.hidden &&
      !event.target.closest("#movel-menu, #menu-alternar")
    )
      closeMobileMenu(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeThemeMenu(true);
    closeMobileMenu(true);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeMobileMenu(false);
  });
  window.addEventListener("dinda:cart-updated", updateCartCount);
  window.addEventListener("storage", (event) => {
    if (event.key === "dinda_carrinho") updateCartCount();
    if (event.key === "dinda-novo-tema") {
      const theme = readTheme();
      document.documentElement.dataset.tema = theme;
      updateThemeAssets(theme);
    }
  });
  document.querySelectorAll("[data-atual-ano]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
  window.DindaToast = showToast;
  updateCartCount();
})();
