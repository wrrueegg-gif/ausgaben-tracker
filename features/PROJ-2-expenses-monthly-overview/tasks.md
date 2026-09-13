# PROJ-2 Aufgaben

> Erzeugt von `/tasks` aus `spec.md` + `design.md`. Dies ist der geordnete, nachverfolgbare Bauplan — die Brücke zwischen dem Vertrag (WAS) und dem Bau (WIE).
> `[P]` = parallelisierbar: Die Dateien der Aufgabe sind von jeder anderen `[P]`-Aufgabe derselben Stufe disjunkt.
> Stufen laufen **nacheinander** (jede ist eine Barriere). Jede Aufgabe verweist auf die AC-IDs aus `spec.md`, die sie erfüllt — das ist die Kette AC → Aufgabe → Test.
> Eigentümer: `/tasks` erstellt diese Datei; `/build` hakt die Kästchen ab.

## Stufe 1 — Daten / Schema

- [x] T1  Migration: Tabelle `expenses` (id, user_id, amount_chf als Festkommazahl mit 2 Nachkommastellen und grösser 0, category aus sechs festen Werten, spent_on ohne Uhrzeit und nicht in der Zukunft, note bis 200 Zeichen, created_at), Index auf (user_id, spent_on absteigend)  · files: supabase/migrations/0003_expenses.sql  · → AC-3, AC-4, AC-6, EC-4, EC-5
- [x] T2  Migration im selben File: Row Level Security mit Regeln „nur eigene Zeilen lesen", „nur für sich selbst anlegen" (inklusive Prüfung der eingetragenen Kennung beim Einfügen) und „nur eigene löschen"; kein Ändern für niemanden  · files: supabase/migrations/0003_expenses.sql  · → AC-11, AC-12, EC-3

## Stufe 2 — Server-Logik

- [x] T3 [P]  Kategorienliste und Eingabeprüfung für eine Ausgabe (Betrag grösser 0 auf zwei Nachkommastellen gerundet, Kategorie aus der Liste, Datum nicht in der Zukunft, Notiz bis 200 Zeichen)  · files: src/lib/validation/expense.ts  · → AC-3, AC-4, EC-4, EC-5
- [x] T4 [P]  Monatslogik: Monat aus dem Adressparameter lesen, unlesbare oder zukünftige Werte auf den laufenden Monat zurücksetzen, Grenzen des Monats berechnen, Vor- und Folgemonat bestimmen, Monatsnamen auf Deutsch formatieren  · files: src/lib/month.ts  · → AC-7, AC-8
- [x] T5 [P]  Summenbildung: Gesamtsumme und Summe je Kategorie aus einer Liste von Ausgaben, absteigend nach Betrag, Kategorien ohne Ausgaben entfallen, exakte Rappenrechnung  · files: src/lib/expense-summary.ts  · → AC-6, AC-10
- [x] T6  Serverseitige Aktionen `createExpense` (prüft, speichert für die angemeldete Person, lädt den Seitenausschnitt neu) und `deleteExpense` (löscht idempotent nur die eigene Zeile); ohne Anmeldung beide abgewiesen  · files: src/app/app/actions.ts  · → AC-1, AC-9, AC-12, EC-2, EC-3, EC-6

## Stufe 3 — Oberfläche

- [x] T7 [P]  Erfassungsformular mit Betrag, Kategorie, mit heute vorbelegtem Datum, Notiz, Feldfehlern und während des Speicherns gesperrtem Knopf  · files: src/components/expense-form.tsx  · → AC-1, AC-2, AC-3, AC-4, EC-1, EC-2
- [x] T8 [P]  Monatszusammenfassung: Gesamtsumme und Summe je Kategorie mit Anteil, Leerzustand mit 0.00 CHF  · files: src/components/month-summary.tsx  · → AC-6, AC-10
- [x] T9 [P]  Ausgabenliste mit Datum, Kategorie, Notiz, Betrag und Löschen samt Bestätigungsdialog; Leerzustand mit Hinweis  · files: src/components/expense-list.tsx  · → AC-5, AC-9, AC-10
- [x] T10 [P]  Monatswechsler mit Monatsnamen und gesperrtem Vorwärtsknopf im laufenden Monat  · files: src/components/month-switcher.tsx  · → AC-7, AC-8
- [x] T11  Übersichtsseite: liest den Monat aus der Adresszeile, holt die Ausgaben dieses Monats für die angemeldete Person, setzt Seitenkopf, Formular, Zusammenfassung und Liste zusammen und behält den Bereich „Konto & Daten" aus PROJ-1  · files: src/app/app/page.tsx  · → AC-1, AC-5, AC-6, AC-7, AC-10, AC-12, EC-2

## Stufe 4 — Feinschliff

- [x] T12 [P]  Ladezustand der Übersicht als Skelettflächen für Zusammenfassung und Liste  · files: src/app/app/loading.tsx  · → AC-5, AC-6
- [x] T13 [P]  Tests der Monatslogik (Parameter lesen, ungültige und zukünftige Werte, Monatsgrenzen, Jahreswechsel)  · files: src/lib/month.test.ts  · → AC-7, AC-8
- [x] T14 [P]  Tests der Summenbildung (Gesamtsumme auf den Rappen, Sortierung nach Höhe, leere Kategorien entfallen, leerer Monat ergibt 0.00)  · files: src/lib/expense-summary.test.ts  · → AC-6, AC-10
- [x] T15 [P]  Tests der Eingabeprüfung (Betrag null, negativ, keine Zahl, Rundung auf zwei Nachkommastellen, unbekannte Kategorie, Datum in der Zukunft, Notiz über 200 Zeichen)  · files: src/lib/validation/expense.test.ts  · → AC-3, AC-4, EC-4, EC-5
- [x] T16 [P]  Tests der Aktionen (Anlegen für die angemeldete Person, Abweisung ohne Anmeldung, Löschen nur der eigenen Zeile, Löschen bleibt bei bereits gelöschter Zeile fehlerfrei, Fehler der Datenbank wird gemeldet)  · files: src/app/app/actions.test.ts  · → AC-1, AC-9, AC-12, EC-2, EC-3, EC-6

## Parallelisierung

- **Stufen sind Barrieren.** Schema (S1) → Serverlogik (S2) → Oberfläche (S3) → Feinschliff (S4).
- **`[P]` verlangt disjunkte Dateien.** T1 und T2 schreiben dieselbe Migrationsdatei und laufen deshalb nacheinander. T6 hängt von T3, T4 und T5 ab und läuft nach ihnen. T11 setzt die Komponenten aus T7 bis T10 zusammen und ist deshalb die letzte Aufgabe der Stufe 3.
- **Keine `[user]`-Aufgaben:** Dieses Feature braucht keine Einstellung im Dashboard.
- **Abdeckung:** AC-1 → T6, T7, T11, T16 · AC-2 → T7 · AC-3 → T1, T3, T7, T15 · AC-4 → T1, T3, T7, T15 · AC-5 → T9, T11, T12 · AC-6 → T1, T5, T8, T11, T12, T14 · AC-7 → T4, T10, T11, T13 · AC-8 → T4, T10, T13 · AC-9 → T6, T9, T16 · AC-10 → T5, T8, T9, T11, T14 · AC-11 → T2 · AC-12 → T2, T6, T11, T16 · EC-1 → T7 · EC-2 → T6, T7, T11 · EC-3 → T2, T6, T16 · EC-4 → T1, T3, T15 · EC-5 → T1, T3, T15 · EC-6 → T6, T16. Jede AC ist durch mindestens eine Aufgabe abgedeckt.
