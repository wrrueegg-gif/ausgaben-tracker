# Datenschutz-Register — was dieses Produkt mit personenbezogenen Daten tut

> Die ehrliche Übersicht darüber, welche personenbezogenen Daten dieses Produkt verarbeitet, wozu und wie lange.
>
> - Erstellt und aktuell gehalten von `/dsgvo`, ein Eintrag je Verarbeitungszweck.
> - Wächst mit dem Produkt: Ändert ein Feature, was gespeichert wird, ändert sich sein Eintrag mit.
> - **Flughöhe:** Zwecke, Rechtsgrundlagen, Aufbewahrung und wer die Daten sonst noch sieht. Felddetails stehen in `docs/data-model.md` und in den Feature-Designs.
>
> Dies entspricht weitgehend dem Verzeichnis von Verarbeitungstätigkeiten (Art. 30 DSGVO; Art. 12 DSG) — es ist aber ein technisches Dokument, keine juristische Eingabe. Ob es für die konkrete Situation vollständig ist, beantwortet eine Anwältin oder ein Datenschutzberater, nicht dieses Werkzeug.

**Anwendbares Recht:** DSGVO (EU/DE) · DSG (CH) — beide, aus `.ai-eng-kit` → `law`; die Regeln stehen in `docs/law/`
**Datenschutz-Haltung:** lean (`docs/PRD.md` → Constraints)
**Verantwortlicher:** _offen — vor einem echten Betrieb einzutragen. Das Produkt läuft derzeit als Prüfungsprojekt lokal, ohne echte Nutzer._
**Zuletzt geprüft:** 2026-09-13

---

## Verarbeitungstätigkeiten

| Zweck | Daten | Von wem | Warum zulässig | Aufbewahrung | Beteiligte Auftragsverarbeiter |
|-------|-------|---------|----------------|--------------|-------------------------------|
| Benutzerkonten betreiben (Registrierung, Anmeldung, geschützter Bereich) | E-Mail-Adresse, Passwort-Hash, Anzeigename, Zeitpunkt der Registrierung und der Anmeldungen, IP-Adresse der Anmeldung | registrierte Personen | DSGVO: Art. 6 Abs. 1 lit. b — ohne Konto gibt es die Leistung nicht · DSG: erwarteter Zweck, keine Rechtfertigung nötig | bis zur Löschung des Kontos durch die Person (AC-13) | Supabase (Region Frankfurt, `eu-central-1`) |
| Ausgaben speichern und auswerten | Betrag, Währung, Kategorie, Datum, freie Notiz, Wechselkurs und Kursdatum — je Person | registrierte Personen | DSGVO: Art. 6 Abs. 1 lit. b · DSG: erwarteter Zweck | bis zur Löschung der einzelnen Ausgabe oder des Kontos | Supabase (Frankfurt) |
| Missbrauch der Anmeldung abwehren | E-Mail-Adresse und IP-Adresse fehlgeschlagener Anmeldeversuche, nur im Arbeitsspeicher des Servers | jede Person, die sich anzumelden versucht | DSGVO: Art. 6 Abs. 1 lit. f — berechtigtes Interesse an der Abwehr automatisierten Passwortratens · DSG: erwarteter Zweck | 15 Minuten, danach automatisch verworfen; kein Eintrag in der Datenbank | keine |
| Wechselkurse abrufen | **keine** — an die Frankfurter-API gehen ausschliesslich Währungskürzel und ein Datum, nie ein Betrag, nie eine Kennung der Person | — | keine Verarbeitung personenbezogener Daten | entfällt | Frankfurter-API (siehe unten) |

Die freie Notiz an einer Ausgabe ist ein Freitextfeld. Menschen schreiben dort erfahrungsgemäss auch Persönliches hinein („Medikamente", „Geschenk für X"). Es wird wie personenbezogener Inhalt behandelt: nur für die eigene Person sichtbar, mit dem Konto löschbar, im Export enthalten.

## Besondere Kategorien personenbezogener Daten

- keine — das Produkt fragt nichts ab, was unter Art. 9 DSGVO oder Art. 5 lit. c DSG fällt. Dass jemand in eine Notiz etwas Gesundheitsbezogenes schreiben *kann*, macht das Feld nicht zu einem Gesundheitsdatenfeld; es gibt keine Auswertung und keine Weitergabe.

## Auftragsverarbeiter

