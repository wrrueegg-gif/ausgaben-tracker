# PROJ-1 — Technisches Design

> Der technische Entwurf (das WIE) für dieses Feature. Zwei Leser: der Produktverantwortliche (muss zustimmen) und `/build` (setzt danach um). Kein Code — aber so genau, dass nichts erraten werden muss.
> Eigentümer: `/architecture`. Der Vertrag (das WAS) steht in `spec.md`, die Aufgabenliste in `tasks.md`.

## Komponentenstruktur

```
Öffentlicher Bereich (Layout „Anmeldeseiten": zentrierte Karte, keine Kopfzeile)
+-- /login   — Anmeldeseite
|   +-- Anmeldeformular (E-Mail, Passwort, Knopf „Anmelden")
|   |   +-- Fehlermeldung über dem Formular (eine Meldung für alle Fehlschläge)
|   |   +-- Knopf während des Absendens gesperrt und beschriftet „Wird geprüft …"
|   +-- Textlink „Noch kein Konto? Registrieren"
|   +-- Textlink „Datenschutz"
+-- /signup  — Registrierungsseite
|   +-- Registrierungsformular (E-Mail, Passwort, Knopf „Konto anlegen")
|   |   +-- Feldfehler unter dem jeweiligen Feld (E-Mail-Format, Passwortlänge)
|   |   +-- Fehlermeldung über dem Formular (neutral, siehe unten)
|   +-- Textlink „Schon registriert? Anmelden"
|   +-- Textlink „Datenschutz"
+-- /datenschutz — Datenschutzhinweis (statischer Text, ohne Anmeldung erreichbar)

Geschützter Bereich (Layout „App": Kopfzeile + Inhalt, Zugang nur angemeldet)
+-- AppHeader
|   +-- Produktname „Ausgaben-Tracker" (links)
|   +-- E-Mail der angemeldeten Person (ab Breite sm sichtbar)
|   +-- Knopf „Abmelden"
+-- /app — Übersicht
    +-- Begrüssung mit Anzeigename
    +-- Platzhalterbereich für die Ausgabenliste (wird von PROJ-2 gefüllt)
    +-- Bereich „Konto & Daten"
        +-- Knopf „Meine Daten herunterladen"
        +-- Knopf „Konto löschen" (Variante destruktiv)
            +-- Bestätigungsdialog mit zweitem Knopf „Endgültig löschen"
        +-- Textlink „Datenschutz"
```

## Datenmodell

```
Tabelle profiles — das Profil zu einem Anmeldekonto

- id — eindeutige Kennung, identisch mit der Kennung des Anmeldekontos (auth.users).
       Zugleich Primärschlüssel und Fremdschlüssel; wird das Anmeldekonto gelöscht,
       verschwindet das Profil automatisch mit.
- display_name — Text, 1 bis 60 Zeichen, Pflicht. Beim Anlegen der Teil der
       E-Mail-Adresse vor dem @, gekürzt auf 60 Zeichen.
- created_at — Zeitstempel mit Zeitzone, Pflicht, Vorgabe „jetzt".

Gehört zu: genau einer Person (derjenigen, deren Anmeldekonto dieselbe Kennung trägt).
Zugriff: Eine angemeldete Person darf ausschliesslich die Zeile lesen und ändern,
       deren id ihrer eigenen Kennung entspricht. Einfügen und Löschen ist für
       angemeldete Personen nicht erlaubt — das Einfügen übernimmt die Datenbank
       selbst beim Registrieren, das Löschen geschieht über das Anmeldekonto.
Nicht angemeldet: keine Zeile, weder lesend noch schreibend.
Aufbewahrung: bis die Person ihr Konto löscht (AC-13). Keine automatische Frist.

Bestehende Tabelle auth.users — von der Auth-Plattform verwaltet, nicht von uns
angelegt. Sie enthält E-Mail-Adresse, Passwort-Hash, Registrierungs- und
Anmeldezeitpunkte sowie die IP der letzten Anmeldung. Wir lesen daraus nur die
eigene Kennung und die eigene E-Mail-Adresse; wir schreiben nichts direkt hinein.

Fehlversuchs-Zähler — bewusst keine Tabelle. Er lebt im Arbeitsspeicher des
Serverprozesses: je Schlüssel (E-Mail-Adresse bzw. IP-Adresse) ein Zeitstempel je
Fehlversuch, älter als 15 Minuten wird verworfen. Aufbewahrung damit maximal
15 Minuten, kein Eintrag in der Datenbank.
```

