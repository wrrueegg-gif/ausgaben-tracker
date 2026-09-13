# PROJ-3: Fremdwährung & Wechselkurse

<!-- This file (spec.md) is the stable CONTRACT — it defines WHAT, not HOW.
     Owner: /write-spec (creates), /refine (updates). During /build this file is READ-ONLY.
     Technical design lives in design.md, QA results in qa-report.md. -->

## Dependencies
- Benötigt: PROJ-1 (Benutzerkonto & Login) — für die angemeldete Person und den geschützten Bereich.
- Benötigt: PROJ-2 (Ausgaben & Monatsübersicht) — dieses Feature erweitert das Erfassen, die Liste und die Auswertung um Fremdwährungen.

## User Stories
- Als Nutzerin, die in Konstanz einkauft, möchte ich den Betrag in Euro erfassen und trotzdem eine korrekte Monatssumme in Franken sehen, damit ich nicht selbst mit dem Taschenrechner umrechne.
- Als Nutzer mit Abos in Dollar möchte ich sehen, mit welchem Kurs umgerechnet wurde, damit ich die Zahl nachvollziehen und mit meiner Kreditkartenabrechnung vergleichen kann.
- Als Nutzerin möchte ich, dass eine einmal erfasste Ausgabe ihren Betrag behält, auch wenn sich der Kurs später ändert, damit vergangene Monate stabil bleiben.
- Als Nutzer möchte ich den aktuellen Kurs sehen, bevor ich etwas erfasse, damit ich eine Vorstellung von der Grössenordnung habe.

