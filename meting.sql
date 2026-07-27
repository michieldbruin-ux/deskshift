-- Meting van afhaken in de intake van Deskshift.
-- Dit is wat er in de database staat. Al toegepast, hier voor de vindbaarheid.
--
-- Wat hier in gaat: een tijdstip, een willekeurig sessienummer, de taal van de
-- pagina, de naam van de stap, en hoeveel milliseconden na de eerste stap die
-- stap bereikt werd.
-- Wat hier NIET in gaat: antwoorden, mailadressen, IP-adressen, user agents.
-- Er komt ook geen cookie aan te pas: het sessienummer staat in sessionStorage
-- en is weg zodra de tab sluit. Het bestaat alleen om twee stappen van dezelfde
-- bezoeker aan elkaar te knopen, en is nergens anders bekend.
--
-- Deskshift heeft een eigen Supabase-project (naxanmyekaqxledmzowh). Dat was
-- eerst niet zo: de tabel stond in het project van VendorRadar, omdat het voor
-- een tellertabel zonde leek om een project op te tuigen. Daar is hij weg bij de
-- beheerdersmail, want die heeft een service-sleutel nodig om te lezen, en zo'n
-- sleutel gaat langs RLS van ELKE tabel in het project. In één project betekent
-- dat: een fout in een functie van Deskshift ligt de gebruikersgegevens van
-- VendorRadar open. Twee projecten is de enige scheiding die dat echt afdekt.
--
-- De tabellen heten nog steeds deskshift_iets. Dat mag nu weg, maar het kost
-- alleen maar een migratie en het leest prima.
--
-- Hij staat in het schema public omdat PostgREST alleen dat schema standaard
-- doorgeeft, en dat is nodig om er vanuit api/stap.js in te kunnen schrijven.

create table if not exists public.deskshift_meting (
  id      bigserial primary key,
  ts      timestamptz not null default now(),
  sessie  text        not null,
  taal    text,
  stap    text        not null,
  ms      integer
);

-- De taalkolom kwam er later bij, toen /en erbij kwam. Zonder die kolom lopen
-- Nederlands en Engels door elkaar in dezelfde funnel en is niet meer te zien
-- waar wie afhaakt. Hij mag leeg zijn: regels van voor deze wijziging hebben
-- geen taal, en die zijn allemaal Nederlands (Engels bestond nog niet). Ze vallen
-- binnen 30 dagen uit de view en binnen 90 dagen uit de tabel.
alter table public.deskshift_meting add column if not exists taal text;

create index if not exists deskshift_meting_ts_idx   on public.deskshift_meting (ts desc);
create index if not exists deskshift_meting_stap_idx on public.deskshift_meting (stap);

-- Bewust GEEN unieke index op (sessie, stap). Met RLS en zonder select-policy
-- faalt "on conflict do nothing", en zonder die clausule laat een index een
-- tweede aanbieding van dezelfde batch met een 409 stranden, waardoor de hele
-- batch verloren gaat. De view hieronder groepeert al per (sessie, stap), dus
-- een dubbele regel schuift de funnel niet op. Liever dubbel dan gemist.

alter table public.deskshift_meting enable row level security;

-- De browser praat niet rechtstreeks met de database: api/stap.js doet dat, met
-- de publieke sleutel. Die sleutel mag alleen toevoegen, nooit lezen of wijzigen.
-- Er is dus geen select-policy, en zonder select-policy geeft de API niets terug.
-- Lezen doe je in de SQL-editor, met een sleutel die niet in een deploy zit.
drop policy if exists deskshift_meting_toevoegen on public.deskshift_meting;
create policy deskshift_meting_toevoegen
  on public.deskshift_meting for insert to anon
  with check (true);