Zwei Bausteine liegen als Datenbankobjekte vor, weil sie sonst nicht zuverlässig wären:

- **Automatisches Profil beim Registrieren:** Ein Auslöser auf der Kontotabelle legt im selben Vorgang das Profil an, in dem das Konto entsteht. Entweder beides oder nichts — das ist die Garantie hinter EC-6. Ein Profil, das die App nach der Registrierung „nachträglich" anlegt, wäre genau dann weg, wenn der zweite Schritt scheitert.
- **Konto selbst löschen:** Eine Datenbankfunktion, die genau das Anmeldekonto der aufrufenden Person löscht und nichts sonst. Sie läuft mit erhöhten Rechten, ist aber nur für angemeldete Aufrufer freigegeben und arbeitet ausschliesslich auf der eigenen Kennung — ein Parameter, mit dem man ein fremdes Konto angeben könnte, existiert nicht. Über die Fremdschlüssel verschwinden Profil und (ab PROJ-2) alle Ausgaben derselben Person mit. **Damit braucht die App keinen Administrationsschlüssel**, der sonst im Server liegen und jede Zugriffsregel aushebeln könnte.

## Verhalten & Zugriff

```
Operationen:

- Registrieren — offen für alle. Verlangt E-Mail im gültigen Format und Passwort mit
  mindestens 8 Zeichen. Erfolg: Konto entsteht, Profil entsteht automatisch, die
  Person ist angemeldet und landet auf /app.
- Anmelden — offen für alle. Erfolg: Sitzung entsteht, Weiterleitung auf /app.
- Abmelden — nur angemeldet. Beendet die Sitzung und leitet auf /login.
- Eigene Daten herunterladen — nur angemeldet. Liefert eine JSON-Datei mit
  E-Mail-Adresse, Profil und (ab PROJ-2) allen eigenen Ausgaben.
- Eigenes Konto löschen — nur angemeldet, nur das eigene Konto. Danach ist die
  Person abgemeldet.
- Geschützten Bereich betreten — nur angemeldet.

Abgelehnt wird:
- jede Operation des geschützten Bereichs ohne gültige Sitzung — Weiterleitung auf
  /login, kein Inhalt;
- jeder Datenbankzugriff auf ein fremdes Profil, auch mit gültiger Sitzung — die
  Datenbank liefert dann keine Zeile, unabhängig davon, was die App fragt;
- jeder Anmeldeversuch, der die Sperre nach Fehlversuchen auslöst, mit der
  Auskunft, in wie vielen Minuten es wieder geht.
```

**Zwei unabhängige Prüfungen, nicht eine.** Die Weiterleitung im Layout des geschützten Bereichs ist Bequemlichkeit; verbindlich ist die Regel in der Datenbank. Wer den öffentlichen Datenbankschlüssel aus dem ausgelieferten JavaScript nimmt und die Datenbank direkt fragt, kommt an der App vorbei — aber nicht an der Zeilenregel (AC-9). Genau das prüft `/qa`.

**Missbrauchsschutz — was die Plattform bereits tut und was nicht.** Die Auth-Plattform begrenzt ihre eigenen Endpunkte pro IP-Adresse; diese Grenze ist nicht einstellbar und greift gegen plumpes Dauerfeuer aus einer Quelle. Sie greift **nicht** gegen einen geduldigen Angriff auf ein einzelnes Konto und nicht gegen wechselnde IP-Adressen. Deshalb zählt die App selbst mit, und zwar doppelt: je E-Mail-Adresse **und** je IP-Adresse, 5 Fehlversuche in 15 Minuten, gezählt **bevor** das Passwort geprüft wird. Der Zähler wird bei erfolgreicher Anmeldung für diese Adresse zurückgesetzt.

