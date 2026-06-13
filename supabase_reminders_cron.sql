-- ══════════════════════════════════════════════════════════════
-- Kuida — Cron job para recordatorios por email
-- Ejecutar en Supabase: SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Habilitar pg_cron (solo la primera vez)
create extension if not exists pg_cron;

-- Habilitar pg_net (para llamar a la Edge Function)
create extension if not exists pg_net;

-- Crear el cron job: todos los días a las 8am hora Argentina (UTC-3 = 11:00 UTC)
select cron.schedule(
  'kuida-recordatorios-diarios',
  '0 11 * * *',
  $$
  select net.http_post(
    url    := 'https://' || current_setting('app.settings.project_ref') || '.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body   := '{}'::jsonb
  )
  $$
);

-- Ver cron jobs activos
-- select * from cron.job;

-- Para eliminar el job si hace falta:
-- select cron.unschedule('kuida-recordatorios-diarios');