-- De funnel als leesbare tabel. De volgorde komt uit de gemiddelde ms sinds de
-- eerste stap, dus die klopt automatisch mee als de vragen veranderen. Geen
-- vaste lijst met stapnamen die je bij elke wijziging moet bijwerken.
-- Drop en opnieuw aanmaken en niet "create or replace": er komt een kolom bij,
-- en replace mag de kolomlijst van een bestaande view niet omgooien. Er hangt
-- niets aan deze view, dus weggooien kost niets.
drop view if exists public.deskshift_funnel;
create view public.deskshift_funnel as
-- Eerst één taal per sessie vaststellen, en niet per regel. De taalknop staat in
-- de voet, en sessionStorage gaat mee naar /en, dus wie halverwege omschakelt zou
-- anders in twee funnels tegelijk staan en dubbel geteld worden. De taal van de
-- vroegste gemeten stap geldt voor de hele sessie.
with taal_per_sessie as (
  select sessie,
         (array_agg(coalesce(taal, 'onbekend') order by ms asc nulls last))[1] as taal
  from public.deskshift_meting
  where ts > now() - interval '30 days'
  group by sessie
), per_sessie as (
  select m.sessie, t.taal, m.stap, min(m.ms) as ms
  from public.deskshift_meting m
  join taal_per_sessie t on t.sessie = m.sessie
  where m.ts > now() - interval '30 days'
  group by m.sessie, t.taal, m.stap
), geteld as (
  select taal,
         stap,
         count(*)                       as sessies,
         round(avg(ms) / 1000.0)::int   as gem_seconden
  from per_sessie
  group by taal, stap
)
select taal,
       stap,
       sessies,
       gem_seconden,
       round(100.0 * sessies / max(sessies) over (partition by taal), 1) as pct_van_start,
       sessies - lead(sessies) over (partition by taal order by gem_seconden) as verloren_hierna
from geteld
order by taal, gem_seconden;

comment on view public.deskshift_funnel is
  'Afhaken in de Deskshift-intake over de laatste 30 dagen, per taal. pct_van_start is ten opzichte van de drukste stap in diezelfde taal, verloren_hierna is hoeveel sessies de volgende stap niet haalden. taal is nl, en, of onbekend voor sessies van voor de taalkolom.';

-- Bewaartermijn van 90 dagen, echt afgedwongen en niet alleen opgeschreven in
-- de privacyverklaring. Draait elke nacht.
create extension if not exists pg_cron with schema cron;

create or replace function public.deskshift_meting_opruimen()
returns void language sql security definer set search_path = public as $$
  delete from public.deskshift_meting where ts < now() - interval '90 days';
$$;

select cron.unschedule('deskshift-meting-opruimen')
  where exists (select 1 from cron.job where jobname = 'deskshift-meting-opruimen');

select cron.schedule('deskshift-meting-opruimen', '17 3 * * *', 'select public.deskshift_meting_opruimen()');

-- ---------------------------------------------------------------------------
-- Verzendadministratie van de beheerdersmail (api/adminmail.js).
--
-- Waarom dit bestaat: de cron van Vercel draait op UTC en 07:00 in Nederland is
-- 's zomers 05:00 UTC en 's winters 06:00. Daarom staan er twee cron-regels op
-- hetzelfde pad. Deze tabel zorgt ervoor dat er dan toch één mail uitgaat: wie
-- als eerste een regel weet toe te voegen mag versturen, de ander vindt hem al
-- staan en doet niets. Dat vangt ook een herhaald verzoek van Vercel op.
--
-- Geen RLS-policy, en dat is de bedoeling: alleen de service-sleutel komt erbij.
-- De anon-sleutel die in de browserfunctie zit kan hier niets mee.
create table if not exists public.deskshift_adminmail (
  soort     text not null,          -- 'dag', 'week' of 'dagfout'
  periode   text not null,          -- '2026-07-26' of 'week-2026-07-20'
  verstuurd timestamptz not null default now(),
  primary key (soort, periode)
);

alter table public.deskshift_adminmail enable row level security;

comment on table public.deskshift_adminmail is
  'Welke beheerdersmail al verstuurd is. Voorkomt dubbele mail als de cron twee keer langskomt.';

-- Meer dan een jaar hoeft niet.
create or replace function public.deskshift_adminmail_opruimen()
returns void language sql security definer set search_path = public as $$
  delete from public.deskshift_adminmail where verstuurd < now() - interval '400 days';
$$;

select cron.unschedule('deskshift-adminmail-opruimen')
  where exists (select 1 from cron.job where jobname = 'deskshift-adminmail-opruimen');

select cron.schedule('deskshift-adminmail-opruimen', '23 3 * * *', 'select public.deskshift_adminmail_opruimen()');
