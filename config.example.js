/*
  Modelo do config.js. Copie para "config.js" e preencha com os dados do
  seu projeto Supabase (Project Settings > API no painel).

  O config.js FICA versionado: a chave "anon" é pública por design e quem
  protege os dados são as policies de RLS (schema.sql).

  A chave do Google Gemini (chat de IA) não entra aqui — ela vive na tabela
  app_settings do Supabase. Cadastre pela aba Admin → "Configurações" depois
  de rodar o schema.sql. Gere a chave em https://aistudio.google.com/apikey
  e restrinja-a (referrers de HTTP + só a "Generative Language API").
*/

window.SUPABASE_CONFIG = {
  url: "https://SEU-PROJETO.supabase.co",
  anonKey: "SUA_CHAVE_ANON_AQUI",
};
