from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist"
PAGES = (
    "index.html", "personalizar.html", "carrinho.html", "checkout.html",
    "painel.html", "pedidos.html", "produtos.html", "avaliacoes.html",
    "login.html", "cadastro.html", "meus-pedidos.html", "rastreio.html",
)
FILES = (*PAGES, "manus-routes.json", "README.md")
DIRS = ("css", "js", "img")

ASSET_MAP = {
    "bolo-2_069d9a93.jpg": "bolo-2.jpg",
    "bolo-3_f700dbea.jpg": "bolo-3.jpg",
    "bolo-4_dd67dfdb.jpg": "bolo-4.jpg",
    "bolo-5_1b1dbc21.jpg": "bolo-5.jpg",
    "bolo-limao_8f35feb6.jpg": "bolo-limao.jpg",
    "bolo5_b55bc0f4.jpg": "bolo5.jpg",
    "bolo7_69f3a451.jpg": "bolo7.jpg",
    "brigadeiro_ffb56e56.jpg": "brigadeiro.jpg",
    "coxinha_4de69476.jpg": "coxinha.jpg",
    "docinhos1_ef0db94b.jpg": "docinhos1.jpg",
    "docinhos_89f53da3.jpg": "docinhos.jpg",
    "figma-logo-clean_f01660fa.png": "figma-logo-clean.png",
    "fivecon_4828c1cf.png": "fivecon.png",
    "logo-dinda_659df9f1.png": "logo-dinda.png",
    "salgados1_1056ecab.jpg": "salgados1.jpg",
    "salgados_55a27053.jpg": "salgados.jpg",
}

if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir(parents=True)

for name in FILES:
    source = ROOT / name
    if not source.is_file():
        raise FileNotFoundError(f"Arquivo obrigatório não encontrado: {name}")
    shutil.copy2(source, OUT / name)

for name in DIRS:
    source = ROOT / name
    if not source.is_dir():
        raise FileNotFoundError(f"Pasta obrigatória não encontrada: {name}")
    shutil.copytree(source, OUT / name)

for name in PAGES:
    page = OUT / name
    text = page.read_text(encoding="utf-8")
    for source_name, local_name in ASSET_MAP.items():
        text = text.replace(f"/manus-storage/{source_name}", f"img/{local_name}")
    page.write_text(text, encoding="utf-8")

for script in (OUT / "js").glob("*.js"):
    text = script.read_text(encoding="utf-8")
    for source_name, local_name in ASSET_MAP.items():
        text = text.replace(f"/manus-storage/{source_name}", f"img/{local_name}")
    script.write_text(text, encoding="utf-8")

missing_images = [local for local in ASSET_MAP.values() if not (OUT / "img" / local).is_file()]
if missing_images:
    raise FileNotFoundError(f"Imagens locais ausentes: {', '.join(missing_images)}")

print(f"Site estático preparado em {OUT.relative_to(ROOT)}")
