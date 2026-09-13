# PROJ-3 — Technisches Design

> Der technische Entwurf (das WIE) für dieses Feature. Zwei Leser: der Produktverantwortliche (muss zustimmen) und `/build` (setzt danach um). Kein Code — aber so genau, dass nichts erraten werden muss.
> Eigentümer: `/architecture`. Der Vertrag (das WAS) steht in `spec.md`, die Aufgabenliste in `tasks.md`.

## Komponentenstruktur

```
/app — Übersicht (Rahmen aus PROJ-1, Aufbau aus PROJ-2)
+-- Seitenkopf mit Monatswechsler            (unverändert aus PROJ-2)
+-- Kursfeld (neu, über dem Erfassungsformular)
|   +-- je eine Zeile für EUR, USD, GBP: „1 EUR = 0.9451 CHF"
|   +-- Kursdatum und Quellenangabe „Referenzkurse der EZB"
|   +-- Fehlerfall: eine Zeile „Kurse gerade nicht abrufbar" (EC-3)
+-- Erfassungsformular                        (erweitert)
|   +-- Betrag  ──┐
|   +-- Währung ──┘ nebeneinander; Währung ist eine Auswahlliste
|   |              mit CHF (Vorgabe), EUR, USD, GBP
|   +-- Kategorie, Datum, Notiz                (unverändert)
|   +-- Hinweiszeile unter dem Betrag, sobald eine Fremdwährung gewählt ist:
|   |   „Wird mit dem EZB-Kurs vom Ausgabedatum in CHF umgerechnet."
|   +-- Fehlermeldung bei nicht erreichbarer Kursquelle (AC-9)
+-- Monatszusammenfassung                      (unverändert — rechnet mit CHF)
+-- Ausgabenliste                              (erweitert)
|   +-- Betragsspalte zeigt bei Fremdwährung zwei Zeilen:
|   |   oben der Franken-Betrag, darunter klein „12.00 EUR · Kurs 0.9451 vom 11.09.2026"
+-- Bereich „Konto & Daten"                    (unverändert aus PROJ-1)
```

## Datenmodell

```
Tabelle expenses — vier neue Felder, die bestehenden bleiben unverändert

- currency — Text, Pflicht, Vorgabe 'CHF', einer von genau vier Werten:
       CHF, EUR, USD, GBP. Die Währung, in der die Person bezahlt hat.
- amount_original — Festkommazahl mit 12 Stellen und 2 Nachkommastellen,
       Pflicht, grösser als 0. Der Betrag, wie ihn die Person eingegeben hat,
       in der Währung aus `currency`.
- exchange_rate — Festkommazahl mit 18 Stellen und 8 Nachkommastellen,
       Pflicht, grösser als 0. Wie viele Franken ein Stück der Fremdwährung
       kostete. Bei CHF immer genau 1. Acht Nachkommastellen, weil Kurse
       mehrstellig veröffentlicht werden und ein gerundeter Kurs eine
       Nachrechnung unmöglich machen würde.
- rate_date — Datum ohne Uhrzeit, Pflicht. Der Tag, für den dieser Kurs
       veröffentlicht wurde. Bei einem Wochenendeinkauf liegt er vor dem
       Ausgabedatum (EC-1); bei CHF ist er gleich dem Ausgabedatum.

Bestehend und unverändert:
- amount_chf bleibt das Feld, mit dem gerechnet wird. Es ist jetzt das
       Ergebnis von amount_original × exchange_rate, auf zwei Nachkommastellen
       gerundet, und muss weiterhin grösser als 0 sein (EC-4).

Bestehende Zeilen: Es gibt noch keine, aber die Migration muss trotzdem
       vollständig sein — die neuen Felder erhalten Vorgabewerte
       (currency = 'CHF', amount_original = amount_chf, exchange_rate = 1,
       rate_date = spent_on), sodass ein bestehender Bestand widerspruchsfrei
       bleibt und niemand eine Datenwanderung von Hand machen muss.

Prüfregel in der Datenbank: Bei currency = 'CHF' muss exchange_rate genau 1
       sein. Das schliesst die eine Kombination aus, die still falsche Summen
       erzeugen würde — ein Franken-Betrag, der mit irgendetwas multipliziert
       wurde.

Zugriff und Aufbewahrung: unverändert wie in PROJ-2 — nur die eigene Person,
       durchgesetzt in der Datenbank, gelöscht mit der Ausgabe oder dem Konto.

Kurse selbst werden nicht gespeichert. Keine Kurstabelle, kein Zwischenspeicher
       in der Datenbank — was gebraucht wird, steht auf der Ausgabe (AC-5).
```

