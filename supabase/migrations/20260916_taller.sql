-- Tabla: vehiculos
create table if not exists vehiculos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  cliente_id    uuid,
  patente       text not null,
  marca         text not null,
  modelo        text not null,
  anio          integer,
  color         text,
  notas         text,
  created_at    timestamptz not null default now()
);

alter table vehiculos enable row level security;

create policy "vehiculos_user" on vehiculos
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tabla: ordenes_trabajo
create table if not exists ordenes_trabajo (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  vehiculo_id         uuid references vehiculos(id) on delete set null,
  cliente_id          uuid,
  fecha               date not null,
  descripcion         text not null,
  diagnostico         text,
  trabajo_realizado   text,
  presupuesto         numeric(12,2),
  monto_final         numeric(12,2),
  estado              text not null default 'recibido',
  mecanico            text,
  notas               text,
  created_at          timestamptz not null default now()
);

alter table ordenes_trabajo enable row level security;

create policy "ordenes_trabajo_user" on ordenes_trabajo
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
