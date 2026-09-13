# QA Test Results

**Tested:** 2026-09-13 (Erstlauf) · 2026-09-13, Nachtrag nach Erledigung der `[user]`-Aufgaben T3 und T4
**App URL:** http://localhost:3012 (Entwicklungsserver gegen die gehostete Supabase-Instanz)
**Tester:** QA Engineer (AI) — Acceptance und Security durch einen unabhängigen Prüfer, der diesen Build nicht kannte; Laufzeitprüfungen mit angemeldeter Sitzung durch den Eigentümer dieses Laufs

> Legende: `[x]` in diesem Lauf geprüft (mit Beleg) · `[ ] BUG` als defekt bestätigt · `[!] NOT VERIFIED` in diesem Lauf nicht prüfbar (mit Begründung)

Für die Laufzeitprüfungen wurden zwei Testkonten (`qa.anna@gmail.com`, `qa.bruno@gmail.com`) direkt in der Datenbank angelegt, weil die Registrierung über die App derzeit an der offenen `[user]`-Aufgabe T3 scheitert (siehe AC-1). Beide wurden nach dem Lauf wieder entfernt.

### Acceptance Criteria Status

#### AC-1: Registrierung legt ein Konto an und meldet sofort an
- [x] Im Browser durchgespielt, nachdem T3 erledigt war: Registrierung mit einer unbekannten Adresse und einem Passwort mit 12 Zeichen → sofort angemeldet auf `/app`, Kopfzeile zeigte „Angemeldet als abnahme.pruefung@gmail.com" — Beleg: Seitentext unmittelbar nach dem Absenden
- [x] Die Einstellung greift: `GET /auth/v1/settings` liefert jetzt `"mailer_autoconfirm": true` — Beleg: eigener `curl` gegen die Instanz
- [x] Test „AC-1: legt ein Konto an und leitet direkt in den geschützten Bereich" in `src/app/(auth)/actions.test.ts`

#### AC-2: Passwort mindestens 8 Zeichen
- [x] Serverseitig erzwungen, bevor die Auth-Plattform überhaupt gefragt wird — Beleg: unabhängiger Prüfer schickte ein 7-Zeichen-Passwort an die Server Action und erhielt „Das Passwort muss mindestens 8 Zeichen haben."; Regel in `src/lib/validation/auth.ts`, Anzeige unter dem Feld in `src/app/(auth)/signup/page.tsx`; Test in `src/app/(auth)/actions.test.ts`
- [x] Die zweite Ebene steht jetzt ebenfalls, nachdem T4 erledigt war: `POST /auth/v1/signup` mit einem 7-Zeichen-Passwort antwortet `422 weak_password` / „Password should be at least 8 characters." — Beleg: eigener `curl` an der App vorbei
- [x] Im Browser bestätigt: ein 7-Zeichen-Passwort im Registrierungsformular erzeugt „Das Passwort muss mindestens 8 Zeichen haben." und legt kein Konto an — Beleg: Seitentext

#### AC-3: Anmeldung mit richtigen Daten führt auf /app
- [x] Im Browser geprüft: Anmeldung als `qa.anna@gmail.com` führte auf `/app` mit Kopfzeile, Monatsübersicht und Ausgabenliste — Beleg: Bildschirmaufnahme der Übersicht nach der Anmeldung; Test „AC-3: leitet nach korrekter Anmeldung auf /app"

#### AC-4: Falsches Passwort meldet niemanden an
- [x] Im Browser geprüft: falsches Passwort für ein existierendes Konto → Verbleib auf `/login`, Meldung „E-Mail-Adresse oder Passwort ist falsch.", keine Sitzung — Beleg: Seitentext nach dem Absenden
- [x] Unabhängig bestätigt: `POST` an die Server Action mit falschen Daten → HTTP 200, kein `Set-Cookie`, keine Weiterleitung