## Verhalten & Zugriff

```
Operationen (Erweiterung der beiden aus PROJ-2):

- Ausgabe anlegen — nur angemeldet. Zusätzlich zur Prüfung aus PROJ-2:
  Währung muss eine der vier sein (AC-10). Bei CHF: Kurs 1, Kursdatum gleich
  Ausgabedatum, kein Aufruf nach aussen (AC-2). Bei EUR, USD oder GBP: Der
  Server holt den Kurs für das Ausgabedatum, rechnet um, rundet auf zwei
  Nachkommastellen und speichert Originalbetrag, Währung, Kurs und Kursdatum
  mit (AC-3). Ergibt die Umrechnung 0.00, wird abgelehnt (EC-4).
- Aktuelle Kurse lesen — nur angemeldet. Liefert die Kurse für EUR, USD und GBP
  in Franken samt Kursdatum (AC-7).

Abgelehnt wird:
- eine Währung ausserhalb der vier (AC-10);
- jede Erfassung in Fremdwährung, für die kein Kurs beschafft werden konnte
  (AC-9) — es wird nichts gespeichert;
- alles, was schon PROJ-2 ablehnt (kein Betrag, Zukunftsdatum, zu lange Notiz,
  keine Anmeldung).
```

**Die Kursquelle wird ausschliesslich vom Server angefragt.** Konkret: `https://api.frankfurter.dev/v1/<datum>?base=<währung>&symbols=CHF` für eine Ausgabe und `https://api.frankfurter.dev/v1/latest?base=CHF&symbols=EUR,USD,GBP` für das Kursfeld. Kein Schlüssel, kein Konto, keine Anmeldung — und weil der Server fragt, erfährt der Dienst weder die IP-Adresse der Person noch sonst etwas über sie. Übertragen werden ein Währungskürzel und ein Datum.

**Die Antwort nennt ihr eigenes Kursdatum, und genau das wird gespeichert.** Für einen Sonntag liefert der Dienst den Kurs des letzten Börsentags und schreibt dieses frühere Datum in die Antwort. Dieses Datum ist die Wahrheit über den verwendeten Kurs — deshalb wird es übernommen und angezeigt, statt das Ausgabedatum zu wiederholen. Das ist die Garantie hinter EC-1.

**Zeitlimit von 5 Sekunden auf jede Anfrage nach aussen.** Läuft es ab, gilt die Kursquelle als nicht erreichbar, und es passiert dasselbe wie bei AC-9. Das ist die Garantie hinter EC-2: Ein fremder Dienst darf niemals bestimmen, wie lange unsere Seite hängt.

**Das Kursfeld ist vom Rest der Seite entkoppelt.** Es lädt in einem eigenen Abschnitt, der nachgereicht wird, und ein Fehlschlag wird dort aufgefangen. Die Ausgabenliste, das Formular und die Summen erscheinen unabhängig davon (EC-3, EC-6). Die Antwort für das Kursfeld wird eine Stunde lang wiederverwendet, weil die Zentralbank ohnehin nur einmal täglich veröffentlicht — das erspart bei jedem Seitenaufruf eine Anfrage nach aussen.

**Kein doppeltes Umrechnen (EC-5).** Der Kurs wird genau einmal je Speichervorgang geholt, unmittelbar vor dem Einfügen, und `amount_original` bleibt unangetastet. Zwei abgeschickte Formulare ergeben zwei unabhängige Vorgänge, nie einen doppelt umgerechneten Betrag; gegen die zwei Zeilen selbst wirkt wie in PROJ-2 die Sperre am Knopf.

## Abhängigkeiten

- Keine neuen Pakete. Die Anfrage nach aussen geht mit der eingebauten Netzwerkfunktion der Laufzeitumgebung; `zod` prüft die Antwort, bevor ihr geglaubt wird.
- Keine neuen Komponenten aus der Oberflächenbibliothek über die bereits verwendeten hinaus.

## Einstellungen, die die Person selbst macht

keine — die Kursquelle braucht weder Konto noch Schlüssel noch eine Einstellung. Das ist der Grund, aus dem sie gewählt wurde.

## Technische Entscheidungen

