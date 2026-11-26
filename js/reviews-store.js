(() => {
  "use strict";

  const KEY = "dinda_avaliacoes_demo";
  const STATUSES = ["pendente", "aprovada"];

  function cleanReview(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const id = String(raw.id || "").slice(0, 70);
    const nota = Number(raw.nota);
    const texto = String(raw.texto || "")
      .trim()
      .slice(0, 500);
    const criadaEm = String(raw.criadaEm || "").slice(0, 40);
    const status = STATUSES.includes(raw.status) ? raw.status : "pendente";
    if (
      !/^[A-Za-z0-9_-]{8,70}$/.test(id) ||
      !Number.isInteger(nota) ||
      nota < 1 ||
      nota > 5 ||
      texto.length < 12 ||
      !Number.isFinite(Date.parse(criadaEm))
    )
      return null;
    return { id, nota, texto, criadaEm, status };
  }

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      const seen = new Set();
      const clean = parsed
        .map(cleanReview)
        .filter((review) => {
          if (!review || seen.has(review.id)) return false;
          seen.add(review.id);
          return true;
        })
        .slice(-100);
      if (JSON.stringify(clean) !== raw)
        localStorage.setItem(KEY, JSON.stringify(clean));
      return clean;
    } catch {
      return [];
    }
  }

  function save(reviews) {
    if (!Array.isArray(reviews)) return false;
    const clean = reviews.map(cleanReview).filter(Boolean).slice(-100);
    try {
      localStorage.setItem(KEY, JSON.stringify(clean));
      window.dispatchEvent(new CustomEvent("dinda:reviews-updated"));
      return true;
    } catch {
      return false;
    }
  }

  function add(nota, texto) {
    const review = cleanReview({
      id: `aval-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      nota,
      texto,
      criadaEm: new Date().toISOString(),
      status: "pendente",
    });
    if (!review) return false;
    return save([...read(), review]);
  }

  window.DindaReviews = Object.freeze({ KEY, read, save, add, cleanReview });
})();