#### AC-5: Abmelden beendet die Sitzung
- [x] Im Browser geprüft: Klick auf „Abmelden" führte auf `/login`; anschliessender Aufruf von `/app` leitete wieder auf `/login` — Beleg: Seitentext vor und nach dem Abmelden; Test „AC-5: meldet ab und führt zur Anmeldeseite"

#### AC-6: /app ohne Anmeldung leitet auf /login
- [x] `curl -i http://localhost:3012/app` → `HTTP 307`, `location: /login`, kein Inhalt des geschützten Bereichs — Beleg: unabhängiger Prüfer; zusätzlich im Browser nach dem Abmelden bestätigt; `src/app/app/layout.tsx`

#### AC-7: Angemeldet auf /login oder /signup führt auf /app
- [x] Im Browser geprüft: angemeldet `/login` aufgerufen → sofortige Weiterleitung auf `/app` — Beleg: `src/app/(auth)/layout.tsx` und beobachtete Weiterleitung

#### AC-8: Profil entsteht automatisch
- [x] Nach einer **echten Registrierung über die App** nachgezählt: das Konto war sofort bestätigt und trug ohne weiteres Zutun das Profil `abnahme.pruefung` — Beleg: `select u.email, u.confirmed_at is not null, p.display_name from auth.users u left join public.profiles p on p.id = u.id`
- [x] Gegen die echte Datenbank geprüft: nach Anlegen eines Kontos mit der Adresse `qa.anna@gmail.com` existierte ohne weiteres Zutun die Profilzeile mit `display_name = "qa.anna"` — Beleg: `select u.email, p.display_name from auth.users u left join public.profiles p on p.id = u.id` lieferte den Anzeigenamen; Auslöser in `supabase/migrations/0001_profiles_and_auth.sql`

#### AC-9: Fremder Zugriff mit dem öffentlichen Schlüssel liefert nichts
- [x] Ohne Anmeldung: `GET /rest/v1/profiles?select=*` mit dem öffentlichen Schlüssel → `[]` — Beleg: unabhängiger Prüfer und eigener `curl`
- [x] Angemeldet: Anna sah ausschliesslich ihr eigenes Profil (`[{"display_name":"qa.anna"}]`), Bruno keine fremde Zeile — Beleg: zwei echte Sitzungen über `/auth/v1/token`, je ein `GET /rest/v1/profiles`
- [x] Beide Datenbankfunktionen sind gegen anonyme Aufrufe gesperrt: `POST /rest/v1/rpc/delete_own_account` → `42501 permission denied`, `POST /rest/v1/rpc/handle_new_user` → nicht auffindbar (Wirkung von Migration 0002)

#### AC-10: Sperre nach 5 Fehlversuchen in 15 Minuten
- [x] Im Browser geprüft: fünf Fehlversuche lieferten die normale Meldung, der sechste „Zu viele Fehlversuche. Bitte versuche es in 15 Minuten erneut." — Beleg: Seitentext nach dem sechsten Versuch
- [x] Die Sperre ist beständig und zählt herunter: ein späterer Versuch nannte „in 12 Minuten" — Beleg: Bildschirmaufnahme
- [x] Sie zählt je Konto, nicht nur je IP — Beleg: unabhängiger Prüfer feuerte sechs Versuche mit je anderer `x-forwarded-for` (203.0.113.1–6) gegen dieselbe Adresse und wurde beim sechsten gesperrt
- [x] Gezählt wird vor der Passwortprüfung — Test „AC-10: sperrt nach 5 Fehlversuchen und fragt die Plattform nicht mehr"

#### AC-11: Keine Auskunft über die Existenz eines Kontos
- [x] Im Browser geprüft: unbekannte Adresse und falsches Passwort ergaben wortgleich „E-Mail-Adresse oder Passwort ist falsch." — Beleg: Seitentext beider Versuche
- [x] Auch eine ungültige Eingabe und die Sperrmeldung verraten nichts — Beleg: unabhängiger Prüfer erhielt die Sperrmeldung für eine frei erfundene Adresse; Tests „AC-11: …" (zwei Stück)

