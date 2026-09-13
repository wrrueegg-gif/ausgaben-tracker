# PROJ-1 Aufgaben

> Erzeugt von `/tasks` aus `spec.md` + `design.md`. Dies ist der geordnete, nachverfolgbare Bauplan — die Brücke zwischen dem Vertrag (WAS) und dem Bau (WIE).
> `[P]` = parallelisierbar: Die Dateien der Aufgabe sind von jeder anderen `[P]`-Aufgabe derselben Stufe disjunkt.
> Stufen laufen **nacheinander** (jede ist eine Barriere). Innerhalb einer Stufe laufen `[P]`-Aufgaben parallel. Jede Aufgabe verweist auf die AC-IDs aus `spec.md`, die sie erfüllt — das ist die Kette AC → Aufgabe → Test.
> `[user]` = eine Einstellung, die nur die Person selbst machen kann, im Dashboard des Anbieters: `where:` statt `files:`, nie `[P]`, wird von der Person abgehakt — `/build` übergibt sie nur.
> Eigentümer: `/tasks` erstellt diese Datei; `/build` hakt die Kästchen ab — ausser den `[user]`-Aufgaben.

## Stufe 1 — Daten / Schema

- [ ] T1  Migration: Tabelle `profiles` (id, display_name, created_at), Row Level Security aktiviert, Regeln „nur die eigene Zeile lesen und ändern", kein Einfügen/Löschen für angemeldete Personen  · files: supabase/migrations/0001_profiles_and_auth.sql  · → AC-8, AC-9
- [ ] T2  Migration im selben File: Auslöser auf der Kontotabelle, der beim Registrieren das Profil im selben Vorgang anlegt (Anzeigename aus dem Teil vor dem @), sowie die Funktion zum Löschen des eigenen Kontos, freigegeben nur für angemeldete Aufrufer  · files: supabase/migrations/0001_profiles_and_auth.sql  · → AC-8, AC-13, EC-6
- [ ] T3 [user]  Supabase: E-Mail-Bestätigung ausschalten  · where: Dashboard → Authentication → Sign In / Providers → Email → „Confirm email" auf aus  · → AC-1
- [ ] T4 [user]  Supabase: Mindestlänge des Passworts auf 8 setzen  · where: Dashboard → Authentication → Policies → „Minimum password length" = 8  · → AC-2

## Stufe 2 — Server-Logik

- [ ] T5 [P]  Fehlversuchssperre: Zähler im Serverspeicher, 5 Versuche je 15 Minuten, getrennt je E-Mail-Adresse und je IP, mit verbleibender Wartezeit; Zurücksetzen bei erfolgreicher Anmeldung  · files: src/lib/rate-limit.ts  · → AC-10
- [ ] T6 [P]  Sitzungserneuerung im Anfragen-Grenzposten, damit eine ablaufende Sitzung nicht mitten in der Nutzung kippt  · files: src/proxy.ts  · → AC-6, EC-4
- [ ] T7 [P]  Eingabeprüfung für Anmelde- und Registrierdaten (E-Mail-Format, Passwort mindestens 8 Zeichen) als eigenes Schema, serverseitig verwendet  · files: src/lib/validation/auth.ts  · → AC-2, EC-5
- [ ] T8  Serverseitige Formular-Aktionen: `signup` (Konto anlegen, danach angemeldet auf `/app`), `login` (Sperre prüfen, anmelden, weiterleiten), `logout`, `deleteAccount` (ruft die Löschfunktion der Datenbank, meldet ab); alle Fehlschläge mit wortgleicher, neutraler Meldung  · files: src/app/(auth)/actions.ts  · → AC-1, AC-3, AC-4, AC-5, AC-11, AC-13, EC-1, EC-2, EC-3
- [ ] T9 [P]  Route für den Datenexport: liefert Profil, E-Mail-Adresse und alle eigenen Ausgaben als JSON-Download; ohne Anmeldung abgewiesen  · files: src/app/api/export/route.ts  · → AC-12

## Stufe 3 — Oberfläche