| Decision | Rationale | Alternative considered | Trade-off | Date |
| --- | --- | --- | --- | --- |
| Kurs vom Server holen, nie aus dem Browser | Der Dienst erfährt so nichts über die Person — keine IP, kein Zeitpunkt, kein Zusammenhang zu einem Konto. Ausserdem bleibt die Antwort prüfbar, bevor sie in die Datenbank gelangt. | Anfrage direkt aus dem Browser | Eine Anfrage mehr auf dem Server statt beim Betrachter. Bei einer Anfrage je Erfassung nicht messbar. | 2026-09-13 |
| Zeitlimit 5 Sekunden auf jede Anfrage nach aussen | Ein fremder Dienst darf nicht bestimmen, wie lange unsere Seite hängt. Fünf Sekunden sind grosszügig für einen Dienst, der sonst in unter 300 ms antwortet. | Kein Zeitlimit, oder ein sehr kurzes von 1 s | Bei einem kurzzeitig langsamen Dienst schlägt das Speichern fehl, obwohl es kurz darauf ginge. Die Person sieht eine klare Meldung und kann es erneut versuchen. | 2026-09-13 |
| Neue Felder mit Vorgabewerten statt getrennter Datenwanderung | Die Migration ist damit in einem Schritt vollständig und für jeden bestehenden Bestand widerspruchsfrei. Niemand muss sich an einen zweiten Schritt erinnern. | Felder ohne Vorgabe und ein Nachtrag von Hand | Die Vorgabewerte stehen dauerhaft im Schema, auch wenn sie nur einmal gebraucht wurden. | 2026-09-13 |
| Prüfregel „CHF heisst Kurs genau 1" in der Datenbank | Schliesst die eine Kombination aus, die still falsche Summen erzeugen würde. Eine Prüfung im Anwendungscode allein wäre ein Fehler weit weg von seiner Wirkung. | Nur im Anwendungscode prüfen | Eine Regel mehr im Schema. Dafür kann ein Franken-Betrag nie umgerechnet worden sein. | 2026-09-13 |
| Kurs mit acht Nachkommastellen speichern | Kurse werden mehrstellig veröffentlicht. Ein gerundeter Kurs macht die Nachrechnung „Originalbetrag mal Kurs ergibt Franken-Betrag" unmöglich — und genau die will AC-4 ermöglichen. | Vier Nachkommastellen | Ein paar Bytes mehr je Zeile. | 2026-09-13 |
| Umrechnung im Server, nicht in der Datenbank | Die Umrechnung braucht den Kurs von aussen; sie gehört dorthin, wo die Anfrage stattfindet. Die Datenbank prüft das Ergebnis, statt es zu erzeugen. | Umrechnung in einer Datenbankfunktion | Die Datenbank könnte die Rundung nicht selbst durchsetzen. Dafür bleibt der Weg nach aussen an einer Stelle. | 2026-09-13 |
| Kursdatum aus der Antwort übernehmen, nicht das Ausgabedatum wiederholen | Am Wochenende gibt es keinen neuen Kurs. Das Kursdatum sagt ehrlich, welcher Kurs verwendet wurde — das ist die Garantie hinter EC-1. | Immer das Ausgabedatum eintragen | Kursdatum und Ausgabedatum weichen manchmal ab, was erklärt werden muss. Genau diese Erklärung ist der Wert. | 2026-09-13 |
| Kein Kursspeicher in der Datenbank | Was gebraucht wird, steht auf der Ausgabe. Ein Zwischenspeicher wäre eine zweite Wahrheit über den Kurs eines Tages und müsste gepflegt werden. | Tabelle `exchange_rates` | Zwei Erfassungen am selben Tag lösen zwei Anfragen aus. Bei einem persönlichen Tracker ist das belanglos. | 2026-09-13 |
| Kursfeld nachgereicht und eigenständig abgesichert | Ein Ausfall der Kursquelle darf nicht die Übersicht blockieren (EC-3, EC-6). Nachgereicht heisst: Liste und Summen sind sofort da. | Kurse zusammen mit der Seite laden | Das Kursfeld erscheint einen Moment später als der Rest. Das ist genau die gewünschte Rangfolge. | 2026-09-13 |
| Antwort des Kursfelds eine Stunde wiederverwenden | Die Zentralbank veröffentlicht einmal täglich. Jede Seitenansicht neu zu fragen wäre Verschwendung und würde den kostenlosen Dienst unnötig belasten. | Jedes Mal frisch fragen | Ein frisch veröffentlichter Kurs erscheint bis zu eine Stunde später. Für eine Orientierungsangabe ohne Bedeutung; die Erfassung selbst fragt immer frisch. | 2026-09-13 |
| Die Antwort der Kursquelle wird geprüft, bevor ihr geglaubt wird | Eine fremde Antwort ist Eingabe, nicht Wahrheit. Fehlt der Kurs oder ist er keine positive Zahl, gilt die Quelle als nicht erreichbar (AC-9), statt dass etwas Unsinniges in die Datenbank gelangt. | Antwort direkt verwenden | Ein paar Zeilen Prüfung mehr. | 2026-09-13 |

## Offene Fragen

- keine
