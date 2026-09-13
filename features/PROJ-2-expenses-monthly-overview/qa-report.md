# QA Test Results

**Tested:** 2026-09-13
**App URL:** http://localhost:3012 (Entwicklungsserver gegen die gehostete Supabase-Instanz)
**Tester:** QA Engineer (AI) — Acceptance und Security durch einen unabhängigen Prüfer, der diesen Build nicht kannte; Laufzeitprüfungen mit angemeldeter Sitzung durch den Eigentümer dieses Laufs

> Legende: `[x]` in diesem Lauf geprüft (mit Beleg) · `[ ] BUG` als defekt bestätigt · `[!] NOT VERIFIED` in diesem Lauf nicht prüfbar (mit Begründung)

### Acceptance Criteria Status

#### AC-1: Erfasste Ausgabe erscheint sofort in Liste und Summen
- [x] Im Browser geprüft: Betrag 12.00 EUR, Kategorie Freizeit, Notiz „Kaffee in Konstanz" gespeichert → die Zeile stand ohne Neuladen in der Liste, die Monatssumme stieg von CHF 25.00 auf CHF 36.34 — Beleg: Seitentext vor und nach dem Speichern
- [x] Der Mechanismus ist `revalidatePath('/app')` in `src/app/app/actions.ts`; Test „AC-1: speichert die Ausgabe für die angemeldete Person und lädt die Übersicht neu"

#### AC-2: Heutiges Datum ist vorbelegt
- [x] Im Browser geprüft: das Datumsfeld stand beim Öffnen auf `13.09.2026` — Beleg: Bildschirmaufnahme des Formulars; Wert kommt aus `heuteIso()` (Zeitzone Europe/Zurich) in `src/lib/validation/expense.ts`
- [x] Ein Zeitzonenbruch zwischen App und Datenbank wurde gefunden und behoben — siehe BUG-1