| Dienst | Was er verarbeitet | Region | AVV geschlossen | Ausserhalb der angemessenen Länder? |
|--------|--------------------|--------|-----------------|-------------------------------------|
| Supabase | sämtliche Anwendungsdaten (Konten, Profile, Ausgaben) | `eu-central-1` (Frankfurt) | ☐ offen — vor echtem Betrieb in den Organisationseinstellungen zu akzeptieren | US-Unternehmen, Hosting in der EU |
| Frankfurter-API (frankfurter.dev, EZB-Referenzkurse) | keine personenbezogenen Daten — nur Währungskürzel und Datum, serverseitig aufgerufen; die IP-Adresse der Nutzerin erreicht den Dienst nie | EU | nicht erforderlich, da keine Auftragsverarbeitung personenbezogener Daten | nein |

Es gibt kein Analyse-Werkzeug, kein Fehler-Tracking, keine Werbe- oder Marketingdienste und keine Cookies ausser dem technisch notwendigen Sitzungs-Cookie der Anmeldung. Damit stellt sich die Einwilligungsfrage (Art. 25 TDDDG, Art. 45c FMG) nicht.

## Betroffenenrechte — wie sie bedient werden

| Recht | DSGVO | DSG | Wie dieses Produkt es erfüllt |
|-------|-------|-----|-------------------------------|
| Auskunft / Kopie | Art. 15 | Art. 25 | Knopf „Meine Daten herunterladen" im geschützten Bereich, liefert sofort eine JSON-Datei (AC-12) |
| Berichtigung | Art. 16 | Art. 32 | Ausgaben können gelöscht und neu erfasst werden (PROJ-2). Die E-Mail-Adresse ist in dieser Version nicht änderbar — siehe offene Punkte |
| Löschung | Art. 17 | Art. 32 / Art. 6 Abs. 4 | Knopf „Konto löschen" mit Rückfrage; entfernt Konto, Profil und alle Ausgaben sofort und endgültig (AC-13) |
| Datenübertragbarkeit | Art. 20 | Art. 28 | dieselbe JSON-Datei wie bei der Auskunft, maschinenlesbar (AC-12) |
| Widerspruch | Art. 21 | Art. 30 Abs. 2 | Es gibt keine Verarbeitung auf berechtigtem Interesse ausser der Missbrauchsabwehr bei der Anmeldung; wer das Konto löscht, beendet jede Verarbeitung |

> Frist: **ein Kalendermonat** nach DSGVO (Art. 12 Abs. 3), **30 Tage** nach DSG (Art. 25 Abs. 7). Beide Rechte werden hier sofort und selbstbedient erfüllt, also deutlich innerhalb der Frist.

## Offene Punkte

- [ ] Verantwortlicher (Name, Adresse, Kontakt) ist nicht eingetragen — vor einem Betrieb mit echten Nutzern nachzuholen.
- [ ] Der AVV mit Supabase ist nicht geschlossen (Organisationseinstellungen → Legal Documents). Für den Prüfungsbetrieb ohne echte Nutzerdaten nicht relevant, für den Echtbetrieb Pflicht.
- [ ] Die E-Mail-Adresse ist nicht änderbar; eine Berichtigung nach Art. 16 wäre derzeit nur über Löschen und Neuanlegen möglich.
- [ ] Ein Impressum (DDG) bzw. die Anbieterkennzeichnung nach UWG fehlt — erst vor einer Veröffentlichung nötig.

## Für eine Anwältin / einen Datenschutzberater

- Das Produkt richtet sich an Privatpersonen in der Schweiz, wird aber auf einer EU-Region betrieben und soll auch in der EU nutzbar sein. Wir behandeln deshalb DSGVO und DSG parallel und wenden jeweils die strengere Anforderung an. Ist diese Doppelbetrachtung für den geplanten Markt so ausreichend?
- Reicht die Selbstbedienung (Sofort-Export, Sofort-Löschung) als Erfüllung der Auskunfts- und Löschpflichten, oder braucht es zusätzlich einen benannten Kontaktweg für Betroffenenanfragen?

## Schwellenwert Datenschutz-Folgenabschätzung

Keine der Voraussetzungen ist erfüllt: keine besonderen Kategorien, keine systematische Überwachung, keine automatisierte Bewertung oder Profilbildung, kein grosser Massstab. Eine Datenschutz-Folgenabschätzung ist nach heutigem Stand nicht erforderlich. Das ist eine Einschätzung, keine Zusicherung.

---

_Dieses Register ist keine Rechtsberatung und bescheinigt keine Konformität._
