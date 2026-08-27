(function () {
  "use strict";

  const priceFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  let editingId = null;
  let selectedFile = null;
  let currentImageUrl = "";

  function formatPrice(cents) {
    return priceFormatter.format(cents / 100);
  }

  /* Converte "389.00", "1,299.00" ou "389" (formato americano) em centavos */
  function parsePriceToCents(raw) {
    const normalized = raw.trim().replace(/,/g, "");
    const value = parseFloat(normalized);
    if (isNaN(value) || value < 0) return null;
    return Math.round(value * 100);
  }

  const BUCKET = "product-images";

  function extractStoragePath(publicUrl) {
    if (!publicUrl) return null;
    const marker = `/object/public/${BUCKET}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return null;
    return publicUrl.slice(idx + marker.length);
  }

  async function deleteImageFromStorage(publicUrl) {
    const path = extractStoragePath(publicUrl);
    if (!path || !window.supabaseClient) return;
    const { error } = await window.supabaseClient.storage.from(BUCKET).remove([path]);
    if (error) console.warn("Não foi possível remover a imagem antiga do storage.", error.message);
  }

  async function uploadSelectedImage() {
    if (!selectedFile || !window.supabaseClient) return currentImageUrl || null;

    const ext = selectedFile.name.split(".").pop().toLowerCase();
    const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

    const { error } = await window.supabaseClient.storage.from(BUCKET).upload(path, selectedFile, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      console.error(error);
      showToast("Não foi possível enviar a imagem. Confira o console.");
      return null;
    }

    const { data } = window.supabaseClient.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  function renderImagePreview(url) {
    const preview = document.getElementById("imagePreview");
    const removeBtn = document.getElementById("removeImage");
    if (url) {
      preview.innerHTML = `<img src="${url}" alt="Prévia da imagem">`;
      removeBtn.hidden = false;
    } else {
      preview.innerHTML = `<span class="image-preview-empty">Sem foto</span>`;
      removeBtn.hidden = true;
    }
  }

  function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => renderImagePreview(e.target.result);
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    selectedFile = null;
    currentImageUrl = "";
    document.getElementById("imageInput").value = "";
    renderImagePreview("");
  }


  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function populateCategorySelect() {
    const select = document.getElementById("categorySelect");
    select.innerHTML = CATEGORIES.map((c) => `<option value="${c.id}">${c.label}</option>`).join("");
  }

  function checkSupabaseConfigured() {
    const banner = document.getElementById("configBanner");
    const configured = !!window.supabaseClient;
    banner.hidden = configured;
    document.getElementById("submitBtn").disabled = !configured;
    return configured;
  }

  async function fetchProducts() {
    if (!window.supabaseClient) return [];
    const { data, error } = await window.supabaseClient
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      showToast("Não foi possível carregar os produtos. Confira o console.");
      return [];
    }
    return data || [];
  }

  function categoryLabel(id) {
    const cat = CATEGORIES.find((c) => c.id === id);
    return cat ? cat.label : id;
  }

  function renderTable(products) {
    const body = document.getElementById("productTableBody");
    const empty = document.getElementById("adminEmpty");

    if (products.length === 0) {
      body.innerHTML = "";
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    body.innerHTML = products
      .map(
        (p) => `
        <tr data-id="${p.id}">
          <td>${
            p.image_url
              ? `<img class="table-photo" src="${p.image_url}" alt="${p.name}" loading="lazy">`
              : `<span class="table-swatch swatch-${p.swatch}"></span>`
          }</td>
          <td class="table-name">${p.name}</td>
          <td>${categoryLabel(p.category)}</td>
          <td>${formatPrice(p.price_cents)}</td>
          <td>${p.featured ? '<span class="badge-featured">XOXO</span>' : '<span class="badge-none">—</span>'}</td>
          <td>
            <div class="row-actions">
              <button class="row-edit" data-id="${p.id}">Editar</button>
              <button class="row-delete" data-id="${p.id}">Excluir</button>
            </div>
          </td>
        </tr>`
      )
      .join("");

    body.querySelectorAll(".row-edit").forEach((btn) =>
      btn.addEventListener("click", () => startEdit(products.find((p) => p.id === btn.dataset.id)))
    );
    body.querySelectorAll(".row-delete").forEach((btn) =>
      btn.addEventListener("click", () =>
        deleteProduct(btn.dataset.id, btn.closest("tr"), products.find((p) => p.id === btn.dataset.id)?.image_url)
      )
    );
  }

  async function refreshTable() {
    const products = await fetchProducts();
    renderTable(products);
  }

  function startEdit(product) {
    if (!product) return;
    editingId = product.id;

    const form = document.getElementById("productForm");
    form.elements.name.value = product.name;
    form.elements.category.value = product.category;
    form.elements.price.value = (product.price_cents / 100).toFixed(2);
    form.elements.description.value = product.description || "";
    form.elements.featured.checked = !!product.featured;

    const swatchInput = form.querySelector(`input[name="swatch"][value="${product.swatch}"]`);
    if (swatchInput) swatchInput.checked = true;

    selectedFile = null;
    currentImageUrl = product.image_url || "";
    document.getElementById("imageInput").value = "";
    renderImagePreview(currentImageUrl);

    document.getElementById("formEyebrow").textContent = "Editando";
    document.getElementById("formTitle").textContent = `Editar "${product.name}"`;
    document.getElementById("submitBtn").textContent = "Salvar alterações";
    document.getElementById("cancelEdit").hidden = false;

    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetForm() {
    editingId = null;
    selectedFile = null;
    currentImageUrl = "";
    const form = document.getElementById("productForm");
    form.reset();
    renderImagePreview("");
    document.getElementById("formEyebrow").textContent = "Novo item";
    document.getElementById("formTitle").textContent = "Cadastrar produto";
    document.getElementById("submitBtn").textContent = "Cadastrar produto";
    document.getElementById("cancelEdit").hidden = true;
  }

  async function deleteProduct(id, rowEl, imageUrl) {
    if (!window.supabaseClient) return;
    const confirmed = confirm("Excluir este produto do catálogo?");
    if (!confirmed) return;

    if (rowEl) rowEl.style.opacity = "0.4";

    const { error } = await window.supabaseClient.from("products").delete().eq("id", id);
    if (error) {
      console.error(error);
      showToast("Não foi possível excluir. Confira o console.");
      if (rowEl) rowEl.style.opacity = "1";
      return;
    }

    if (imageUrl) await deleteImageFromStorage(imageUrl);

    showToast("Produto removido do catálogo.");
    if (editingId === id) resetForm();
    refreshTable();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!window.supabaseClient) {
      showToast("Configure o Supabase antes de cadastrar produtos.");
      return;
    }

    const form = event.target;
    const name = form.elements.name.value.trim();
    const category = form.elements.category.value;
    const priceCents = parsePriceToCents(form.elements.price.value);
    const description = form.elements.description.value.trim();
    const featured = form.elements.featured.checked;
    const swatch = form.querySelector('input[name="swatch"]:checked').value;

    let hasError = false;
    form.elements.name.classList.toggle("field-error", name === "");
    if (name === "") hasError = true;

    if (priceCents === null) {
      form.elements.price.classList.add("field-error");
      hasError = true;
    } else {
      form.elements.price.classList.remove("field-error");
    }

    if (hasError) {
      showToast("Confira os campos destacados.");
      return;
    }

    const payload = { name, category, price_cents: priceCents, description, featured, swatch };
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = selectedFile ? "Enviando foto..." : (editingId ? "Salvando..." : "Cadastrando...");

    if (selectedFile) {
      const oldImageUrl = editingId ? currentImageUrl : null;
      const uploadedUrl = await uploadSelectedImage();
      if (uploadedUrl === null) {
        submitBtn.disabled = false;
        submitBtn.textContent = editingId ? "Salvar alterações" : "Cadastrar produto";
        return;
      }
      payload.image_url = uploadedUrl;
      if (oldImageUrl) await deleteImageFromStorage(oldImageUrl);
    } else {
      payload.image_url = currentImageUrl || null;
    }

    let error;
    if (editingId) {
      ({ error } = await window.supabaseClient.from("products").update(payload).eq("id", editingId));
    } else {
      ({ error } = await window.supabaseClient.from("products").insert(payload));
    }

    submitBtn.disabled = false;

    if (error) {
      console.error(error);
      showToast("Não foi possível salvar. Confira o console.");
      submitBtn.textContent = editingId ? "Salvar alterações" : "Cadastrar produto";
      return;
    }

    showToast(editingId ? "Produto atualizado." : `"${name}" cadastrado no catálogo.`);
    resetForm();
    refreshTable();
  }

  document.addEventListener("DOMContentLoaded", () => {
    populateCategorySelect();
    const configured = checkSupabaseConfigured();

    document.getElementById("productForm").addEventListener("submit", handleSubmit);
    document.getElementById("cancelEdit").addEventListener("click", resetForm);
    document.getElementById("imageInput").addEventListener("change", handleImageSelect);
    document.getElementById("removeImage").addEventListener("click", handleRemoveImage);

    document.querySelectorAll(".swatch-option").forEach((label) => {
      label.addEventListener("click", () => {
        document.querySelectorAll(".swatch-option").forEach((l) => l.classList.remove("active"));
        label.classList.add("active");
      });
    });

    if (configured) refreshTable();
  });
})();
