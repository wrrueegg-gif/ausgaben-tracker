# PROJ-2 — Technisches Design

> Der technische Entwurf (das WIE) für dieses Feature. Zwei Leser: der Produktverantwortliche (muss zustimmen) und `/build` (setzt danach um). Kein Code — aber so genau, dass nichts erraten werden muss.
> Eigentümer: `/architecture`. Der Vertrag (das WAS) steht in `spec.md`, die Aufgabenliste in `tasks.md`.

## Komponentenstruktur

```
/app — Übersicht (im Rahmen aus PROJ-1: Kopfzeile + Inhaltsbreite max-w-3xl)
+-- Seitenkopf
|   +-- Titel „Ausgaben"
|   +-- Monatswechsler
|       +-- Knopf „voriger Monat" (Pfeil links)
|       +-- Monatsname und Jahr, z. B. „September 2026"
|       +-- Knopf „nächster Monat" (Pfeil rechts) — gesperrt im laufenden Monat
+-- Erfassungsformular (Karte, immer sichtbar, oben)
|   +-- Betrag (Zahlenfeld, Einheit CHF sichtbar)
|   +-- Kategorie (Auswahlliste, sechs feste Einträge)
|   +-- Datum (Datumsfeld, mit heute vorbelegt)
|   +-- Notiz (einzeiliges Textfeld, optional)
|   +-- Knopf „Ausgabe speichern" (während des Speicherns gesperrt)
|   +-- Feldfehler unter dem jeweiligen Feld
+-- Monatszusammenfassung (Karte)
|   +-- Gesamtsumme des Monats, gross, mit Währung
|   +-- Liste „Summe je Kategorie", absteigend nach Betrag
|       +-- je Zeile: Kategoriename, Betrag, Anteil in Prozent
+-- Ausgabenliste (Karte)
|   +-- je Zeile: Datum · Kategorie · Notiz · Betrag · Löschknopf
|   +-- Löschknopf öffnet Bestätigungsdialog
|   +-- Leerzustand: „Noch keine Ausgaben in diesem Monat."
+-- Ladezustand: Skelettflächen an Stelle von Zusammenfassung und Liste
+-- Fehlerzustand: Meldung im Inhaltsbereich, Formular bleibt bedienbar
```

Der Bereich „Konto & Daten" aus PROJ-1 bleibt unverändert unter der Liste stehen. Der Platzhalter „Deine Ausgaben", den PROJ-1 dort hinterlassen hat, wird durch dieses Feature ersetzt — das ist kein Eingriff in PROJ-1, sondern das Einlösen des Platzhalters.

## Datenmodell

```
Tabelle expenses — eine erfasste Ausgabe

- id — eindeutige Kennung, vom System erzeugt (UUID), Primärschlüssel.
- user_id — Kennung der Person, der die Ausgabe gehört. Pflicht, Fremdschlüssel
       auf das Anmeldekonto; wird das Konto gelöscht, verschwinden alle ihre
       Ausgaben mit (das ist die Kaskade, auf die AC-13 aus PROJ-1 sich stützt).
- amount_chf — Betrag in Franken. Festkommazahl mit 12 Stellen und genau
       2 Nachkommastellen, Pflicht, muss grösser als 0 sein. Bewusst keine
       Fliesskommazahl: 0.10 + 0.20 ergibt dort nicht 0.30, und eine
       Monatssumme muss auf den Rappen stimmen.
- category — Text, Pflicht, einer von genau sechs Werten: Lebensmittel,
       Wohnen, Mobilität, Freizeit, Gesundheit, Sonstiges. Die Datenbank lässt
       nichts anderes zu.
- spent_on — Datum ohne Uhrzeit, Pflicht, darf nicht in der Zukunft liegen
       (EC-5). Die Uhrzeit spielt für eine Monatsauswertung keine Rolle und
       würde nur Zeitzonenfragen aufwerfen.
- note — Text, optional, höchstens 200 Zeichen.
- created_at — Zeitstempel mit Zeitzone, Pflicht, Vorgabe „jetzt". Dient als
       zweites Sortierkriterium, wenn mehrere Ausgaben dasselbe Datum haben.

Gehört zu: genau einer Person.
Zugriff: Eine angemeldete Person darf ausschliesslich Zeilen lesen, anlegen und
       löschen, deren user_id ihrer eigenen Kennung entspricht. Beim Anlegen
       prüft die Datenbank zusätzlich, dass die eingetragene user_id die eigene
       ist — sonst könnte jemand eine Ausgabe in fremdem Namen anlegen.
       Ändern ist für niemanden erlaubt (es gibt kein Bearbeiten).
Nicht angemeldet: kein Lesen, kein Schreiben, keine Zeile.
Aufbewahrung: bis die Person die Ausgabe oder ihr Konto löscht.

Index: auf (user_id, spent_on absteigend). Jede Abfrage dieser Anwendung filtert
       nach Person und Monat; ohne diesen Index läuft sie über die ganze Tabelle.
```

