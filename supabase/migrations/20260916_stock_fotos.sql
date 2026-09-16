-- Tabla: stock
create table if not exists stock (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  nombre        text not null,
  descripcion   text,
  categoria     text,
  cantidad      numeric(12,3) not null default 0,
  unidad        text,
  stock_minimo  numeric(12,3),
  precio_costo  numeric(12,2),
  precio_venta  numeric(12,2),
  created_at    timestamptz not null default now()
);

alter table stock enable row level security;

create policy "stock_user" on stock
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Fotos en consultas y órdenes de trabajo
alter table consultas add column if not exists fotos jsonb default '[]'::jsonb;
alter table ordenes_trabajo add column if not exists fotos jsonb default '[]'::jsonb;

-- Storage bucket 'fotos' (ejecutar manualmente en Supabase Dashboard > Storage)
-- create bucket fotos with public = true;
