# Product Requirements Document

## Vision
Ausgaben-Tracker ist ein kleines SaaS-Werkzeug, mit dem eine Privatperson ihre täglichen Ausgaben in wenigen Sekunden erfasst und am Monatsende sofort sieht, wofür das Geld geflossen ist. Wer im Ausland einkauft oder online in Euro, Dollar oder Pfund bezahlt, muss nicht mehr selbst umrechnen: Die App holt den offiziellen Referenzkurs der Europäischen Zentralbank zum Ausgabedatum und speichert ihn nachvollziehbar mit der Ausgabe. Alles, was ein Nutzer erfasst, gehört nur ihm — technisch durchgesetzt, nicht nur versprochen.

## Target Users
Privatpersonen in der Schweiz, die ihre Ausgaben in Schweizer Franken im Blick behalten wollen und regelmässig auch in Fremdwährung bezahlen — grenznahe Einkäufe, Reisen, Online-Abos in Euro oder Dollar.

Ihre Schmerzpunkte heute:
- Eine Tabellenkalkulation ist überall verfügbar, aber niemand pflegt sie unterwegs konsequent weiter.
- Bankauszüge zeigen erst Wochen später, wofür das Geld weg ist, und kategorisieren nach eigener Logik.
- Fremdwährungsbeträge werden entweder gar nicht umgerechnet oder mit einem gegriffenen Kurs — der Monatsvergleich stimmt dann nicht mehr.
- Kostenlose Tracker-Apps verlangen Bankzugriff oder verkaufen Daten; das schreckt ab.

## Core Features (Roadmap)
Damit das Produkt überhaupt benutzbar ist, braucht es dreierlei: ein eigenes Konto mit geschütztem Bereich, das Erfassen von Ausgaben mit einer Monatsübersicht, und die automatische Umrechnung von Fremdwährungen zum Kurs des Ausgabedatums. Diese drei Features sind der MVP.

Bewusst später: Budgets und Warnungen, wiederkehrende Ausgaben, CSV-Export, eigene Kategorien, geteilte Haushalte, mobile App.

## Success Metrics
- Eine Ausgabe ist in unter 15 Sekunden erfasst (Formular geöffnet bis Eintrag sichtbar).
- Ein Nutzer, der in der ersten Woche fünf Ausgaben erfasst, ist in der Folgewoche wieder aktiv.
- Jede Fremdwährungsausgabe trägt einen gespeicherten Kurs mit Kursdatum — 100 %, keine geschätzten Werte.
- Kein Nutzer sieht jemals Daten eines anderen Nutzers (durchgesetzt per Row Level Security, geprüft in `/qa`).

## Constraints
- Environment strategy: single
- Data region: eu-central-1 (Frankfurt)
- Data protection law: GDPR (EU/DE), DSG (CH)
- Data protection stance: lean
- Design system: see `docs/design-system.md`
- Es dürfen keine laufenden Kosten entstehen: Supabase Free Plan, und als externe Integration ausschliesslich die Frankfurter-API (EZB-Referenzkurse, kostenlos, ohne API-Schlüssel).
- Einzelentwickler, Zeitrahmen wenige Tage, gesamter Ablauf spec-getrieben über das AI Engineering Kit.
- Nur Webanwendung (Next.js), kein produktives Deployment gefordert — die App läuft lokal gegen die gehostete Supabase-Instanz.

## Non-Goals
- Keine Anbindung an Banken, Kreditkarten oder Buchhaltungssoftware.
- Keine Budgets, keine Sparziele, keine Prognosen, keine Auswertung über mehrere Monate hinweg.
- Keine geteilten Haushalte, keine Mehrbenutzer-Freigaben, keine Rollen.
- Keine KI-Funktionen (z. B. automatische Kategorisierung).
- Kein Passwort-Reset per E-Mail, kein Social Login, keine Zwei-Faktor-Anmeldung in dieser Version.
- Keine native App, kein Offline-Modus.

---

Run `/init` to set up this PRD and feature map, then `/write-spec` to create detailed feature specifications for each feature in `features/INDEX.md`.