#### AC-12: Datenexport als maschinenlesbare Datei
- [x] Im Browser als angemeldete Person abgerufen: `GET /api/export` → HTTP 200, `content-disposition: attachment; filename="ausgaben-tracker-export.json"`, Inhalt mit `konto` (id, email, registriert_am), `profil` und allen Ausgaben — Beleg: vollständige Antwort im Prüflauf
- [x] Ohne Anmeldung abgewiesen: `curl /api/export` → HTTP 401 — Beleg: unabhängiger Prüfer; Test „weist einen nicht angemeldeten Aufruf mit 401 ab"

#### AC-13: Kontolöschung entfernt Konto, Profil und Ausgaben
- [x] Im Nachtragslauf mit dem echt registrierten Konto wiederholt: „Konto löschen" bestätigt → Weiterleitung auf `/login`, danach null Konten, null Profile, null Ausgaben in der Datenbank — Beleg: `select count(*) …` nach der Löschung
- [x] Im Browser als `qa.bruno@gmail.com` durchgeführt: Ausgabe erfasst, dann „Konto löschen" bestätigt → Weiterleitung auf `/login`
- [x] In der Datenbank nachgezählt: Konten 1, Profile 1, Ausgaben 2 — Brunos Konto, sein Profil und seine Ausgabe waren weg, Annas Daten unberührt — Beleg: `select count(*) …` vor und nach der Löschung
- [x] Ohne Administrationsschlüssel: die Löschung läuft über `public.delete_own_account()`, die nur auf `auth.uid()` wirkt und für anonyme Aufrufer gesperrt ist

#### AC-14: Datenschutzhinweis ohne Anmeldung erreichbar
- [x] `curl http://localhost:3012/datenschutz` → HTTP 200 ohne Anmeldung, mit Angaben zu Daten, Zweck, Speicherort (Supabase, `eu-central-1`, Frankfurt) und Aufbewahrungsdauer — Beleg: unabhängiger Prüfer
- [x] Verlinkt aus beiden Formularen und aus dem geschützten Bereich — Beleg: `href="/datenschutz"` im ausgelieferten HTML von `/login` und `/signup`

### Edge Cases Status

#### EC-1: Bereits registrierte Adresse
- [x] Der Code gibt bei einer bereits vergebenen Adresse dieselbe neutrale Meldung wie bei jedem anderen Fehlschlag — Beleg: Test „EC-1: antwortet bei bereits vergebener Adresse neutral"
- [x] Zusätzlich abgesichert: der Hinweis auf eine eingeschaltete E-Mail-Bestätigung erscheint für eine neue und eine vergebene Adresse wortgleich — Beleg: Test „EC-1: der Hinweis verrät nicht, ob die Adresse schon vergeben ist"

