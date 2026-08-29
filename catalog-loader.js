/*
  Carrega o catálogo para a home.
  Tenta buscar produtos no Supabase; se não houver cliente configurado,
  a consulta falhar ou vier vazia, mantém o catálogo local de products.js.
*/
async function loadCatalog() {
  if (!window.supabaseClient) return;

  try {
    const { data, error } = await window.supabaseClient
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Não foi possível carregar produtos do Supabase, usando catálogo local.", error.message);
      return;
    }

    if (data && data.length > 0) {
      PRODUCTS = data.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        priceCents: row.price_cents,
        description: row.description || "",
        featured: !!row.featured,
        swatch: row.swatch || "ink",
        imageUrl: row.image_url || "",
        inEdit: !!row.in_edit,
      }));
    }
  } catch (err) {
    console.warn("Erro ao conectar no Supabase, usando catálogo local.", err);
  }
}
