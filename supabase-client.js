/*
  Inicializa o cliente Supabase a partir de window.SUPABASE_CONFIG (config.js).
  Se config.js não existir ou não tiver sido preenchido, window.supabaseClient
  fica indefinido e o resto do app cai no fallback local (products.js).
*/
(function () {
  if (typeof window.SUPABASE_CONFIG === "undefined") {
    console.warn(
      "config.js não encontrado. Copie config.example.js para config.js e preencha suas chaves do Supabase."
    );
    return;
  }

  const { url, anonKey } = window.SUPABASE_CONFIG;
  const isPlaceholder = !url || !anonKey || url.includes("SEU-PROJETO") || anonKey.includes("SUA_CHAVE");

  if (isPlaceholder) {
    console.warn(
      "config.js ainda está com valores de exemplo. Preencha SUPABASE_CONFIG com os dados reais do seu projeto."
    );
    return;
  }

  if (typeof window.supabase === "undefined") {
    console.warn("Biblioteca do Supabase não carregou. Verifique a tag <script> do supabase-js.");
    return;
  }

  window.supabaseClient = window.supabase.createClient(url, anonKey);
})();
