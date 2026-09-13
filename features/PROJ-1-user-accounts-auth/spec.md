# PROJ-1: Benutzerkonto & Login

<!-- This file (spec.md) is the stable CONTRACT — it defines WHAT, not HOW.
     Owner: /write-spec (creates), /refine (updates). During /build this file is READ-ONLY.
     Technical design lives in design.md, QA results in qa-report.md.
     No status or date fields here: the feature's status lives ONLY in features/INDEX.md,
     and git records when this file changed. -->

## Dependencies
- Keine. Dies ist das erste Feature; es legt das Muster fest, dem PROJ-2 und PROJ-3 folgen (eigene Daten, durchgesetzt in der Datenbank).

## User Stories
- Als neue Nutzerin möchte ich mich mit E-Mail und Passwort registrieren, damit meine Ausgaben dauerhaft gespeichert werden und nicht nur in diesem Browser liegen.
- Als wiederkehrender Nutzer möchte ich mich anmelden und danach direkt bei meinen Ausgaben landen, damit ich in wenigen Sekunden etwas erfassen kann.
- Als Nutzerin möchte ich sicher sein, dass niemand ausser mir meine Ausgaben sehen kann — auch nicht jemand, der die technischen Zugangsdaten der App kennt.
- Als Nutzer an einem fremden Gerät möchte ich mich abmelden können, damit die nächste Person an diesem Rechner meine Daten nicht sieht.
- Als Nutzerin möchte ich meine Daten herunterladen und mein Konto samt allen Daten löschen können, ohne jemanden fragen zu müssen.

## Out of Scope
- Passwort zurücksetzen per E-Mail — Non-Goal dieser Version (der eingebaute Mailer des kostenlosen Tarifs ist stark limitiert; wer sein Passwort vergisst, legt ein neues Konto an).
- Anmeldung über Google, GitHub oder andere Anbieter.
- Zwei-Faktor-Anmeldung.
- E-Mail-Adresse oder Passwort im Nachhinein ändern.
- CAPTCHA auf dem Registrierungsformular — siehe Decision Log; die Sperre nach Fehlversuchen bleibt.
- Rollen, geteilte Konten, Einladungen anderer Personen.
- Ein Profilbild oder weitere Profilfelder; das Profil trägt nur Anzeigename und Anlagedatum.

## Acceptance Criteria

- [ ] **AC-1** — Angenommen eine Person ist nicht angemeldet und auf der Registrierungsseite, wenn sie eine noch unbekannte E-Mail-Adresse und ein Passwort mit mindestens 8 Zeichen abschickt, dann wird ein Konto angelegt, sie ist sofort angemeldet und sieht den geschützten Bereich unter `/app`
- [ ] **AC-2** — Angenommen eine Person füllt das Registrierungsformular aus, wenn das Passwort weniger als 8 Zeichen hat, dann wird kein Konto angelegt und unter dem Passwortfeld erscheint eine Meldung, die die Mindestlänge nennt
- [ ] **AC-3** — Angenommen ein Konto existiert, wenn die Person auf der Anmeldeseite die richtige E-Mail-Adresse und das richtige Passwort eingibt, dann ist sie angemeldet und wird auf `/app` weitergeleitet
- [ ] **AC-4** — Angenommen ein Konto existiert, wenn die Person ein falsches Passwort eingibt, dann bleibt sie auf der Anmeldeseite, sieht eine Fehlermeldung und ist nicht angemeldet
- [ ] **AC-5** — Angenommen eine Person ist angemeldet, wenn sie in der Kopfzeile auf „Abmelden" klickt, dann ist die Sitzung beendet, sie landet auf der Anmeldeseite, und ein erneuter Aufruf von `/app` zeigt ihre Daten nicht mehr
- [ ] **AC-6** — Angenommen eine Person ist nicht angemeldet, wenn sie `/app` direkt aufruft, dann wird sie auf `/login` weitergeleitet und sieht keine Inhalte des geschützten Bereichs
- [ ] **AC-7** — Angenommen eine Person ist angemeldet, wenn sie `/login` oder `/signup` aufruft, dann wird sie auf `/app` weitergeleitet
- [ ] **AC-8** — Angenommen eine Registrierung war erfolgreich, wenn das Konto entsteht, dann wird automatisch ein zugehöriges Profil mit Anzeigename und Anlagedatum erzeugt, ohne dass die Person etwas tun muss
- [ ] **AC-9** — Angenommen jemand kennt den öffentlichen Datenbankschlüssel der App, wenn er damit ohne gültige Anmeldung Profildaten abfragt, dann liefert die Datenbank keine Zeile zurück; angemeldet erhält er ausschliesslich sein eigenes Profil
- [ ] **AC-10** — Angenommen es gab 5 fehlgeschlagene Anmeldeversuche für dieselbe E-Mail-Adresse innerhalb von 15 Minuten, wenn ein weiterer Versuch erfolgt, dann wird er abgelehnt und die Person sieht, nach wie vielen Minuten sie es erneut versuchen kann
- [ ] **AC-11** — Angenommen eine Anmeldung schlägt fehl, wenn die Fehlermeldung erscheint, dann ist sie für eine unbekannte E-Mail-Adresse und ein falsches Passwort wortgleich und verrät nicht, ob die Adresse existiert
- [ ] **AC-12** — Angenommen eine Person ist angemeldet, wenn sie „Meine Daten herunterladen" auslöst, dann erhält sie eine maschinenlesbare Datei mit ihrer E-Mail-Adresse, ihrem Profil und allen ihren Ausgaben _(Art. 15 und Art. 20 DSGVO, Art. 25 DSG)_
- [ ] **AC-13** — Angenommen eine Person ist angemeldet, wenn sie ihr Konto löscht und die Rückfrage bestätigt, dann werden ihr Konto, ihr Profil und alle ihre Ausgaben endgültig entfernt, sie wird abgemeldet, und eine erneute Anmeldung mit diesen Daten ist nicht mehr möglich _(Art. 17 DSGVO, Art. 32 DSG)_
- [ ] **AC-14** — Angenommen eine Person ist auf der Anmelde- oder Registrierungsseite, wenn sie den Datenschutzhinweis öffnet, dann sieht sie, welche Daten zu welchem Zweck gespeichert werden, wo sie liegen und wie lange sie bleiben _(Art. 13 DSGVO, Art. 19 DSG)_

