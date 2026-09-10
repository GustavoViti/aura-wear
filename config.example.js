/*
  Template de configuração. Copie este arquivo para "config.js" (mesma pasta)
  e preencha com os dados reais. O "config.js" é ignorado pelo git —
  nunca commite suas chaves reais nele.

  - Supabase: Project Settings > API no painel do Supabase.
  - Gemini:   https://aistudio.google.com/apikey
*/

window.SUPABASE_CONFIG = {
  url: "https://SEU-PROJETO.supabase.co",
  anonKey: "SUA_CHAVE_ANON_AQUI",
};

/*
  Chave da API do Google Gemini, usada pelo chat de IA (chat.js).
  Como o site é front-end puro, a chave fica visível no navegador do
  visitante. Restrinja a chave no Google AI Studio (referrers permitidos +
  apenas a "Generative Language API"). Sem chave válida, o chat fica
  desabilitado e o resto do site funciona normalmente.
*/
window.GEMINI_CONFIG = {
  apiKey: "SUA_CHAVE_DO_GEMINI_AQUI",
  model: "gemini-3.6-flash",
};
