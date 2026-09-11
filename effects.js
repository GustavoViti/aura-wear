(function () {
  "use strict";

  // trava de segurança: a home nunca pode ficar presa atrás do preloader
  setTimeout(() => document.documentElement.classList.add("intro-ready"), 4500);

  /* ============================================
     PRELOADER
     ============================================ */
  function initPreloader() {
    const preloader = document.getElementById("preloader");
    if (!preloader) {
      document.documentElement.classList.add("intro-ready");
      return;
    }

    const fill = document.getElementById("preloaderFill");
    const countEl = document.getElementById("preloaderCount");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let hidden = false;
    function hide() {
      if (hidden) return;
      hidden = true;
      if (countEl) countEl.textContent = "100";
      if (fill) fill.style.width = "100%";
      document.documentElement.classList.add("intro-ready");
      document.dispatchEvent(new CustomEvent("aura:intro-done"));
      preloader.classList.add("hide");
      setTimeout(() => preloader.classList.add("gone"), 1150);
    }

    if (reduce) {
      // sem contagem: espera o load e sai direto
      if (document.readyState === "complete") hide();
      else window.addEventListener("load", hide, { once: true });
      setTimeout(hide, 3000);
      return;
    }

    // contagem 0 -> 100; anda até ~92 e fecha quando a página carrega
    const start = performance.now();
    const RAMP = 3400; // ms até ~92%
    let pageLoaded = document.readyState === "complete";
    window.addEventListener("load", () => { pageLoaded = true; }, { once: true });

    function tick(now) {
      if (hidden) return;
      const t = Math.min((now - start) / RAMP, 1);
      const eased = 1 - Math.pow(1 - t, 2);
      let pct = Math.floor(eased * 92);
      if (pageLoaded && t >= 1) pct = 100;
      if (countEl) countEl.textContent = String(pct);
      if (fill) fill.style.width = pct + "%";
      if (pct >= 100) {
        setTimeout(hide, 650);
        return;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // não deixa a abertura passar de ~7s de qualquer jeito
    setTimeout(hide, 7000);
  }

  /* ============================================
     SCROLL PROGRESS BAR
     ============================================ */
  function initScrollProgress() {
    const bar = document.getElementById("scrollProgressBar");
    if (!bar) return;

    let ticking = false;
    function update() {
      const scrollTop = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const pct = height > 0 ? (scrollTop / height) * 100 : 0;
      bar.style.width = pct + "%";
      ticking = false;
    }

    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    });
    update();
  }

  /* ============================================
     CUSTOM CURSOR (apenas em dispositivos com mouse)
     ============================================ */
  function initCustomCursor() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const dot = document.getElementById("cursorDot");
    const ring = document.getElementById("cursorRing");
    if (!dot || !ring) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    document.body.classList.add("has-custom-cursor");

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    function loop() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    }
    loop();

    const hoverTargets = "a, button, input, textarea, select, .product-card, .category-card, .swatch-option, .pay-option";

    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(hoverTargets)) ring.classList.add("hover");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(hoverTargets)) ring.classList.remove("hover");
    });
    document.addEventListener("mousedown", () => ring.classList.add("active"));
    document.addEventListener("mouseup", () => ring.classList.remove("active"));
    document.addEventListener("mouseleave", () => {
      dot.classList.add("cursor-hidden");
      ring.classList.add("cursor-hidden");
    });
    document.addEventListener("mouseenter", () => {
      dot.classList.remove("cursor-hidden");
      ring.classList.remove("cursor-hidden");
    });
  }

  /* ============================================
     TAB ATTENTION — "volta aqui" quando o usuário sai da aba
     ============================================ */
  function initTabAttention() {
    if (typeof document.title === "undefined") return;
    const originalTitle = document.title;
    const messages = ["Volta aqui... 👀", "Sentimos sua falta. XOXO", "A vitrine ainda te espera."];
    let idx = 0;

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        document.title = messages[idx % messages.length];
        idx++;
      } else {
        document.title = originalTitle;
      }
    });
  }

  /* ============================================
     MAGNETIC BUTTONS
     ============================================ */
  function initMagneticButtons() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.querySelectorAll(".btn-gold, .btn-outline").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.3}px)`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "";
      });
    });
  }

  initPreloader();
  initScrollProgress();
  initCustomCursor();
  initTabAttention();
  initMagneticButtons();
})();