- [ ] T10 [P]  Layout der Anmeldeseiten (zentrierte Karte) samt Weiterleitung angemeldeter Personen auf `/app`  · files: src/app/(auth)/layout.tsx  · → AC-7
- [ ] T11 [P]  Anmeldeseite mit Formular, Fehleranzeige, gesperrtem Knopf während des Absendens und Link zur Registrierung und zum Datenschutz  · files: src/app/(auth)/login/page.tsx  · → AC-3, AC-4, AC-10, AC-11, AC-14, EC-2, EC-3
- [ ] T12 [P]  Registrierungsseite mit Formular, Feldfehlern, neutraler Fehlermeldung und Links  · files: src/app/(auth)/signup/page.tsx  · → AC-1, AC-2, AC-14, EC-1, EC-2, EC-5
- [ ] T13 [P]  Kopfzeile des geschützten Bereichs mit Produktname, E-Mail und Abmelden-Knopf  · files: src/components/app-header.tsx  · → AC-5
- [ ] T14 [P]  Layout des geschützten Bereichs: erzwingt die Anmeldung, leitet sonst auf `/login`, setzt Kopfzeile und Inhaltsbreite  · files: src/app/app/layout.tsx  · → AC-6, EC-4
- [ ] T15 [P]  Übersichtsseite mit Begrüssung, Platzhalter für die Ausgabenliste und Bereich „Konto & Daten" (Download-Knopf, Löschen mit Bestätigungsdialog, Datenschutz-Link)  · files: src/app/app/page.tsx  · → AC-12, AC-13, AC-14
- [ ] T16 [P]  Datenschutzseite mit Angaben zu Daten, Zweck, Speicherort und Aufbewahrungsdauer, ohne Anmeldung erreichbar  · files: src/app/datenschutz/page.tsx  · → AC-14

## Stufe 4 — Feinschliff

- [ ] T17  Gestaltungswerte aus `docs/design-system.md` in die Token-Datei übertragen (hell und dunkel), damit alle Seiten dieselbe Farbwelt zeigen  · files: src/app/globals.css  · → AC-14
- [ ] T18 [P]  Startseite leitet auf `/app` (angemeldet) bzw. `/login` (abgemeldet) weiter, statt die Vorlagenseite zu zeigen  · files: src/app/page.tsx  · → AC-6, AC-7
- [ ] T19 [P]  Integrationstests der Formular-Aktionen: erfolgreiche Anmeldung, falsches Passwort, gleiche Meldung bei unbekannter Adresse, Sperre nach 5 Versuchen, Registrierung mit vergebener Adresse, Kontolöschung  · files: src/app/(auth)/actions.test.ts  · → AC-1, AC-3, AC-4, AC-10, AC-11, AC-13, EC-1
- [ ] T20 [P]  Tests der Fehlversuchssperre (Zählung je Adresse und je IP, Ablauf nach 15 Minuten, Zurücksetzen nach Erfolg)  · files: src/lib/rate-limit.test.ts  · → AC-10
- [ ] T21 [P]  Test der Exportroute: ohne Anmeldung abgewiesen, angemeldet vollständige eigene Daten  · files: src/app/api/export/route.test.ts  · → AC-12

## Parallelisierung

- **Stufen sind Barrieren.** Eine Stufe beginnt erst, wenn die vorherige vollständig integriert und gegen ihre AC-IDs geprüft ist. Damit steht der Datenvertrag vor der Oberfläche: Schema (S1) → Server (S2) → Oberfläche (S3) → Feinschliff (S4).
- **`[P]` verlangt disjunkte Dateien.** T1 und T2 schreiben dieselbe Migrationsdatei und sind deshalb bewusst **nicht** parallel. T8 berührt als einzige Aufgabe der Stufe 2 die Aktionsdatei, hängt aber inhaltlich von T5 und T7 ab und läuft daher nach ihnen — ebenfalls ohne `[P]`.
- **`[user]`-Aufgaben werden nie gebaut.** T3 und T4 stehen in Stufe 1, weil AC-1 und AC-2 ohne sie nicht erfüllbar sind. `/build` übergibt sie, die Person hakt sie ab.
- **Abdeckung:** AC-1 → T3, T8, T12 · AC-2 → T4, T7, T12 · AC-3 → T8, T11 · AC-4 → T8, T11 · AC-5 → T8, T13 · AC-6 → T6, T14, T18 · AC-7 → T10, T18 · AC-8 → T1, T2 · AC-9 → T1 · AC-10 → T5, T11 · AC-11 → T8, T11 · AC-12 → T9, T15 · AC-13 → T2, T8, T15 · AC-14 → T11, T12, T15, T16, T17. Jede AC ist durch mindestens eine Aufgabe abgedeckt.
