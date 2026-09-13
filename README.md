# Ausgaben-Tracker

Ein kleines SaaS-Produkt, mit dem eine Privatperson ihre täglichen Ausgaben erfasst und am Monatsende sieht, wofür das Geld geflossen ist. Bezahlt jemand in Euro, Dollar oder Pfund, holt die App den offiziellen Referenzkurs der Europäischen Zentralbank **zum Ausgabedatum** und speichert ihn nachvollziehbar bei der Ausgabe.

Entstanden als Abschlussarbeit, entwickelt **ausschliesslich** mit dem spec-getriebenen Workflow des AI Engineering Kits: `/init → /write-spec → /architecture → /tasks → /build → /qa`, ein Durchgang je Feature.

**Live ansehen:** https://ausgaben-tracker-six.vercel.app — dort kannst du dich direkt registrieren und alles ausprobieren, ohne selbst etwas aufzusetzen. Wer die App lieber gegen eine eigene Supabase-Instanz laufen lässt, folgt dem Abschnitt „Selbst zum Laufen bringen" weiter unten.

## Die drei Features

| ID | Feature | Was es leistet |
|----|---------|----------------|
| PROJ-1 | Benutzerkonto & Login | Registrierung und Anmeldung mit E-Mail und Passwort über Supabase Auth. Nur angemeldete Personen sehen `/app`. Row Level Security auf `profiles`, Profil entsteht automatisch per Datenbank-Trigger. Sperre nach 5 Fehlversuchen in 15 Minuten, keine Auskunft darüber, ob ein Konto existiert. Datenexport als JSON und Kontolöschung durch die Person selbst. |
| PROJ-2 | Ausgaben & Monatsübersicht | Ausgaben mit Betrag, Kategorie, Datum und Notiz erfassen und löschen. Monatsübersicht mit Gesamtsumme und Summe je Kategorie, Blättern durch die Monate. Row Level Security auf `expenses`: jede Person sieht ausschliesslich ihre eigenen Zeilen. |
| PROJ-3 | Fremdwährung & Wechselkurse | **Die externe Integration.** Ausgaben in EUR, USD oder GBP werden über die [Frankfurter-API](https://frankfurter.dev) (Referenzkurse der EZB) in CHF umgerechnet. Kurs und Kursdatum werden bei der Ausgabe festgeschrieben. Ein Kursfeld über dem Formular zeigt die aktuellen Kurse. |

Die Artefakte jedes Features liegen in `features/PROJ-X-…/` als `spec.md`, `design.md`, `tasks.md` und `qa-report.md`. Der Status steht in [`features/INDEX.md`](features/INDEX.md).

## Die externe Integration braucht nichts

`https://api.frankfurter.dev` ist kostenlos, öffentlich und verlangt **keinen Schlüssel und kein Konto**. Es gibt also nichts einzurichten und nichts zu bezahlen. Der Aufruf erfolgt ausschliesslich serverseitig; an den Dienst gehen nur ein Währungskürzel und ein Datum, nie ein Betrag und nichts, was auf eine Person schliessen lässt.

Selbst nachsehen:

```bash
curl "https://api.frankfurter.dev/v1/2026-09-13?base=EUR&symbols=CHF"
```

Die Antwort nennt das Datum des Kurses. Für einen Sonntag ist das der letzte Börsentag davor — genau dieses Datum zeigt die App an.

## Selbst zum Laufen bringen

Voraussetzung: Node 20 oder neuer und ein kostenloses Supabase-Konto.

### 1. Supabase-Projekt anlegen

Auf [supabase.com](https://supabase.com) ein neues Projekt erstellen, Free Plan, **Region Frankfurt (`eu-central-1`)**. Die Region lässt sich später nicht mehr ändern.

### 2. Zwei Einstellungen setzen — ohne sie funktioniert die Registrierung nicht

Beide im Supabase-Dashboard des neuen Projekts:

1. **Authentication → Sign In / Providers → Email → „Confirm email" ausschalten.**
   Der eingebaute Mailversand des kostenlosen Tarifs ist auf wenige Nachrichten pro Stunde begrenzt. Bleibt die Bestätigung eingeschaltet, scheitert die Registrierung reproduzierbar mit `over_email_send_rate_limit`, und niemand ist nach dem Registrieren angemeldet.
2. **Im selben Panel: „Minimum password length" auf 8 setzen.**
   Die App prüft selbst auf 8 Zeichen; diese Einstellung zieht dieselbe Grenze eine Ebene tiefer. Beide Schalter liegen unter Authentication → Sign In / Providers → Email, nicht unter Authentication → Policies (dort stehen die Row-Level-Security-Regeln).

Diese beiden Schritte sind in `features/PROJ-1-user-accounts-auth/tasks.md` als `[user]`-Aufgaben T3 und T4 dokumentiert — Einstellungen, die kein Code machen kann.

### 3. Datenbankschema anlegen

Im Dashboard unter **SQL Editor** die vier Dateien aus `supabase/migrations/` **in dieser Reihenfolge** einfügen und ausführen:

```
0001_profiles_and_auth.sql
0002_lock_down_trigger_function.sql
0003_expenses.sql
0004_expenses_currency.sql
```

Wer die Supabase CLI hat, kann stattdessen `supabase link --project-ref <ref>` und `supabase db push` verwenden.

### 4. Schlüssel eintragen

`.env.local.example` nach `.env.local` kopieren und die beiden Werte aus **Project Settings → API** eintragen:

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<der publishable bzw. anon key>
```

Der Schlüssel ist öffentlich und gehört ins Browser-Bundle — geschützt sind die Daten durch Row Level Security, nicht durch Geheimhaltung dieses Schlüssels. `.env.local` ist von Git ausgeschlossen.

### 5. Starten

```bash
npm install
npm run dev
```

Die App läuft auf http://localhost:3000.

## In fünf Minuten durchprobieren

1. **Registrieren** unter `/signup` mit einer E-Mail-Adresse und einem Passwort mit mindestens 8 Zeichen. Danach bist du sofort angemeldet und auf `/app`. (Supabase lehnt manche Wegwerf-Domains ab, `example.com` etwa; eine gewöhnliche Adresse funktioniert.)
2. **Ausgabe in CHF erfassen:** Betrag 25, Kategorie Lebensmittel, speichern. Sie erscheint in der Liste, die Monatssumme steigt.
3. **Ausgabe in Euro erfassen:** Betrag 12, Währung auf EUR stellen, speichern. In der Liste steht der Franken-Betrag, darunter „EUR 12.00 · Kurs 0.9451 vom 11.09.2026". Das Kursdatum kann vom Ausgabedatum abweichen — an einem Wochenende veröffentlicht die EZB keinen neuen Kurs.
4. **Monat wechseln** mit den Pfeilen. Im leeren Vormonat steht CHF 0.00. Über den laufenden Monat hinaus geht es nicht.
5. **Löschen** einer Ausgabe: Rückfrage bestätigen, die Summe passt sich an.
6. **Abmelden**, dann `/app` aufrufen: Weiterleitung auf die Anmeldung.
7. **Falsches Passwort** fünfmal eingeben: Der sechste Versuch wird mit einer Wartezeit abgelehnt. Die Fehlermeldung ist für eine unbekannte Adresse und ein falsches Passwort wortgleich.
8. **Row Level Security selbst prüfen** — mit dem öffentlichen Schlüssel an der App vorbei direkt die Datenbank fragen:

   ```bash
   curl "https://<ref>.supabase.co/rest/v1/expenses?select=*" -H "apikey: <anon key>" -H "Authorization: Bearer <anon key>"
   ```

   Antwort: `[]`. Ohne gültige Anmeldung gibt die Datenbank keine Zeile heraus, egal was gefragt wird.
9. **Daten herunterladen** unter „Konto & Daten": eine JSON-Datei mit Konto, Profil und allen Ausgaben samt Originalbetrag, Währung, Kurs und Kursdatum.
10. **Konto löschen:** Konto, Profil und alle Ausgaben verschwinden endgültig.

## Tests

```bash
npm test        # 69 Unit- und Integrationstests (Vitest)
npm run lint
npm run build
```

Die Tests mocken den Supabase-Client und schreiben nichts in die Datenbank.

## Technik

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (PostgreSQL + Auth) · Zod · Vitest

Ein paar Entscheidungen, die im Code sonst nicht auffallen:

- **Anmeldung läuft über Server Actions**, nicht über ein Browser-Formular. Damit kann ein Passwort bauartbedingt nicht in der Adresszeile landen.
- **Zugriff wird zweifach geprüft:** Weiterleitung in der App *und* Zeilenregeln in der Datenbank. Die zweite ist die verbindliche.
- **Beträge sind Festkommazahlen** (`numeric(12,2)`), summiert in ganzen Rappen. In Fliesskomma ergibt 0.10 + 0.20 nicht 0.30, und eine Monatssumme muss stimmen.
- **Kontolöschung läuft über eine Datenbankfunktion**, die nur auf das eigene Konto wirkt. Die App braucht deshalb keinen Administrationsschlüssel, der jede Zugriffsregel aushebeln könnte.
- **Die Sperre gegen Passwortraten zählt im Serverprozess**, je Konto und je IP. Kein zusätzlicher Dienst, keine Kosten — aber sie beginnt nach einem Neustart von vorn, und bei mehreren Instanzen zählt jede für sich. So festgehalten in `features/PROJ-1-user-accounts-auth/design.md`.

## Wenn du selbst auf Vercel deployst

Zwei Dinge, an denen es sonst scheitert:

- **Die beiden Umgebungsvariablen müssen im Vercel-Projekt gesetzt sein**, unter Settings → Environment Variables: `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY`, mindestens für Production. Fehlen sie, antwortet **jede** Seite mit `Internal Server Error` — auch die statische Datenschutzseite, weil schon der Anfragen-Grenzposten (`src/proxy.ts`) einen Supabase-Client baut.
- **Nach dem Setzen muss neu gebaut werden.** Variablen mit dem Präfix `NEXT_PUBLIC_` werden beim Bauen in den Code eingebacken; ein blosser Neustart reicht nicht. In der Vercel-Oberfläche: Deployments → beim neuesten Eintrag „Redeploy".

## Hinweis zum Betrieb

Ein pausiertes Supabase-Free-Projekt (nach sieben Tagen ohne Zugriff) muss im Dashboard einmal mit **Restore** aufgeweckt werden, sonst antwortet die Datenbank nicht.

Das Projekt wird nicht öffentlich betrieben. Für einen echten Betrieb fehlen die Angaben zum Verantwortlichen und ein Impressum; was das Produkt mit personenbezogenen Daten tut, steht in [`docs/privacy.md`](docs/privacy.md).
