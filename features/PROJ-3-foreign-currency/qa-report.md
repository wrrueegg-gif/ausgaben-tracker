# QA Test Results

**Tested:** 2026-09-13
**App URL:** http://localhost:3012 (Entwicklungsserver gegen die gehostete Supabase-Instanz)
**Tester:** QA Engineer (AI) — Acceptance und Security durch einen unabhängigen Prüfer, der diesen Build nicht kannte; Laufzeitprüfungen mit angemeldeter Sitzung durch den Eigentümer dieses Laufs

> Legende: `[x]` in diesem Lauf geprüft (mit Beleg) · `[ ] BUG` als defekt bestätigt · `[!] NOT VERIFIED` in diesem Lauf nicht prüfbar (mit Begründung)

### Acceptance Criteria Status

#### AC-1: Währungsauswahl mit CHF als Vorgabe
- [x] Im Browser geprüft: Die Auswahlliste neben dem Betrag zeigte genau CHF (ausgewählt), EUR, USD, GBP — Beleg: Zugänglichkeitsbaum des Formulars (`combobox "CHF"` mit vier Optionen, CHF selected)
- [x] Serverseitig auf dieselben vier begrenzt — Test „AC-1 (PROJ-3): nimmt alle vier vorgesehenen Währungen an"

#### AC-2: CHF wird nicht umgerechnet und fragt keinen Kurs ab
- [x] Kein Aufruf nach aussen bei CHF — Beleg: unabhängiger Prüfer; Test in `src/lib/exchange-rate.test.ts` prüft, dass `fetch` nicht aufgerufen wird, Test in `src/app/app/actions.test.ts` prüft `exchange_rate === 1`
- [x] Die Datenbank erlaubt für CHF nichts anderes: `CHECK ((currency <> 'CHF'::text) OR (exchange_rate = 1))` — Beleg: gegen die laufende Instanz ein Einfügeversuch mit CHF und Kurs 0.9 → `23514 expenses_chf_rate_is_one_check`

#### AC-3: Fremdwährung wird mit dem Kurs des Ausgabedatums umgerechnet
- [x] Im Browser geprüft: 12.00 EUR am 13.09.2026 → CHF 11.34 in Liste und Summen — Beleg: Seitentext nach dem Speichern
- [x] Mit einer zweiten Währung nachgeprüft: 5.50 GBP → CHF 6.06 (5.50 × 1.1013 = 6.05715) — Beleg: Seitentext, Monatssumme stieg passend auf CHF 42.40
- [x] Der Kurs stammt wirklich von der EZB-Quelle: `curl "https://api.frankfurter.dev/v1/2026-09-11?base=EUR&symbols=CHF"` → `{"date":"2026-09-11","rates":{"CHF":0.9451}}` — derselbe Wert, den die App gespeichert hat
- [x] Aufgerufen wird `/<datum>?base=<währung>&symbols=CHF` — `src/lib/exchange-rate.ts`; Test „AC-3, AC-5: rechnet mit dem Kurs des Ausgabedatums und schreibt ihn fest"

#### AC-4: Liste zeigt Originalbetrag, Kurs und Kursdatum
- [x] Im Browser geprüft: die Zeile las „CHF 11.34" und darunter „EUR 12.00 · Kurs 0.9451 vom 11.09.2026"; bei der GBP-Ausgabe „£ 5.50 · Kurs 1.1013 vom 11.09.2026" — Beleg: Seitentext der Liste
- [x] Bei CHF entfällt die Zusatzzeile — Beleg: dieselbe Liste, die CHF-Zeile trägt nur den Betrag
- Anmerkung ohne Fehlerstatus: Die Landesformatierung schreibt EUR aus, USD und GBP als Zeichen (`$`, `£`). Lesbar und korrekt lokalisiert, aber uneinheitlich; nicht spezifiziert und deshalb nicht geändert.

#### AC-5: Gespeicherter Kurs ändert sich nicht mehr
- [x] Es gibt im gesamten Quelltext kein `update` oder `upsert` auf `expenses` — Beleg: unabhängiger Prüfer, Suchlauf ohne Treffer
- [x] Die Datenbank hat bewusst keine UPDATE-Regel, eine gespeicherte Zeile ist für Nutzer also gar nicht änderbar — Beleg: `supabase/migrations/0003_expenses.sql`
- [x] Der Kurs wird einmal beim Anlegen festgeschrieben — Test „AC-3, AC-5: …"