## Out of Scope
- Andere Währungen als CHF, EUR, USD und GBP. Die Kursquelle kennt mehr, aber vier Währungen decken den Alltag in der Schweiz ab und halten die Auswahl kurz.
- Eine eigene Bewertung in Fremdwährung (etwa „so viel Euro habe ich diesen Monat ausgegeben"). Ausgewertet wird ausschliesslich in Franken.
- Den gespeicherten Kurs nachträglich ändern oder eine Ausgabe neu umrechnen.
- Gebühren, Aufschläge oder Kartenkurse der Bank. Verwendet wird der Referenzkurs der Europäischen Zentralbank, kein Kartenkurs.
- Ein Zwischenspeicher für Kurse in der Datenbank. Was gebraucht wird, steht auf der Ausgabe.
- Kryptowährungen und Edelmetalle.

## Acceptance Criteria

- [ ] **AC-1** — Angenommen eine Person erfasst eine Ausgabe, wenn sie das Formular öffnet, dann steht die Währung auf CHF und sie kann zusätzlich EUR, USD oder GBP wählen
- [ ] **AC-2** — Angenommen die Währung steht auf CHF, wenn die Ausgabe gespeichert wird, dann wird kein Kurs abgefragt und der Betrag wird unverändert als Franken-Betrag übernommen
- [ ] **AC-3** — Angenommen eine Person erfasst 12.00 EUR mit einem bestimmten Ausgabedatum, wenn sie speichert, dann wird der Betrag mit dem Referenzkurs der Europäischen Zentralbank zu diesem Datum in Franken umgerechnet, und der Franken-Betrag ist der, der in Liste und Summen erscheint
- [ ] **AC-4** — Angenommen eine Ausgabe wurde in Fremdwährung erfasst, wenn sie in der Liste erscheint, dann sind Originalbetrag mit Währung, der umgerechnete Franken-Betrag, der verwendete Kurs und das Datum dieses Kurses ablesbar
- [ ] **AC-5** — Angenommen eine Ausgabe in Fremdwährung wurde gespeichert, wenn sich der Kurs später ändert, dann bleiben der gespeicherte Franken-Betrag und der gespeicherte Kurs unverändert
- [ ] **AC-6** — Angenommen ein Monat enthält Ausgaben in verschiedenen Währungen, wenn die Übersicht die Summen bildet, dann rechnet sie ausschliesslich mit den gespeicherten Franken-Beträgen, sodass Gesamtsumme und Summe je Kategorie stimmen
- [ ] **AC-7** — Angenommen eine Person ist im geschützten Bereich, wenn die Seite geladen ist, dann zeigt ein Kursfeld die aktuellen Kurse für EUR, USD und GBP in Franken, zusammen mit dem Kursdatum und der Angabe, dass die Kurse von der Europäischen Zentralbank stammen
- [ ] **AC-8** — Angenommen eine Person lädt ihre Daten herunter, wenn eine Ausgabe in Fremdwährung dabei ist, dann enthält die Datei Originalbetrag, Währung, verwendeten Kurs und Kursdatum zusätzlich zum Franken-Betrag
- [ ] **AC-9** — Angenommen die Kursquelle ist nicht erreichbar, wenn eine Ausgabe in Fremdwährung gespeichert werden soll, dann wird nichts gespeichert, die Eingaben bleiben im Formular stehen, und eine Meldung sagt, dass der Kurs gerade nicht abrufbar ist und die Ausgabe in Franken erfasst werden kann
- [ ] **AC-10** — Angenommen jemand schickt eine Währung ab, die nicht zur Auswahl steht, wenn das Formular verarbeitet wird, dann wird nicht gespeichert und eine Meldung nennt die zulässigen Währungen

## Edge Cases
- **EC-1** — Angenommen das Ausgabedatum fällt auf ein Wochenende oder einen Feiertag, wenn der Kurs abgefragt wird, dann wird der letzte davor veröffentlichte Kurs verwendet, und das angezeigte Kursdatum ist dieses frühere Datum, nicht das Ausgabedatum
- **EC-2** — Angenommen die Kursquelle antwortet sehr langsam, wenn die Person auf das Speichern wartet, dann bricht die Anfrage nach wenigen Sekunden ab und es erscheint dieselbe Meldung wie bei AC-9, statt dass die Seite hängt
- **EC-3** — Angenommen das Kursfeld kann die Kurse nicht laden, wenn die Übersicht angezeigt wird, dann bleibt der Rest der Seite vollständig bedienbar und an der Stelle des Kursfelds steht ein kurzer Hinweis
- **EC-4** — Angenommen ein sehr kleiner Fremdwährungsbetrag ergäbe umgerechnet 0.00 CHF, wenn gespeichert werden soll, dann wird nicht gespeichert und eine Meldung erklärt, dass der Franken-Betrag grösser als null sein muss
- **EC-5** — Angenommen dieselbe Ausgabe wird zweimal schnell hintereinander abgeschickt, wenn beide Versuche durchlaufen, dann wird der Kurs nicht doppelt verrechnet und es entsteht höchstens eine Ausgabe
- **EC-6** — Angenommen eine Person erfasst eine Ausgabe in CHF, wenn die Kursquelle gerade ausgefallen ist, dann funktioniert das Erfassen unverändert — ein Ausfall der Kursquelle legt nicht die ganze App lahm

## Technical Requirements (optional)
- Die Kursquelle wird ausschliesslich vom Server angefragt, nie aus dem Browser. Es werden dabei nur Währungskürzel und ein Datum übertragen, nie ein Betrag und nichts, was auf eine Person schliessen lässt.
- Die Kursquelle darf keine Kosten verursachen und keinen Schlüssel verlangen, damit die App ohne fremde Zugangsdaten nachvollziehbar bleibt.
- Der Franken-Betrag wird auf zwei Nachkommastellen gerundet gespeichert, wie jede andere Ausgabe auch.

## Open Questions
- [ ] Falls die App einmal viele Nutzer hat: Soll ein Kurs-Zwischenspeicher in der Datenbank angelegt werden, damit nicht jede Erfassung eine eigene Anfrage auslöst?

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Kursquelle ist die Frankfurter-API mit den Referenzkursen der Europäischen Zentralbank | Kostenlos, ohne Anmeldung, ohne Schlüssel und mit einer nachvollziehbaren, offiziellen Quelle hinter den Zahlen. Wer das Projekt prüft, braucht kein eigenes Konto irgendwo. | 2026-09-13 |
| Vier Währungen: CHF, EUR, USD, GBP | Deckt Grenzeinkauf, Reisen und Online-Abos ab. Eine lange Auswahlliste kostet bei jeder Erfassung Zeit und bringt fast niemandem etwas. | 2026-09-13 |
| Kurs zum **Ausgabedatum**, nicht zum Erfassungsdatum | Wer eine Ausgabe von vorletzter Woche nachträgt, will den Kurs von damals. Der Kurs von heute wäre schlicht der falsche Wert. | 2026-09-13 |
| Kurs wird auf der Ausgabe festgeschrieben (AC-5) | Eine Auswertung, die sich rückwirkend ändert, weil der Euro gefallen ist, ist unbrauchbar. Ein festgeschriebener Kurs macht die Zahl nachprüfbar — auch in einem Jahr. | 2026-09-13 |
| Bei Ausfall der Kursquelle wird **nicht** gespeichert (AC-9) | Die Alternative wäre, mit einem alten oder geschätzten Kurs zu speichern. Eine stille Fehlbuchung ist schlimmer als eine ehrliche Fehlermeldung mit dem Hinweis, den Betrag in Franken zu erfassen. | 2026-09-13 |
| Referenzkurs der Zentralbank, kein Kartenkurs | Der Kurs der Kartenherausgeberin ist nicht öffentlich abrufbar und enthält Aufschläge. Der Referenzkurs ist der ehrlichste öffentlich verfügbare Massstab; die Abweichung zur Kartenabrechnung ist bekannt und akzeptiert. | 2026-09-13 |
| Kursfeld zeigt die aktuellen Kurse (AC-7) | Macht die Integration für jede Person sofort sichtbar und gibt ein Gefühl für die Grössenordnung, bevor etwas erfasst wird. | 2026-09-13 |
| Keine neue Art personenbezogener Daten | Es werden nur Kurs, Kursdatum, Originalbetrag und Währung zusätzlich gespeichert, alles an der bestehenden Ausgabe. Auskunft und Löschung sind über PROJ-1 abgedeckt; an die Kursquelle gehen keine personenbezogenen Daten. `docs/privacy.md` hält das bereits fest. | 2026-09-13 |
