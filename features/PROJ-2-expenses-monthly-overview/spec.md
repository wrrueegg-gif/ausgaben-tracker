# PROJ-2: Ausgaben & Monatsübersicht

<!-- This file (spec.md) is the stable CONTRACT — it defines WHAT, not HOW.
     Owner: /write-spec (creates), /refine (updates). During /build this file is READ-ONLY.
     Technical design lives in design.md, QA results in qa-report.md. -->

## Dependencies
- Benötigt: PROJ-1 (Benutzerkonto & Login) — für die angemeldete Person, den geschützten Bereich und das Muster „jede Zeile gehört genau einer Person", das die Datenbank durchsetzt.

## User Stories
- Als Nutzerin möchte ich eine Ausgabe in wenigen Sekunden erfassen, damit ich es unterwegs an der Kasse tatsächlich mache und nicht auf später verschiebe.
- Als Nutzer möchte ich sehen, was ich diesen Monat insgesamt ausgegeben habe, damit ich weiss, wo ich stehe, bevor der Monat vorbei ist.
- Als Nutzerin möchte ich die Summe je Kategorie sehen, damit ich erkenne, wohin das Geld tatsächlich fliesst — und nicht nur, dass es weg ist.
- Als Nutzer möchte ich in frühere Monate zurückblättern, damit ich den laufenden Monat einordnen kann.
- Als Nutzerin möchte ich eine falsch erfasste Ausgabe löschen können, damit meine Auswertung stimmt.

## Out of Scope
- Eine bestehende Ausgabe bearbeiten — wer sich vertippt, löscht und erfasst neu. Erst wenn sich zeigt, dass das im Alltag stört, lohnt sich ein Bearbeitungsformular.
- Eigene Kategorien anlegen, umbenennen oder löschen. Die Liste ist fest.
- Budgets, Limits, Warnungen, Sparziele.
- Wiederkehrende Ausgaben und Vorlagen.
- Auswertung über mehrere Monate hinweg (Jahresübersicht, Diagramme, Vergleich zum Vormonat).
- Belege oder Fotos an eine Ausgabe hängen.
- Fremdwährungen — das ist PROJ-3. In diesem Feature wird ausschliesslich in CHF erfasst.
- CSV-Export. Der vollständige JSON-Export aus PROJ-1 (AC-12) deckt die Datenauskunft bereits ab.

## Acceptance Criteria

- [ ] **AC-1** — Angenommen eine Person ist angemeldet und im geschützten Bereich, wenn sie Betrag, Kategorie und Datum ausfüllt und speichert, dann erscheint die Ausgabe ohne Neuladen in der Liste des zugehörigen Monats und die Summen sind sofort aktualisiert
- [ ] **AC-2** — Angenommen eine Person erfasst eine Ausgabe, wenn sie kein Datum wählt, dann ist das heutige Datum bereits voreingestellt und sie kann direkt speichern
- [ ] **AC-3** — Angenommen eine Person gibt einen Betrag ein, wenn dieser null, negativ, leer oder keine Zahl ist, dann wird nicht gespeichert und unter dem Betragsfeld erscheint eine Meldung, die sagt, was erwartet wird
- [ ] **AC-4** — Angenommen eine Person erfasst eine Ausgabe, wenn sie eine Notiz mit mehr als 200 Zeichen eingibt, dann wird nicht gespeichert und eine Meldung nennt die zulässige Länge
- [ ] **AC-5** — Angenommen eine Person hat Ausgaben erfasst, wenn sie die Übersicht öffnet, dann sieht sie die Ausgaben des laufenden Monats absteigend nach Datum, jede mit Betrag, Kategorie, Datum und Notiz
- [ ] **AC-6** — Angenommen eine Person betrachtet einen Monat, wenn die Übersicht geladen ist, dann zeigt sie die Gesamtsumme dieses Monats in CHF und darunter die Summe je Kategorie, absteigend nach Höhe, und Kategorien ohne Ausgaben erscheinen nicht
- [ ] **AC-7** — Angenommen eine Person betrachtet einen Monat, wenn sie auf „voriger Monat" oder „nächster Monat" klickt, dann wechseln Liste und Summen auf diesen Monat, und der angezeigte Monat ist jederzeit benannt
- [ ] **AC-8** — Angenommen eine Person betrachtet den laufenden Monat, wenn sie versucht, über den laufenden Monat hinaus vorwärts zu blättern, dann ist das nicht möglich — es gibt keine Ausgaben in der Zukunft
- [ ] **AC-9** — Angenommen eine Ausgabe steht in der Liste, wenn die Person auf „Löschen" klickt und die Rückfrage bestätigt, dann verschwindet die Ausgabe aus Liste und Summen; bricht sie ab, bleibt alles unverändert
- [ ] **AC-10** — Angenommen eine Person hat in einem Monat keine Ausgaben, wenn sie diesen Monat betrachtet, dann sieht sie einen Hinweis, dass noch nichts erfasst ist, und eine Gesamtsumme von 0.00 CHF statt einer leeren Fläche
- [ ] **AC-11** — Angenommen zwei Personen sind gleichzeitig angemeldet, wenn beide ihre Übersicht öffnen, dann sieht jede ausschliesslich ihre eigenen Ausgaben — auch dann, wenn jemand die Datenbank mit dem öffentlichen Schlüssel direkt abfragt
- [ ] **AC-12** — Angenommen eine Person ist nicht angemeldet, wenn sie versucht, eine Ausgabe anzulegen oder zu löschen, dann wird der Versuch abgewiesen und nichts wird gespeichert oder entfernt

