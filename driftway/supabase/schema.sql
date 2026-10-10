-- DRIFTWAY · base de datos
-- Pegar completo en Supabase → SQL Editor → New query → Run. Se puede correr varias veces sin problema.
-- Tres tablas: visitas (contador), pilotos (registro opcional) y partidas (puntajes).
-- Reglas: el juego (clave anon) solo puede sumar visitas, insertar pilotos y partidas,
-- y leer el ranking público. Los correos nunca se pueden leer desde el juego.

-- ---------- Visitas ----------
create table if not exists public.visitas (
  dia date primary key default current_date,
  total integer not null default 0
);
alter table public.visitas enable row level security;

-- Sumar una visita sin exponer la tabla a escritura directa
create or replace function public.registrar_visita()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  acumulado bigint;
begin
  insert into public.visitas (dia, total) values (current_date, 1)
  on conflict (dia) do update set total = public.visitas.total + 1;
  select coalesce(sum(total), 0) into acumulado from public.visitas;
  return acumulado;
end;
$$;

-- Leer el total sin sumar
create or replace function public.total_visitas()
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(sum(total), 0) from public.visitas;
$$;

grant execute on function public.registrar_visita() to anon;
grant execute on function public.total_visitas() to anon;

-- ---------- Pilotos (registro opcional) ----------
create table if not exists public.pilotos (
  id uuid primary key default gen_random_uuid(),
  creado timestamptz not null default now(),
  apodo text not null check (char_length(apodo) between 2 and 20),
  correo text check (correo is null or correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  acepta_avisos boolean not null default false,
  acepta_avisos_en timestamptz,
  idioma text,
  pais text,
  dispositivo text
);
alter table public.pilotos enable row level security;

-- El juego puede crear pilotos, pero no leerlos, cambiarlos ni borrarlos
drop policy if exists "juego inserta pilotos" on public.pilotos;
create policy "juego inserta pilotos" on public.pilotos
  for insert to anon with check (true);

-- El consentimiento siempre lleva fecha
create or replace function public.sellar_consentimiento()
returns trigger language plpgsql as $$
begin
  if new.acepta_avisos then new.acepta_avisos_en := coalesce(new.acepta_avisos_en, now());
  else new.acepta_avisos_en := null; new.correo := null; end if;
  return new;
end;
$$;
drop trigger if exists pilotos_consentimiento on public.pilotos;
create trigger pilotos_consentimiento before insert or update on public.pilotos
  for each row execute function public.sellar_consentimiento();

-- ---------- Partidas ----------
create table if not exists public.partidas (
  id uuid primary key default gen_random_uuid(),
  creado timestamptz not null default now(),
  piloto_id uuid references public.pilotos(id) on delete set null,
  apodo text not null check (char_length(apodo) between 2 and 20),
  puntos integer not null check (puntos between 0 and 2000000),
  sector smallint not null check (sector between 1 and 5),
  derribos smallint not null default 0 check (derribos between 0 and 99),
  roces integer not null default 0 check (roces between 0 and 9999),
  duracion_s integer not null check (duracion_s between 1 and 7200),
  gano boolean not null default false,
  version text,
  -- Filtro de lo imposible: ni con turbo máximo y roces el juego da más de unos 1.600 puntos por segundo
  constraint ritmo_posible check (puntos <= duracion_s * 1600 + 1500)
);
alter table public.partidas enable row level security;
create index if not exists partidas_puntos on public.partidas (puntos desc);

drop policy if exists "juego inserta partidas" on public.partidas;
create policy "juego inserta partidas" on public.partidas
  for insert to anon with check (true);

-- Ranking público: solo apodo, puntos, sector y fecha. Nada que identifique a nadie.
drop view if exists public.ranking;
-- Una fila por piloto: su mejor partida. Las partidas sin piloto se agrupan por apodo.
create view public.ranking as
  select apodo, puntos, sector, derribos, gano, creado
  from (
    select distinct on (coalesce(piloto_id::text, 'apodo:' || lower(apodo))) apodo, puntos, sector, derribos, gano, creado
    from public.partidas
    order by coalesce(piloto_id::text, 'apodo:' || lower(apodo)), puntos desc, creado asc
  ) mejores
  order by puntos desc, creado asc
  limit 100;
grant select on public.ranking to anon;

-- Posición de un puntaje entre los mejores puntajes de cada piloto (para "eres el piloto n.º 312")
create or replace function public.posicion(p integer)
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select count(*) + 1
  from (select max(puntos) as mejor from public.partidas group by coalesce(piloto_id::text, 'apodo:' || lower(apodo))) mejores
  where mejor > p;
$$;
grant execute on function public.posicion(integer) to anon;

-- Freno a la inundación: máximo 30 partidas por minuto en total desde el juego
create or replace function public.frenar_partidas()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.partidas where creado > now() - interval '1 minute') > 30 then
    raise exception 'demasiadas partidas, intenta en un momento';
  end if;
  return new;
end;
$$;
drop trigger if exists partidas_freno on public.partidas;
create trigger partidas_freno before insert on public.partidas
  for each row execute function public.frenar_partidas();
