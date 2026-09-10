/*
  Configuração do Supabase (front-end).

  A chave "anon" é pública por design: o que protege os dados são as policies
  de RLS no schema.sql, não o segredo da chave. Por isso este arquivo fica
  versionado — o site precisa dele para funcionar em produção.

  A chave do Google Gemini NÃO fica aqui. Ela é lida em runtime da tabela
  app_settings do Supabase (cadastre pela aba Admin → "Configurações", ou
  rode o schema.sql e edite a linha gemini_api_key). Para desenvolvimento,
  dá pra sobrepor localmente adicionando um window.GEMINI_CONFIG neste
  arquivo — mas não commite a chave.
*/

window.SUPABASE_CONFIG = {
  url: "https://dhvyfujopmtznkzpckmw.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRodnlmdWpvcG10em5renBja213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NjYyMjUsImV4cCI6MjEwMzI0MjIyNX0.GC3SIoee-A4LhwninHotHiiArdZWSOSRbiXz7JXef2A",
};