Die sechs Kategorien stehen an genau zwei Stellen: als Prüfregel in der Datenbank und als Liste im Anwendungscode, aus der die Auswahlliste entsteht. Beide müssen übereinstimmen; die Datenbank ist die verbindliche Instanz.

## Verhalten & Zugriff

```
Operationen:

- Ausgabe anlegen — nur angemeldet. Pflicht: Betrag grösser 0 (auf zwei
  Nachkommastellen gerundet), Kategorie aus der festen Liste, Datum heute oder
  früher. Optional: Notiz bis 200 Zeichen. Die Ausgabe gehört immer der
  angemeldeten Person; eine fremde Kennung kann nicht mitgegeben werden.
- Ausgaben eines Monats lesen — nur angemeldet, nur die eigenen. Geliefert wird
  genau der gewählte Monat, sortiert nach Datum absteigend, bei gleichem Datum
  nach Erfassungszeitpunkt absteigend.
- Ausgabe löschen — nur angemeldet, nur die eigene, Kennung wird mitgegeben.

Abgelehnt wird:
- jede dieser Operationen ohne gültige Sitzung — nichts wird gelesen,
  gespeichert oder gelöscht (AC-12);
- das Löschen einer fremden Ausgabe: die Datenbank findet für diese Person
  keine solche Zeile, also verschwindet nichts (EC-3);
- ein Betrag kleiner oder gleich 0, eine unbekannte Kategorie, ein Datum in der
  Zukunft, eine Notiz über 200 Zeichen — geprüft im Server und noch einmal in
  der Datenbank.
```

**Die Summen entstehen im Server, nicht im Browser.** Gesamtsumme und Summe je Kategorie werden aus denselben Zeilen berechnet, die die Liste zeigt — ein zweiter Weg zur selben Zahl wäre eine zweite Gelegenheit, sie falsch zu berechnen. Bei den Datenmengen eines persönlichen Trackers (Dutzende Zeilen pro Monat) ist das kostenlos.

