/*
  motion.js — camada extra de imersão da Aura Wear.

  Tudo aqui é opcional: cada init sai cedo se faltar o elemento alvo,
  se o usuário pedir menos movimento (prefers-reduced-motion) ou se o
  efeito depender de ponteiro fino (mouse) e o dispositivo não tiver.

  Depende só do que já existe:
  - a classe .in-view que script.js aplica aos cards (revelação da imagem é CSS puro);
  - window.AuraStore (script.js) para o count-up de preço;
  - o evento "aura:add-to-cart" que script.js dispara (voar pra sacola).
*/
(function () {
  "use strict";

  const MOTION_OK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE_POINTER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  /* ============================================
     1. HERO — parallax (mouse + scroll) em camadas
     ============================================ */
  function initHeroParallax() {
    if (!MOTION_OK) return;
    const hero = document.querySelector(".hero");
    if (!hero) return;

    const layers = [
      { el: hero.querySelector(".hero-frame"), mouse: 9, scroll: 0.05 },
      { el: hero.querySelector(".hero-caption"), mouse: 16, scroll: 0.09 },
    ].filter((l) => l.el);
    if (!layers.length) return;

    const useMouse = FINE_POINTER;
    let tx = 0, ty = 0, cx = 0, cy = 0, visible = true, rafId = null;

    function loop() {
      cx = lerp(cx, tx, 0.09);
      cy = lerp(cy, ty, 0.09);
      const rel = -hero.getBoundingClientRect().top; // cresce conforme rola pra baixo
      layers.forEach((l) => {
        const mx = useMouse ? -cx * l.mouse : 0;
        const my = useMouse ? -cy * l.mouse : 0;
        l.el.style.transform =
          `translate3d(${mx.toFixed(2)}px, ${(my + rel * l.scroll).toFixed(2)}px, 0)`;
      });
      rafId = visible ? requestAnimationFrame(loop) : null;
    }

    if (useMouse) {
      hero.addEventListener("mousemove", (e) => {
        const r = hero.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      });
      hero.addEventListener("mouseleave", () => { tx = 0; ty = 0; });
    }

    new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible && !rafId) loop();
      },
      { rootMargin: "120px" }
    ).observe(hero);

    loop();
  }

  /* ============================================
     2. REVELAÇÃO DE TEXTO — máscara subindo
     ============================================ */
  function initTextReveal() {
    if (!MOTION_OK) return;

    const groups = document.querySelectorAll(".section-head, .newsletter-inner");
    if (!groups.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-revealed");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.25 }
    );

    groups.forEach((group) => {
      const targets = group.querySelectorAll("h1, h2, .eyebrow, .section-sub, .newsletter-sub");
      let i = 0;
      targets.forEach((el) => {
        if (el.id) return; // títulos trocados via JS (ex.: #catalogTitle)
        if (el.querySelector(".scramble-line") || el.querySelector(".aura-line-i")) return;

        const inner = document.createElement("span");
        inner.className = "aura-line-i";
        while (el.firstChild) inner.appendChild(el.firstChild);

        const mask = document.createElement("span");
        mask.className = "aura-line";
        mask.appendChild(inner);
        el.appendChild(mask);

        inner.style.transitionDelay = (i * 0.07).toFixed(2) + "s";
        i++;
      });
      io.observe(group);
    });
  }

  /* ============================================
     3a. VITRINE — tilt 3D no hover
     ============================================ */
  function initCardTilt() {
    if (!MOTION_OK || !FINE_POINTER) return;
    const MAX = 4;
    let current = null;

    document.addEventListener("mouseover", (e) => {
      const card = e.target.closest(".product-card");
      if (card && card !== current) {
        if (current) resetCard(current);
        current = card;
        current.classList.add("is-tilting");
      }
    });

    document.addEventListener("mousemove", (e) => {
      if (!current) return;
      if (!current.contains(e.target)) { resetCard(current); current = null; return; }
      const r = current.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      current.style.transform =
        `perspective(820px) rotateY(${(px * MAX).toFixed(2)}deg) rotateX(${(-py * MAX).toFixed(2)}deg) translateY(-8px)`;
    });

    document.addEventListener("mouseout", (e) => {
      const card = e.target.closest(".product-card");
      if (card && current === card && !card.contains(e.relatedTarget)) {
        resetCard(card);
        current = null;
      }
    });

    function resetCard(card) {
      card.style.transform = "";
      card.classList.remove("is-tilting");
    }
  }

  /* ============================================
     3b. VITRINE — count-up de preço (uma vez, na 1ª carga)
     ============================================ */
  function initPriceCountUp(grid) {
    if (!MOTION_OK) return;
    const store = window.AuraStore;
    if (!store || typeof store.formatPrice !== "function") return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          const priceEl = e.target.querySelector(".product-price");
          const id = e.target.querySelector(".add-btn") && e.target.querySelector(".add-btn").dataset.id;
          const product = id && store.findProduct(id);
          if (priceEl && product) countUp(priceEl, product.priceCents, store.formatPrice);
        });
      },
      { threshold: 0.5 }
    );

    grid.querySelectorAll(".product-card").forEach((c) => io.observe(c));
  }

  function countUp(el, targetCents, fmt) {
    const start = performance.now();
    const dur = 460;
    function frame(now) {
      const t = clamp((now - start) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(Math.round(targetCents * eased));
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = fmt(targetCents);
    }
    requestAnimationFrame(frame);
  }

  /* ============================================
     3c. VITRINE — skeleton enquanto o catálogo carrega
     ============================================ */
  function initCatalogFx() {
    const grid = document.getElementById("productGrid");
    if (!grid) return;

    let skel = null;
    if (!grid.querySelector(".product-card")) {
      skel = document.createElement("div");
      skel.className = "aura-skel-grid";
      skel.setAttribute("aria-hidden", "true");
      for (let i = 0; i < 8; i++) {
        skel.appendChild(Object.assign(document.createElement("div"), { className: "aura-skel" }));
      }
      grid.parentNode.insertBefore(skel, grid.nextSibling);
      grid.style.display = "none";
    }

    let done = false;
    const finish = (readyGrid) => {
      if (done) return;
      done = true;
      if (skel) skel.remove();
      readyGrid.style.display = "";
      initPriceCountUp(readyGrid);
    };

    whenGridReady(finish);
    // rede fora do ar / catálogo vazio: não deixa o skeleton preso
    if (skel) setTimeout(() => finish(grid), 6000);
  }

  // Rede de segurança: se por algum motivo o observer de script.js não marcar
  // um card visível como .in-view, a imagem ficaria com clip fechado. Depois de
  // um tempo, revela qualquer card que já esteja na viewport.
  function initRevealSafetyNet() {
    if (!MOTION_OK) return;
    setTimeout(() => {
      const vh = window.innerHeight;
      document.querySelectorAll(".product-card:not(.in-view), .category-card:not(.in-view)").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) el.classList.add("in-view");
      });
    }, 3000);
  }

  function whenGridReady(cb) {
    const grid = document.getElementById("productGrid");
    if (!grid) return;
    if (grid.querySelector(".product-card")) { cb(grid); return; }
    const mo = new MutationObserver(() => {
      if (grid.querySelector(".product-card")) { mo.disconnect(); cb(grid); }
    });
    mo.observe(grid, { childList: true });
  }

  /* ============================================
     4. VOAR PRA SACOLA
     ============================================ */
  function initFlyToBag() {
    if (!MOTION_OK) return;
    const bag = document.getElementById("bagBtn");
    if (!bag) return;

    let source = null;
    let stamp = 0;

    document.addEventListener(
      "click",
      (e) => {
        const btn = e.target.closest(".add-btn, #qvAddToCart");
        if (!btn) return;
        if (btn.id === "qvAddToCart") {
          source = document.querySelector("#quickviewSwatch");
        } else {
          const card = btn.closest(".product-card");
          source = card && card.querySelector(".product-swatch");
        }
        stamp = Date.now();
      },
      true
    );

    document.addEventListener("aura:add-to-cart", () => {
      if (!source || Date.now() - stamp > 1200) return;
      flyClone(source, bag);
      source = null;
    });
  }

  function flyClone(src, target) {
    const s = src.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    if (!s.width || !t.width) return;

    const clone = src.cloneNode(true);
    clone.classList.add("aura-fly-clone");
    clone.removeAttribute("id");
    clone.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
    clone.style.left = s.left + "px";
    clone.style.top = s.top + "px";
    clone.style.width = s.width + "px";
    clone.style.height = s.height + "px";
    clone.style.margin = "0";
    document.body.appendChild(clone);

    const dx = t.left + t.width / 2 - (s.left + s.width / 2);
    const dy = t.top + t.height / 2 - (s.top + s.height / 2);

    const anim = clone.animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 1, offset: 0 },
        { transform: `translate(${dx * 0.55}px, ${dy * 0.5 - 70}px) scale(0.55)`, opacity: 0.95, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.06)`, opacity: 0.15, offset: 1 },
      ],
      { duration: 760, easing: "cubic-bezier(0.55, 0, 0.7, 0.25)" }
    );

    anim.onfinish = () => {
      clone.remove();
      target.classList.remove("bump");
      void target.offsetWidth;
      target.classList.add("bump");
    };
  }

  /* ============================================
     5. ÍNDICE DE CAPÍTULOS
     ============================================ */
  function initChapters() {
    if (!MOTION_OK) return;

    const defs = [
      { sel: "#edit", label: "The Edit" },
      { sel: "#categorias", label: "Categorias" },
      { sel: "#vitrine", label: "A Vitrine" },
      { sel: ".newsletter", label: "A Coluna" },
    ];
    const items = defs
      .map((d) => ({ ...d, el: document.querySelector(d.sel) }))
      .filter((d) => d.el);
    if (items.length < 2) return;

    const roman = ["I", "II", "III", "IV", "V", "VI"];
    const nav = document.createElement("nav");
    nav.className = "aura-chapters";
    nav.setAttribute("aria-label", "Índice da página");

    items.forEach((it, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "aura-chapter";
      btn.innerHTML =
        `<span class="aura-chapter-label">${it.label}</span>` +
        `<span class="aura-chapter-num">${roman[idx]}</span>`;
      btn.addEventListener("click", () => {
        it.el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      it.btn = btn;
      nav.appendChild(btn);
    });
    document.body.appendChild(nav);

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const match = items.find((it) => it.el === e.target);
          if (match) items.forEach((it) => it.btn.classList.toggle("is-active", it === match));
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    items.forEach((it) => io.observe(it.el));
  }

  /* ============================================
     6. RÓTULO NO CURSOR
     ============================================ */
  function initCursorLabel() {
    if (!MOTION_OK || !FINE_POINTER) return;

    const label = document.createElement("div");
    label.className = "aura-cursor-label";
    document.body.appendChild(label);

    const map = [
      { sel: ".wish-btn", text: "favoritar" },
      { sel: ".quick-view-btn", text: "espiar" },
      { sel: ".product-card", text: "ver" },
      { sel: ".category-card", text: "explorar" },
      { sel: ".ticker", text: "fofoca" },
    ];

    let shown = false;

    window.addEventListener(
      "mousemove",
      (e) => {
        label.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        let hit = null;
        for (const m of map) {
          if (e.target.closest(m.sel)) { hit = m; break; }
        }
        if (hit) {
          if (label.textContent !== hit.text) label.textContent = hit.text;
          if (!shown) { label.classList.add("show"); shown = true; }
        } else if (shown) {
          label.classList.remove("show");
          shown = false;
        }
      },
      { passive: true }
    );

    window.addEventListener("mouseout", (e) => {
      if (!e.relatedTarget && shown) { label.classList.remove("show"); shown = false; }
    });
  }

  /* ============================================
     7. CORTINA DE TRANSIÇÃO DE PÁGINA
     ============================================ */
  function initPageTransition() {
    const curtain = document.createElement("div");
    curtain.className = "aura-curtain";
    document.body.appendChild(curtain);

    if (sessionStorage.getItem("aura:transition")) {
      sessionStorage.removeItem("aura:transition");
      if (MOTION_OK) {
        curtain.style.transform = "translateY(0)";
        const out = curtain.animate(
          [{ transform: "translateY(0)" }, { transform: "translateY(-100%)" }],
          { duration: 620, easing: "cubic-bezier(0.7, 0, 0.3, 1)", fill: "forwards" }
        );
        out.onfinish = () => { curtain.style.transform = "translateY(-100%)"; out.cancel(); };
      }
    }

    if (!MOTION_OK) return;

    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href]');
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;

      let url;
      try { url = new URL(a.href, location.href); } catch (_) { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) return;

      e.preventDefault();
      sessionStorage.setItem("aura:transition", "1");
      curtain.animate(
        [{ transform: "translateY(100%)" }, { transform: "translateY(0)" }],
        { duration: 460, easing: "cubic-bezier(0.7, 0, 0.3, 1)", fill: "forwards" }
      );
      setTimeout(() => { location.href = a.href; }, 440);
    });
  }

  /* ============================================
     8. CASCATA DOS ITENS DA SACOLA
     ============================================ */
  function initDrawerCascade() {
    if (!MOTION_OK) return;
    const drawer = document.getElementById("cartDrawer");
    if (!drawer) return;

    let wasOpen = drawer.classList.contains("open");
    new MutationObserver(() => {
      const isOpen = drawer.classList.contains("open");
      if (isOpen && !wasOpen) {
        drawer.classList.add("just-opened");
        setTimeout(() => drawer.classList.remove("just-opened"), 850);
      }
      wasOpen = isOpen;
    }).observe(drawer, { attributes: true, attributeFilter: ["class"] });
  }

  /* ============================================
     BOOT
     ============================================ */
  function boot() {
    // liga a revelação de imagem por CSS (motion.css); sem isto as fotos
    // aparecem sem clip, então uma falha aqui nunca esconde produto.
    if (MOTION_OK) document.documentElement.classList.add("js-motion");

    initPageTransition();
    initHeroParallax();
    initTextReveal();
    initCardTilt();
    initCatalogFx();
    initRevealSafetyNet();
    initFlyToBag();
    initChapters();
    initCursorLabel();
    initDrawerCascade();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
