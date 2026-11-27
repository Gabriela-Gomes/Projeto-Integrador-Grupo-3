(() => {
  "use strict";

  const dialog = document.getElementById("galeria-ampliacao");
  const triggers = Array.from(
    document.querySelectorAll("[data-galeria-gatilho]"),
  );
  const photoLabel = (trigger) =>
    trigger
      .closest(".galeria-foto")
      ?.querySelector("figcaption")
      ?.textContent.replace(/\s+/g, " ")
      .trim() ||
    trigger.querySelector("img")?.alt.replace(/\s+/g, " ").trim() ||
    "Foto da galeria da Dinda";
  const photos = triggers.map((trigger) => {
    const label = photoLabel(trigger);
    trigger.setAttribute("aria-label", `Ampliar foto: ${label}`);
    return { trigger };
  });
  const image = document.getElementById("galeria-ampliacao-imagem");
  const caption = document.getElementById("galeria-ampliacao-legenda");
  const counter = document.getElementById("galeria-ampliacao-contador");
  const closeButton = dialog?.querySelector("[data-ampliacao-fechar]");
  const previousButton = dialog?.querySelector("[data-ampliacao-anterior]");
  const nextButton = dialog?.querySelector("[data-ampliacao-proximo]");

  if (
    !dialog ||
    !photos.length ||
    !image ||
    !caption ||
    !counter ||
    !closeButton ||
    !previousButton ||
    !nextButton ||
    typeof dialog.showModal !== "function"
  )
    return;

  let activeIndex = 0;
  let openerTrigger = null;

  function showPhoto(index) {
    activeIndex = ((index % photos.length) + photos.length) % photos.length;
    const { trigger } = photos[activeIndex];
    const thumbnail = trigger.querySelector("img");
    if (!thumbnail) return;
    const label = photoLabel(trigger);

    image.src = thumbnail.currentSrc || thumbnail.getAttribute("src") || "";
    image.alt = thumbnail.alt || label;
    image.title = label;
    caption.textContent = label;
    counter.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(photos.length).padStart(2, "0")}`;
  }

  function openAt(index) {
    openerTrigger = photos[index]?.trigger || null;
    showPhoto(index);
    if (!dialog.open) dialog.showModal();
    document.body.classList.add("galeria-ampliacao-aberta");
    closeButton.focus();
  }

  function closeDialog() {
    if (dialog.open) dialog.close();
  }

  photos.forEach(({ trigger }, index) =>
    trigger.addEventListener("click", () => openAt(index)),
  );
  closeButton.addEventListener("click", closeDialog);
  previousButton.addEventListener("click", () => showPhoto(activeIndex - 1));
  nextButton.addEventListener("click", () => showPhoto(activeIndex + 1));

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });

  dialog.addEventListener("close", () => {
    document.body.classList.remove("galeria-ampliacao-aberta");
    if (openerTrigger?.isConnected) openerTrigger.focus();
  });

  document.addEventListener("keydown", (event) => {
    if (!dialog.open) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPhoto(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showPhoto(activeIndex + 1);
    }
  });
})();