**Nach dem Anlegen und Löschen wird der Seitenausschnitt neu vom Server geholt** (`revalidatePath`). Damit sind Liste und Summen bauartbedingt konsistent, ohne dass im Browser eine zweite Wahrheit gepflegt wird. Das erfüllt AC-1 („ohne Neuladen") aus Sicht der Person: Die Seite springt nicht, der Inhalt aktualisiert sich.

**Monatsnavigation über die Adresszeile** (`/app?monat=2026-09`). Ein Monat ist damit verlinkbar und der Zurück-Knopf des Browsers tut das Erwartbare. Fehlt der Parameter oder ist er unlesbar, gilt der laufende Monat. Ein Monat in der Zukunft wird auf den laufenden Monat zurückgesetzt (AC-8).

**Garantie hinter EC-1 (Doppelklick):** Der Knopf ist während des Absendens gesperrt, und der Server prüft vor dem Einfügen nicht auf Duplikate — zwei gleiche Ausgaben am selben Tag sind ein legitimer Fall (zweimal Kaffee). Die Sperre am Knopf ist deshalb die richtige und einzige Massnahme; eine Eindeutigkeitsregel in der Datenbank wäre hier falsch und würde echte Doppelausgaben verhindern.

**Garantie hinter EC-6 (schon gelöscht):** Das Löschen ist idempotent. Gelöscht wird über „Zeile mit dieser Kennung, die dieser Person gehört"; trifft das auf nichts zu, ist das Ergebnis dasselbe wie beim Löschen selbst — die Zeile ist weg. Es gibt deshalb keine Fehlermeldung über einen bereits verschwundenen Eintrag.

## Abhängigkeiten

- Keine neuen Pakete. `zod` prüft die Eingaben, `@supabase/ssr` liegt bereits vor.
- Aus dem bestehenden shadcn/ui-Bestand kommen hinzu: `select` (Kategorie), `table` (Ausgabenliste), `skeleton` (Ladezustand) — alle bereits installiert. `button`, `input`, `label`, `card`, `alert`, `alert-dialog` werden wie in PROJ-1 verwendet.
- Die Datums- und Währungsformatierung übernimmt die eingebaute Internationalisierung des Browsers und der Laufzeitumgebung (`de-CH`), kein Datums- oder Währungspaket.

## Einstellungen, die die Person selbst macht

keine — dieses Feature braucht keine Einstellung im Dashboard.

## Technische Entscheidungen

| Decision | Rationale | Alternative considered | Trade-off | Date |
| --- | --- | --- | --- | --- |
| Betrag als Festkommazahl mit zwei Nachkommastellen, nicht als Fliesskommazahl | Geldbeträge in Fliesskomma summieren sich falsch: 0.10 + 0.20 ergibt 0.30000000000000004. Bei dreissig Ausgaben im Monat ist die Summe dann sichtbar daneben — genau die Zahl, wegen der es das Produkt gibt. | Fliesskommazahl (einfacher) oder Rappen als Ganzzahl (exakt, aber überall Umrechnung) | Werte kommen als Zeichenkette aus der Datenbank und müssen fürs Rechnen bewusst behandelt werden. Dafür stimmt die Summe. | 2026-09-13 |
| Kategorien als Prüfregel in der Datenbank statt als eigene Tabelle | Eine feste Liste braucht keine Verwaltung, keine Fremdschlüssel und keine Antwort auf „was passiert mit Ausgaben einer gelöschten Kategorie". Die Datenbank lehnt trotzdem alles ab, was nicht auf der Liste steht. | Tabelle `categories` mit Fremdschlüssel | Eine neue Kategorie erfordert eine Migration. Bei einer bewusst festen Liste ist das genau richtig. | 2026-09-13 |
| Datum ohne Uhrzeit | Eine Monatsauswertung braucht keine Uhrzeit, und ohne sie gibt es keine Zeitzonenfrage: Der 30. September bleibt der 30. September, egal wo jemand sitzt. | Zeitstempel mit Zeitzone | Die Reihenfolge zweier Ausgaben desselben Tages ergibt sich aus dem Erfassungszeitpunkt statt aus dem Ausgabezeitpunkt. Für die Auswertung ohne Bedeutung. | 2026-09-13 |
| Summen im Server aus denselben Zeilen wie die Liste | Eine Zahl, ein Rechenweg. Eine Datenbankaggregation wäre ein zweiter Weg zur selben Zahl und damit eine zweite Gelegenheit, sie falsch zu berechnen. | Aggregation in der Datenbank (`group by`) | Bei sehr vielen Ausgaben pro Monat wäre die Aggregation schneller. Bei Dutzenden Zeilen ist der Unterschied nicht messbar. | 2026-09-13 |
| Monat als Parameter in der Adresszeile, Server rendert neu | Verlinkbar, der Zurück-Knopf funktioniert, und es gibt keinen Zustand im Browser, der vom Server abweichen kann. | Monatswechsel nur im Browserzustand | Jeder Monatswechsel ist eine Serveranfrage. Bei dieser Datenmenge nicht spürbar. | 2026-09-13 |
| Zugriff erneut zweifach: Prüfung im Server **und** Zeilenregel in der Datenbank | Dasselbe Muster, das PROJ-1 etabliert hat. Die Zeilenregel ist die belastbare Grenze und deckt AC-11, AC-12 und EC-3 gemeinsam ab. | Nur Prüfung im Server | Zwei Stellen, die zueinander passen müssen. Dafür bleibt ein Fehler im Anwendungscode folgenlos für fremde Daten. | 2026-09-13 |
| Keine Eindeutigkeitsregel gegen doppelte Ausgaben | Zwei gleiche Beträge am selben Tag in derselben Kategorie sind ein normaler Fall. Gegen den Doppelklick hilft die Sperre am Knopf, nicht eine Regel, die echte Doppelausgaben verhindert. | Eindeutigkeit über (Person, Datum, Betrag, Kategorie) | Ein sehr schneller Doppelklick, der die Sperre überholt, könnte zwei Zeilen erzeugen. Die Person sieht beide und löscht eine. | 2026-09-13 |
| Löschen idempotent statt mit Fehlermeldung | „Weg" ist das Ergebnis, das die Person wollte; ob die Zeile schon vorher weg war, ist für sie belanglos (EC-6). | Fehlermeldung „Eintrag existiert nicht mehr" | Ein echter Fehlschlag beim Löschen fiele weniger auf. Dagegen steht, dass die Liste nach dem Neuladen die Wahrheit zeigt. | 2026-09-13 |

## Offene Fragen

- keine
