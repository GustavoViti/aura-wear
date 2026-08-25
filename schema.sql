-- Aura Wear — schema do Supabase
-- Rode isso no SQL Editor do painel do Supabase antes de usar a tela de admin.

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('vestidos', 'casacos', 'bolsas', 'acessorios')),
  price_cents integer not null check (price_cents >= 0),
  description text,
  featured boolean not null default false,
  swatch text not null default 'ink' check (swatch in ('wine', 'ink', 'blush', 'gold')),
  created_at timestamptz not null default now()
);

alter table products enable row level security;

-- Leitura pública: a home precisa exibir o catálogo sem login.
create policy "Leitura pública de produtos"
  on products for select
  using (true);

-- Escrita liberada para a chave anônima, já que este é um projeto de
-- apresentação sem tela de login no admin. Em um projeto real, troque isso
-- por uma policy que exige autenticação (auth.uid() is not null) antes de
-- liberar insert/update/delete.
create policy "Escrita liberada — sem auth (projeto de apresentação)"
  on products for all
  using (true)
  with check (true);