#### AC-6: Summen rechnen mit den gespeicherten Franken-Beträgen
- [x] Im Browser mit drei Währungen geprüft: CHF 25.00 + EUR-Ausgabe (11.34) + GBP-Ausgabe (6.06) = CHF 42.40, Kategorien 59 % / 27 % / 14 % — Beleg: Seitentext der Zusammenfassung
- [x] Die Summenbildung liest ausschliesslich `amount_chf`; `amount_original` und `exchange_rate` kommen darin nicht vor — Beleg: unabhängiger Prüfer, `src/lib/expense-summary.ts`

#### AC-7: Kursfeld zeigt die aktuellen Kurse mit Datum und Quelle
- [x] Im Browser geprüft: „1 EUR = 0.9451 CHF · 1 USD = 0.8153 CHF · 1 GBP = 1.1013 CHF" und darunter „Kurse vom 11.09.2026 · Referenzkurse der Europäischen Zentralbank (frankfurter.dev)" — Beleg: Seitentext und Bildschirmaufnahme
- [x] Die Werte stimmen mit der Quelle überein: `curl "https://api.frankfurter.dev/v1/latest?base=CHF&symbols=EUR,USD,GBP"` liefert die Kehrwerte, die das Feld anzeigt — Beleg: eigener Aufruf
- [x] Test „AC-7: rechnet die Antwort in ‚1 Fremdwährung = x CHF' um"

#### AC-8: Export enthält Originalbetrag, Währung, Kurs und Kursdatum
- [x] Im Browser als angemeldete Person abgerufen: die JSON-Datei enthielt für die EUR-Ausgabe `amount_chf: 11.34`, `amount_original: 12`, `currency: "EUR"`, `exchange_rate: 0.9451`, `rate_date: "2026-09-11"` — Beleg: vollständige Antwort von `/api/export`
- [x] Der Test prüft jetzt zusätzlich, dass alle Spalten abgefragt werden, damit eine später ergänzte Spalte nicht stillschweigend aus dem Export fällt — Beleg: `src/app/api/export/route.test.ts`

#### AC-9: Kursquelle nicht erreichbar — nichts wird gespeichert
- [x] Bei fehlendem Kurs bricht das Speichern vor jedem Einfügevorgang ab und meldet, dass der Kurs nicht abrufbar ist und der Betrag in CHF erfasst werden kann — Beleg: Test „AC-9: speichert nichts, wenn die Kursquelle nicht erreichbar ist"
- [x] Auch eine Fehlerantwort oder eine unsinnige Antwort führt zu keinem Kurs — Beleg: Test „AC-9: glaubt einer unsinnigen Antwort nicht" mit sechs Varianten (leere Kursliste, 0, −1, kaputtes Datum, fehlendes Datum, kein Objekt)
- [x] Die Eingaben bleiben dabei im Formular stehen — Beleg: im Browser nach einem abgewiesenen Speichervorgang bestätigt

#### AC-10: Unzulässige Währung wird abgewiesen
- [x] `JPY` wird abgewiesen, ohne dass die Kursquelle überhaupt gefragt wird — Beleg: Test „AC-10: lehnt eine Währung ausserhalb der Auswahl ab, ohne zu fragen"
- [x] Zweite Ebene in der Datenbank: `CHECK (currency = ANY (ARRAY['CHF','EUR','USD','GBP']))` — Beleg: `pg_get_constraintdef` gegen die laufende Instanz

### Edge Cases Status

#### EC-1: Wochenende oder Feiertag
- [x] Gegen die echte Quelle geprüft: Sonntag `2026-09-13` angefragt, Antwort `"date":"2026-09-11"` — die Quelle liefert den letzten Börsentag und sagt es
- [x] Die App übernimmt dieses Datum statt das Ausgabedatum zu wiederholen — Beleg: die im Browser erfasste Ausgabe vom 13.09. zeigt „Kurs 0.9451 vom 11.09.2026"; Tests in `src/lib/exchange-rate.test.ts` und `src/app/app/actions.test.ts`

