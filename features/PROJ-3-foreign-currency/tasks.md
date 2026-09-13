# PROJ-3 Aufgaben

> Erzeugt von `/tasks` aus `spec.md` + `design.md`. Dies ist der geordnete, nachverfolgbare Bauplan — die Brücke zwischen dem Vertrag (WAS) und dem Bau (WIE).
> `[P]` = parallelisierbar: Die Dateien der Aufgabe sind von jeder anderen `[P]`-Aufgabe derselben Stufe disjunkt.
> Stufen laufen **nacheinander** (jede ist eine Barriere). Jede Aufgabe verweist auf die AC-IDs aus `spec.md`, die sie erfüllt — das ist die Kette AC → Aufgabe → Test.
> Eigentümer: `/tasks` erstellt diese Datei; `/build` hakt die Kästchen ab.

## Stufe 1 — Daten / Schema

- [ ] T1  Migration: Tabelle `expenses` um `currency` (vier feste Werte, Vorgabe CHF), `amount_original` (grösser 0), `exchange_rate` (grösser 0, acht Nachkommastellen, Vorgabe 1) und `rate_date` erweitern; Vorgabewerte so setzen, dass ein bestehender Bestand widerspruchsfrei bleibt; Prüfregel „bei CHF ist der Kurs genau 1"  · files: supabase/migrations/0004_expenses_currency.sql  · → AC-2, AC-3, AC-5, AC-10, EC-4

## Stufe 2 — Server-Logik

- [ ] T2  Anbindung der Kursquelle: Kurs für ein Datum und eine Währung holen sowie die aktuellen Kurse für das Kursfeld; Zeitlimit von 5 Sekunden, Prüfung der Antwort vor Verwendung, Kursdatum aus der Antwort übernehmen, Wiederverwendung der Kursfeld-Antwort für eine Stunde  · files: src/lib/exchange-rate.ts  · → AC-3, AC-7, AC-9, EC-1, EC-2
- [ ] T3  Eingabeprüfung um die Währung erweitern (nur CHF, EUR, USD, GBP) und den Originalbetrag vom Franken-Betrag trennen  · files: src/lib/validation/expense.ts  · → AC-1, AC-10
- [ ] T4  Speichern erweitern: bei CHF Kurs 1 und kein Aufruf nach aussen, bei Fremdwährung Kurs zum Ausgabedatum holen, umrechnen, auf zwei Nachkommastellen runden, bei 0.00 ablehnen, bei nicht erreichbarer Quelle nichts speichern und melden  · files: src/app/app/actions.ts  · → AC-2, AC-3, AC-9, EC-2, EC-4, EC-5
- [ ] T5 [P]  Export um Originalbetrag, Währung, Kurs und Kursdatum ergänzen  · files: src/app/api/export/route.ts  · → AC-8

## Stufe 3 — Oberfläche

- [ ] T6 [P]  Kursfeld: zeigt EUR, USD und GBP in Franken mit Kursdatum und Quellenangabe; fängt einen Fehlschlag selbst ab  · files: src/components/rate-panel.tsx  · → AC-7, EC-3
- [ ] T7 [P]  Erfassungsformular um die Währungsauswahl und den Hinweis auf die Umrechnung erweitern  · files: src/components/expense-form.tsx  · → AC-1, AC-9, AC-10, EC-5
- [ ] T8 [P]  Ausgabenliste zeigt bei Fremdwährung zusätzlich Originalbetrag, Kurs und Kursdatum  · files: src/components/expense-list.tsx  · → AC-4
- [ ] T9 [P]  Zeilentyp und Summenbildung um die neuen Felder erweitern, ohne die Rechnung zu ändern — gerechnet wird weiterhin mit dem Franken-Betrag  · files: src/lib/expense-summary.ts  · → AC-6
- [ ] T10  Übersichtsseite: Kursfeld einhängen, nachgereicht und eigenständig abgesichert, und die neuen Felder mitlesen  · files: src/app/app/page.tsx  · → AC-4, AC-6, AC-7, EC-3, EC-6

## Stufe 4 — Feinschliff

- [ ] T11 [P]  Ladezustand um das Kursfeld ergänzen  · files: src/app/app/loading.tsx  · → AC-7
- [ ] T12 [P]  Tests der Kursanbindung (Kurs zu einem Datum, abweichendes Kursdatum am Wochenende, Zeitüberschreitung, Fehlerantwort, unsinnige Antwort, aktuelle Kurse)  · files: src/lib/exchange-rate.test.ts  · → AC-3, AC-7, AC-9, EC-1, EC-2
- [ ] T13 [P]  Tests der erweiterten Eingabeprüfung (vier zulässige Währungen, unzulässige Währung abgelehnt)  · files: src/lib/validation/expense.test.ts  · → AC-1, AC-10
- [ ] T14 [P]  Tests des Speicherns (CHF ohne Aufruf nach aussen, Fremdwährung mit Umrechnung und festgeschriebenem Kurs, Quelle nicht erreichbar, Umrechnung auf 0.00 abgelehnt)  · files: src/app/app/actions.test.ts  · → AC-2, AC-3, AC-5, AC-9, EC-4
- [ ] T15 [P]  Test des Exports mit einer Fremdwährungsausgabe  · files: src/app/api/export/route.test.ts  · → AC-8

## Parallelisierung

- **Stufen sind Barrieren.** Schema (S1) → Serverlogik (S2) → Oberfläche (S3) → Feinschliff (S4).
- **`[P]` verlangt disjunkte Dateien.** In Stufe 2 hängen T3 und T4 an T2 und laufen nacheinander; nur T5 ist unabhängig. In Stufe 3 ist T10 die letzte Aufgabe, weil sie die Komponenten aus T6 bis T9 zusammensetzt.
- **Keine `[user]`-Aufgaben:** Die Kursquelle braucht weder Konto noch Schlüssel noch eine Einstellung.
- **Abdeckung:** AC-1 → T3, T7, T13 · AC-2 → T1, T4, T14 · AC-3 → T1, T2, T4, T12, T14 · AC-4 → T8, T10 · AC-5 → T1, T14 · AC-6 → T9, T10 · AC-7 → T2, T6, T10, T11, T12 · AC-8 → T5, T15 · AC-9 → T2, T4, T7, T12, T14 · AC-10 → T1, T3, T7, T13 · EC-1 → T2, T12 · EC-2 → T2, T4, T12 · EC-3 → T6, T10 · EC-4 → T1, T4, T14 · EC-5 → T4, T7 · EC-6 → T10. Jede AC ist durch mindestens eine Aufgabe abgedeckt.
