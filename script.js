(function () {
  "use strict";

  const priceFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  const PROMO_CODES = {
    XOXO10: 0.1,
    UPPEREAST: 0.15,
  };

  let activeCategory = "todos";
  let searchQuery = "";
  let sortOrder = "featured";
  let cart = []; // { id, name, priceCents, swatch, imageUrl, qty }
  let currentStep = 1;
  let wishlist = new Set();
  let appliedPromo = null; // { code, rate }
  let lastConfirmedItems = [];
  let quickViewProductId = null;
  let quickViewQty = 1;

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
  function filterAndSortProducts() {
    let list =
      activeCategory === "todos" ? [...PRODUCTS] : PRODUCTS.filter((p) => p.category === activeCategory);

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }

    switch (sortOrder) {
      case "price-asc":
        list.sort((a, b) => a.priceCents - b.priceCents);
        break;
      case "price-desc":
        list.sort((a, b) => b.priceCents - a.priceCents);
        break;
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        list.sort((a, b) => (b.featured === true) - (a.featured === true));
    }

    return list;
  }

  function productCardHTML(p, i) {
    return `
      <article class="product-card" style="--i:${i}">
        <div class="product-swatch swatch-${p.swatch}">
          ${p.featured ? '<span class="featured-badge">XOXO</span>' : ""}
          <button class="wish-btn${wishlist.has(p.id) ? " saved" : ""}" data-id="${p.id}" aria-label="Adicionar aos favoritos">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M12 20s-7-4.35-9.5-8.5C.5 8 2 4 6 4c2 0 3.5 1.3 4 2.5C10.5 5.3 12 4 14 4c4 0 5.5 4 3.5 7.5C19 15.65 12 20 12 20z"/>
            </svg>
          </button>
          ${
            p.imageUrl
              ? `<img class="product-photo" src="${p.imageUrl}" alt="${p.name}" loading="lazy">`
              : `<span class="monogram">${p.name.charAt(0)}</span>`
          }
          <button class="quick-view-btn" data-id="${p.id}">Visualização rápida</button>
        </div>
        <div class="product-info">
          <h3 class="product-name">${p.name}</h3>
          <p class="product-desc">${p.description}</p>
          <div class="product-footer">
            <span class="product-price">${formatPrice(p.priceCents)}</span>
            <button class="add-btn" data-id="${p.id}">Adicionar</button>
          </div>
        </div>
      </article>`;
  }

  function bindProductCardEvents(container) {
    container.querySelectorAll(".add-btn").forEach((btn) => {
      btn.addEventListener("click", () => addToCart(btn.dataset.id));
    });

    container.querySelectorAll(".wish-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleWishlist(btn.dataset.id, btn);
      });
    });

    container.querySelectorAll(".quick-view-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openQuickView(btn.dataset.id);
      });
    });

    observeReveal(container.querySelectorAll(".product-card"));
  }

  function renderProducts() {
    const grid = document.getElementById("productGrid");
    const title = document.getElementById("catalogTitle");
    const eyebrow = document.getElementById("catalogEyebrow");
    const searchStatus = document.getElementById("searchStatus");
    const emptyState = document.getElementById("emptyState");

    const filtered = filterAndSortProducts();

    if (activeCategory === "todos") {
      eyebrow.textContent = "Todas as fontes";
      title.textContent = "A vitrine";
    } else {
      const cat = CATEGORIES.find((c) => c.id === activeCategory);
      eyebrow.textContent = "Filtrando por";
      title.textContent = cat ? cat.label : "A vitrine";
    }

    if (searchQuery.trim()) {
      searchStatus.hidden = false;
      searchStatus.textContent = `Resultados para "${searchQuery.trim()}" (${filtered.length})`;
    } else {
      searchStatus.hidden = true;
    }

    emptyState.hidden = filtered.length > 0;
    grid.style.display = filtered.length > 0 ? "" : "none";

    grid.innerHTML = filtered.map((p, i) => productCardHTML(p, i)).join("");
    bindProductCardEvents(grid);
  }

  function renderEditorial() {
    const grid = document.getElementById("editorialGrid");
    const empty = document.getElementById("editorialEmpty");

    const picks = PRODUCTS.filter((p) => p.inEdit).slice(0, 3);

    if (picks.length === 0) {
      grid.innerHTML = "";
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    grid.innerHTML = picks.map((p, i) => productCardHTML(p, i)).join("");
    bindProductCardEvents(grid);
  }

  function toggleWishlist(productId, btn) {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return;

    const saving = !wishlist.has(productId);
    if (saving) {
      wishlist.add(productId);
    } else {
      wishlist.delete(productId);
    }

    document.querySelectorAll(`.wish-btn[data-id="${productId}"]`).forEach((el) => {
      el.classList.toggle("saved", saving);
    });
    if (quickViewProductId === productId) {
      document.getElementById("qvWishBtn").classList.toggle("saved", saving);
    }

    if (saving) {
      btn.classList.remove("saved");
      void btn.offsetWidth;
      btn.classList.add("saved");
      showToast(`"${product.name}" favoritado. Bom gosto. XOXO.`);
    } else {
      showToast(`"${product.name}" saiu da sua lista de desejos.`);
    }
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
     QUICK VIEW
     ============================================ */
  function openQuickView(productId) {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return;

    quickViewProductId = productId;
    quickViewQty = 1;

    const cat = CATEGORIES.find((c) => c.id === product.category);
    document.getElementById("quickviewCategory").textContent = cat ? cat.label : "";
    document.getElementById("quickviewName").textContent = product.name;
    document.getElementById("quickviewPrice").textContent = formatPrice(product.priceCents);
    document.getElementById("quickviewDesc").textContent = product.description;
    document.getElementById("qvQty").textContent = quickViewQty;

    const swatch = document.getElementById("quickviewSwatch");
    swatch.className = `product-swatch swatch-${product.swatch}`;
    if (product.imageUrl) {
      swatch.innerHTML = `<img class="product-photo" src="${product.imageUrl}" alt="${product.name}">`;
    } else {
      swatch.innerHTML = `<span class="monogram">${product.name.charAt(0)}</span>`;
    }

    const wishBtn = document.getElementById("qvWishBtn");
    wishBtn.classList.toggle("saved", wishlist.has(productId));

    document.getElementById("quickviewModal").classList.add("open");
    syncOverlay();
  }

  function closeQuickView() {
    document.getElementById("quickviewModal").classList.remove("open");
    syncOverlay();
    quickViewProductId = null;
  }

  function changeQuickViewQty(delta) {
    quickViewQty = Math.max(1, quickViewQty + delta);
    document.getElementById("qvQty").textContent = quickViewQty;
  }

  function addQuickViewToCart() {
    if (!quickViewProductId) return;
    for (let i = 0; i < quickViewQty; i++) addToCart(quickViewProductId);
    closeQuickView();
    openDrawer();
  }

  /* ============================================
     MOBILE MENU
     ============================================ */
  function toggleMobileMenu() {
    const nav = document.getElementById("mobileNav");
    const btn = document.getElementById("menuToggle");
    const isOpen = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  function closeMobileMenu() {
    document.getElementById("mobileNav").classList.remove("open");
    document.getElementById("menuToggle").setAttribute("aria-expanded", "false");
  }

  /* ============================================
     SEARCH
     ============================================ */
  function toggleSearch() {
    const wrap = document.getElementById("searchWrap");
    const input = document.getElementById("searchInput");
    const isOpening = !wrap.classList.contains("open");
    wrap.classList.toggle("open");
    if (isOpening) {
      input.focus();
    } else {
      input.value = "";
      searchQuery = "";
      renderProducts();
    }
  }

  /* ============================================
     NEWSLETTER
     ============================================ */
  function handleNewsletterSubmit(event) {
    event.preventDefault();
    const input = document.getElementById("newsletterEmail");
    const feedback = document.getElementById("newsletterFeedback");
    if (!input.checkValidity()) {
      feedback.textContent = "Confira o e-mail digitado.";
      return;
    }
    feedback.textContent = "Você está na lista. XOXO.";
    input.value = "";
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
  function anyPanelOpen() {
    return (
      document.getElementById("cartDrawer").classList.contains("open") ||
      document.getElementById("checkoutModal").classList.contains("open") ||
      document.getElementById("quickviewModal").classList.contains("open")
    );
  }

  function syncOverlay() {
    document.getElementById("overlay").classList.toggle("show", anyPanelOpen());
  }

  function openDrawer() {
    document.getElementById("cartDrawer").classList.add("open");
    syncOverlay();
  }

  function closeDrawer() {
    document.getElementById("cartDrawer").classList.remove("open");
    syncOverlay();
  }

  /* ============================================
     CHECKOUT MODAL
     ============================================ */
  function openCheckout() {
    if (cart.length === 0) return;
    currentStep = 1;
    goToStep(1, true);
    renderCheckoutSummary();
    document.getElementById("checkoutModal").classList.add("open");
    syncOverlay();
    document.getElementById("cartDrawer").classList.remove("open");
  }

  function closeCheckout() {
    document.getElementById("checkoutModal").classList.remove("open");
    syncOverlay();
  }

  function goToStep(step, skipAnimation) {
    const direction = step > currentStep ? "right" : "left";
    currentStep = step;

    document.querySelectorAll(".step-panel").forEach((panel) => {
      const isTarget = Number(panel.dataset.step) === step;
      panel.classList.toggle("active", isTarget);
      panel.classList.remove("slide-in-right", "slide-in-left");
      if (isTarget && !skipAnimation) {
        void panel.offsetWidth;
        panel.classList.add(direction === "right" ? "slide-in-right" : "slide-in-left");
      }
    });

    document.querySelectorAll(".step-dot").forEach((dot) => {
      const dotStep = Number(dot.dataset.step);
      dot.classList.toggle("active", dotStep === step);
      dot.classList.toggle("done", dotStep < step);
    });

    document.getElementById("stepLine1").classList.toggle("filled", step >= 2);
    document.getElementById("stepLine2").classList.toggle("filled", step >= 3);

    document.getElementById("checkoutSummary").classList.toggle("hidden", step === 3);
    document.getElementById("promoRow").classList.toggle("hidden", step === 3);
    document.getElementById("promoFeedback").classList.toggle("hidden", step === 3);
  }

  function computeTotals() {
    const subtotal = cartSubtotalCents();
    const shipping = subtotal > 0 ? 2900 : 0;
    const discount = appliedPromo ? Math.round(subtotal * appliedPromo.rate) : 0;
    const total = Math.max(subtotal + shipping - discount, 0);
    return { subtotal, shipping, discount, total };
  }

  function renderCheckoutSummary() {
    const el = document.getElementById("checkoutSummary");
    const { subtotal, shipping, discount, total } = computeTotals();

    el.innerHTML = `
      <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
      ${
        discount > 0
          ? `<div class="summary-row discount"><span>Cupom ${appliedPromo.code}</span><span>−${formatPrice(discount)}</span></div>`
          : ""
      }
      <div class="summary-row"><span>Frete</span><span>${formatPrice(shipping)}</span></div>
      <div class="summary-row total"><span>Total</span><span>${formatPrice(total)}</span></div>
    `;
  }

  function applyPromo() {
    const input = document.getElementById("promoInput");
    const feedback = document.getElementById("promoFeedback");
    const code = input.value.trim().toUpperCase();

    if (!code) return;

    if (PROMO_CODES[code]) {
      appliedPromo = { code, rate: PROMO_CODES[code] };
      feedback.textContent = `Cupom aplicado — ${Math.round(appliedPromo.rate * 100)}% de desconto. XOXO.`;
      feedback.className = "promo-feedback success";
      input.disabled = true;
      document.getElementById("applyPromoBtn").textContent = "Aplicado";
      document.getElementById("applyPromoBtn").disabled = true;
    } else {
      feedback.textContent = "Código inválido — confira e tente de novo.";
      feedback.className = "promo-feedback error";
    }

    renderCheckoutSummary();
  }

  function resetPromo() {
    appliedPromo = null;
    const input = document.getElementById("promoInput");
    const feedback = document.getElementById("promoFeedback");
    input.value = "";
    input.disabled = false;
    feedback.textContent = "";
    feedback.className = "promo-feedback";
    document.getElementById("applyPromoBtn").textContent = "Aplicar";
    document.getElementById("applyPromoBtn").disabled = false;
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

  /* ============================================
     CARD PREVIEW (checkout)
     ============================================ */
  function maskCardNumber(digits) {
    const padded = (digits + "••••••••••••••••").slice(0, 16);
    return padded.match(/.{1,4}/g).join(" ");
  }

  function initCardPreview() {
    const form = document.getElementById("paymentForm");
    const numberInput = form.elements.cardNumber;
    const nameInput = form.elements.cardName;
    const expiryInput = form.elements.cardExpiry;
    const cvvInput = form.elements.cardCvv;
    const cardInner = document.getElementById("cardInner");

    numberInput.addEventListener("input", (e) => {
      const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
      e.target.value = digits.match(/.{1,4}/g)?.join(" ") || "";
      document.getElementById("cardPreviewNumber").textContent = maskCardNumber(digits);
    });

    nameInput.addEventListener("input", (e) => {
      const value = e.target.value.toUpperCase();
      document.getElementById("cardPreviewName").textContent = value || "NOME NO CARTÃO";
    });

    expiryInput.addEventListener("input", (e) => {
      let digits = e.target.value.replace(/\D/g, "").slice(0, 4);
      if (digits.length >= 3) digits = digits.slice(0, 2) + "/" + digits.slice(2);
      e.target.value = digits;
      document.getElementById("cardPreviewExpiry").textContent = digits || "MM/AA";
    });

    cvvInput.addEventListener("input", (e) => {
      const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
      e.target.value = digits;
      document.getElementById("cardPreviewCvv").textContent = ("•••" + digits).slice(-Math.max(digits.length, 3));
    });

    cvvInput.addEventListener("focus", () => cardInner.classList.add("flipped"));
    cvvInput.addEventListener("blur", () => cardInner.classList.remove("flipped"));
  }

  /* ============================================
     CONFIRMATION
     ============================================ */
  function renderConfirmItems(items) {
    const el = document.getElementById("confirmItems");
    el.innerHTML = items
      .map((item) => `<div class="confirm-item-row"><span>${item.qty}× ${item.name}</span><span>${formatPrice(item.priceCents * item.qty)}</span></div>`)
      .join("");
  }

  function spawnConfetti() {
    const stage = document.getElementById("confettiStage");
    stage.querySelectorAll(".spark").forEach((el) => el.remove());

    const count = 14;
    for (let i = 0; i < count; i++) {
      const spark = document.createElement("span");
      spark.className = "spark" + (i % 3 === 0 ? " wine" : "");
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const distance = 40 + Math.random() * 30;
      spark.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
      spark.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
      spark.style.animationDelay = `${Math.random() * 0.15}s`;
      stage.appendChild(spark);
    }
  }

  function runConfirmation() {
    const loading = document.getElementById("confirmLoading");
    const success = document.getElementById("confirmSuccess");
    loading.classList.add("show");
    success.classList.remove("show");

    lastConfirmedItems = cart.map((item) => ({ ...item }));

    setTimeout(() => {
      loading.classList.remove("show");
      success.classList.add("show");

      const orderNum = "AW-" + Math.floor(1000 + Math.random() * 9000);
      document.getElementById("orderNumber").textContent = "#" + orderNum;
      renderConfirmItems(lastConfirmedItems);
      spawnConfetti();

      const circle = document.querySelector(".check-circle");
      const mark = document.querySelector(".check-mark");
      const ping = document.querySelector(".check-ping");
      [circle, mark, ping].forEach((el) => {
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
    goToStep(1, true);
    resetPromo();
    document.getElementById("shippingForm").reset();
    document.getElementById("paymentForm").reset();
    document.getElementById("cardPreviewNumber").textContent = "•••• •••• •••• ••••";
    document.getElementById("cardPreviewName").textContent = "NOME NO CARTÃO";
    document.getElementById("cardPreviewExpiry").textContent = "MM/AA";
    document.getElementById("cardPreviewCvv").textContent = "•••";
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
    document.getElementById("applyPromoBtn").addEventListener("click", applyPromo);

    document.getElementById("menuToggle").addEventListener("click", toggleMobileMenu);
    document.querySelectorAll("#mobileNav a:not(.disabled)").forEach((a) =>
      a.addEventListener("click", closeMobileMenu)
    );

    document.getElementById("searchToggle").addEventListener("click", toggleSearch);
    document.getElementById("searchInput").addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderProducts();
    });
    document.getElementById("searchInput").addEventListener("keydown", (e) => {
      if (e.key === "Escape") toggleSearch();
    });

    document.getElementById("sortSelect").addEventListener("change", (e) => {
      sortOrder = e.target.value;
      renderProducts();
    });

    document.getElementById("newsletterForm").addEventListener("submit", handleNewsletterSubmit);

    document.getElementById("closeQuickview").addEventListener("click", closeQuickView);
    document.getElementById("qvInc").addEventListener("click", () => changeQuickViewQty(1));
    document.getElementById("qvDec").addEventListener("click", () => changeQuickViewQty(-1));
    document.getElementById("qvAddToCart").addEventListener("click", addQuickViewToCart);
    document.getElementById("qvWishBtn").addEventListener("click", () => {
      if (quickViewProductId) toggleWishlist(quickViewProductId, document.getElementById("qvWishBtn"));
    });

    document.getElementById("promoInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyPromo();
      }
    });

    document.getElementById("overlay").addEventListener("click", () => {
      closeDrawer();
      closeCheckout();
      closeQuickView();
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
        closeQuickView();
        closeMobileMenu();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    renderTicker();
    if (typeof loadCatalog === "function") await loadCatalog();
    renderCategories();
    renderProducts();
    renderEditorial();
    renderCartDrawer();
    initCardPreview();
    bindEvents();
  });
})();