#### EC-2: Kursquelle antwortet sehr langsam
- [x] Zeitlimit von 5 Sekunden auf beiden Aufrufen — Beleg: `AbortSignal.timeout` in `src/lib/exchange-rate.ts`; Tests „EC-2: gibt bei Zeitüberschreitung keinen Kurs zurück" und „EC-2: setzt ein Zeitlimit auf die Anfrage"
- [x] Eine Zeitüberschreitung endet in derselben Meldung wie AC-9 — Beleg: der `catch` macht aus Zeitüberschreitung, DNS-Fehler und Offline dasselbe Ergebnis

#### EC-3: Kursfeld nicht ladbar
- [x] Das Kursfeld gibt bei einem Ausfall nichts zurück, statt zu werfen — Beleg: Tests „EC-3: gibt bei einem Ausfall nichts zurück, statt zu werfen" und „EC-3: gibt auch bei einer leeren Kursliste nichts zurück"
- [x] Es hängt in einer eigenen Suspense-Grenze, Liste, Formular und Summen stehen ausserhalb — Beleg: `src/app/app/page.tsx`
- [!] NOT VERIFIED — der gerenderte Hinweistext im Ausfall wurde nicht ausgelöst; die Quelle war während des ganzen Laufs erreichbar

#### EC-4: Sehr kleiner Betrag ergäbe 0.00 CHF
- [x] Wird mit einer Feldmeldung abgewiesen, bevor irgendetwas gespeichert wird — Beleg: Test „EC-4: lehnt einen Betrag ab, der umgerechnet 0.00 CHF ergäbe" (0.01 × 0.0001)
- [x] Zweite Schranke in der Datenbank: `CHECK (amount_chf > 0)`
- Beobachtet im Browser: 0.01 USD ergibt 0.01 CHF und wird zu Recht gespeichert — die Grenze greift erst, wenn wirklich auf 0.00 gerundet würde

#### EC-5: Dieselbe Ausgabe zweimal abgeschickt
- [x] BEHOBEN in diesem Lauf. Der unabhängige Prüfer stellte fest, dass gegen die zweite Zeile ausschliesslich die Knopfsperre im Browser wirkte: ein wiederholter POST, eine Browser-Wiederholung oder ein Client ohne JavaScript hätte zwei Zeilen erzeugt und den Monat verdoppelt. Siehe BUG-1
- [x] Nach der Korrektur trägt jedes Formularexemplar eine Absendekennung mit eindeutigem Index dahinter — gegen die laufende Datenbank geprüft: erster Einfügevorgang ok, **zweiter mit derselben Kennung abgelehnt** (`unique_violation`), eine bewusst zweite gleichartige Ausgabe mit neuer Kennung wieder erlaubt
- [x] Der Kurs wurde schon vorher nur einmal je Speichervorgang geholt, doppelt umgerechnet wurde nie etwas — Beleg: `src/app/app/actions.ts`
- [x] Test „EC-5: dieselbe Formularkennung ein zweites Mal erzeugt keine zweite Ausgabe"

#### EC-6: Ausfall der Kursquelle legt CHF-Erfassung nicht lahm
- [x] Bei CHF verlässt nichts den Server, der Ausfall kann die CHF-Erfassung also gar nicht erreichen — Beleg: Test prüft, dass `fetch` bei CHF nicht aufgerufen wird
- [x] Das Kursfeld ist über Suspense entkoppelt — Beleg: `src/app/app/page.tsx`

### Security Audit Results