**Keine Auskunft darüber, wer existiert.** Alle Fehlschläge einer Anmeldung — unbekannte Adresse, falsches Passwort, gesperrt wegen Fehlversuchen — erzeugen dieselbe Meldung: „E-Mail-Adresse oder Passwort ist falsch." Ausnahme ist allein die Sperrmeldung, die die Wartezeit nennt; sie erscheint nach fünf Fehlversuchen unabhängig davon, ob es die Adresse gibt, und verrät deshalb nichts. Auch die Registrierung mit einer bereits vergebenen Adresse antwortet neutral: „Registrierung fehlgeschlagen. Bitte prüfe deine Eingaben — falls du bereits ein Konto hast, melde dich an."

## Abhängigkeiten

- `zod` — bereits im Projekt. Prüft E-Mail-Format und Passwortlänge serverseitig, bevor irgendetwas an die Auth-Plattform geht.
- `@supabase/ssr`, `@supabase/supabase-js` — bereits im Projekt. Liefern den Server- und den Browser-Client; beide Dateien existieren und werden **nicht** dupliziert.
- Keine neuen Pakete. Insbesondere **kein** externer Dienst für die Fehlversuchssperre: Der Zähler liegt im Serverprozess (siehe `CLAUDE.md` → How This Project Runs), damit das Projekt ohne Fremdkonto und ohne Kosten läuft.
- Aus dem bestehenden shadcn/ui-Bestand werden verwendet: `button`, `input`, `label`, `card`, `alert`, `alert-dialog`, `sonner`. Nichts davon wird nachgebaut.

## Einstellungen, die die Person selbst macht

| Einstellung | Wo | Wann | Wert | Warum | → AC |
| --- | --- | --- | --- | --- | --- |
| E-Mail-Bestätigung ausschalten | Supabase → Authentication → Sign In / Providers → Email → „Confirm email" | now | aus | Der Mailversand des kostenlosen Tarifs ist auf wenige Nachrichten pro Stunde begrenzt. Bleibt die Bestätigung an, ist niemand nach der Registrierung angemeldet und AC-1 ist nicht erfüllbar. | AC-1 |
| Mindestlänge des Passworts auf 8 setzen | Supabase → Authentication → Policies (Password) → „Minimum password length" | now | 8 | Die Vorgabe der Plattform liegt bei 6. Die App prüft selbst auf 8 (AC-2); diese Einstellung zieht dieselbe Grenze eine Ebene tiefer, falls jemand an der App vorbei registriert. | AC-2 |

Die Grenzwerte unter *Authentication → Rate Limits* bleiben auf den Vorgaben — die Sperre, die AC-10 verlangt, wird in der App gezählt, weil nur dort pro Konto gezählt werden kann.

## Technische Entscheidungen

