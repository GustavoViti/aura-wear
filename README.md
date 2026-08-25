# Aura Wear — loja fake para apresentação

Site estático (HTML/CSS/JS puro, sem build/backend). `index.html` é a loja,
`admin.html` é a tela de cadastro de produtos. Checkout é fake — não processa
pagamento real.

## Setup do Supabase

1. Crie um projeto em https://supabase.com.
2. No SQL Editor do projeto, rode o conteúdo de `schema.sql` — ele cria a
   tabela `products`, o bucket de storage `product-images` (público) e as
   policies de leitura/escrita.
3. Em Project Settings > API, copie a **Project URL** e a **anon public key**.
4. Copie `config.example.js` para `config.js` e preencha com esses dois valores.
   (Opcional: copie `.env.example` para `.env` também, como referência única
   das credenciais caso adicione algum script Node no futuro — o navegador
   não lê `.env` diretamente.)
5. Abra `index.html` num servidor local (ex.: extensão Live Server do VS Code).
   Abrir via `file://` direto pode bloquear os módulos do Supabase em alguns
   navegadores.

Sem `config.js` preenchido, a loja funciona normalmente com o catálogo local
mockado em `products.js` — útil pra testar a interface sem depender do banco.

No admin, o upload de foto é opcional: sem foto, o card do produto usa a cor
escolhida (placeholder com monograma) — igual antes.

## Estrutura

- `index.html` / `style.css` / `script.js` — loja (catálogo, carrinho, checkout fake)
- `admin.html` / `admin.css` / `admin.js` — cadastro de produtos
- `products.js` — catálogo local (fallback)
- `catalog-loader.js` — busca produtos no Supabase pra home
- `supabase-client.js` — inicializa o client a partir de `config.js`
- `schema.sql` — schema da tabela `products` + políticas de RLS
- `config.example.js` / `.env.example` — templates versionados
- `config.js` / `.env` — chaves reais, ignorados pelo git

## Segurança

O admin não tem autenticação — qualquer pessoa com a URL pode cadastrar,
editar ou excluir produtos. Isso é aceitável para uma demo de apresentação,
mas **não deve ir pra produção real** sem uma tela de login (Supabase Auth)
e uma policy de RLS que exija `auth.uid() is not null` para escrita.