## Edge Cases
- **EC-1** — Angenommen eine E-Mail-Adresse ist bereits registriert, wenn jemand sich mit derselben Adresse erneut registriert, dann entsteht kein zweites Konto und die Rückmeldung verrät nicht, dass die Adresse bereits existiert
- **EC-2** — Angenommen eine Person klickt zweimal schnell hintereinander auf „Registrieren" oder „Anmelden", wenn beide Klicks abgeschickt werden, dann entsteht höchstens ein Konto und höchstens eine Sitzung, und der Knopf ist während der Verarbeitung gesperrt
- **EC-3** — Angenommen die Datenbank ist nicht erreichbar oder das Netzwerk fällt aus, wenn eine Anmeldung oder Registrierung abgeschickt wird, dann erscheint eine verständliche Fehlermeldung, das Formular bleibt ausgefüllt, und es hängt kein Ladezustand endlos
- **EC-4** — Angenommen die Sitzung einer angemeldeten Person ist abgelaufen, wenn sie die nächste Seite im geschützten Bereich aufruft, dann wird sie auf die Anmeldeseite geführt statt eine leere oder fehlerhafte Seite zu sehen
- **EC-5** — Angenommen eine Person gibt eine Zeichenfolge ohne gültiges E-Mail-Format ein, wenn sie das Formular abschickt, dann wird es nicht gesendet und das E-Mail-Feld zeigt eine Meldung
- **EC-6** — Angenommen das automatische Anlegen des Profils schlägt fehl, wenn ein Konto registriert wird, dann entsteht kein Konto ohne Profil — beides gilt als eine einzige Operation

## Technical Requirements (optional)
- Anmeldedaten werden ausschliesslich per POST übertragen, nie in der Adresszeile.
- Der geschützte Bereich ist auch dann geschützt, wenn jemand die Prüfung im Browser umgeht: Die Zugriffsregel liegt zusätzlich in der Datenbank.
- Die Daten liegen in der EU (Region Frankfurt, `eu-central-1`), siehe `docs/PRD.md` → Constraints.

## Open Questions
- [ ] Passwort zurücksetzen: Soll in einer späteren Version ein eigener Mailversand angebunden werden (der eingebaute Mailer reicht dafür nicht)?
- [ ] Soll die Sperre nach Fehlversuchen zusätzlich pro IP-Adresse greifen, wenn die App jemals öffentlich läuft? Für den lokalen Betrieb genügt die Sperre pro Konto und pro IP im Serverprozess.

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Kein CAPTCHA auf dem Registrierungsformular | Ein CAPTCHA braucht ein zusätzliches Konto bei Cloudflare oder hCaptcha. Das Produkt soll ohne fremde Zugangsdaten und ohne Kosten nachvollziehbar laufen. Die Sperre nach 5 Fehlversuchen (AC-10) bleibt, weil sie genau das schützt, was wirklich angreifbar ist: das Erraten von Passwörtern. | 2026-09-13 |
| Keine Bestätigung der E-Mail-Adresse vor der ersten Anmeldung | Der eingebaute Mailversand des kostenlosen Tarifs ist auf wenige Nachrichten pro Stunde begrenzt; mit Bestätigungspflicht scheitert die erste Anmeldung reproduzierbar. Die Adresse dient hier nur als Anmeldename, nicht als Kontaktkanal. | 2026-09-13 |
| Kein Passwort-Reset in dieser Version | Setzt funktionierenden Mailversand voraus (siehe oben). Bis dahin ist ein neues Konto der ehrlichere Weg als ein Reset, der nie ankommt. | 2026-09-13 |
| Passwort mindestens 8 Zeichen, keine Zeichenklassen-Pflicht | Länge schützt messbar, erzwungene Sonderzeichen führen zu vorhersehbaren Mustern. Entspricht der Voreinstellung der Auth-Plattform. | 2026-09-13 |
| Sperre nach 5 Fehlversuchen in 15 Minuten | Vom Kit vorgeschlagener und hier übernommener Wert: hoch genug für Vertipper, niedrig genug gegen automatisiertes Raten. | 2026-09-13 |
| Anzeigename wird aus dem Teil vor dem @ der E-Mail-Adresse erzeugt | Spart ein Formularfeld bei der Registrierung. Das Profil existiert vor allem, damit jede Ausgabe einen Eigentümer hat. | 2026-09-13 |
| Datenexport und Kontolöschung sind Teil dieses Features, nicht eines späteren | Beide hängen am Konto und sind gesetzliche Pflichten (Art. 15/17/20 DSGVO, Art. 25/32 DSG) — sie werden hier gebaut und geprüft wie jedes andere Kriterium. AC-12 bis AC-14 stammen aus der Datenschutzprüfung, nicht aus der Produktdiskussion. | 2026-09-13 |
