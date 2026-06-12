-- ══════════════════════════════════════════════════
-- GestiónTurnos — Schema completo
-- Ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════════════

-- Pacientes / Clientes
create table pacientes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  nombre       text not null,
  apellido     text not null,
  edad         int,
  telefono     text,
  email        text,
  dni          text,
  obra_social  text,
  alergias     text,
  antecedentes text,
  notas_adicionales text,
  fecha_registro    text,
  created_at   timestamptz default now()
);

-- Turnos
create table turnos (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade not null,
  paciente_id         uuid references pacientes(id) on delete cascade not null,
  fecha               text not null,
  hora                text not null,
  duracion            int default 30,
  servicio_id         text,
  motivo              text,
  campo_rubro         text,
  estado              text default 'pendiente',
  motivo_cancelacion  text,
  profesional         text,
  especialidad        text,
  created_at          timestamptz default now()
);

-- Consultas / evoluciones
create table consultas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  paciente_id   uuid references pacientes(id) on delete cascade not null,
  turno_id      uuid,
  fecha         text not null,
  tratamiento   text,
  notas         text,
  profesional   text,
  proxima_visita text,
  created_at    timestamptz default now()
);

-- Horarios bloqueados
create table horarios_bloqueados (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  fecha       text not null,
  hora_inicio text not null,
  hora_fin    text not null,
  motivo      text,
  created_at  timestamptz default now()
);

-- Cobros
create table cobros (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  paciente_id      uuid,
  turno_id         uuid,
  fecha            text not null,
  concepto         text not null,
  monto            numeric not null,
  metodo_pago      text,
  tipo_comprobante text,
  nro_comprobante  text,
  notas            text,
  created_at       timestamptz default now()
);

-- Gastos
create table gastos (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  fecha           text not null,
  concepto        text not null,
  categoria       text,
  monto           numeric not null,
  proveedor       text,
  nro_comprobante text,
  notas           text,
  created_at      timestamptz default now()
);

-- Recetas
create table recetas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  paciente_id  uuid references pacientes(id) on delete cascade not null,
  fecha        text not null,
  diagnostico  text,
  medicamentos text,
  indicaciones text,
  created_at   timestamptz default now()
);

-- Odontogramas (estado complejo → JSONB)
create table odontogramas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  paciente_id uuid references pacientes(id) on delete cascade not null unique,
  dientes     jsonb default '{}',
  notas       text,
  updated_at  timestamptz default now()
);

-- Mediciones antropométricas
create table mediciones (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  paciente_id  uuid references pacientes(id) on delete cascade not null,
  fecha        text not null,
  peso         numeric,
  talla        numeric,
  imc          numeric,
  cintura      numeric,
  cadera       numeric,
  brazo        numeric,
  muslo        numeric,
  presion_sis  numeric,
  presion_dia  numeric,
  glucemia     numeric,
  notas        text,
  created_at   timestamptz default now()
);

-- Notas clínicas
create table notas_clinicas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  paciente_id uuid references pacientes(id) on delete cascade not null,
  fecha       text not null,
  tipo        text,
  contenido   text,
  privada     boolean default false,
  created_at  timestamptz default now()
);

-- Historial de servicios (peluquería / estética)
create table historial_servicios (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  paciente_id   uuid references pacientes(id) on delete cascade not null,
  fecha         text not null,
  servicio      text,
  detalles      text,
  resultado     text,
  proxima_visita text,
  created_at    timestamptz default now()
);

-- Configuración por usuario (JSONB para flexibilidad)
create table configuracion (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null unique,
  datos        jsonb default '{}',
  logo_app     text,
  logo_receta  text,
  updated_at   timestamptz default now()
);

-- ══════════════════════════════════════════════════
-- Row Level Security — cada usuario ve solo sus datos
-- ══════════════════════════════════════════════════

alter table pacientes          enable row level security;
alter table turnos             enable row level security;
alter table consultas          enable row level security;
alter table horarios_bloqueados enable row level security;
alter table cobros             enable row level security;
alter table gastos             enable row level security;
alter table recetas            enable row level security;
alter table odontogramas       enable row level security;
alter table mediciones         enable row level security;
alter table notas_clinicas     enable row level security;
alter table historial_servicios enable row level security;
alter table configuracion      enable row level security;

create policy "own_pacientes"   on pacientes           for all using (auth.uid() = user_id);
create policy "own_turnos"      on turnos              for all using (auth.uid() = user_id);
create policy "own_consultas"   on consultas           for all using (auth.uid() = user_id);
create policy "own_horarios"    on horarios_bloqueados for all using (auth.uid() = user_id);
create policy "own_cobros"      on cobros              for all using (auth.uid() = user_id);
create policy "own_gastos"      on gastos              for all using (auth.uid() = user_id);
create policy "own_recetas"     on recetas             for all using (auth.uid() = user_id);
create policy "own_odontogramas" on odontogramas       for all using (auth.uid() = user_id);
create policy "own_mediciones"  on mediciones          for all using (auth.uid() = user_id);
create policy "own_notas"       on notas_clinicas      for all using (auth.uid() = user_id);
create policy "own_servicios"   on historial_servicios for all using (auth.uid() = user_id);
create policy "own_config"      on configuracion       for all using (auth.uid() = user_id);
