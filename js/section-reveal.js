(() => {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion.matches || !("IntersectionObserver" in window)) return;
  const targets = Array.from(document.querySelectorAll("main > section.secao:not(.galeria-secao), main > section.personalizado-promocao"));
  targets.forEach((el, index) => {
    el.classList.add("dinda-reveal");
    el.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 85}ms`);
  });
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("dinda-reveal-visivel");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
  targets.forEach((el) => observer.observe(el));
})();
