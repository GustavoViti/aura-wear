(function () {
  "use strict";

  /* ============================================
     PRELOADER
     ============================================ */
  function initPreloader() {
    const preloader = document.getElementById("preloader");
    if (!preloader) return;

    const hide = () => preloader.classList.add("hide");

    if (document.readyState === "complete") {
      setTimeout(hide, 500);
    } else {
      window.addEventListener("load", () => setTimeout(hide, 500));
    }
    // rede lenta não deve travar a experiência
    setTimeout(hide, 2500);
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

  initPreloader();
  initScrollProgress();
  initCustomCursor();
})();
