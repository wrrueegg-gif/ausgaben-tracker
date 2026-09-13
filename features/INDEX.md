# Feature Index

> Central tracking for all features. Updated by skills automatically.

## Status Legend
- **Roadmap** - `/init` done, feature identified in feature map, no spec file yet
- **Mapped** - already built before the kit arrived; proposed by `/map`, confirmed at `/init`, no spec folder yet — `/reverse-spec` writes it
- **Spec'd** - `/reverse-spec` done: runs in production, criteria confirmed, not yet verified — `/qa` closes that gap
- **Planned** - `/write-spec` done, full spec written, architecture not yet designed
- **Architected** - `/architecture` done, tech design approved, ready to build
- **Tasked** - `/tasks` done, tasks.md approved, ready to build
- **In Progress** - `/build` active or completed, not yet in QA
- **In Review** - `/qa` active, testing in progress
- **Approved** - `/qa` passed, no critical/high bugs, ready to deploy
- **Deployed** - `/deploy` done, live in production

## Features

> The **Spec** column links to the feature **folder** (`features/PROJ-X-name/`), not a single file. Each folder contains `spec.md`, `design.md`, `tasks.md`, and `qa-report.md`.
>
> **Feature** is the name only — two to four words, the way you would say it ("User accounts & login", "Kanban board"). **Description** is one sentence of what it does. Priority and dependencies are not columns: they are the **build order** line under the table, and it is the only place they live — there is no second roadmap table anywhere else.

| ID | Feature | Description | Status | Spec | Created |
|----|---------|-------------|--------|------|---------|
| PROJ-1 | Benutzerkonto & Login | Registrierung und Anmeldung mit E-Mail und Passwort; nur angemeldete Nutzer sehen den geschützten Bereich, und jeder sieht ausschliesslich seine eigenen Daten. | In Progress | [PROJ-1-user-accounts-auth/](PROJ-1-user-accounts-auth/) | 2026-09-13 |
| PROJ-2 | Ausgaben & Monatsübersicht | Ausgaben mit Betrag, Kategorie und Datum erfassen, löschen und pro Monat als Summe je Kategorie auswerten. | In Progress | [PROJ-2-expenses-monthly-overview/](PROJ-2-expenses-monthly-overview/) | 2026-09-13 |
| PROJ-3 | Fremdwährung & Wechselkurse | Ausgaben in EUR, USD oder GBP erfassen; die App rechnet sie über die EZB-Referenzkurse der Frankfurter-API zum Ausgabedatum in CHF um und speichert den Kurs nachvollziehbar mit. | Roadmap | — | 2026-09-13 |

**Build order:** P0 (MVP): PROJ-1 → PROJ-2 · P1: PROJ-3 (needs PROJ-2)

<!-- Add features above this line -->

## Deployments

> One line per release, written by `/deploy` — **the single deployment record**: tag · date · production URL · the features it shipped. `/security-check` reads the production URL here, `/audit` expects every Deployed feature on one line. A feature that was live before the kit arrived (reconstructed from code) gets its line from `/qa`: `live before the kit — verified by /qa on <date> · PROJ-X`.

- _v1.0.0 · 2026-01-31 · https://app.example.com · PROJ-1, PROJ-2_

## Next Available ID: PROJ-4