| Decision | Rationale | Alternative considered | Trade-off | Date |
| --- | --- | --- | --- | --- |
| Anmeldung und Registrierung als serverseitige Formular-Aktionen (Server Actions), nicht als Formular im Browser | Eine serverseitige Aktion überträgt grundsätzlich per POST. Damit kann das Passwort nie in der Adresszeile landen — der klassische Fehler eines selbstgebauten Formulars, dem ein `preventDefault()` fehlt. Entspricht dem vorgesehenen Muster von `@supabase/ssr`. | Client-Formular mit eigenem `fetch` auf eine eigene API-Route | Etwas weniger Kontrolle über Zwischenzustände im Browser; dafür ist der riskanteste Fehler bauartbedingt ausgeschlossen. | 2026-09-13 |
| Profil entsteht über einen Datenbank-Auslöser, nicht durch einen zweiten Aufruf der App | Konto und Profil entstehen im selben Vorgang. Ein zweiter Aufruf der App könnte scheitern, nachdem das Konto schon existiert — dann gäbe es ein Konto ohne Profil, und niemand merkt es. Das ist die Garantie hinter EC-6. | Nach der Registrierung ein zweiter Schreibaufruf aus der App | Der Auslöser ist in einer Migration versteckt und nicht im Anwendungscode sichtbar; dafür ist der Zustand „Konto ohne Profil" unmöglich. | 2026-09-13 |
| Kontolöschung über eine Datenbankfunktion mit erhöhten Rechten, die nur auf die eigene Kennung wirkt | Die App braucht damit **keinen** Administrationsschlüssel. Ein solcher Schlüssel würde jede Zeilenregel aushebeln und wäre das gefährlichste Geheimnis im Projekt — besser, es existiert gar nicht. | Administrations-Schlüssel (`service_role`) in der Serverumgebung und Löschung über die Admin-Schnittstelle | Die Funktion muss sorgfältig geschrieben und nur für angemeldete Aufrufer freigegeben sein; dafür entfällt ein Geheimnis, das sonst im Repository, in der Umgebung und im Kopf des Prüfers auftauchen müsste. | 2026-09-13 |
| Fehlversuchssperre im Arbeitsspeicher des Servers, gezählt pro E-Mail-Adresse **und** pro IP | Kostet nichts, braucht kein Fremdkonto, und trifft genau die Lücke der Plattform: den geduldigen Angriff auf ein einzelnes Konto. | Externer Zähldienst (z. B. Upstash Redis) | Der Zähler beginnt bei jedem Serverneustart von vorn und gilt je Serverinstanz. Für einen Einzelbetrieb tragbar; bei mehreren Instanzen müsste ein gemeinsamer Speicher her — als offene Frage vermerkt. | 2026-09-13 |
| Schutz gegen bekannte geleakte Passwörter wird nicht aktiviert | Die Funktion gehört bei der Auth-Plattform zum kostenpflichtigen Tarif. Das Projekt darf keine Kosten verursachen. | Kostenpflichtigen Tarif buchen | Ein Passwort aus einer bekannten Leak-Liste wird akzeptiert, sofern es 8 Zeichen hat. Bewusst getragenes Restrisiko, hier benannt statt stillschweigend übergangen. | 2026-09-13 |
| Registrierung meldet neutral, obwohl die erfolgreiche Registrierung direkt anmeldet | Vollständige Nichtunterscheidbarkeit wäre nur mit E-Mail-Bestätigung erreichbar, und die ist im kostenlosen Tarif nicht verlässlich. Gewählt wurde die neutrale Formulierung; der Anmeldepfad (AC-11) bleibt vollständig nichtunterscheidbar. | E-Mail-Bestätigung einschalten und damit echte Nichtunterscheidbarkeit erreichen | Wer genau hinsieht, kann am Verhalten (Weiterleitung oder nicht) erkennen, ob eine Adresse vergeben ist. Restrisiko benannt; die Meldung selbst verrät nichts. | 2026-09-13 |
| Sitzungserneuerung im Anfragen-Grenzposten (`src/proxy.ts`) | Ohne sie läuft die Sitzung irgendwann ab, und die Person wird zu einem zufälligen Zeitpunkt ausgeloggt — genau das Verhalten, das EC-4 vermeiden soll. Die Datei existiert im Projekt noch nicht und entsteht mit diesem Feature. | Sitzung bei jedem Seitenaufruf einzeln erneuern | Läuft bei jeder Anfrage mit, kostet also ein paar Millisekunden pro Aufruf; dafür gibt es keinen Aufruf ohne gültige Sitzung. | 2026-09-13 |
| Datenexport als JSON über eine eigene Route mit Download-Kopfzeile | Maschinenlesbar im Sinne von Art. 20 DSGVO, ohne zusätzliche Bibliothek und ohne ein Format, das später niemand mehr lesen kann. | CSV-Datei | Für Laien weniger direkt lesbar als CSV; dafür bildet es verschachtelte Daten (Profil plus Ausgaben) verlustfrei ab. | 2026-09-13 |
| Zugriffsschutz doppelt: Weiterleitung im Layout **und** Zeilenregel in der Datenbank | Die Weiterleitung ist bequem, aber umgehbar; die Zeilenregel ist die belastbare Grenze. Beides zusammen ist die Anforderung aus den Projektregeln („zwei unabhängige Prüfungen"). | Nur die Prüfung in der App | Zwei Stellen, die zueinander passen müssen; dafür bleibt ein Fehler in der App folgenlos für fremde Daten. | 2026-09-13 |

## Offene Fragen

- [ ] Falls die App später auf mehreren Serverinstanzen läuft: Die Fehlversuchssperre müsste dann in einen gemeinsamen Speicher wandern, sonst zählt jede Instanz für sich.
