(() => {
  "use strict";
  const carousel = document.querySelector("[data-destaque-carrossel]");
  if (!carousel) return;
  const slides = Array.from(carousel.querySelectorAll("[data-destaque-slide]"));
  const dots = Array.from(carousel.querySelectorAll("[data-carrossel-ir]"));
  const previous = carousel.querySelector("[data-carrossel-anterior]");
  const next = carousel.querySelector("[data-carrossel-proximo]");
  const captionTitle = carousel.querySelector("[data-carrossel-legenda-titulo]");
  const captionDescription = carousel.querySelector(
    "[data-carrossel-legenda-descricao]",
  );
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!slides.length) return;
  let activeIndex = 0;
  let timer = null;
  const intervalMs = 5000;
  function showSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === activeIndex;
      slide.classList.toggle("e-ativo", active);
      slide.classList.toggle("ativo", active);
      slide.setAttribute("aria-hidden", String(!active));
      slide.inert = !active;
    });
    dots.forEach((dot, i) => {
      const active = i === activeIndex;
      dot.classList.toggle("e-ativo", active);
      dot.classList.toggle("ativo", active);
      dot.setAttribute("aria-pressed", String(active));
    });
    if (captionTitle)
      captionTitle.textContent = slides[activeIndex].dataset.legendaTitulo || "";
    if (captionDescription)
      captionDescription.textContent =
        slides[activeIndex].dataset.legendaDescricao || "";
  }
  function stop() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }
  function start() {
    stop();
    if (reducedMotion.matches || document.hidden) return;
    timer = window.setInterval(() => showSlide(activeIndex + 1), intervalMs);
  }
  function go(index) {
    showSlide(index);
    start();
  }
  carousel.addEventListener("mouseenter", stop);
  carousel.addEventListener("mouseleave", start);
  carousel.addEventListener("focusin", stop);
  carousel.addEventListener("focusout", (event) => {
    if (!carousel.contains(event.relatedTarget)) start();
  });
  previous?.addEventListener("click", () => go(activeIndex - 1));
  next?.addEventListener("click", () => go(activeIndex + 1));
  dots.forEach((dot) =>
    dot.addEventListener("click", () =>
      go(Number(dot.dataset.carrosselIr) || 0),
    ),
  );
  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(activeIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(activeIndex + 1);
    }
  });
  document.addEventListener("visibilitychange", start);
  reducedMotion.addEventListener?.("change", start);
  showSlide(0);
  start();
})();
