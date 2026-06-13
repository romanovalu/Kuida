-- ══════════════════════════════════════════════════
-- Kuida — Link de autogestión para pacientes
-- ══════════════════════════════════════════════════

-- Link único por profesional
create table booking_links (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null unique,
  slug       text not null unique,
  activo     boolean default true,
  mensaje    text,
  created_at timestamptz default now()
);

-- Reservas hechas por pacientes desde la página pública
create table reservas_publicas (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null,
  fecha            text not null,
  hora             text not null,
  duracion         int default 30,
  nombre_paciente  text not null,
  telefono_paciente text,
  motivo           text,
  estado           text default 'pendiente',
  created_at       timestamptz default now()
);

-- RLS
alter table booking_links  enable row level security;
alter table reservas_publicas enable row level security;

-- El profesional maneja su propio link
create policy "own_booking_link" on booking_links for all using (auth.uid() = user_id);

-- Cualquiera puede leer links activos (para la página pública)
create policy "public_read_booking_link" on booking_links
  for select using (activo = true);

-- El profesional ve sus reservas
create policy "own_reservas" on reservas_publicas
  for all using (auth.uid() = user_id);

-- Cualquiera puede crear una reserva (página pública sin login)
create policy "public_insert_reserva" on reservas_publicas
  for insert with check (true);

-- Configuración: lectura pública (para obtener horarios del profesional)
create policy "public_read_config" on configuracion
  for select using (true);

-- Turnos: lectura pública limitada (para verificar disponibilidad)
create policy "public_read_turnos" on turnos
  for select using (true);
