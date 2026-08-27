(function () {
  "use strict";

  const priceFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  let activeCategory = "todos";
  let cart = []; // { id, name, price, qty, swatch }
  let currentStep = 1;

  function formatPrice(cents) {
    return priceFormatter.format(cents / 100);
  }

  /* ============================================
     TICKER
     ============================================ */
  function renderTicker() {
    const track = document.getElementById("tickerTrack");
    const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
    track.innerHTML = items
      .map(
        (text) =>
          `<span class="ticker-item">${text}</span><span class="ticker-divider">✦</span>`
      )
      .join("");
  }

  /* ============================================
     CATEGORIES
     ============================================ */
  function renderCategories() {
    const strip = document.getElementById("categoryStrip");
    const all = [{ id: "todos", label: "Todas", glyph: "★" }, ...CATEGORIES];

    strip.innerHTML = all
      .map(
        (cat, i) => `
        <button class="category-card${cat.id === activeCategory ? " active" : ""}" data-category="${cat.id}" style="--i:${i}">
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

    observeReveal(strip.querySelectorAll(".category-card"));
  }

  /* ============================================
     PRODUCTS
     ============================================ */
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
        (p, i) => `
        <article class="product-card" style="--i:${i}">
          <div class="product-swatch swatch-${p.swatch}">
            ${p.featured ? '<span class="featured-badge">XOXO</span>' : ""}
            ${
              p.imageUrl
                ? `<img class="product-photo" src="${p.imageUrl}" alt="${p.name}" loading="lazy">`
                : `<span class="monogram">${p.name.charAt(0)}</span>`
            }
          </div>
          <div class="product-info">
            <h3 class="product-name">${p.name}</h3>
            <p class="product-desc">${p.description}</p>
            <div class="product-footer">
              <span class="product-price">${formatPrice(p.priceCents)}</span>
              <button class="add-btn" data-id="${p.id}">Adicionar</button>
            </div>
          </div>
        </article>`
      )
      .join("");

    grid.querySelectorAll(".add-btn").forEach((btn) => {
      btn.addEventListener("click", () => addToCart(btn.dataset.id));
    });

    observeReveal(grid.querySelectorAll(".product-card"));
  }

  /* ============================================
     SCROLL REVEAL
     ============================================ */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  function observeReveal(elements) {
    elements.forEach((el) => revealObserver.observe(el));
  }

  /* ============================================
     TOAST
     ============================================ */
  let toastTimer = null;
  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  /* ============================================
     CART
     ============================================ */
  function addToCart(productId) {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return;

    const existing = cart.find((item) => item.id === productId);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        priceCents: product.priceCents,
        swatch: product.swatch,
        imageUrl: product.imageUrl,
        qty: 1,
      });
    }

    updateBagCount();
    renderCartDrawer();
    showToast(`"${product.name}" adicionado à sua sacola. XOXO.`);

    const bagBtn = document.getElementById("bagBtn");
    const bagCountEl = document.getElementById("bagCount");
    bagBtn.classList.remove("bump");
    bagCountEl.classList.remove("bump");
    void bagBtn.offsetWidth; // restart animation
    bagBtn.classList.add("bump");
    bagCountEl.classList.add("bump");
  }

  function changeQty(productId, delta) {
    const item = cart.find((i) => i.id === productId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter((i) => i.id !== productId);
    }
    updateBagCount();
    renderCartDrawer();
  }

  function removeFromCart(productId) {
    cart = cart.filter((i) => i.id !== productId);
    updateBagCount();
    renderCartDrawer();
  }

  function cartSubtotalCents() {
    return cart.reduce((sum, item) => sum + item.priceCents * item.qty, 0);
  }

  function updateBagCount() {
    const total = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById("bagCount").textContent = total;
  }

  function renderCartDrawer() {
    const itemsEl = document.getElementById("cartItems");
    const subtotalEl = document.getElementById("cartSubtotal");
    const checkoutBtn = document.getElementById("checkoutBtn");

    if (cart.length === 0) {
      itemsEl.innerHTML = `<p class="drawer-empty">Sua sacola está vazia — por enquanto.</p>`;
      checkoutBtn.disabled = true;
    } else {
      itemsEl.innerHTML = cart
        .map(
          (item) => `
          <div class="cart-item">
            <div class="cart-item-swatch swatch-${item.swatch}">${
              item.imageUrl
                ? `<img src="${item.imageUrl}" alt="${item.name}" loading="lazy">`
                : item.name.charAt(0)
            }</div>
            <div class="cart-item-info">
              <span class="cart-item-name">${item.name}</span>
              <span class="cart-item-price">${formatPrice(item.priceCents)}</span>
              <div class="qty-stepper">
                <button data-action="dec" data-id="${item.id}" aria-label="Diminuir quantidade">−</button>
                <span>${item.qty}</span>
                <button data-action="inc" data-id="${item.id}" aria-label="Aumentar quantidade">+</button>
              </div>
            </div>
            <button class="cart-item-remove" data-id="${item.id}">Remover</button>
          </div>`
        )
        .join("");
      checkoutBtn.disabled = false;

      itemsEl.querySelectorAll("[data-action='inc']").forEach((btn) =>
        btn.addEventListener("click", () => changeQty(btn.dataset.id, 1))
      );
      itemsEl.querySelectorAll("[data-action='dec']").forEach((btn) =>
        btn.addEventListener("click", () => changeQty(btn.dataset.id, -1))
      );
      itemsEl.querySelectorAll(".cart-item-remove").forEach((btn) =>
        btn.addEventListener("click", () => removeFromCart(btn.dataset.id))
      );
    }

    subtotalEl.textContent = formatPrice(cartSubtotalCents());
  }

  /* ============================================
     DRAWER OPEN / CLOSE
     ============================================ */
  function openDrawer() {
    document.getElementById("cartDrawer").classList.add("open");
    document.getElementById("overlay").classList.add("show");
  }

  function closeDrawer() {
    document.getElementById("cartDrawer").classList.remove("open");
    if (!document.getElementById("checkoutModal").classList.contains("open")) {
      document.getElementById("overlay").classList.remove("show");
    }
  }

  /* ============================================
     CHECKOUT MODAL
     ============================================ */
  function openCheckout() {
    if (cart.length === 0) return;
    currentStep = 1;
    goToStep(1);
    renderCheckoutSummary();
    document.getElementById("checkoutModal").classList.add("open");
    document.getElementById("overlay").classList.add("show");
    document.getElementById("cartDrawer").classList.remove("open");
  }

  function closeCheckout() {
    document.getElementById("checkoutModal").classList.remove("open");
    document.getElementById("overlay").classList.remove("show");
  }

  function goToStep(step) {
    currentStep = step;

    document.querySelectorAll(".step-panel").forEach((panel) => {
      panel.classList.toggle("active", Number(panel.dataset.step) === step);
    });

    document.querySelectorAll(".step-dot").forEach((dot) => {
      const dotStep = Number(dot.dataset.step);
      dot.classList.toggle("active", dotStep === step);
      dot.classList.toggle("done", dotStep < step);
    });

    document.getElementById("checkoutSummary").classList.toggle("hidden", step === 3);
  }

  function renderCheckoutSummary() {
    const el = document.getElementById("checkoutSummary");
    const subtotal = cartSubtotalCents();
    const shipping = subtotal > 0 ? 2900 : 0;
    const total = subtotal + shipping;

    el.innerHTML = `
      <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
      <div class="summary-row"><span>Frete</span><span>${formatPrice(shipping)}</span></div>
      <div class="summary-row total"><span>Total</span><span>${formatPrice(total)}</span></div>
    `;
  }

  function validateForm(form) {
    let valid = true;
    form.querySelectorAll("input[required]").forEach((input) => {
      const empty = input.value.trim() === "";
      input.classList.toggle("field-error", empty);
      if (empty) valid = false;
    });
    return valid;
  }

  function runConfirmation() {
    const loading = document.getElementById("confirmLoading");
    const success = document.getElementById("confirmSuccess");
    loading.classList.add("show");
    success.classList.remove("show");

    setTimeout(() => {
      loading.classList.remove("show");
      success.classList.add("show");

      const orderNum = "AW-" + Math.floor(1000 + Math.random() * 9000);
      document.getElementById("orderNumber").textContent = "#" + orderNum;

      // restart checkmark draw animation
      const circle = document.querySelector(".check-circle");
      const mark = document.querySelector(".check-mark");
      [circle, mark].forEach((el) => {
        el.style.animation = "none";
        void el.offsetWidth;
        el.style.animation = "";
      });
    }, 1400);
  }

  function resetCheckoutAndCart() {
    cart = [];
    updateBagCount();
    renderCartDrawer();
    closeCheckout();
    goToStep(1);
    document.getElementById("shippingForm").reset();
    document.getElementById("paymentForm").reset();
  }

  /* ============================================
     EVENTS
     ============================================ */
  function bindEvents() {
    document.getElementById("bagBtn").addEventListener("click", openDrawer);
    document.getElementById("closeDrawer").addEventListener("click", closeDrawer);
    document.getElementById("closeCheckout").addEventListener("click", closeCheckout);
    document.getElementById("checkoutBtn").addEventListener("click", openCheckout);
    document.getElementById("continueShopping").addEventListener("click", resetCheckoutAndCart);

    document.getElementById("overlay").addEventListener("click", () => {
      closeDrawer();
      closeCheckout();
    });

    document.getElementById("shippingForm").addEventListener("submit", (e) => {
      e.preventDefault();
      if (validateForm(e.target)) goToStep(2);
    });

    document.getElementById("backToStep1").addEventListener("click", () => goToStep(1));

    document.getElementById("paymentForm").addEventListener("submit", (e) => {
      e.preventDefault();
      goToStep(3);
      runConfirmation();
    });

    document.querySelectorAll(".pay-option").forEach((label) => {
      label.addEventListener("click", () => {
        document.querySelectorAll(".pay-option").forEach((l) => l.classList.remove("active"));
        label.classList.add("active");
        const isPix = label.querySelector("input").value === "pix";
        document.querySelector(".card-fields").style.display = isPix ? "none" : "block";
        document.querySelector(".pix-note").classList.toggle("show", isPix);
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeDrawer();
        closeCheckout();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    renderTicker();
    if (typeof loadCatalog === "function") await loadCatalog();
    renderCategories();
    renderProducts();
    renderCartDrawer();
    bindEvents();
  });
})();