- [x] Kursquelle wird ausschliesslich serverseitig aufgerufen — „frankfurter" kommt im Produktions-Client-Bundle (`.next/static`, 16 Dateien, 1,2 MB) an keiner Stelle vor, nur in den Server-Chunks; Gegenprobe, dass das richtige Bundle durchsucht wurde: „Ausgabe speichern" und „Wird mit dem EZB-Kurs" sind darin enthalten — Beleg: unabhängiger Prüfer
- [x] Keine personenbezogenen Daten an die Kursquelle — übertragen werden nur Währungskürzel und Datum, kein Betrag, keine Kennung, keine E-Mail; da der Server fragt, sieht der Dienst nicht die IP der Person
- [x] Kein Schlüssel, kein Konto, keine Kosten — kein `process.env`, kein `apiKey`, kein `Authorization`-Header in der Anbindung; `curl` gegen die Quelle ohne jede Authentifizierung antwortet 200
- [x] Keine Einschleusung in die ausgehende Adresse — die beiden eingesetzten Werte sind vorher auf eine feste Aufzählung und auf das Datumsformat begrenzt; eine fremde Währung erreicht den Aufruf gar nicht
- [x] Fremde Antwort wird geprüft, bevor ihr geglaubt wird — Schema-Prüfung plus Zahlenprüfung; sechs unsinnige Antworten ergeben alle „kein Kurs"
- [x] Authentifizierung: `curl -i /app` → 307 auf `/login`, `curl /api/export` → 401
- [x] Autorisierung: mit zwei echten Sitzungen geprüft (siehe PROJ-2, AC-11 und EC-3)
- [x] Keine Geheimnisse im Browser-Bundle — kein Treffer auf `service_role`, kein JWT-Muster, keine `NEXT_PUBLIC_*`-Variable in `.next/static`
- [x] Zugangsdaten nie in der URL — dieses Feature hat keinen Anmeldepfad; das Erfassungsformular läuft über eine Server Action (POST)
- [!] NOT VERIFIED — Ratenbegrenzung auf das Erfassen (nicht implementiert, für ein MVP optional). Eine angemeldete Person kann je Fremdwährungs-Erfassung eine Anfrage an den kostenlosen Dienst auslösen; als offene Frage in der Spec bereits vermerkt

### E2E Tests

- Status: **nicht gelaufen** (für kritische Abläufe `/e2e-tests` ausführen). Der Ablauf wurde in diesem Lauf von Hand im Browser mit zwei Fremdwährungen durchgespielt.

### Not Verified In This Run

- [!] EC-3 — der gerenderte Hinweis bei nicht erreichbarer Kursquelle; die Quelle war durchgehend erreichbar
- [!] Ratenbegrenzung auf das Erfassen — nicht implementiert, für ein MVP optional
- [!] Darstellung in Firefox und Safari — geprüft wurde ein Chromium-Browser
- [x] Responsive bei 375 px, 768 px und 1440 px — geprüft, kein waagrechter Seitenbildlauf auf keiner Breite

### Bugs Found

#### BUG-1: Gegen eine doppelt abgeschickte Ausgabe wirkte nur der Browser
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Dasselbe Formular zweimal abschicken, ohne auf die Knopfsperre angewiesen zu sein — etwa mit deaktiviertem JavaScript, über die Wiederholung des POST im Browser oder mit zwei gleichzeitigen Anfragen
  2. Erwartet: höchstens eine Ausgabe (EC-5)
  3. Tatsächlich: zwei Zeilen in `expenses`, die Monatssumme zählte doppelt
- **Ursache:** Die einzige Garantie war die clientseitige Knopfsperre. Serverseitig gab es weder eine Eindeutigkeitsregel noch einen Idempotenzschlüssel.
- **Priority:** **Behoben in diesem Lauf** (Migration `0005_expense_submission_id.sql`). Jedes Formularexemplar trägt eine Absendekennung; ein eindeutiger Index über Person und Kennung lässt eine Absendung genau einmal durch, während zwei wirklich verschiedene, gleichartige Ausgaben weiterhin erlaubt bleiben — beides gegen die laufende Datenbank nachgeprüft.

### Summary
- **Acceptance Criteria:** 10 von 10 bestanden
- **Edge Cases:** 6 von 6 bestanden, 1 davon mit einem `[!] NOT VERIFIED`-Teilaspekt (gerenderter Hinweis bei Ausfall)
- **Bugs Found:** 1 (0 kritisch, 0 hoch, 1 mittel) — behoben und nachgeprüft
- **Security:** 9 von 10 Prüfungen belegt, 1 `[!] NOT VERIFIED` (Ratenbegrenzung auf das Erfassen, für ein MVP optional)
- **Production Ready:** **YES** — keine offenen kritischen oder hohen Fehler
- **Recommendation:** Freigeben. Die externe Integration arbeitet nachweislich gegen die echte Quelle, ohne Schlüssel, ohne Konto und ohne personenbezogene Daten.