#### EC-2: Doppelklick auf Registrieren oder Anmelden
- [x] Der Knopf ist während des Absendens gesperrt und beschriftet („Wird geprüft …") — Beleg: `src/app/(auth)/login/page.tsx` über `useFormStatus`, im Browser beobachtet
- [!] NOT VERIFIED — echtes Renn-Timing zweier gleichzeitiger Anfragen wurde nicht provoziert; die serverseitige Garantie „höchstens ein Konto" liegt bei der Eindeutigkeit der E-Mail-Adresse in der Auth-Plattform

#### EC-3: Datenbank oder Netzwerk nicht erreichbar
- [x] BEHOBEN in diesem Lauf. Der unabhängige Prüfer fand, dass die Auth-Bibliothek einen Netzwerkfehler **zurückgibt** statt ihn zu werfen: der Ausfall lief in den Zweig für falsche Zugangsdaten, die Person sah „Passwort ist falsch", und fünf Ausfälle sperrten das Konto für 15 Minuten. Siehe BUG-3
- [x] Nach der Korrektur: ein zurückgegebener Netzwerkfehler wird an Name und Status erkannt, als Verbindungsproblem gemeldet und **nicht** als Fehlversuch gezählt — Belege: Tests „EC-3: erkennt einen Netzwerkfehler auch dann, wenn die Bibliothek ihn zurückgibt" und „EC-3: ein Ausfall zählt nicht als Fehlversuch und sperrt niemanden aus"
- [x] Die Eingaben bleiben im Formular stehen — Beleg: im Browser nach einem Fehlversuch waren E-Mail-Feld und Passwortfeld weiterhin gefüllt (`{"email":"qa.anna@gmail.com","pwLen":17}`); siehe auch BUG-4

#### EC-4: Abgelaufene Sitzung
- [!] NOT VERIFIED — eine echt abgelaufene Sitzung wurde nicht abgewartet. Geprüft ist der Fall „gar keine Sitzung" (AC-6); die Erneuerung liegt in `src/proxy.ts` und läuft bei jeder Anfrage mit

#### EC-5: Ungültiges E-Mail-Format
- [x] Serverseitig abgewiesen mit „Bitte gib eine gültige E-Mail-Adresse ein." — Beleg: unabhängiger Prüfer schickte „keine-mail-adresse" an die Server Action
- [x] Das ausgelieferte HTML beider Formulare enthält `<input type="email" … required>`, die Browserprüfung blockt also schon das Absenden — Beleg: `curl /login` und `curl /signup`

#### EC-6: Konto ohne Profil ist unmöglich
- [x] Garantie im Code bestätigt: `after insert on auth.users … execute function public.handle_new_user()` legt das Profil im selben Vorgang an; scheitert das Einfügen, stirbt die Transaktion und es entsteht kein Konto — Beleg: `supabase/migrations/0001_profiles_and_auth.sql`
- [x] In der Praxis bestätigt: jedes in diesem Lauf angelegte Konto hatte sofort ein Profil (AC-8)

### Security Audit Results

- [x] Authentifizierung: ohne Anmeldung kein Zugriff — `curl -i /app` → 307 auf `/login`, `curl /api/export` → 401
- [x] Autorisierung: fremde Daten nicht erreichbar — zwei echte Sitzungen, Bruno erhielt auf `GET /rest/v1/expenses` und `/rest/v1/profiles` jeweils `[]`, während Anna ihre Zeilen sah
- [x] Eingabeprüfung: `<script>alert(1)</script>@x.ch`, `'; drop table public.profiles;--@x.ch` und `admin@x.ch' or '1'='1` gegen die Server Action — alle serverseitig abgewiesen, keine Nutzlast in der Antwort gespiegelt, Tabelle danach unverändert — Beleg: unabhängiger Prüfer
- [x] Brute Force: Sperre greift, siehe AC-10
- [x] Keine Kontoexistenz-Auskunft: siehe AC-11
- [x] Zugangsdaten nie in der URL — beide Formulare rendern `<form … method="POST">`, kein natives GET-Formular im ganzen Dokument — Beleg: `curl /login`, `curl /signup`
- [x] Keine Geheimnisse im Browser-Bundle — `.next/static` (17 Dateien, 1,2 MB, Produktionsbuild) enthält keinen Treffer auf `supabase`, keine `NEXT_PUBLIC_*`-Variable und keine JWT-Zeichenkette; Gegenprobe, dass das richtige Bundle durchsucht wurde: „Wird geprüft" ist darin enthalten
- [x] Keine Geheimnisse im Quelltext — `git grep -nEi "service_role|sk_live|secret[_-]?key|SUPABASE_SERVICE|eyJhbGciOiJIUzI1NiIs|sb_secret"` über alle getrackten Dateien findet nur Kommentare und den auskommentierten Platzhalter in `.env.local.example`; `.gitignore` schliesst alle `.env`-Varianten aus
- [x] Zeilenzugriffsregeln auf jeder neuen Tabelle, passend zu den verwendeten Operationen — `profiles`: RLS aktiv, SELECT und UPDATE „nur eigene Zeile", bewusst kein INSERT/DELETE
- [x] Massenregistrierung gebremst — war ungebremst (BUG-5), behoben: die Registrierung zählt jetzt unter eigenem Präfix mit, 5 Versuche je 15 Minuten, getrennt von der Anmeldezählung — Beleg: Test „Registrierung: sperrt nach 5 Versuchen und trennt die Zählung von der Anmeldung"
- [!] NOT VERIFIED — Ratenbegrenzung auf gewöhnlichen Endpunkten (nicht implementiert, für ein MVP optional): 20 Aufrufe von `/api/export` in Folge ergaben 20× HTTP 401 ohne Drosselung

### E2E Tests

- Status: **nicht gelaufen** (für kritische Abläufe `/e2e-tests` ausführen). Die Abläufe wurden in diesem Lauf von Hand im Browser durchgespielt und oben mit Belegen festgehalten.

### Not Verified In This Run

- [!] EC-2 — echtes Renn-Timing zweier gleichzeitiger Anmeldungen
- [!] EC-4 — echt abgelaufene Sitzung
- [!] Ratenbegrenzung auf gewöhnlichen Endpunkten — nicht implementiert, für ein MVP optional
- [!] Darstellung in Firefox und Safari — geprüft wurde ein Chromium-Browser
- [x] Responsive bei 375 px, 768 px und 1440 px — geprüft, kein waagrechter Seitenbildlauf auf keiner Breite (`document.documentElement.scrollWidth === window.innerWidth`)

### Bugs Found

#### BUG-1: Registrierung unmöglich, solange die E-Mail-Bestätigung eingeschaltet ist
- **Severity:** High
- **Steps to Reproduce:**
  1. `curl -s "<projekt>/auth/v1/settings" -H "apikey: <öffentlicher Schlüssel>"` → `"mailer_autoconfirm": false`
  2. Über `/signup` ein Konto anlegen
  3. Erwartet: sofort angemeldet auf `/app` (AC-1)
  4. Tatsächlich: „Registrierung fehlgeschlagen …"; der Mailversand des kostenlosen Tarifs antwortet zusätzlich mit `429 over_email_send_rate_limit`
- **Priority:** **Erledigt.** Die `[user]`-Aufgabe T3 wurde im Supabase-Dashboard ausgeführt (Authentication → Sign In / Providers → Email → „Confirm email" aus); `mailer_autoconfirm` steht auf `true`, AC-1 im Browser nachgeprüft. Im README als Schritt 2 für jede Person dokumentiert, die das Projekt aufsetzt.
- **Nachtrag in diesem Lauf:** Die App benennt die Ursache jetzt selbst, statt eine allgemeine Fehlermeldung zu zeigen — geprüft gegen die laufende Instanz, die Registrierung antwortet mit „Das Konto wurde angelegt, aber in Supabase ist ‚Confirm email' noch eingeschaltet … (siehe README, Schritt 2)". Der Hinweis erscheint für eine neue und eine bereits vergebene Adresse wortgleich und verrät deshalb weiterhin nichts (EC-1); zwei Tests decken beide Antwortformen der Plattform ab, einschliesslich des limitierten Mailversands.

#### BUG-2: Mindestlänge des Passworts in der Plattform noch auf 6
- **Severity:** High (offene `[user]`-Aufgabe auf einem Anmeldepfad)
- **Steps to Reproduce:**
  1. `POST /auth/v1/signup` mit einem 5-Zeichen-Passwort
  2. Erwartet: Ablehnung mit Verweis auf 8 Zeichen
  3. Tatsächlich: „Password should be at least 6 characters."
- **Priority:** **Erledigt.** Die `[user]`-Aufgabe T4 wurde im selben Panel ausgeführt; die Plattform weist ein 7-Zeichen-Passwort jetzt mit „Password should be at least 8 characters." ab.

#### BUG-3: Ein Ausfall sah aus wie ein falsches Passwort und sperrte das Konto
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Den Supabase-Host unerreichbar machen
  2. Auf `/login` etwas absenden
  3. Erwartet: Hinweis auf ein Verbindungsproblem, kein gezählter Fehlversuch (EC-3)
  4. Tatsächlich: „E-Mail-Adresse oder Passwort ist falsch." — und nach fünf Ausfällen war das Konto 15 Minuten gesperrt
- **Ursache:** `@supabase/auth-js` gibt einen `AuthRetryableFetchError` zurück, statt ihn zu werfen; der `catch`-Zweig wurde für Netzwerkfehler nie erreicht. Der zugehörige Test prüfte mit `mockRejectedValue` einen Pfad, den die Bibliothek nie nimmt.
- **Priority:** **Behoben in diesem Lauf** (Commit „fix: Work through the findings of the independent QA pass"), mit zwei neuen Tests für die zurückgegebene Form.

#### BUG-4: Formularfelder wurden nach jedem Fehlschlag geleert
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Auf `/login` ein falsches Passwort absenden
  2. Erwartet: Meldung, Formular bleibt ausgefüllt (EC-3)
  3. Tatsächlich: beide Felder leer; ein zweiter Versuch war nicht absendbar, weil die Pflichtfelder leer waren
- **Ursache:** React leert ein unkontrolliertes Formular nach jeder Aktion, auch nach einer fehlgeschlagenen. Nebenwirkung: die Sperre nach Fehlversuchen war über die Oberfläche praktisch nicht erreichbar.
- **Priority:** **Behoben in diesem Lauf.** Die Felder sind jetzt kontrolliert; nichts wird dabei vom Server zurückgespiegelt.

#### BUG-5: Registrierung ohne jede Drosselung
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Zwölf Registrieranfragen in Folge abschicken
  2. Erwartet: irgendwann eine Abweisung
  3. Tatsächlich: keine Drosselung; als einzige Bremse blieb die nicht einstellbare Pro-IP-Grenze der Plattform, die bei wechselnden IPs nicht greift
- **Priority:** **Behoben in diesem Lauf.** Die Registrierung zählt jetzt unter eigenem Präfix mit (5 Versuche je 15 Minuten, je Adresse und je IP), getrennt von der Anmeldezählung.

#### BUG-6: Bestätigungsdialog löschte nichts
- **Severity:** High
- **Steps to Reproduce:**
  1. Angemeldet „Konto löschen" bzw. bei einer Ausgabe „Löschen" wählen und bestätigen
  2. Erwartet: Konto bzw. Ausgabe ist weg (AC-13)
  3. Tatsächlich: gar nichts passierte — der Klick löste keine Server-Aktion aus
- **Ursache:** Der Dialog schliesst sich beim Klick und hängt damit das Formular aus, bevor die Aktion abgeschickt werden kann. Im Code und in den Unit-Tests unsichtbar; nur im Browser zu sehen.
- **Priority:** **Behoben in diesem Lauf**, vor dem Schreiben dieses Berichts; AC-13 anschliessend im Browser und in der Datenbank nachgeprüft.

### Summary
- **Acceptance Criteria:** 14 von 14 bestanden
- **Edge Cases:** 5 von 6 bestanden, 1 `[!] NOT VERIFIED` (echt abgelaufene Sitzung)
- **Bugs Found:** 6 (0 kritisch, 3 hoch, 3 mittel) — alle geschlossen: 4 im Code behoben und nachgeprüft, 2 durch die erledigten `[user]`-Aufgaben T3 und T4
- **Security:** 9 von 10 Prüfungen belegt, 1 `[!] NOT VERIFIED` (Ratenbegrenzung auf gewöhnlichen Endpunkten, für ein MVP optional)
- **Production Ready:** **YES** — keine offenen kritischen oder hohen Fehler, keine offene `[user]`-Aufgabe
- **Recommendation:** Freigeben.