#### AC-3: Ungültiger Betrag wird abgewiesen
- [x] Im Browser geprüft: Betrag `-5` → „Bitte gib eine Zahl ein, z. B. 12.50."; Betrag `0` → „Der Betrag muss grösser als 0 sein." — Belege: beide Meldungen im Seitentext, nichts gespeichert
- [x] Die Datenbank prüft dasselbe erneut: `CHECK ((amount_chf > (0)::numeric))` — Beleg: `pg_get_constraintdef` gegen die laufende Instanz
- [x] Tests: `src/lib/validation/expense.test.ts` („AC-3: weist Betrag 0, negative Beträge und Nicht-Zahlen ab") und `src/app/app/actions.test.ts`

#### AC-4: Notiz über 200 Zeichen wird abgewiesen
- [x] Serverseitig mit Nennung der zulässigen Länge — Beleg: Test „AC-4: weist eine Notiz über 200 Zeichen ab"
- [x] Zweite Ebene in der Datenbank: `CHECK (((note IS NULL) OR (char_length(note) <= 200)))` — Beleg: `pg_get_constraintdef` gegen die laufende Instanz

#### AC-5: Liste zeigt den Monat absteigend nach Datum
- [x] Im Browser geprüft: drei Ausgaben erschienen als 13.09., 13.09., 12.09. mit Datum, Kategorie, Notiz und Betrag je Zeile — Beleg: Seitentext der Liste
- [x] Sortierung `spent_on` absteigend, Zweitkriterium `created_at` — `src/app/app/page.tsx`

#### AC-6: Gesamtsumme und Summe je Kategorie
- [x] Im Browser geprüft: CHF 42.40 gesamt, darunter Lebensmittel 59 % CHF 25.00, Freizeit 27 % CHF 11.34, Mobilität 14 % CHF 6.06 — absteigend sortiert, keine leere Kategorie aufgeführt, Summe stimmt auf den Rappen — Beleg: Seitentext der Zusammenfassung
- [x] Gerechnet wird in ganzen Rappen als Ganzzahlen — Beleg: `src/lib/expense-summary.ts`; Test „AC-6: summiert dreissig Ausgaben ohne Abweichung" (30 × 19.99 = 599.70)

#### AC-7: Monatswechsel
- [x] Im Browser geprüft: `/app?monat=2026-08` zeigte „August 2026" mit CHF 0.00, zurück auf September wieder die drei Ausgaben — Beleg: Seitentext beider Monate
- [x] Der angezeigte Monat ist immer benannt — Beleg: `src/components/month-switcher.tsx`; Tests in `src/lib/month.test.ts` inklusive Jahreswechsel

#### AC-8: Kein Blättern über den laufenden Monat hinaus
- [x] Im Browser geprüft: `/app?monat=2099-01` fiel auf „September 2026" zurück; der Vorwärtsknopf ist im laufenden Monat gesperrt — Belege: Seitentext und Zugänglichkeitsbaum (`button "Nächster Monat"` ohne Verweisziel)
- [x] Tests „AC-8: setzt einen Monat in der Zukunft auf den laufenden zurück" und „AC-8: bietet im laufenden Monat keinen Folgemonat an"

#### AC-9: Löschen mit Rückfrage
- [x] Im Browser geprüft: „Löschen" öffnete den Dialog; **Abbrechen** liess die Ausgabe stehen; **Löschen** entfernte sie, und die Summe fiel von CHF 36.35 auf CHF 36.34 — Belege: Seitentext nach jedem Schritt
- [x] Zunächst war der Dialog wirkungslos — siehe BUG-2, behoben und nachgeprüft
- [x] Test „AC-9, EC-3: löscht nur eine Zeile, die dieser Person gehört"

#### AC-10: Leerer Monat
- [x] Im Browser geprüft: August 2026 zeigte „CHF 0.00", „Noch nichts erfasst in diesem Monat." und „Noch keine Ausgaben in diesem Monat. Erfasse oben deine erste Ausgabe." statt einer leeren Fläche — Beleg: Seitentext

#### AC-11: Jede Person sieht nur ihre eigenen Ausgaben
- [x] Mit zwei echten Sitzungen geprüft: Anna legte eine Ausgabe an, Bruno erhielt auf `GET /rest/v1/expenses?select=*` `[]` — Beleg: zwei Zugangstoken über `/auth/v1/token`, je ein Aufruf
- [x] Auch in der Oberfläche: Bruno sah nach der Anmeldung CHF 0.00 und eine leere Liste, während Anna zwei Ausgaben hatte — Beleg: Seitentext beider Sitzungen
- [x] Durchgesetzt in der Datenbank, nicht nur in der App — `expenses_select_own` mit `auth.uid() = user_id`, RLS aktiv; ohne Anmeldung liefert derselbe Aufruf `[]`
- [x] Die Leseabfrage trägt jetzt zusätzlich den Eigentümerfilter — siehe BUG-4

#### AC-12: Ohne Anmeldung wird nichts gespeichert oder gelöscht
- [x] `curl -i /app` → 307 auf `/login`; `POST /app` → 307 — Beleg: unabhängiger Prüfer
- [x] Mit dem öffentlichen Schlüssel ohne Sitzung: `POST /rest/v1/expenses` → `42501 new row violates row-level security policy` — Beleg: eigener `curl`
- [x] Tests „AC-12: speichert nichts, wenn niemand angemeldet ist" und „AC-12: löscht nichts, wenn niemand angemeldet ist"

### Edge Cases Status

#### EC-1: Doppelklick auf Speichern
- [x] Der Knopf ist während des Speicherns gesperrt und beschriftet („Wird gespeichert …") — Beleg: `src/components/expense-form.tsx` über `useFormStatus`, im Browser beobachtet
- [x] Zusätzlich abgesichert durch die Formularkennung aus PROJ-3 (dort EC-5): dieselbe Absendung erreicht die Tabelle höchstens einmal — Beleg: Probe gegen die laufende Datenbank, zweiter Einfügevorgang mit gleicher Kennung abgelehnt
- [x] Bewusst **keine** Eindeutigkeitsregel über die Werte — zwei gleiche Ausgaben am selben Tag bleiben erlaubt, bestätigt in derselben Probe

#### EC-2: Datenbank nicht erreichbar
- [x] Speicherpfad: Alert über dem Formular, Eingaben bleiben stehen — Beleg: Test „EC-2: meldet einen Fehler der Datenbank, statt Erfolg vorzutäuschen"; das Stehenbleiben wurde nach BUG-3 im Browser bestätigt
- [x] Löschpfad: **war defekt** und stürzte in die Fehlerseite ab — siehe BUG-5. Nach der Korrektur bleibt die Meldung im Dialog stehen — Beleg: Test „EC-2: meldet einen Fehler der Datenbank, statt die Seite abstürzen zu lassen"
- [x] Ladefehler: die Warnung steht jetzt allein, ohne daneben eine leere Liste und CHF 0.00 zu behaupten — Beleg: `src/app/app/page.tsx`
- [x] Der geschützte Bereich hat jetzt eine Fehlergrenze mit „Erneut versuchen" — `src/app/app/error.tsx`

#### EC-3: Fremde Ausgabe löschen
- [x] Mit zwei echten Sitzungen geprüft: Bruno schickte ein `DELETE` auf Annas Ausgaben-Kennung → HTTP 204, aber die Zeile existierte danach unverändert bei Anna — Beleg: `curl -X DELETE …` gefolgt von Annas `GET`, das die Zeile weiterhin zurückgab
- [x] Durchgesetzt durch die Löschregel in der Datenbank plus den Filter `.eq('user_id', user.id)` im Server
- [x] Eine missgebildete Kennung erreicht die Datenbank gar nicht mehr — siehe BUG-6

#### EC-4: Mehr als zwei Nachkommastellen
- [x] Wird auf zwei Nachkommastellen gerundet, und genau dieser Wert wird gespeichert — Beleg: Test „EC-4: rundet auf zwei Nachkommastellen" (12.567 → 12.57); Spalte `numeric(12,2)`
- [x] Einschränkung ohne Spec-Verstoss (Low): halbe Rappen runden wegen Binär-Fliesskomma nach unten (1.005 → 1.00) — vom unabhängigen Prüfer mit Node nachgerechnet und hier festgehalten

#### EC-5: Datum in der Zukunft
- [x] Im Formular durch `max` begrenzt, serverseitig mit „Das Datum darf nicht in der Zukunft liegen." abgewiesen — Beleg: Test „EC-5: weist ein Datum in der Zukunft ab"
- [x] Die Datenbank prüft weiterhin mit, jetzt mit einem Tag Spielraum für die Zeitzone — siehe BUG-1; `CHECK ((spent_on <= (CURRENT_DATE + 1)))`, gegen die laufende Instanz ausgelesen

#### EC-6: Bereits gelöschte Ausgabe
- [x] Das Löschen ist idempotent: getroffen werden null Zeilen, es folgt keine Fehlermeldung — Beleg: Test „EC-6: bleibt fehlerfrei, wenn die Zeile bereits gelöscht war"; bestätigt durch EC-3, wo ein `DELETE` ohne Treffer mit 204 endete

### Security Audit Results

- [x] Authentifizierung: `curl -i /app` → 307 auf `/login`, `POST /app` → 307, `/api/export` → 401
- [x] Autorisierung: mit zwei echten Sitzungen geprüft (AC-11, EC-3); zusätzlich lehnt die Datenbank ein Anlegen unter fremder Kennung ab — `POST /rest/v1/expenses` mit fremder `user_id` → `42501` — Beleg: eigener `curl` mit Annas Token
- [x] Eingabeprüfung: Notiz und Kategorie werden als Textknoten gerendert, kein `dangerouslySetInnerHTML` im Projekt; Kategorie und Währung sind feste Aufzählungen, der Monatsparameter ist regulär geprüft; fünf Varianten von `?monat=` inklusive `' or 1=1--` und `<script>` ergaben 307 statt eines Fehlers — Beleg: unabhängiger Prüfer
- [x] Keine Geheimnisse im Browser-Bundle — `.next/static` und das ausgelieferte HTML enthalten keine JWT-Zeichenkette
- [x] Zugangsdaten nie in der URL — alle Formulare sind Server-Action-Formulare (POST)
- [x] Zeilenzugriffsregeln auf der neuen Tabelle, passend zu den verwendeten Operationen — `expenses`: RLS aktiv, SELECT/INSERT/DELETE je „nur eigene Zeile", INSERT zusätzlich mit `WITH CHECK`, bewusst keine UPDATE-Regel
- [!] NOT VERIFIED — Ratenbegrenzung auf Anlegen und Löschen (nicht implementiert, für ein MVP optional); dieses Feature enthält keinen Anmelde- oder Passwortpfad

### E2E Tests

- Status: **nicht gelaufen** (für kritische Abläufe `/e2e-tests` ausführen). Der vollständige Ablauf wurde in diesem Lauf von Hand im Browser durchgespielt.

### Not Verified In This Run

- [!] Ratenbegrenzung auf Anlegen und Löschen — nicht implementiert, für ein MVP optional
- [!] Darstellung in Firefox und Safari — geprüft wurde ein Chromium-Browser
- [!] Echtes Renn-Timing zweier gleichzeitiger Speichervorgänge — nicht provoziert; die Garantie (Formularkennung mit eindeutigem Index) wurde stattdessen direkt in der Datenbank geprüft
- [x] Responsive bei 375 px, 768 px und 1440 px — geprüft, kein waagrechter Seitenbildlauf auf keiner Breite

### Bugs Found

#### BUG-1: Zeitzonenbruch zwischen App und Datenbank
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Serverzeit auf 00:30 Europe/Zurich stellen
  2. Das Formular mit dem vorbelegten Datum speichern
  3. Erwartet: gespeichert (AC-1, AC-2)
  4. Tatsächlich: Die App hält den Tag nach Schweizer Zeit für heute, die Datenbank prüfte gegen ihr eigenes UTC-`current_date` — zwischen 00:00 und 02:00 war das Datum für sie Zukunft, der Einfügevorgang scheiterte, und die Person sah nur „Die Ausgabe konnte nicht gespeichert werden."
- **Priority:** **Behoben in diesem Lauf** (Migration `0006_spent_on_timezone_slack.sql`). Die Datenbankregel ist wieder das, was sie sein soll — eine Vernunftgrenze mit einem Tag Spielraum; die Produktregel bleibt in der App, wo sie sich erklären kann.

#### BUG-2: Bestätigungsdialog löschte nichts
- **Severity:** High
- **Steps to Reproduce:**
  1. Bei einer Ausgabe „Löschen" wählen und bestätigen
  2. Erwartet: Ausgabe verschwindet aus Liste und Summen (AC-9)
  3. Tatsächlich: nichts geschah; die Zeile stand danach unverändert in Liste **und** Datenbank
- **Ursache:** Der Dialog schliesst sich beim Klick und hängt das Formular aus, bevor die Server-Aktion abgeschickt wird. In den Unit-Tests unsichtbar.
- **Priority:** **Behoben in diesem Lauf**, anschliessend im Browser und in der Datenbank nachgeprüft.

#### BUG-3: Formularfelder wurden nach jedem Fehlschlag geleert
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Einen ungültigen Betrag absenden
  2. Erwartet: Meldung, Eingaben bleiben erhalten (EC-2)
  3. Tatsächlich: alle Felder leer
- **Ursache:** React leert ein unkontrolliertes Formular nach jeder Aktion, auch nach einer fehlgeschlagenen.
- **Priority:** **Behoben in diesem Lauf.** Die Felder sind kontrolliert; nach einem erfolgreichen Speichern leert sich das Formular über einen Neuaufbau.

#### BUG-4: Leseabfrage ohne Eigentümerfilter
- **Severity:** Low
- **Steps to Reproduce:**
  1. Zeilenzugriffsregeln auf `public.expenses` abschalten
  2. Die Übersicht aufrufen
  3. Erwartet: nach dem Design zwei unabhängige Prüfungen
  4. Tatsächlich: die Übersicht zeigte sofort alle Zeilen aller Personen, weil nur die Datenbankregel schützte
- **Priority:** **Behoben in diesem Lauf.** Die Abfrage trägt jetzt `.eq('user_id', user.id)`, wie die Schreib- und Löschpfade auch.

#### BUG-5: Fehlgeschlagenes Löschen stürzte die Seite ab
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Die Datenbank unerreichbar machen
  2. Angemeldet eine Ausgabe löschen
  3. Erwartet: verständliche Meldung (EC-2)
  4. Tatsächlich: die Aktion warf, es gab keine Fehlergrenze, und der ganze Bereich fiel auf die Absturzseite — die Liste war weg
- **Priority:** **Behoben in diesem Lauf.** Das Löschen gibt seinen Fehlschlag zurück, der Dialog zeigt ihn, und `src/app/app/error.tsx` fängt alles Übrige ab.

#### BUG-6: Missgebildete Kennung erreichte die Datenbank
- **Severity:** Low
- **Steps to Reproduce:**
  1. Das Löschformular mit `id=abc` abschicken
  2. Erwartet: stille Ablehnung
  3. Tatsächlich: Datenbankfehler `22P02`, geworfen und mangels Fehlergrenze bis zur Absturzseite durchgereicht
- **Priority:** **Behoben in diesem Lauf.** Die Kennung wird gegen das UUID-Format geprüft, bevor sie die Datenbank erreicht; ein eigener Test deckt vier missgebildete Formen ab.

### Summary
- **Acceptance Criteria:** 12 von 12 bestanden
- **Edge Cases:** 6 von 6 bestanden
- **Bugs Found:** 6 (0 kritisch, 1 hoch, 3 mittel, 2 niedrig) — alle in diesem Lauf behoben und nachgeprüft
- **Security:** 6 von 7 Prüfungen belegt, 1 `[!] NOT VERIFIED` (Ratenbegrenzung auf Anlegen und Löschen, für ein MVP optional)
- **Production Ready:** **YES** — keine offenen kritischen oder hohen Fehler
- **Recommendation:** Freigeben. Die nicht geprüften Punkte sind benannt und keiner davon blockiert.
