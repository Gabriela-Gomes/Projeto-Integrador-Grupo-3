(() => {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.querySelectorAll("[data-vitrine-carrossel]").forEach((carousel) => {
    const track = carousel.querySelector("[data-vitrine-trilho]");
    const previous = carousel.querySelector("[data-vitrine-anterior]");
    const next = carousel.querySelector("[data-vitrine-proximo]");
    if (!track) return;
    const distance = () => {
      const item = track.querySelector(":scope > :not([hidden])");
      return item ? item.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || 0) : track.clientWidth * .8;
    };
    const move = (direction) => track.scrollBy({
      left: direction * distance() * (window.innerWidth < 700 ? 1 : 1.5),
      behavior: reduceMotion.matches ? "auto" : "smooth"
    });
    previous?.addEventListener("click", () => move(-1));
    next?.addEventListener("click", () => move(1));
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      if (previous) previous.disabled = track.scrollLeft <= 3;
      if (next) next.disabled = track.scrollLeft >= max - 3;
    };
    track.addEventListener("scroll", update, { passive:true });
    window.addEventListener("resize", update);
    const observer = new MutationObserver(() => requestAnimationFrame(update));
    observer.observe(track, { childList:true, subtree:true });
    update();
    // Teclas direcionais também funcionam quando o trilho recebe foco.
    track.setAttribute("tabindex", "0");
    track.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
    });
  });
})();