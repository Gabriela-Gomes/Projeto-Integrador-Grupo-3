(function () {
            const temasValidos = ['marrom', 'preto', 'rosa', 'rosa-preto'];
            const body = document.body;
            const painel = document.getElementById('painelTemas');
            const btnTema = document.getElementById('btnTema');
            const btnMobile = document.getElementById('btnMenuMobile');
            const menuMobile = document.getElementById('menuMobileNovo');

            function aplicarTema(tema) {
                body.classList.remove('tema-preto', 'tema-rosa', 'tema-rosa-preto');
                if (tema !== 'marrom') body.classList.add('tema-' + tema);
                localStorage.setItem('dinda-novo-tema', tema);

                document.querySelectorAll('.opcao-tema').forEach(btn => {
                    btn.classList.toggle('ativo', btn.dataset.tema === tema);
                });
            }

            const temaSalvo = localStorage.getItem('dinda-novo-tema') || 'marrom';
            aplicarTema(temasValidos.includes(temaSalvo) ? temaSalvo : 'marrom');

            if (btnTema) {
                btnTema.addEventListener('click', e => {
                    e.stopPropagation();
                    painel.classList.toggle('aberto');
                });
            }

            document.querySelectorAll('.opcao-tema').forEach(btn => {
                btn.addEventListener('click', () => {
                    aplicarTema(btn.dataset.tema);
                    painel.classList.remove('aberto');
                });
            });

            document.addEventListener('click', e => {
                if (!e.target.closest('.seletor-tema') && painel) painel.classList.remove('aberto');
            });

            if (btnMobile && menuMobile) {
                btnMobile.addEventListener('click', () => menuMobile.classList.toggle('aberto'));
            }

            /* Abas de Categorias da Index */
            const botoesAbas = document.querySelectorAll('.btn-aba');
            const paineis = document.querySelectorAll('.painel-categoria');

            botoesAbas.forEach(aba => {
                aba.addEventListener('click', (e) => {
                    e.preventDefault();
                    botoesAbas.forEach(b => b.classList.remove('ativo'));
                    paineis.forEach(p => p.classList.remove('ativo'));
                    aba.classList.add('ativo');
                    document.getElementById(aba.dataset.alvo).classList.add('ativo');
                });
            });

            /* Avaliação por Estrelas */
            const estrelas = document.querySelectorAll('#notaEstrelas span');
            const inputNota = document.getElementById('inputNota');
            if (estrelas.length) {
                estrelas.forEach(estrela => {
                    estrela.addEventListener('click', () => {
                        inputNota.value = estrela.dataset.valor;
                        estrelas.forEach(e => e.classList.toggle('ativa', Number(e.dataset.valor) <= Number(estrela.dataset.valor)));
                    });
                });
            }

            /* FAQ Acordeão */
            document.querySelectorAll('.faq-pergunta').forEach(pergunta => {
                pergunta.addEventListener('click', () => {
                    const item = pergunta.parentElement;
                    item.classList.toggle('aberto');
                });
            });

            /* Carrossel discreto do banner principal */
            const heroCarousel = document.getElementById('heroCarousel');
            if (heroCarousel) {
                const slidesHero = heroCarousel.querySelectorAll('.hero-slide');
                const dotsHero = document.getElementById('heroDots');
                const prevHero = heroCarousel.querySelector('.hero-prev');
                const nextHero = heroCarousel.querySelector('.hero-next');
                let heroIndex = 0;
                let heroTimer;

                slidesHero.forEach((_, i) => {
                    const dot = document.createElement('button');
                    dot.type = 'button';
                    dot.className = 'hero-dot' + (i === 0 ? ' ativo' : '');
                    dot.setAttribute('aria-label', 'Ir para destaque ' + (i + 1));
                    dot.addEventListener('click', () => showHero(i));
                    dotsHero.appendChild(dot);
                });

                const heroDots = dotsHero.querySelectorAll('.hero-dot');

                function showHero(i) {
                    heroIndex = (i + slidesHero.length) % slidesHero.length;
                    slidesHero.forEach((slide, n) => slide.classList.toggle('ativo', n === heroIndex));
                    heroDots.forEach((dot, n) => dot.classList.toggle('ativo', n === heroIndex));
                    restartHero();
                }

                function restartHero() {
                    clearInterval(heroTimer);
                    heroTimer = setInterval(() => showHero(heroIndex + 1), 5000);
                }

                prevHero.addEventListener('click', () => showHero(heroIndex - 1));
                nextHero.addEventListener('click', () => showHero(heroIndex + 1));

                heroCarousel.addEventListener('mouseenter', () => clearInterval(heroTimer));
                heroCarousel.addEventListener('mouseleave', restartHero);
                restartHero();
            }

            /* Carrossel responsivo da Vitrine */
            const track = document.getElementById('carrosselTrack');
            const itens = Array.from(document.querySelectorAll('.item-carrossel'));
            const btnPrev = document.getElementById('btnPrev');
            const btnNext = document.getElementById('btnNext');
            const dotsContainer = document.getElementById('dotsContainer');
            let indexCarrossel = 0;

            if (track && itens.length && dotsContainer) {
                const getVisibleItems = () => {
                    if (window.innerWidth <= 560) return 1;
                    if (window.innerWidth <= 1100) return 2;
                    return 3;
                };

                itens.forEach((_, i) => {
                    const dot = document.createElement('button');
                    dot.type = 'button';
                    dot.className = 'dot' + (i === 0 ? ' ativo' : '');
                    dot.setAttribute('aria-label', 'Ir para item ' + (i + 1));
                    dot.addEventListener('click', () => irParaSlide(i));
                    dotsContainer.appendChild(dot);
                });

                const dots = Array.from(dotsContainer.querySelectorAll('.dot'));

                function maxIndex() {
                    return Math.max(0, itens.length - getVisibleItems());
                }

                function atualizarCarrossel(animate = true) {
                    const gap = parseFloat(getComputedStyle(track).gap) || 0;
                    const larguraItem = itens[0].getBoundingClientRect().width + gap;
                    const limite = maxIndex();

                    indexCarrossel = Math.min(Math.max(indexCarrossel, 0), limite);
                    track.style.transition = animate ? 'transform .45s cubic-bezier(.22,1,.36,1)' : 'none';
                    track.style.transform = `translate3d(-${indexCarrossel * larguraItem}px,0,0)`;

                    dots.forEach((d, i) => d.classList.toggle('ativo', i === indexCarrossel));
                }

                function irParaSlide(i) {
                    indexCarrossel = Math.min(Math.max(i, 0), maxIndex());
                    atualizarCarrossel();
                }

                if (btnNext) {
                    btnNext.addEventListener('click', () => {
                        indexCarrossel = indexCarrossel >= maxIndex() ? 0 : indexCarrossel + 1;
                        atualizarCarrossel();
                    });
                }

                if (btnPrev) {
                    btnPrev.addEventListener('click', () => {
                        indexCarrossel = indexCarrossel <= 0 ? maxIndex() : indexCarrossel - 1;
                        atualizarCarrossel();
                    });
                }

                /* arrastar com mouse/toque */
                let inicioX = 0;
                let arrastando = false;

                track.addEventListener('pointerdown', e => {
                    inicioX = e.clientX;
                    arrastando = true;
                });

                track.addEventListener('pointerup', e => {
                    if (!arrastando) return;
                    const delta = e.clientX - inicioX;
                    arrastando = false;
                    if (Math.abs(delta) > 45) {
                        if (delta < 0) irParaSlide(indexCarrossel + 1);
                        else irParaSlide(indexCarrossel - 1);
                    }
                });

                track.addEventListener('pointercancel', () => arrastando = false);

                let resizeTimer;
                window.addEventListener('resize', () => {
                    clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(() => atualizarCarrossel(false), 120);
                });

                atualizarCarrossel(false);
            }


            /* Lightbox da Vitrine: clique na foto para ampliar e navegar em sequência */
            const lightbox = document.getElementById('lightboxGaleria');
            const lightboxImagem = document.getElementById('lightboxImagem');
            const lightboxTitulo = document.getElementById('lightboxTitulo');
            const lightboxDescricao = document.getElementById('lightboxDescricao');
            const lightboxContador = document.getElementById('lightboxContador');
            const lightboxFechar = document.getElementById('lightboxFechar');
            const lightboxPrev = document.getElementById('lightboxPrev');
            const lightboxNext = document.getElementById('lightboxNext');

            if (lightbox && itens.length) {
                let lightboxIndex = 0;
                let toqueX = 0;

                function atualizarLightbox() {
                    const item = itens[lightboxIndex];
                    const img = item.querySelector('img');
                    const titulo = item.querySelector('.overlay-carrossel strong');
                    const descricao = item.querySelector('.overlay-carrossel p');

                    if (!img) return;

                    lightboxImagem.src = img.currentSrc || img.src;
                    lightboxImagem.alt = img.alt || 'Foto da vitrine';
                    lightboxTitulo.textContent = titulo ? titulo.textContent : '';
                    lightboxDescricao.textContent = descricao ? descricao.textContent : '';
                    lightboxContador.textContent = `${lightboxIndex + 1} / ${itens.length}`;
                }

                function abrirLightbox(i) {
                    lightboxIndex = (i + itens.length) % itens.length;
                    atualizarLightbox();
                    lightbox.classList.add('aberto');
                    lightbox.setAttribute('aria-hidden', 'false');
                    document.body.classList.add('lightbox-aberto');
                }

                function fecharLightbox() {
                    lightbox.classList.remove('aberto');
                    lightbox.setAttribute('aria-hidden', 'true');
                    document.body.classList.remove('lightbox-aberto');
                }

                function mudarLightbox(direcao) {
                    lightboxIndex = (lightboxIndex + direcao + itens.length) % itens.length;
                    atualizarLightbox();
                }

                itens.forEach((item, i) => {
                    item.addEventListener('click', e => {
                        /* Os botões do carrossel ficam fora dos itens, então o clique é sempre da foto. */
                        if (e.target.closest('a,button')) return;
                        abrirLightbox(i);
                    });
                });

                lightboxFechar.addEventListener('click', fecharLightbox);
                lightboxPrev.addEventListener('click', () => mudarLightbox(-1));
                lightboxNext.addEventListener('click', () => mudarLightbox(1));

                lightbox.addEventListener('click', e => {
                    if (e.target === lightbox) fecharLightbox();
                });

                document.addEventListener('keydown', e => {
                    if (!lightbox.classList.contains('aberto')) return;
                    if (e.key === 'Escape') fecharLightbox();
                    if (e.key === 'ArrowLeft') mudarLightbox(-1);
                    if (e.key === 'ArrowRight') mudarLightbox(1);
                });

                lightboxImagem.addEventListener('pointerdown', e => {
                    toqueX = e.clientX;
                });

                lightboxImagem.addEventListener('pointerup', e => {
                    const delta = e.clientX - toqueX;
                    if (Math.abs(delta) > 45) {
                        mudarLightbox(delta < 0 ? 1 : -1);
                    }
                });
            }

            /* Movimento */
            const elementosAnimados = document.querySelectorAll(
                '.hero > div, .secao, .card-produto, .personalize, .pagamento, ' +
                '.item-carrossel, .card-depoimento, .faq-item, .contato-card, .mapa-box'
            );

            elementosAnimados.forEach((el, i) => {
                if (el.classList.contains('reveal-on-scroll')) return;
                el.classList.add('reveal-on-scroll');
                el.style.transitionDelay = `${Math.min((i % 5) * 55, 220)}ms`;
            });

            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver(entries => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('revealed');
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: .10, rootMargin: '0px 0px -45px 0px' });

                elementosAnimados.forEach(el => observer.observe(el));
            } else {
                elementosAnimados.forEach(el => el.classList.add('revealed'));
            }

            /* Fecha o menu mobile ao navegar por um link interno/externo. */
            if (menuMobile) {
                menuMobile.querySelectorAll('a').forEach(link => {
                    link.addEventListener('click', () => {
                        menuMobile.classList.remove('aberto');
                    });
                });
            }


           

            /* Avaliações locais */
            const reviewsKey = 'dinda-avaliacoes-html';
            const gradeReviews = document.getElementById('gradeDepoimentos');
            const btnReview = document.getElementById('btnEnviarAvaliacao');
            const campoReview = document.getElementById('campoComentario');
            const msgReview = document.getElementById('mensagemAvaliacao');
            function carregarReviews() {
                const arr = JSON.parse(localStorage.getItem(reviewsKey) || '[]');
                arr.forEach(r => {
                    const article = document.createElement('article'); article.className = 'card-depoimento';
                    article.innerHTML = `<div><div class="estrelas">${'★'.repeat(r.nota)}</div><p class="depoimento-texto">“${r.texto.replace(/[<>&]/g, m => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[m]))}”</p></div><p class="depoimento-nome">— Você</p>`;
                    gradeReviews?.appendChild(article);
                });
            }
            btnReview?.addEventListener('click', () => {
                const nota = Number(document.getElementById('inputNota').value || 5), texto = (campoReview?.value || '').trim();
                if (!texto) { msgReview.hidden = false; msgReview.textContent = 'Escreva seu comentário para enviar.'; return; }
                const arr = JSON.parse(localStorage.getItem(reviewsKey) || '[]'); arr.push({ nota, texto }); localStorage.setItem(reviewsKey, JSON.stringify(arr));
                msgReview.hidden = false; msgReview.textContent = 'Obrigada! Seu depoimento foi salvo neste navegador. ✨'; campoReview.value = ''; carregarReviews();
            });
            carregarReviews();
            const anoAtual = document.getElementById('anoAtual'); if (anoAtual) anoAtual.textContent = new Date().getFullYear();

        })();
