(function () {
  "use strict";

  const priceFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  let activeCategory = "todos";
  let bagCount = 0;

  function formatPrice(cents) {
    return priceFormatter.format(cents / 100);
  }

  function renderTicker() {
    const track = document.getElementById("tickerTrack");
    // duplicamos a lista para o loop de scroll ficar contínuo (translateX -50%)
    const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
    track.innerHTML = items
      .map(
        (text) =>
          `<span class="ticker-item">${text}</span><span class="ticker-divider">✦</span>`
      )
      .join("");
  }

  function renderCategories() {
    const strip = document.getElementById("categoryStrip");
    const all = [{ id: "todos", label: "Todas", glyph: "★" }, ...CATEGORIES];

    strip.innerHTML = all
      .map(
        (cat) => `
        <button class="category-card${cat.id === activeCategory ? " active" : ""}" data-category="${cat.id}">
          <div class="category-glyph">${cat.glyph}</div>
          <div class="category-label">${cat.label}</div>
        </button>`
      )
      .join("");

    strip.querySelectorAll(".category-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeCategory = btn.dataset.category;
        renderCategories();
        renderProducts();
        document.getElementById("vitrine").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function renderProducts() {
    const grid = document.getElementById("productGrid");
    const title = document.getElementById("catalogTitle");
    const eyebrow = document.getElementById("catalogEyebrow");

    const filtered =
      activeCategory === "todos"
        ? PRODUCTS
        : PRODUCTS.filter((p) => p.category === activeCategory);

    if (activeCategory === "todos") {
      eyebrow.textContent = "Todas as fontes";
      title.textContent = "A vitrine";
    } else {
      const cat = CATEGORIES.find((c) => c.id === activeCategory);
      eyebrow.textContent = "Filtrando por";
      title.textContent = cat ? cat.label : "A vitrine";
    }

    grid.innerHTML = filtered
      .map(
        (p) => `
        <article class="product-card">
          <div class="product-swatch swatch-${p.swatch}">
            ${p.featured ? '<span class="featured-badge">XOXO</span>' : ""}
            <span class="monogram">${p.name.charAt(0)}</span>
          </div>
          <div class="product-info">
            <h3 class="product-name">${p.name}</h3>
            <p class="product-desc">${p.description}</p>
            <div class="product-footer">
              <span class="product-price">${formatPrice(p.priceCents)}</span>
              <button class="add-btn" data-name="${p.name}">Adicionar</button>
            </div>
          </div>
        </article>`
      )
      .join("");

    grid.querySelectorAll(".add-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        bagCount += 1;
        document.getElementById("bagCount").textContent = bagCount;
        showToast(`"${btn.dataset.name}" adicionado à sua vitrine. XOXO.`);
      });
    });
  }

  let toastTimer = null;
  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderTicker();
    renderCategories();
    renderProducts();
  });
})();
