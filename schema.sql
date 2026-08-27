-- Aura Wear — schema do Supabase
-- Rode isso no SQL Editor do painel do Supabase antes de usar a tela de admin.
-- Script idempotente: pode rodar de novo sem erro se algo já existir
-- (ex.: depois de adicionar uma coluna ou policy nova).

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('saias-calcas', 'alfaiataria', 'blusas-tricos', 'sapatos', 'vestidos-blusas')),
  price_cents integer not null check (price_cents >= 0),
  description text,
  featured boolean not null default false,
  swatch text not null default 'ink' check (swatch in ('wine', 'ink', 'blush', 'gold')),
  image_url text,
  created_at timestamptz not null default now()
);

-- Caso a tabela já existisse de uma versão anterior sem esta coluna.
alter table products add column if not exists image_url text;

-- Migração das categorias antigas (vestidos/casacos/bolsas/acessorios) para
-- as novas, caso a tabela já tenha sido criada com o schema anterior.
-- Produtos com categoria fora do mapa abaixo caem em 'vestidos-blusas'.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'products' and column_name = 'category'
  ) then
    update products set category = case category
      when 'vestidos' then 'vestidos-blusas'
      when 'casacos' then 'alfaiataria'
      when 'bolsas' then 'sapatos'
      when 'acessorios' then 'blusas-tricos'
      else category
    end
    where category not in ('saias-calcas', 'alfaiataria', 'blusas-tricos', 'sapatos', 'vestidos-blusas');
  end if;
end $$;

alter table products drop constraint if exists products_category_check;
alter table products add constraint products_category_check
  check (category in ('saias-calcas', 'alfaiataria', 'blusas-tricos', 'sapatos', 'vestidos-blusas'));

alter table products enable row level security;

-- Leitura pública: a home precisa exibir o catálogo sem login.
drop policy if exists "Leitura pública de produtos" on products;
create policy "Leitura pública de produtos"
  on products for select
  using (true);

-- Escrita liberada para a chave anônima, já que este é um projeto de
-- apresentação sem tela de login no admin. Em um projeto real, troque isso
-- por uma policy que exige autenticação (auth.uid() is not null) antes de
-- liberar insert/update/delete.
drop policy if exists "Escrita liberada — sem auth (projeto de apresentação)" on products;
create policy "Escrita liberada — sem auth (projeto de apresentação)"
  on products for all
  using (true)
  with check (true);

-- ============================================
-- STORAGE — bucket de imagens dos produtos
-- ============================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Leitura pública das imagens (necessário pra exibir na home).
drop policy if exists "Leitura pública das imagens de produtos" on storage.objects;
create policy "Leitura pública das imagens de produtos"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Upload/exclusão liberados para a chave anônima, pelo mesmo motivo do
-- "Escrita liberada" acima: não há tela de login no admin. Em um projeto
-- real, restrinja a usuários autenticados.
drop policy if exists "Upload liberado — sem auth (projeto de apresentação)" on storage.objects;
create policy "Upload liberado — sem auth (projeto de apresentação)"
  on storage.objects for insert
  with check (bucket_id = 'product-images');

drop policy if exists "Exclusão liberada — sem auth (projeto de apresentação)" on storage.objects;
create policy "Exclusão liberada — sem auth (projeto de apresentação)"
  on storage.objects for delete
  using (bucket_id = 'product-images');