## Edge Cases
- **EC-1** — Angenommen die Person klickt zweimal schnell hintereinander auf „Speichern", wenn beide Klicks abgeschickt werden, dann entsteht nur eine Ausgabe und der Knopf ist während des Speicherns gesperrt
- **EC-2** — Angenommen die Datenbank ist nicht erreichbar, wenn eine Ausgabe gespeichert oder gelöscht werden soll, dann erscheint eine verständliche Fehlermeldung, die Eingaben bleiben erhalten, und die Liste zeigt weiterhin den letzten bekannten Stand
- **EC-3** — Angenommen jemand versucht, eine fremde Ausgabe zu löschen, indem er deren Kennung errät, wenn die Löschung abgeschickt wird, dann geschieht nichts und keine fremde Ausgabe verschwindet
- **EC-4** — Angenommen die Person gibt einen Betrag mit mehr als zwei Nachkommastellen ein, wenn sie speichert, dann wird auf zwei Nachkommastellen gerundet und der gespeicherte Wert ist der, der angezeigt wird
- **EC-5** — Angenommen die Person wählt ein Datum in der Zukunft, wenn sie speichert, dann wird nicht gespeichert und eine Meldung sagt, dass nur vergangene und heutige Daten möglich sind
- **EC-6** — Angenommen eine Ausgabe wurde in einem anderen Browserfenster bereits gelöscht, wenn die Person sie hier ebenfalls löscht, dann bleibt es bei einer gelöschten Ausgabe und es erscheint keine Fehlermeldung über einen bereits verschwundenen Eintrag

## Technical Requirements (optional)
- Beträge werden exakt gespeichert, nicht als Fliesskommazahl mit Rundungsfehlern — eine Summe über 30 Ausgaben muss auf den Rappen stimmen.
- Die Übersicht lädt nur die Ausgaben des betrachteten Monats, nicht die gesamte Historie.
- Zugriff wird in der Datenbank erzwungen, nicht nur in der Anwendung (dasselbe Muster wie PROJ-1).

## Open Questions
- [ ] Falls später doch bearbeitet werden soll: Reicht Löschen und Neuerfassen dauerhaft, oder braucht es ein Bearbeitungsformular?

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Feste Kategorienliste: Lebensmittel, Wohnen, Mobilität, Freizeit, Gesundheit, Sonstiges | Sechs Kategorien decken den Alltag ab und halten die Auswertung lesbar. Eigene Kategorien bedeuten eine zweite Tabelle, eine Verwaltungsoberfläche und die Frage, was mit Ausgaben einer gelöschten Kategorie geschieht — viel Aufwand für wenig Nutzen im MVP. | 2026-09-13 |
| Kein Bearbeiten, nur Anlegen und Löschen | Halbiert die Oberfläche und die Zahl der Zustände. Eine falsch erfasste Ausgabe ist in zwei Klicks korrigiert. | 2026-09-13 |
| Monat als einzige Auswertungsebene | Der Monat ist die Einheit, in der Menschen über Geld nachdenken (Miete, Lohn, Abos). Wochen und Jahre kämen erst mit mehr Daten zur Geltung. | 2026-09-13 |
| Keine Ausgaben in der Zukunft (EC-5, AC-8) | Ein Ausgaben-Tracker hält fest, was ausgegeben wurde. Zukünftige Beträge sind Planung — ein anderes Produkt. Verhindert zugleich, dass ein Vertipper im Jahr die Auswertung unbrauchbar macht. | 2026-09-13 |
| Löschen nur mit Rückfrage | Löschen ist unumkehrbar, und die Liste ist klickdicht. Eine Rückfrage kostet eine Sekunde und verhindert den ärgerlichsten Fehler. | 2026-09-13 |
| Notiz auf 200 Zeichen begrenzt | Die Notiz soll erinnern („Znüni mit Team"), nicht dokumentieren. Eine Grenze hält zugleich die Liste lesbar. | 2026-09-13 |
| Alle Beträge in CHF; Fremdwährung ist ein eigenes Feature | Single Responsibility: Dieses Feature ist ohne Fremdwährung vollständig testbar und nutzbar. PROJ-3 erweitert es. | 2026-09-13 |
| Keine Datenschutzprüfung mit eigenen Kriterien nötig | Dieses Feature führt keine neue Art personenbezogener Daten ein: Die Ausgaben gehören zum bestehenden Konto, Auskunft und Löschung sind bereits über AC-12 und AC-13 aus PROJ-1 abgedeckt. Die Notiz ist ein Freitextfeld und wird in `docs/privacy.md` entsprechend behandelt. | 2026-09-13 |
